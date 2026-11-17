/**
 * Dates and times are shown in the market's time zone, so the server render,
 * the browser and the emails agree (a UAE order reads Dubai time wherever the
 * shopper's device is set). The API sends no time zone, so the market's country
 * decides it. Components read it with `useMarketTimeZone()`
 * (MarketTimeZoneProvider), which the root layout sets from the page's market.
 */
const COUNTRY_TIME_ZONE: Record<string, string> = {
  AE: "Asia/Dubai",
  SA: "Asia/Riyadh",
  KW: "Asia/Kuwait",
  QA: "Asia/Qatar",
  BH: "Asia/Bahrain",
  OM: "Asia/Muscat",
  EG: "Africa/Cairo",
  JO: "Asia/Amman",
  IQ: "Asia/Baghdad",
  LB: "Asia/Beirut",
  PK: "Asia/Karachi",
  IN: "Asia/Kolkata",
  GB: "Europe/London",
};

/** The shop's home market (UAE) when the country is unknown. */
export const DEFAULT_MARKET_TIME_ZONE = "Asia/Dubai";

export function marketTimeZone(countryCode?: string | null): string {
  const code = countryCode?.trim().toUpperCase() ?? "";
  return COUNTRY_TIME_ZONE[code] ?? DEFAULT_MARKET_TIME_ZONE;
}
