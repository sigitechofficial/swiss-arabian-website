import { unstable_cache } from "next/cache";
import { env } from "@/lib/config/env";
import { stripLocalePrefix, withLocalePrefix } from "@/lib/i18n/localePath";
import {
  fallbackLocaleConfig,
  localeConfigFromMarket,
  type LocaleConfig,
} from "@/lib/i18n/locales";
import type { StorefrontMarket, StorefrontMarketListResponse } from "@/features/markets/types/market";
import { marketPagePath } from "@/lib/site/marketLink";

/**
 * hreflang between a brand's markets: the same page on `uae.swissarabian.com`
 * (en-AE, ar-AE), `ksa.swissarabian.com` (en-SA, ar-SA) and, for a market without
 * a website of its own, its address on the shared address
 * (`swissarabian.com/~KWT`, en-KW, ar-KW), with x-default on the brand's default
 * market. A market is only named for a page that exists there: catalog pages are
 * checked against that market's catalog (its own sitemap), fixed pages exist in
 * every market, and anything else (CMS pages, Journal posts) is linked within its
 * own website only.
 */
export const MARKET_PATHS_REVALIDATE_SECONDS = 3600;

/** Pages every market website has. */
const FIXED_PATHS = new Set(["/", "/products", "/collections", "/faq"]);
const CATALOG_PATH = /^\/(?:products|collections|categories)\/[^/]+$/;

export type MarketSite = {
  zoneCode: string;
  countryCode: string;
  origin: string;
  host: string;
  /** "" on a market website; `/~KWT` for a market the shared address serves. */
  basePath: string;
  /** Website languages the market publishes, default first (its default has no prefix). */
  languages: string[];
};

/** A market website's own languages and default (they differ per market). */
function siteLocaleConfig(site: MarketSite): LocaleConfig {
  if (!site.languages.length) return fallbackLocaleConfig();
  return { locales: site.languages, defaultLocale: site.languages[0]! };
}

/**
 * The website languages a market serves, its default first — the same rule the
 * market's own website uses (`localeConfigFromMarket`), including its fallback when
 * the market has none of the website's languages.
 */
function marketLanguages(market: StorefrontMarket): string[] {
  const codes = market.languages
    .slice()
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
    .map((l) => l.locale || l.languageCode);
  return [...localeConfigFromMarket(codes).locales];
}

/**
 * Where each market of the brand lives: its own website, or — a market without
 * one that the shared address serves — that address under `/~CODE`.
 */
export function marketSites(list: StorefrontMarketListResponse | null): MarketSite[] {
  if (!list) return [];
  const sites: MarketSite[] = [];
  for (const market of list.markets) {
    const onShared = !market.storefrontUrl && market.onSharedAddress && list.sharedSiteUrl;
    const address = market.storefrontUrl || (onShared ? list.sharedSiteUrl : null);
    if (!address) continue;
    try {
      const url = new URL(address);
      sites.push({
        zoneCode: market.zoneCode,
        countryCode: market.countryCode.toUpperCase(),
        origin: url.origin,
        host: url.host,
        basePath: onShared ? marketPagePath(market.zoneCode, "/") : "",
        languages: marketLanguages(market),
      });
    } catch {
      // A malformed address is skipped (never linked).
    }
  }
  return sites;
}

/** The absolute address of a (language-prefixed) page on a market's site. */
function siteUrl(site: MarketSite, localized: string): string {
  return `${site.origin}${site.basePath}${localized === "/" ? "" : localized}`;
}

/**
 * Catalog paths published in a market, read from that market's own website
 * (a market address decides the market, so its host is sent). Cached across
 * requests; host and market are part of the cache key.
 */
