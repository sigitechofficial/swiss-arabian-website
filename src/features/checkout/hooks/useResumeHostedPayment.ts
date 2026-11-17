"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkoutHref } from "../utils/checkoutLocale";
import { clearHostedPaymentOpen, getHostedPaymentOpen } from "../utils/checkoutSession";
import { returnToCheckout } from "../utils/returnToCheckout";

/**
 * The shopper opened a hosted payment page (Tabby, Telr) and came back with the
 * browser's Back button instead of the provider's return link. The order is
 * unpaid and its bag was handed to the order, so checkout would show an empty
 * bag with no way forward (found in the Tabby QA walk-through, Nov 2026).
 *
 * On checkout, every brand: ask the platform about that order first. Paid
 * after all → its confirmation. Not paid → the unpaid order is cancelled and
 * the same bag comes back, Tabby still offered (it was not declined). A
 * payment still open at a provider we can't check → nothing changes.
 *
 * `true` while it runs, so checkout doesn't flash "nothing to check out".
 * Also runs when the browser restores checkout from its back/forward cache.
 */
export function useResumeHostedPayment(): boolean {
  const router = useRouter();
  const [resuming, setResuming] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = () => {
      const orderId = getHostedPaymentOpen();
      if (!orderId) return;
      clearHostedPaymentOpen();
      setResuming(true);
      void returnToCheckout(orderId)
        .then((result) => {
          if (cancelled) return;
          if (result.kind === "paid") {
            router.replace(checkoutHref(`/order-confirmation/${encodeURIComponent(orderId)}`));
            return;
          }
          setResuming(false);
        })
        .catch(() => {
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
  }, [router]);

  return resuming;
}
