"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMarket } from "@/providers/MarketProvider";
import { wishlistKeys } from "../api/wishlist.keys";
import { fetchWishlist } from "../api/wishlist.service";
import type { StorefrontWishlistStatusView } from "../types/wishlist";
import { uniqueProductUuids, WISHLIST_LIST_PAGE_SIZE } from "../utils/productId";
import { toWishlistCatalogProduct } from "../utils/toWishlistProductCard";
import { useWishlistMutations } from "./useWishlistMutations";

/**
 * The signed-in shopper's wishlist for the selected market, a page at a time
 * (`?page=`), with each item mapped to the catalog card model, and "clear all".
 * Loaded items also prime the hearts' wishlist status.
 */
export function useAccountWishlist() {
  const searchParams = useSearchParams();
  const { marketId } = useMarket();
  const zoneCode = marketId || "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const offset = (page - 1) * WISHLIST_LIST_PAGE_SIZE;
  const [confirmClear, setConfirmClear] = useState(false);
  const queryClient = useQueryClient();
  const { clear } = useWishlistMutations();

  const query = useQuery({
    queryKey: wishlistKeys.list(zoneCode, WISHLIST_LIST_PAGE_SIZE, offset),
    queryFn: () => fetchWishlist({ zoneCode, limit: WISHLIST_LIST_PAGE_SIZE, offset }),
    enabled: Boolean(zoneCode),
  });

  const items = query.data?.items;
  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / WISHLIST_LIST_PAGE_SIZE));

  const cards = useMemo(
    () =>
      (items ?? []).map((item) => ({
        item,
        card: item.product ? toWishlistCatalogProduct(item.product) : null,
      })),
    [items],
  );

  useEffect(() => {
    if (!items?.length) return;
    const ids = uniqueProductUuids(items.map((item) => item.productId));
    if (ids.length === 0) return;
    queryClient.setQueryData<StorefrontWishlistStatusView>(wishlistKeys.status(ids), {
      items: ids.map((productId) => ({ productId, inWishlist: true })),
    });
  }, [items, queryClient]);

  return {
    ...query,
    page,
    total,
    totalPages,
    items,
    cards,
    confirmClear,
    setConfirmClear,
    clear,
    clearAll: () => void clear.unwrap().finally(() => setConfirmClear(false)),
  };
}
