"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useUiStore } from "@/stores/useUiStore";
import { marketTimeZone } from "./marketTimeZone";

/**
 * The time zone of the market this page belongs to, decided by the server (root layout)
 * from the page's market. Dates are formatted in it, so the server render and the browser
 * print the same day whatever time zone the shopper's device is in (React error #418 came
 * from a review dated "17 Mar" on the server and "18 Mar" in a browser in Pakistan).
 */
const MarketTimeZoneContext = createContext<string | null>(null);

export function MarketTimeZoneProvider({
  timeZone,
  children,
}: {
  timeZone: string;
  children: ReactNode;
}) {
  return (
    <MarketTimeZoneContext.Provider value={timeZone}>
      {children}
    </MarketTimeZoneContext.Provider>
  );
}

/**
 * The page's market time zone. Outside the provider (isolated tests, stand-alone widgets) it
 * falls back to the selected market's, then the home market's.
 */
export function useMarketTimeZone(): string {
  const fromPage = useContext(MarketTimeZoneContext);
  const selectedCountry = useUiStore((state) => state.catalogContext?.countryCode);
  return fromPage ?? marketTimeZone(selectedCountry);
}
