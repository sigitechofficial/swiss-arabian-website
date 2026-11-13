"use client";

import { useEffect, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCouponMutations } from "@/features/cart/hooks/useCouponMutations";
import { useMarketCurrency } from "@/features/markets/hooks/useMarketCurrency";
import { ApiClientError } from "@/lib/api/apiError";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCartStore } from "@/stores/useCartStore";
import { appliedCoupon, appliedPromotionView, isFixedAmountBxgy } from "../types/promotions";
import { couponErrorMessage } from "../utils/couponErrors";
import { couponLoginHref, peekPendingCoupon, takePendingCoupon } from "../utils/pendingCoupon";

/**
 * The promo-code field of the bag and checkout: apply / remove on the cart
 * quote, the code waiting for sign-in, and the shopper-facing error.
 */
export function useCouponForm() {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const promotions = useCartStore((s) => s.promotions);
  const totals = useCartStore((s) => s.totals);
  const marketCurrency = useMarketCurrency();
  const currency = promotions?.context?.currencyCode ?? totals?.currency ?? marketCurrency;
  const { apply, remove, cartId } = useCouponMutations();

  const [code, setCode] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const applied = appliedCoupon(promotions);

  useEffect(() => {
    if (!bootstrapped || !isAuthenticated || !cartId) return;
    if (!peekPendingCoupon()) return;
    const pending = takePendingCoupon();
    if (!pending) return;
    // The field shows the code being applied (mutation variables) meanwhile.
    void apply
      .mutateAsync(pending)
      .then(() => {
        setFieldError(null);
        setCode("");
      })
      .catch((error: unknown) => {
        // Keep the rejected code in the field so the shopper can fix it.
        setCode(pending);
        setFieldError(couponErrorMessage(error, currency));
      });
    // Apply once after login; `apply` identity is not a trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootstrapped, isAuthenticated, cartId]);

  async function onApply(event?: FormEvent) {
    event?.preventDefault();
    const next = code.trim();
    if (!next || !cartId) return;
    setFieldError(null);
    try {
      await apply.mutateAsync(next);
      setCode("");
    } catch (error) {
      if (error instanceof ApiClientError && error.code === "COUPON_REQUIRES_LOGIN") {
        router.push(couponLoginHref(pathname || "/cart", next));
        return;
      }
      setFieldError(couponErrorMessage(error, currency));
    }
  }

  async function onRemove() {
    if (!applied?.code) return;
    setFieldError(null);
    try {
      await remove.mutateAsync(applied.code);
    } catch (error) {
      setFieldError(couponErrorMessage(error, currency));
    }
  }

  const appliedView = applied ? appliedPromotionView(applied, promotions) : null;

  return {
    cartId,
    currency,
    applied,
    appliedView,
    /** "Applied · AED 10" rather than "−AED 10" for a fixed-amount buy-X-get-Y. */
    appliedIsFixedBxgy: applied ? isFixedAmountBxgy(applied) : false,
    /** What the input shows: the shopper's text, or the code being applied after sign-in. */
    value: apply.isPending && !code ? (apply.variables ?? "") : code,
    setCode: (next: string) => {
      setCode(next);
      if (fieldError) setFieldError(null);
    },
    code,
    fieldError,
    applying: apply.isPending,
    removing: remove.isPending,
    busy: apply.isPending || remove.isPending,
    onApply,
    onRemove,
  };
}