const marketCatalogPaths = unstable_cache(
  async (host: string, zoneCode: string): Promise<string[]> => {
    const res = await fetch(
      `${env.apiBaseUrl}/storefront/catalog/seo/sitemap?zoneCode=${encodeURIComponent(zoneCode)}`,
      { headers: { "x-storefront-host": host } },
    );
    if (!res.ok) throw new Error(`market sitemap ${res.status}`);
    const json = (await res.json()) as {
      data?: { entries?: Array<{ path: string; noindex?: boolean }> };
      entries?: Array<{ path: string; noindex?: boolean }>;
    };
    const entries = json.data?.entries ?? json.entries ?? [];
    return entries.filter((e) => e.path && !e.noindex).map((e) => e.path.toLowerCase());
  },
  ["market-catalog-paths"],
  { revalidate: MARKET_PATHS_REVALIDATE_SECONDS },
);

/** Catalog paths of a market website; null when they cannot be read (then it is not linked). */
export async function catalogPathsOf(site: MarketSite): Promise<Set<string> | null> {
  try {
    return new Set(await marketCatalogPaths(site.host, site.zoneCode));
  } catch {
    return null;
  }
}

/** Whether a page (bare path, no language prefix) exists on a market website. */
export function pathExistsIn(path: string, catalogPaths: Set<string> | null): boolean {
  if (FIXED_PATHS.has(path)) return true;
  if (CATALOG_PATH.test(path)) return Boolean(catalogPaths?.has(path.toLowerCase()));
  return false;
}

/**
 * hreflang map for a page on a market website, or null when the address is not
 * a market website or the brand has no other market website (then the page keeps
 * its language-only alternates). The page's own website gets relative addresses
 * (resolved against metadataBase); other markets absolute ones.
 */
export function buildMarketHreflang(input: {
  path: string;
  ownZoneCode: string;
  defaultZoneCode: string | null;
  sites: MarketSite[];
  /** Catalog paths per market website (zone code → paths); missing = unreadable. */
  catalogPaths: Map<string, Set<string> | null>;
}): Record<string, string> | null {
  const bare = stripLocalePrefix(input.path) || "/";
  const own = input.sites.find((site) => site.zoneCode === input.ownZoneCode);
  if (!own || input.sites.length < 2) return null;
  const languages: Record<string, string> = {};
  for (const site of input.sites) {
    const isOwn = site.zoneCode === own.zoneCode;
    if (!isOwn && !pathExistsIn(bare, input.catalogPaths.get(site.zoneCode) ?? null)) continue;
    for (const code of site.languages) {
      const localized = withLocalePrefix(bare, code, siteLocaleConfig(site));
      // Own addresses stay relative: metadataBase carries the market's base.
      languages[`${code}-${site.countryCode}`] = isOwn ? localized : siteUrl(site, localized);
    }
  }
  const fallback =
    input.sites.find((site) => site.zoneCode === input.defaultZoneCode) ?? own;
  const fallbackIsOwn = fallback.zoneCode === own.zoneCode;
  if (fallbackIsOwn || pathExistsIn(bare, input.catalogPaths.get(fallback.zoneCode) ?? null)) {
    const config = siteLocaleConfig(fallback);
    const localized = withLocalePrefix(bare, config.defaultLocale, config);
    languages["x-default"] = fallbackIsOwn ? localized : siteUrl(fallback, localized);
  }
  return Object.keys(languages).length > 1 ? languages : null;
}

/** Catalog paths for every other market website a page may link to. */
export async function catalogPathsFor(
  sites: MarketSite[],
  ownZoneCode: string,
  path: string,
): Promise<Map<string, Set<string> | null>> {
  const map = new Map<string, Set<string> | null>();
  const bare = stripLocalePrefix(path) || "/";
  // Only catalog pages need the other markets' catalogs.
  if (!CATALOG_PATH.test(bare)) return map;
  await Promise.all(
    sites
      .filter((site) => site.zoneCode !== ownZoneCode)
      .map(async (site) => map.set(site.zoneCode, await catalogPathsOf(site))),
  );
  return map;
}
