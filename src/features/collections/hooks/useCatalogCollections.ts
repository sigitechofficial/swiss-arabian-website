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
export function useCatalogCollections(
  initial?: { zoneCode: string; collections: CatalogCollection[] } | null,
) {
  const market = useSelectedCatalogMarket();
  const zoneCode = market?.zoneCode ?? initial?.zoneCode ?? "";
  const serverList = initial && initial.zoneCode === zoneCode ? initial.collections : undefined;
  const { data, isLoading, isError } = useQuery({
    queryKey: [...catalogKeys.collections(zoneCode), market?.salesChannelCode ?? ""],
    queryFn: () => fetchCollections(zoneCode, market),
    enabled: Boolean(market),
    initialData: serverList,
  });
  return {
    collections: data,
    /** Nothing to show yet: no market in the browser, or the first load is running. */
    loading: !data && (!market || isLoading),
    isError,
  };
}
