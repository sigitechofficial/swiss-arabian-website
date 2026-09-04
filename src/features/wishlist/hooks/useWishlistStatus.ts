"use client";

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { useAuthBootstrapped, useIsAuthenticated } from "@/hooks/useCurrentUser";
import { wishlistKeys } from "../api/wishlist.keys";
import { fetchWishlistStatus } from "../api/wishlist.service";
import { chunkProductIds, uniqueProductUuids } from "../utils/productId";

export function useWishlistStatusMap(productIds: readonly string[]) {
  const isAuthenticated = useIsAuthenticated();
  const bootstrapped = useAuthBootstrapped();
  const idsKey = uniqueProductUuids(productIds).join(",");
  const chunks = useMemo(
    () => (idsKey ? chunkProductIds(idsKey.split(",")) : []),
    [idsKey],
  );
  const enabled = bootstrapped && isAuthenticated && chunks.length > 0;

  const queries = useQueries({
    queries: chunks.map((chunk) => ({
      queryKey: wishlistKeys.status(chunk),
      queryFn: () => fetchWishlistStatus(chunk),
      enabled,
    })),
  });

  const map = useMemo(() => {
    const next = new Map<string, boolean>();
    for (const query of queries) {
      for (const item of query.data?.items ?? []) {
        next.set(item.productId, item.inWishlist);
      }
    }
    return next;
  }, [queries]);

  return {
    inWishlist: (productId: string) => map.get(productId) === true,
    isLoading: enabled && queries.some((query) => query.isPending),
  };
}
