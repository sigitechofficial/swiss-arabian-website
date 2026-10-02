"use client";

import { useCartStore } from "@/stores/useCartStore";
import { freeShippingProgress } from "../utils/freeShippingBar";
import { useApplicablePromotions } from "./useApplicablePromotions";

export function useFreeShippingBar() {
  const promotions = useCartStore((s) => s.promotions);
  const totals = useCartStore((s) => s.totals);
  const syncing = useCartStore((s) => s.syncing);
  const subtotal = useCartStore((s) => s.subtotal());
  const { data } = useApplicablePromotions();
  const snapshot = data?.promotions ?? promotions;
  const currency = snapshot?.context?.currencyCode ?? totals?.currency ?? "AED";
  const quotePending = syncing && totals == null;
  const progressState = freeShippingProgress({
    subtotal,
    offers: data?.offers,
    snapshot,
  });
  const unlocked =
    progressState.isFree ||
    (progressState.threshold != null && progressState.remaining <= 0);
  return {
    ...progressState,
    unlocked,
    currency,
    snapshot,
    offers: data?.offers ?? [],
    quotePending,
  };
}
