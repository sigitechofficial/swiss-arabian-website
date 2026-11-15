"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useOptionalMarket } from "@/providers/MarketProvider";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import {
  readCountryMarket,
  readDeclinedCountryMarket,
  writeDeclinedCountryMarket,
} from "@/features/markets/utils/zoneCookie";
import {
  countryDisplayName,
  countryMarketSuggestion,
} from "@/features/markets/utils/countryMarketSuggestion";

export type CountryMarketOption = { id: string; label: string; flag?: string };

export type CountryMarketSuggestion = {
  /** The market of the shopper's country (suggested). */
  suggested: CountryMarketOption;
  /** The market in use. */
  current: CountryMarketOption;
  /** The country's name in the page's language (falls back to the market name). */
  countryName: string;
  /** Switch to the suggested market. */
  accept: () => void;
  /** Stay in the current market; this suggestion is not shown again. */
  decline: () => void;
};

/* A brand shell can draw the suggestion in its own design: while one is mounted, the default prompt draws nothing. */
let brandHosts = 0;
const hostListeners = new Set<() => void>();
function subscribeHosts(listener: () => void) {
  hostListeners.add(listener);
  return () => {
    hostListeners.delete(listener);
  };
}
const brandHostClaimed = () => brandHosts > 0;
const noBrandHost = () => false;

/* Cookies as an external store: this hook's own writes notify; the proxy's are read on the next render. */
const cookieListeners = new Set<() => void>();
function subscribeCookies(listener: () => void) {
  cookieListeners.add(listener);
  return () => {
    cookieListeners.delete(listener);
  };
}
const browserCookies = () => document.cookie;
const noCookies = () => "";

/** True while a brand shell draws the suggestion itself. */
export function useCountryPromptClaimed(): boolean {
  return useSyncExternalStore(subscribeHosts, brandHostClaimed, noBrandHost);
}

/** For a brand's own prompt: claims the suggestion (the default prompt hides). */
export function useClaimCountryPrompt(): void {
  useEffect(() => {
    brandHosts += 1;
    hostListeners.forEach((listener) => listener());
    return () => {
      brandHosts -= 1;
      hostListeners.forEach((listener) => listener());
    };
  }, []);
}

/**
 * The market suggestion for the shopper's current country (null: nothing to
 * suggest). The country's market comes from the edge through the proxy's
 * country market cookie; the shopper's own market always stays until they accept.
 */
export function useCountryMarketSuggestion(): CountryMarketSuggestion | null {
  const market = useOptionalMarket();
  const pathname = usePathname() || "/";
  const locale = useShopLocale();
  // Read in the browser only (the server never draws the prompt). The snapshot is
  // read on every render, so a page change picks up the proxy's latest value.
  const cookieString = useSyncExternalStore(subscribeCookies, browserCookies, noCookies);
  const cookies = useMemo(
    () => ({ country: cookieString && readCountryMarket(), declined: cookieString && readDeclinedCountryMarket() }),
    [cookieString],
  );

  const options = useMemo(() => market?.regionOptions ?? [], [market?.regionOptions]);
  const suggestedId = countryMarketSuggestion({
    countryMarket: cookies.country,
    currentMarket: market?.marketId ?? null,
    offered: options.map((option) => option.id),
    declined: cookies.declined,
    pathname,
  });

  const setMarketId = market?.setMarketId;
  const accept = useCallback(() => {
    if (suggestedId) setMarketId?.(suggestedId);
  }, [setMarketId, suggestedId]);
  const decline = useCallback(() => {
    if (!suggestedId) return;
    writeDeclinedCountryMarket(suggestedId);
    cookieListeners.forEach((listener) => listener());
  }, [suggestedId]);

  const suggested = options.find((option) => option.id === suggestedId);
  const current = options.find((option) => option.id === market?.marketId);
  if (!suggested || !current) return null;
  return {
    suggested: { id: suggested.id, label: suggested.label, flag: suggested.flag },
    current: { id: current.id, label: current.label, flag: current.flag },
    countryName: countryDisplayName(suggested.countryCode, locale) ?? suggested.label,
    accept,
    decline,
  };
}
