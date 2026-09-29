"use client";

import { useMutation } from "@tanstack/react-query";
import { ApiClientError } from "@/lib/api/apiError";
import {
  applyCartGiftCard,
  getActiveCart,
  removeCartGiftCards,
} from "@/features/cart/api/cart.service";
import { runQueuedCart } from "@/features/cart/api/optimisticCart";
import {
  applyCheckoutGiftCard,
  removeCheckoutGiftCard,
} from "@/features/checkout/api/checkout.service";
import type { CheckoutSessionResponse } from "@/features/checkout/types/checkout";
import { useCartStore } from "@/stores/useCartStore";
import { checkGiftCardBalance } from "../api/promotions.service";

export function useGiftCardMutations(opts?: {
  checkoutSessionId?: string | null;
  onCheckoutSession?: (session: CheckoutSessionResponse) => void | Promise<void>;
}) {
  const cartId = useCartStore((s) => s.cartId);
  const checkoutSessionId = opts?.checkoutSessionId ?? null;

  async function refreshCart() {
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
        await refreshCart();
      } catch {
        // Inline copy still surfaces from the original error.
      }
    }
  }

  const apply = useMutation({
    mutationFn: async (code: string) => {
      if (checkoutSessionId) {
        const session = await applyCheckoutGiftCard(checkoutSessionId, code);
        await opts?.onCheckoutSession?.(session);
        return session;
      }
      const id = useCartStore.getState().cartId;
      if (!id) throw new Error("Your bag isn’t ready yet.");
      return runQueuedCart(() => applyCartGiftCard(id, code));
    },
    onError: onQuoteError,
  });

  const remove = useMutation({
    mutationFn: async (usageId?: string | null) => {
      if (checkoutSessionId && usageId) {
        const session = await removeCheckoutGiftCard(checkoutSessionId, usageId);
        await opts?.onCheckoutSession?.(session);
        return session;
      }
      const id = useCartStore.getState().cartId;
      if (!id) throw new Error("Your bag isn’t ready yet.");
      return runQueuedCart(() => removeCartGiftCards(id));
    },
    onError: onQuoteError,
  });

  const balance = useMutation({
    mutationFn: (code: string) => checkGiftCardBalance(code),
  });

  return { apply, remove, balance, cartId, checkoutSessionId };
}
