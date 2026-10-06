"use client";

import { useApiQuery } from "@/lib/api/queryHooks";
import { useUiStore } from "@/stores/useUiStore";
import { fetchPromotionDiscovery } from "../api/discovery.service";

export function usePromotionDiscovery(productIds: string[] = []) {
  const zoneCode = useUiStore((state) => state.catalogContext?.zoneCode);
  const key = [...new Set(productIds)].sort().join(",");
  return useApiQuery(
    ["promotions", "discovery", zoneCode ?? "", key],
    () => fetchPromotionDiscovery(productIds),
    { staleTime: 30_000 },
  );
}
