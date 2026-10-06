"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { ApiClientError } from "@/lib/api/apiError";
import { useApiQuery } from "@/lib/api/queryHooks";
import { useCartStore } from "@/stores/useCartStore";
import { useUiStore } from "@/stores/useUiStore";
import { promotionKeys } from "../api/promotions.keys";
import { fetchApplicablePromotions } from "../api/promotions.service";

export function useApplicablePromotions() {
  const cartId = useCartStore((s) => s.cartId);
  const computedAt = useCartStore((s) => s.promotions?.computedAt);
  const zoneCode = useUiStore((s) => s.catalogContext?.zoneCode);

  return useApiQuery(
    promotionKeys.applicable(cartId ?? "", computedAt, zoneCode),
    () => fetchApplicablePromotions(cartId!),
    {
      enabled: Boolean(cartId),
      staleTime: 15_000,
      // Qty edits change `computedAt`, which changes the query key. Keep the
      // last offers so the shipping bar does not unmount while the next quote loads.
      placeholderData: keepPreviousData,
      retry: (count, error) => {
        if (error instanceof ApiClientError && error.status === 404) return false;
        return count < 1;
      },
    },
  );
}
