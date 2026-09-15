"use client";

import { ApiClientError } from "@/lib/api/apiError";
import { useApiQuery } from "@/lib/api/queryHooks";
import { useCartStore } from "@/stores/useCartStore";
import { promotionKeys } from "../api/promotions.keys";
import { fetchApplicablePromotions } from "../api/promotions.service";

export function useApplicablePromotions() {
  const cartId = useCartStore((s) => s.cartId);
  const computedAt = useCartStore((s) => s.promotions?.computedAt);

  return useApiQuery(
    promotionKeys.applicable(cartId ?? "", computedAt),
    () => fetchApplicablePromotions(cartId!),
    {
      enabled: Boolean(cartId),
      staleTime: 15_000,
      retry: (count, error) => {
        if (error instanceof ApiClientError && error.status === 404) return false;
        return count < 1;
      },
    },
  );
}
