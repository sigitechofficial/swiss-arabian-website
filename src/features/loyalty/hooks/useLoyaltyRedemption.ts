"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  applyCartLoyaltyRedemption,
  getActiveCart,
  removeCartLoyaltyRedemption,
} from "@/features/cart/api/cart.service";
import { runQueuedCart } from "@/features/cart/api/optimisticCart";
import { ApiClientError } from "@/lib/api/apiError";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCartStore } from "@/stores/useCartStore";
import { loyaltyKeys } from "../api/loyalty.keys";
import {
  isLoyaltyRedemptionHidden,
  readLoyaltyRedemption,
  type LoyaltyRedemptionView,
} from "../types/loyalty";

export function useLoyaltyRedemption(opts?: { quoteOverride?: unknown }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const cartId = useCartStore((s) => s.cartId);
  const storedQuote = useCartStore((s) => s.loyaltyRedemption);
  const adjusted = useCartStore((s) => s.loyaltyAdjusted);
  const queryClient = useQueryClient();

  const quote =
    readLoyaltyRedemption(opts?.quoteOverride) ?? storedQuote;

  async function onQuoteError(error: unknown) {
    if (
      error instanceof ApiClientError &&
      (error.code === "PRICING_CHANGED" ||
        error.code === "RESERVATION_EXPIRED" ||
        error.code === "REDEMPTION_EXPIRED")
    ) {
      const id = useCartStore.getState().cartId;
      if (!id) return;
      try {
        await runQueuedCart(() => getActiveCart(id));
      } catch {
        // Inline copy still surfaces from the original error.
      }
    }
  }

  const apply = useMutation({
    mutationFn: async (points: number) => {
      const id = useCartStore.getState().cartId;
      if (!id) throw new Error("Your bag isn’t ready yet.");
      useCartStore.getState().clearLoyaltyAdjusted();
      return runQueuedCart(() => applyCartLoyaltyRedemption(id, points));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: loyaltyKeys.all });
    },
    onError: onQuoteError,
  });

  const remove = useMutation({
    mutationFn: async () => {
      const id = useCartStore.getState().cartId;
      if (!id) throw new Error("Your bag isn’t ready yet.");
      useCartStore.getState().clearLoyaltyAdjusted();
      return runQueuedCart(() => removeCartLoyaltyRedemption(id));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: loyaltyKeys.all });
    },
    onError: onQuoteError,
  });

  return {
    quote,
    hidden: !bootstrapped || !isAuthenticated || isLoyaltyRedemptionHidden(quote),
    isAuthenticated: bootstrapped && isAuthenticated,
    cartId,
    adjusted,
    acknowledgeAdjustment: () => useCartStore.getState().clearLoyaltyAdjusted(),
    apply,
    remove,
  };
}

export function loyaltyLineFromQuote(quote: LoyaltyRedemptionView | null | undefined): {
  points: number;
  amount: number;
  currency: string | null;
} | null {
  if (!quote || quote.appliedPoints <= 0) return null;
  return {
    points: quote.appliedPoints,
    amount: quote.appliedAmount,
    currency: quote.currencyCode,
  };
}
