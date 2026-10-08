"use client";

import { useApiQuery } from "@/lib/api/queryHooks";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUiStore } from "@/stores/useUiStore";
import { promotionKeys } from "../api/promotions.keys";
import { fetchPromotionDiscovery } from "../api/discovery.service";

export function usePromotionDiscovery(productIds: string[] = []) {
  const zoneCode = useUiStore((state) => state.catalogContext?.zoneCode);
  const customerId = useAuthStore((state) => state.user?.id ?? null);
  const key = [...new Set(productIds)].sort().join(",");
  return useApiQuery(
    promotionKeys.discovery(zoneCode ?? null, customerId, key),
    () => fetchPromotionDiscovery(productIds),
    { staleTime: 30_000 },
  );
}
