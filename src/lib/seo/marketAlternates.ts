import { unstable_cache } from "next/cache";
import { env } from "@/lib/config/env";
import { stripLocalePrefix, withLocalePrefix } from "@/lib/i18n/localePath";
import { LOCALES } from "@/lib/i18n/locales";
import type { StorefrontMarket, StorefrontMarketListResponse } from "@/features/markets/types/market";

/**
 * hreflang between a brand's market websites: the same page on
 * `uae.swissarabian.com` (en-AE, ar-AE) and `ksa.swissarabian.com` (en-SA,
 * ar-SA), with x-default on the brand's default market. A market is only named
 * for a page that exists there: catalog pages are checked against that market's
 * catalog (its own sitemap), fixed pages exist in every market, and anything
 * else (CMS pages, Journal posts) is linked within its own website only.
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
  /** Configured shop languages the market publishes, default first. */
  languages: string[];
};

function marketLanguages(market: StorefrontMarket): string[] {
  const codes = market.languages
    .slice()
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
    .map((l) => (l.languageCode || l.locale || "").slice(0, 2).toLowerCase())
    .filter((code) => (LOCALES as readonly string[]).includes(code));
  return [...new Set(codes)];
}

/** The brand's market websites (markets with an address of their own). */
export function marketSites(list: StorefrontMarketListResponse | null): MarketSite[] {
  if (!list) return [];
  const sites: MarketSite[] = [];
  for (const market of list.markets) {
    if (!market.storefrontUrl) continue;
    try {
      const url = new URL(market.storefrontUrl);
      sites.push({
        zoneCode: market.zoneCode,
        countryCode: market.countryCode.toUpperCase(),
        origin: url.origin,
        host: url.host,
        languages: marketLanguages(market),
      });
    } catch {
      // A malformed address is skipped (never linked).
    }
  }
  return sites;
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
      const localized = withLocalePrefix(bare, code);
      languages[`${code}-${site.countryCode}`] = isOwn
        ? localized
        : `${site.origin}${localized === "/" ? "" : localized}`;
    }
  }
  const fallback =
    input.sites.find((site) => site.zoneCode === input.defaultZoneCode) ?? own;
  const fallbackIsOwn = fallback.zoneCode === own.zoneCode;
  if (fallbackIsOwn || pathExistsIn(bare, input.catalogPaths.get(fallback.zoneCode) ?? null)) {
    const localized = withLocalePrefix(bare, fallback.languages[0] ?? LOCALES[0]);
    languages["x-default"] = fallbackIsOwn
      ? localized
      : `${fallback.origin}${localized === "/" ? "" : localized}`;
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
