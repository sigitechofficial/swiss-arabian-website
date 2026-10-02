import { useUiStore } from "@/stores/useUiStore";

/** Default storefront market context for browse/commerce calls. */
export const DEFAULT_ZONE_CODE = "UAE";
export const DEFAULT_LANGUAGE_CODE = "en";
export const DEFAULT_CURRENCY_CODE = "AED";

/** Auth / register: zone matches the markets API (`UAE`, `KSA`). */
export function toAuthZoneCode(zoneCode?: string | null): string {
  return (zoneCode?.trim() || DEFAULT_ZONE_CODE).toUpperCase();
}

export function toAuthSalesChannelCode(zoneCode?: string | null): string {
  const zone = (zoneCode?.trim() || DEFAULT_ZONE_CODE).toLowerCase();
  return `platform_${zone}`;
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

export function resolveStorefrontContext(
  input: StorefrontContextInput = {},
): StorefrontContextInput {
  const saved = getPersistedCatalogContext();
  const zoneCode = input.zoneCode?.trim() || saved.zoneCode || DEFAULT_ZONE_CODE;
  const sameZone = !saved.zoneCode || saved.zoneCode === zoneCode;
  return {
    zoneCode,
    languageCode:
      input.languageCode?.trim() ||
      (sameZone ? saved.languageCode : null) ||
      DEFAULT_LANGUAGE_CODE,
    currencyCode:
      input.currencyCode?.trim() ||
      (sameZone ? saved.currencyCode : null) ||
      DEFAULT_CURRENCY_CODE,
    countryCode:
      input.countryCode?.trim() ||
      (sameZone ? saved.countryCode : null) ||
      undefined,
    salesChannelCode:
      input.salesChannelCode?.trim() ||
      (sameZone ? saved.salesChannelCode : null) ||
      toAuthSalesChannelCode(zoneCode),
  };
}

/** Build `?zoneCode=…&languageCode=…` for storefront catalog/homepage routes. */
export function storefrontContextQuery(
  input: StorefrontContextInput = {},
): string {
  const ctx = resolveStorefrontContext(input);
  const params = new URLSearchParams();
  params.set("zoneCode", ctx.zoneCode || DEFAULT_ZONE_CODE);
  params.set("languageCode", ctx.languageCode || DEFAULT_LANGUAGE_CODE);
  params.set("currencyCode", ctx.currencyCode || DEFAULT_CURRENCY_CODE);
  if (ctx.countryCode?.trim()) {
    params.set("countryCode", ctx.countryCode.trim());
  }
  if (ctx.salesChannelCode?.trim()) {
    params.set("salesChannelCode", ctx.salesChannelCode.trim());
  }
  return params.toString();
}
