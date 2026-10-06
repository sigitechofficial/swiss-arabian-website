"use client";

import { useMutation } from "@tanstack/react-query";
import { ApiClientError } from "@/lib/api/apiError";
import { useCartStore } from "@/stores/useCartStore";
import { runQueuedCart } from "../api/optimisticCart";
import { applyCartCoupon, getActiveCart, removeCartCoupon } from "../api/cart.service";

export function useCouponMutations() {
  const cartId = useCartStore((s) => s.cartId);

  async function requote() {
    const id = useCartStore.getState().cartId;
    if (!id) return;
    await runQueuedCart(() => getActiveCart(id));
  }

  async function onQuoteError(error: unknown) {
    if (
      error instanceof ApiClientError &&
      (error.code === "PRICING_CHANGED" || error.code === "REDEMPTION_EXPIRED")
    ) {
      try {
        await requote();
      } catch {
        // Inline copy still surfaces from the original error.
      }
    }
  }

  const apply = useMutation({
    mutationFn: (code: string) => {
      const id = useCartStore.getState().cartId;
      if (!id) throw new Error("Your bag isn’t ready yet.");
      return runQueuedCart(() => applyCartCoupon(id, code));
    },
    onError: onQuoteError,
  });

  const remove = useMutation({
    mutationFn: (code: string) => {
      const id = useCartStore.getState().cartId;
      if (!id) throw new Error("Your bag isn’t ready yet.");
      return runQueuedCart(() => removeCartCoupon(id, code));
    },
    onError: onQuoteError,
  });

  return { apply, remove, cartId };
}
