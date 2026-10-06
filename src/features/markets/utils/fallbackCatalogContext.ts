import type { StorefrontContextInput } from "@/lib/storefront/context";

/**
 * Holds the shopper's zone until `/storefront/markets` returns that market's
 * channel, currency, and language. Does not invent a sales channel.
 */
export function fallbackCatalogContext(zoneCode: string): StorefrontContextInput {
  const zone = zoneCode.trim();
  return zone ? { zoneCode: zone } : {};
}
