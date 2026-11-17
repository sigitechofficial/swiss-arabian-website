"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useOptionalMarket } from "@/providers/MarketProvider";
import { getActiveCart } from "@/features/cart/api/cart.service";
import { useCartStore } from "@/stores/useCartStore";
import { checkoutHref } from "../utils/checkoutLocale";
import { returnToCheckout, type ReturnToCheckoutResult } from "../utils/returnToCheckout";

/**
 * The shopper opened checkout while an unpaid order holds their bag: they came
 * back without paying, whatever the payment method or the reason (Back from a
 * hosted page, a reload during 3DS, a payment that could not start, a closed
 * tab, another device). The server says so on the bag (`pendingPayment`);
 * nothing here depends on the browser tab or the provider (checkout QA-006).
 *
 * Coming back to checkout means "let me pay again or change things": ask the
 * platform to release that order. Paid after all → its confirmation. Released →
 * the same bag is back and checkout starts. Kept (money held or under review) →
 * that order's "Pay again".
 *
 * `true` while it runs, so checkout doesn't flash "nothing to check out".
 * Runs once the market is known on page load (and again for another market),
 * and when the browser restores checkout from its back/forward cache — never
 * during the in-page card form flow.
 */
export function useResumeHeldBag(): boolean {
  const router = useRouter();
  // Runs once per page: never restarted because the router object changes.
  const openConfirmation = useEffectEvent((orderId: string) => {
    router.replace(checkoutHref(`/order-confirmation/${encodeURIComponent(orderId)}`));
  });
  const openRetry = useEffectEvent((orderId: string) => {
    router.replace(checkoutHref(`/checkout/payment/cancel?orderId=${encodeURIComponent(orderId)}`));
  });
  const [resuming, setResuming] = useState(false);
  // The bag is read with the market's context; wait until the market is known
  // (an early read has no zone and is refused, which would miss a held bag).
  const zoneCode = useOptionalMarket()?.catalogContext?.zoneCode ?? null;

  useEffect(() => {
    if (!zoneCode) return;
    let cancelled = false;
    const run = () => {
      setResuming(true);
      void beginResume()
        .then((outcome) => {
          if (!outcome) {
            if (!cancelled) setResuming(false);
            return;
          }
          if (outcome.result.kind === "paid") {
            openConfirmation(outcome.orderId);
            return;
          }
          if (outcome.result.kind === "kept") {
            openRetry(outcome.orderId);
            return;
          }
          if (!cancelled) setResuming(false);
        })
        .catch((error: unknown) => {
          // The bag is held but the platform couldn't be asked: the order can
          // still be paid from its own page, so never leave an empty checkout.
          const orderId = error instanceof HeldBagReleaseError ? error.orderId : null;
          if (orderId) {
            openRetry(orderId);
            return;
          }
          if (!cancelled) setResuming(false);
        });
    };
    run();
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) run();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => {
      cancelled = true;
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [zoneCode]);

  return resuming;
}

type ResumeOutcome = { orderId: string; result: ReturnToCheckoutResult };

class HeldBagReleaseError extends Error {
  constructor(readonly orderId: string, cause: unknown) {
    super("The held bag could not be released", { cause });
    this.name = "HeldBagReleaseError";
  }
}

/**
 * One check per page load, shared by every mount of checkout (React dev re-runs
 * effects; a route refresh remounts): a second mount attaches to the same
 * answer instead of asking twice.
 */
let inflight: Promise<ResumeOutcome | null> | null = null;

function beginResume(): Promise<ResumeOutcome | null> {
  if (inflight) return inflight;
  const request = (async (): Promise<ResumeOutcome | null> => {
    const cart = await getActiveCart().catch(() => null);
    const held = cart?.pendingPayment;
    if (!cart || !held) return null;
    // Checkout waits while the bag is held (no session against a held bag).
    useCartStore.getState().setCartFromApi(cart);
    try {
      return { orderId: held.orderId, result: await returnToCheckout(held.orderId) };
    } catch (error) {
      throw new HeldBagReleaseError(held.orderId, error);
    }
  })();
  inflight = request;
  const settle = () => {
    if (inflight === request) inflight = null;
  };
  request.then(settle, settle);
  return request;
}
