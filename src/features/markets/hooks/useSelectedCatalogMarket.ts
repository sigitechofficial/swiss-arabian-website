"use client";

import { usePathname } from "next/navigation";
import { localeFromPathname } from "@/lib/i18n/localePath";
import { useMarket } from "@/providers/MarketProvider";
import type { StorefrontContextInput } from "@/lib/storefront/context";

/**
 * The market the shopper selected, once its catalog context is ready.
 * Search and collection queries wait for this so they do not run against
 * another market's zone or an invented channel.
 */
export function useSelectedCatalogMarket(): StorefrontContextInput | null {
  const { marketId, catalogContext } = useMarket();
  // The address decides the language; the saved context catches up a moment later.
  const languageCode = localeFromPathname(usePathname() || "/");
  const zoneCode = marketId?.trim() || "";
  const salesChannelCode = catalogContext?.salesChannelCode?.trim() || "";
  if (!zoneCode || catalogContext?.zoneCode?.trim() !== zoneCode || !salesChannelCode) {
    return null;
  }
  return {
    zoneCode,
    salesChannelCode,
    languageCode,
    currencyCode: catalogContext.currencyCode,
    countryCode: catalogContext.countryCode,
    zoneId: catalogContext.zoneId,
    brandId: catalogContext.brandId,
    brandCode: catalogContext.brandCode,
  };
}
