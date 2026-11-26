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
 * Whether the shared address of this market list (no market of its own) serves
 * `zoneCode` at `/~CODE`: a market without a website of its own (backend
 * `onSharedAddress`). False on a market website.
 */
export function servedOnSharedAddress(
  list: { siteMarketCode?: string | null; markets: StorefrontMarket[] } | null,
  zoneCode: string | null | undefined,
): boolean {
  // The page tree's market (`~CODE`) is only served where the proxy allowed it: the
  // shared address, which may be a market's own website too (swissarabian.com).
  if (!list || !zoneCode || zoneCode === list.siteMarketCode) return false;
  const market = list.markets.find((m) => m.zoneCode === zoneCode);
  return Boolean(market && market.onSharedAddress && !market.storefrontUrl);
}

/**
 * The page's market when the shared address serves it at `/~CODE` (page tree
 * `swissarabian.com~KWT`); null on a market website and elsewhere.
 */
export async function sharedAddressMarketCode(): Promise<string | null> {
  const code = await currentSiteMarketCode();
  if (!code) return null;
  return servedOnSharedAddress(await loadServerMarkets(), code) ? code : null;
}

/**
 * The market a page's own addresses are for (hreflang, sitemap): the address's own
 * market (a market website), else the shared address's market of this page; null
 * on a root domain page that is no market's.
 */
export async function pageOwnMarketCode(): Promise<string | null> {
  const list = await loadServerMarkets();
  return (await sharedAddressMarketCode()) ?? list?.siteMarketCode ?? null;
}

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
    // A page under `/~CODE` is that market's, also on an address that is another
    // market's own website (swissarabian.com: Global's, and NEW's at /~NEW).
    const treeMarket = await currentSiteMarketCode();
    const wanted =
      (treeMarket && servedOnSharedAddress(list, treeMarket) ? treeMarket : null) ||
      list.siteMarketCode?.trim() ||
      zoneCode?.trim() ||
      treeMarket;
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
