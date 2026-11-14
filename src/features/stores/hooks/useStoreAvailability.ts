"use client";

import { useQuery } from "@tanstack/react-query";
import { brandFeatureEnabled } from "@/lib/brand/features";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { fetchStoreAvailability } from "../api/storesApi";
import type { StoreStock } from "../types";

const ORDER: Record<StoreStock, number> = { IN_STOCK: 0, LOW: 1, OUT_OF_STOCK: 2 };

/**
 * Stock of one product in the market's shops (product page). Off when the
 * brand has no store locator; `tracked` is false when no shop has a D365
 * warehouse yet, so the section stays hidden.
 */
export function useStoreAvailability(sku: string | null | undefined, zoneCode: string) {
  const locale = useShopLocale();
  const enabled = brandFeatureEnabled("storeLocator") && Boolean(sku && zoneCode);
  const query = useQuery({
    queryKey: ["store-availability", zoneCode, sku, locale],
    queryFn: () => fetchStoreAvailability({ zoneCode, languageCode: locale, sku: sku! }),
    enabled,
    staleTime: 5 * 60_000,
  });
  const stores = [...(query.data?.stores ?? [])].sort((a, b) => ORDER[a.stock] - ORDER[b.stock]);
  return {
    tracked: enabled && stores.length > 0,
    stores,
    inStockCount: stores.filter((s) => s.stock !== "OUT_OF_STOCK").length,
  };
}
