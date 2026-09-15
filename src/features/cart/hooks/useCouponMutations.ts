"use client";

import { useMutation } from "@tanstack/react-query";
import { ApiClientError } from "@/lib/api/apiError";
import { useCartStore } from "@/stores/useCartStore";
import { storeCartId } from "../utils/guestToken";
import { applyCartCoupon, getActiveCart, removeCartCoupon } from "../api/cart.service";

export function useCouponMutations() {
  const setCartFromApi = useCartStore((s) => s.setCartFromApi);
  const setCartId = useCartStore((s) => s.setCartId);
  const cartId = useCartStore((s) => s.cartId);

  const sync = (cart: Awaited<ReturnType<typeof applyCartCoupon>>) => {
    storeCartId(cart.cartId);
    setCartId(cart.cartId);
    setCartFromApi(cart);
  };

  async function requote() {
    const id = useCartStore.getState().cartId;
    if (!id) return;
    sync(await getActiveCart(id));
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
      if (!cartId) throw new Error("Your bag isn’t ready yet.");
      return applyCartCoupon(cartId, code);
    },
    onSuccess: sync,
    onError: onQuoteError,
  });

  const remove = useMutation({
    mutationFn: (code: string) => {
      if (!cartId) throw new Error("Your bag isn’t ready yet.");
      return removeCartCoupon(cartId, code);
    },
    onSuccess: sync,
    onError: onQuoteError,
  });

  return { apply, remove, cartId };
}
