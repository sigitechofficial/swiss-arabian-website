import { useUiStore } from "@/stores/useUiStore";

/** Default storefront market context for browse/commerce calls. */
export const DEFAULT_ZONE_CODE = "UAE";
export const DEFAULT_LANGUAGE_CODE = "en";
export const DEFAULT_CURRENCY_CODE = "AED";

/** The shopper's resolved market. An empty value is not replaced with UAE. */
export function toAuthZoneCode(zoneCode?: string | null): string {
  return zoneCode?.trim().toUpperCase() || "";
}

/**
 * Invented channel label. Catalog, search, and collection calls must not use
 * this — they send the selected market's `salesChannelCode` from `/storefront/markets`.
 */
export function toAuthSalesChannelCode(zoneCode?: string | null): string {
  const zone = zoneCode?.trim().toLowerCase() || "";
  return zone ? `platform_sa_${zone}` : "";
}

export type StorefrontContextInput = {
  zoneCode?: string | null;
  languageCode?: string | null;
  currencyCode?: string | null;
  countryCode?: string | null;
  salesChannelCode?: string | null;
  zoneId?: string | null;
  brandId?: string | null;
  brandCode?: string | null;
};

/** Last selected market’s catalogContext (client only; empty on the server). */
export function getPersistedCatalogContext(): StorefrontContextInput {
  if (typeof window === "undefined") return {};
  return useUiStore.getState().catalogContext ?? {};
}

function trimmed(value?: string | null): string {
  return value?.trim() || "";
}

/**
 * Catalog context for the shopper's selected market.
 * Zone, channel, currency, language, and country come from that market.
 * Another market's values are not reused, and a channel code is never invented.
 */
export function resolveStorefrontContext(
  input: StorefrontContextInput = {},
): StorefrontContextInput {
  const saved = getPersistedCatalogContext();
  const requestedZone = trimmed(input.zoneCode);
  const savedZone = trimmed(saved.zoneCode);
  const zoneCode = requestedZone || savedZone;
  const sameMarket = Boolean(zoneCode) && (!requestedZone || savedZone === requestedZone);

  if (!zoneCode) {
    // No market has been resolved from the host or the shopper's choice.
    // Do not invent a zone. Callers wait.
    return {
      languageCode: trimmed(input.languageCode) || undefined,
      currencyCode: trimmed(input.currencyCode) || undefined,
      countryCode: trimmed(input.countryCode) || undefined,
      salesChannelCode: trimmed(input.salesChannelCode) || undefined,
    };
  }

  const fromMarket = (inputValue?: string | null, savedValue?: string | null) =>
    trimmed(inputValue) || (sameMarket ? trimmed(savedValue) : "") || undefined;

  return {
    zoneCode,
    languageCode: fromMarket(input.languageCode, saved.languageCode),
    currencyCode: fromMarket(input.currencyCode, saved.currencyCode),
    countryCode: fromMarket(input.countryCode, saved.countryCode),
    salesChannelCode: fromMarket(input.salesChannelCode, saved.salesChannelCode),
    zoneId: fromMarket(input.zoneId, saved.zoneId),
    brandId: trimmed(input.brandId) || (sameMarket ? saved.brandId : undefined) || undefined,
    brandCode: trimmed(input.brandCode) || (sameMarket ? saved.brandCode : undefined) || undefined,
  };
}

/** Build market query params for storefront catalog routes. */
export function storefrontContextQuery(
  input: StorefrontContextInput = {},
): string {
  const ctx = resolveStorefrontContext(input);
  const params = new URLSearchParams();
  if (ctx.zoneCode) params.set("zoneCode", ctx.zoneCode);
  if (ctx.languageCode) params.set("languageCode", ctx.languageCode);
  if (ctx.currencyCode) params.set("currencyCode", ctx.currencyCode);
  if (ctx.countryCode) params.set("countryCode", ctx.countryCode);
  if (ctx.salesChannelCode) params.set("salesChannelCode", ctx.salesChannelCode);
  return params.toString();
}
