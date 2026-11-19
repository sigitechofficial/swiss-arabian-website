import { cache } from "react";
import type { MarketReturnTerms } from "@/features/catalog/components/CatalogJsonLd";
import { getMarketReturnsPolicy } from "@/features/afterSales/api/afterSales.service";

/**
 * The market's returns policy today, for the product schema (MerchantReturnPolicy).
 * Cached per request; null when the market has none or the API cannot answer,
 * so the schema leaves the policy out instead of guessing it.
 */
export const loadMarketReturnTerms = cache(async (zoneCode: string | null | undefined): Promise<MarketReturnTerms | null> => {
  const code = zoneCode?.trim();
  if (!code) return null;
  try {
    return await getMarketReturnsPolicy(code);
  } catch {
    return null;
  }
});
