import { cache } from "react";
import { fetchStorefrontMarkets } from "@/features/markets/api/markets.service";
import { marketContentLanguage } from "@/features/markets/utils/marketContentLanguage";
import type { StorefrontMarket } from "@/features/markets/types/market";
import type { StorefrontContextInput } from "@/lib/storefront/context";
import type { ShopLocale } from "@/lib/i18n/locales";
import { currentSiteMarketCode } from "@/lib/site/currentSite";

function marketContext(
  market: StorefrontMarket,
  locale: ShopLocale,
): StorefrontContextInput {
  return {
    zoneCode: market.zoneCode,
    languageCode: locale,
    currencyCode:
      market.catalogContext.currencyCode ?? market.defaultCurrencyCode,
    countryCode: market.catalogContext.countryCode || market.countryCode,
    salesChannelCode:
      market.salesChannelCode ?? market.catalogContext.salesChannelCode,
    zoneId: market.zoneId,
    brandId: market.catalogContext.brandId,
    brandCode: market.catalogContext.brandCode,
  };
}

/** The website's markets (one request per render): the address decides the brand and its market. */
export const loadServerMarkets = cache(async () => {
  try {
    return await fetchStorefrontMarkets();
  } catch {
    return null;
  }
});

/**
 * A market in a language. A market address (`ksa.swissarabian.com`) always
 * gets its own market; elsewhere `zoneCode` when given, else the page tree's
 * market (`swissarabian.com~KSA`, chosen by the proxy), when it is one of the
 * storefront's markets, else the storefront's default market. No request data
 * is read, so pages stay static (one cached set per address and market).
 */
export async function resolveCatalogMarketFor(
  locale: ShopLocale,
  zoneCode?: string | null,
) {
  const list = await loadServerMarkets();
  let chosen: StorefrontMarket | null = null;
  if (list) {
    const ready = list.markets.filter((market) => market.isCatalogReady);
    const pool = ready.length ? ready : list.markets;
    const wanted =
      list.siteMarketCode?.trim() || zoneCode?.trim() || (await currentSiteMarketCode());
    chosen =
      (wanted ? pool.find((market) => market.zoneCode === wanted) : null) ??
      list.defaultMarket ??
      pool[0] ??
      null;
  }
  return {
    locale,
    zoneCode: chosen?.zoneCode ?? "",
    market: chosen ? marketContext(chosen, locale) : { languageCode: locale },
    /** Code the market publishes content under for this language (e.g. "en-us"). */
    contentLanguage: chosen
      ? (marketContentLanguage(chosen.languages, locale) ?? locale)
      : "",
    /** The market's own languages (language picker, hreflang). */
    languages: chosen?.languages ?? [],
  };
}
