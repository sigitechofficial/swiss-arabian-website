"use client";

import { useQuery, type QueryKey } from "@tanstack/react-query";
import { useSelectedCatalogMarket } from "@/features/markets/hooks/useSelectedCatalogMarket";
import type { StorefrontContextInput } from "@/lib/storefront/context";

/**
 * A product / collection / category the server rendered for the storefront's
 * default market (catalog pages are prerendered). When the shopper's market is
 * another one, the browser loads that market's version instead.
 */
export function useMarketDocument<T>(options: {
  server: T | null;
  /** Market the server rendered `server` for ("" when unknown). */
  serverZoneCode?: string | null;
  queryKey: (zoneCode: string | null | undefined) => QueryKey;
  fetch: (market: StorefrontContextInput) => Promise<T | null>;
  /** Also load in the browser when the server had nothing (default true). */
  fetchWhenMissing?: boolean;
}) {
  const fetchWhenMissing = options.fetchWhenMissing ?? true;
  const market = useSelectedCatalogMarket();
  const zoneCode = market?.zoneCode ?? "";
  const otherMarket = Boolean(
    zoneCode && options.serverZoneCode && zoneCode !== options.serverZoneCode,
  );
  const query = useQuery({
    queryKey: options.queryKey(market?.zoneCode),
    queryFn: () => options.fetch(market!),
    enabled: Boolean(market) && (otherMarket || (fetchWhenMissing && !options.server)),
    retry: false,
  });
  const data = otherMarket ? (query.data ?? null) : (options.server ?? query.data ?? null);
  return { data, otherMarket, query };
}
