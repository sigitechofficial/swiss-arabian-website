import {
  DEFAULT_CURRENCY_CODE,
  DEFAULT_LANGUAGE_CODE,
  toAuthSalesChannelCode,
  type StorefrontContextInput,
} from "@/lib/storefront/context";

const ZONE_CURRENCY: Record<string, string> = {
  UAE: "AED",
  KSA: "SAR",
  KWT: "KWD",
  QAT: "QAR",
  BHR: "BHD",
  OMN: "OMR",
};

const ZONE_COUNTRY: Record<string, string> = {
  UAE: "AE",
  KSA: "SA",
  KWT: "KW",
  QAT: "QA",
  BHR: "BH",
  OMN: "OM",
};

/** Used only when the public markets API is unavailable. */
export function fallbackCatalogContext(zoneCode: string): StorefrontContextInput {
  const zone = zoneCode.trim() || "UAE";
  return {
    zoneCode: zone,
    salesChannelCode: toAuthSalesChannelCode(zone),
    languageCode: DEFAULT_LANGUAGE_CODE,
    currencyCode: ZONE_CURRENCY[zone] ?? DEFAULT_CURRENCY_CODE,
    countryCode: ZONE_COUNTRY[zone],
  };
}
