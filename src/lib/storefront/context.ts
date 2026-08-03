/** Default storefront market context for browse/commerce calls. */
export const DEFAULT_ZONE_CODE = "UAE";
export const DEFAULT_LANGUAGE_CODE = "en";
export const DEFAULT_CURRENCY_CODE = "AED";

export type StorefrontContextInput = {
  zoneCode?: string | null;
  languageCode?: string | null;
  currencyCode?: string | null;
  countryCode?: string | null;
  salesChannelCode?: string | null;
};

/** Build `?zoneCode=…&languageCode=…` for storefront catalog/homepage routes. */
export function storefrontContextQuery(
  input: StorefrontContextInput = {},
): string {
  const params = new URLSearchParams();
  params.set("zoneCode", input.zoneCode?.trim() || DEFAULT_ZONE_CODE);
  params.set(
    "languageCode",
    input.languageCode?.trim() || DEFAULT_LANGUAGE_CODE,
  );
  params.set(
    "currencyCode",
    input.currencyCode?.trim() || DEFAULT_CURRENCY_CODE,
  );
  if (input.countryCode?.trim()) {
    params.set("countryCode", input.countryCode.trim());
  }
  if (input.salesChannelCode?.trim()) {
    params.set("salesChannelCode", input.salesChannelCode.trim());
  }
  return params.toString();
}
