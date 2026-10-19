"use client";

import { ApiClientError } from "@/lib/api/apiError";
import { useApiQuery } from "@/lib/api/queryHooks";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCartStore } from "@/stores/useCartStore";
import { useUiStore } from "@/stores/useUiStore";
import { promotionKeys } from "../api/promotions.keys";
import { fetchApplicablePromotions } from "../api/promotions.service";

export function useApplicablePromotions() {
  const cartId = useCartStore((s) => s.cartId);
  const computedAt = useCartStore((s) => s.promotions?.computedAt);
  const zoneCode = useUiStore((s) => s.catalogContext?.zoneCode);
  const customerId = useAuthStore((s) => s.user?.id ?? null);

  return useApiQuery(
    promotionKeys.applicable(cartId ?? "", computedAt, zoneCode, customerId),
    () => fetchApplicablePromotions(cartId!),
    {
      enabled: Boolean(cartId),
      staleTime: 15_000,
      // Qty edits change `computedAt`, which changes the query key. Keep the
      // last offers so the shipping bar does not unmount while the next quote loads.
      // Do not keep a prior customer's or Market's quote after identity changes.
      placeholderData: (previousData, previousQuery) => {
        const previousKey = previousQuery?.queryKey;
        if (!previousKey) return undefined;
        const previousZone = previousKey[3];
        const previousCustomer = previousKey[4];
        if (previousZone !== (zoneCode ?? "") || previousCustomer !== (customerId ?? "guest")) {
          return undefined;
        }
        return previousData;
      },
      retry: (count, error) => {
        if (error instanceof ApiClientError && error.status === 404) return false;
        return count < 1;
      },
    },
  );
}
