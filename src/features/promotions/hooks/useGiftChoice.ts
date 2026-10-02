"use client";

import { useMutation } from "@tanstack/react-query";
import { selectCartGift } from "@/features/cart/api/cart.service";
import { runQueuedCart } from "@/features/cart/api/optimisticCart";
import { useCartStore } from "@/stores/useCartStore";

export function useGiftChoice() {
  const cartId = useCartStore((s) => s.cartId);
  const select = useMutation({
    mutationFn: async (input: { sku: string; promotionCode: string | null }) => {
      const id = useCartStore.getState().cartId;
      if (!id) throw new Error("Your bag isn’t ready yet.");
      return runQueuedCart(() => selectCartGift(id, input.sku, input.promotionCode));
    },
  });
  return { select, cartId };
}
