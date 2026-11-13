"use client";

import { useQuery } from "@tanstack/react-query";
import {
  catalogKeys,
  fetchCollections,
  type CatalogCollection,
} from "@/features/catalog/api/catalog.service";
import { useSelectedCatalogMarket } from "@/features/markets/hooks/useSelectedCatalogMarket";

export type CollectionsInitial = { zoneCode: string; collections: CatalogCollection[] } | null;

/**
 * The selected market's collections. `initial` is the server-rendered list for
 * the request market, used only while it matches the shopper's market.
 */
export function useCollectionsList(initial?: CollectionsInitial) {
  const market = useSelectedCatalogMarket();
  const zoneCode = market?.zoneCode ?? initial?.zoneCode ?? "";
  const serverList = initial && initial.zoneCode === zoneCode ? initial.collections : undefined;
  const query = useQuery({
    queryKey: [...catalogKeys.collections(zoneCode), market?.salesChannelCode ?? ""],
    queryFn: () => fetchCollections(zoneCode, market),
    enabled: Boolean(market),
    initialData: serverList,
  });
  return {
    collections: query.data,
    loading: !query.data && (!market || query.isLoading),
    loadFailed: query.isError && !query.data,
    retry: () => void query.refetch(),
  };
}
