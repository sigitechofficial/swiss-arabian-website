import { getPersistedCatalogContext } from "@/lib/storefront/context";
import { useUiStore } from "@/stores/useUiStore";

/**
 * Order dates and times are shown in the market's time zone, so the server
 * render, the browser and the emails agree (a UAE order reads Dubai time
 * wherever the shopper's device is set). The API sends no time zone, so the
 * market's country decides it.
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

/** The selected market's time zone (the default market's on the server). */
export function currentMarketTimeZone(): string {
  return marketTimeZone(getPersistedCatalogContext().countryCode);
}

/** `currentMarketTimeZone` for components: follows a market switch. */
export function useMarketTimeZone(): string {
  return marketTimeZone(useUiStore((state) => state.catalogContext?.countryCode));
}
