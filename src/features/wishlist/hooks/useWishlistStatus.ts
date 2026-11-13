"use client";

import { useCallback, useMemo } from "react";
import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import { useAuthBootstrapped, useIsAuthenticated } from "@/hooks/useCurrentUser";
import { wishlistKeys } from "../api/wishlist.keys";
import { fetchWishlistStatus } from "../api/wishlist.service";
import { chunkProductIds, uniqueProductUuids } from "../utils/productId";

type WishlistStatusResult = Awaited<ReturnType<typeof fetchWishlistStatus>>;

/**
 * Module-level (stable) `combine`: React Query only re-runs it when a query
 * result changes, so the map — and `inWishlist` below — keep their identity
 * across renders. A new function on every render re-rendered every heart
 * button through `WishlistStatusScope` in an endless loop.
 */
function combineStatus(results: UseQueryResult<WishlistStatusResult>[]) {
  const map = new Map<string, boolean>();
  for (const query of results) {
    for (const item of query.data?.items ?? []) {
      map.set(item.productId, item.inWishlist);
    }
  }
  return { map, pending: results.some((query) => query.isPending) };
}

export function useWishlistStatusMap(productIds: readonly string[]) {
  const isAuthenticated = useIsAuthenticated();
  const bootstrapped = useAuthBootstrapped();
  const idsKey = uniqueProductUuids(productIds).join(",");
  const chunks = useMemo(
    () => (idsKey ? chunkProductIds(idsKey.split(",")) : []),
    [idsKey],
  );
  const enabled = bootstrapped && isAuthenticated && chunks.length > 0;

  const { map, pending } = useQueries({
    queries: chunks.map((chunk) => ({
      queryKey: wishlistKeys.status(chunk),
      queryFn: () => fetchWishlistStatus(chunk),
      enabled,
    })),
    combine: combineStatus,
  });

  const inWishlist = useCallback((productId: string) => map.get(productId) === true, [map]);

  return {
    inWishlist,
    isLoading: enabled && pending,
  };
}
