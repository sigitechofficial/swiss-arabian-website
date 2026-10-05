"use client";

import { useApiQuery } from "@/lib/api/queryHooks";
import { useAuthStore } from "@/stores/useAuthStore";
import { fetchOrderReward } from "../api/loyalty.service";
import { loyaltyKeys } from "../api/loyalty.keys";

/**
 * Frozen loyalty outcome for one order. Read from the order snapshot, so it is
 * unaffected by later policy changes and never falls back to a cart estimate.
 */
export function useOrderReward(orderId: string | null | undefined) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const id = orderId?.trim() || null;

  const query = useApiQuery(
    loyaltyKeys.order(id ?? ""),
    () => {
      if (!id) return Promise.resolve({ earned: false as const });
      return fetchOrderReward(id);
    },
    { enabled: bootstrapped && isAuthenticated && Boolean(id), staleTime: 60_000 },
  );

  return query.data ?? null;
}
