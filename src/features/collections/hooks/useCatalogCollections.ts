"use client";

import { useQuery } from "@tanstack/react-query";
import {
  catalogKeys,
  fetchCollections,
  type CatalogCollection,
} from "@/features/catalog/api/catalog.service";
import { useSelectedCatalogMarket } from "@/features/markets/hooks/useSelectedCatalogMarket";

/**
 * The market's collections (`GET /storefront/catalog/collections`). `initial`
 * is a server-rendered list; it is used only while it belongs to the
 * shopper's market.
 */
export type CollectionsInitial = { zoneCode: string; collections: CatalogCollection[] } | null;

export function useCatalogCollections(initial?: CollectionsInitial) {
  const market = useSelectedCatalogMarket();
  const zoneCode = market?.zoneCode ?? initial?.zoneCode ?? "";
  const serverList = initial && initial.zoneCode === zoneCode ? initial.collections : undefined;
  const query = useQuery({
    queryKey: [...catalogKeys.collections(zoneCode), market?.salesChannelCode ?? ""],
    queryFn: () => fetchCollections(zoneCode, market),
    enabled: Boolean(market),
    initialData: serverList,
  });
  const { data, isLoading, isError, refetch } = query;
  return {
    collections: data,
    /** Nothing to show yet: no market in the browser, or the first load is running. */
    loading: !data && (!market || isLoading),
    isError,
    /** The store couldn't be reached and there is nothing to show. */
    loadFailed: isError && !data,
    retry: () => void refetch(),
  };
}
