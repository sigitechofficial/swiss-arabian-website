import { env } from "@/lib/config/env";

/**
 * Which website an address is, from the backend address table
 * (`GET /storefront/site`). The proxy uses it to serve only known addresses and
 * to send a brand's root domain (no market of its own) to a market website.
 * Edge-safe: plain fetch, in-memory cache per instance.
 */
export type SiteMarket = {
  zoneCode: string;
  countryCode: string;
  storefrontUrl: string | null;
  languages: string[];
};

export type SiteInfo = {
  host: string;
  brandCode: string;
  storefrontCode: string | null;
  /** The brand's root domain this address sits under (address table); null when under none. */
  brandDomain?: string | null;
  /** The address's own market; null when the address serves no single market. */
  siteMarketCode: string | null;
  defaultMarketCode: string | null;
  markets: SiteMarket[];
};

/** `known`: in the address table; `unknown`: 404; `unavailable`: backend not reachable. */
export type SiteLookup =
  | { status: "known"; site: SiteInfo }
  | { status: "unknown" }
  | { status: "unavailable" };

const TTL_MS = 60_000;
const FETCH_TIMEOUT_MS = 1_500;

type Entry = { at: number; lookup: SiteLookup; refreshing?: Promise<void> };
const cache = new Map<string, Entry>();

async function load(storefrontHost: string): Promise<SiteLookup> {
  const res = await fetch(`${env.apiBaseUrl}/storefront/site`, {
    headers: { "x-storefront-host": storefrontHost },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (res.status === 404) return { status: "unknown" };
  if (!res.ok) throw new Error(`site ${res.status}`);
  const json = (await res.json()) as { data?: SiteInfo } & Partial<SiteInfo>;
  const site = json.data ?? (json as SiteInfo);
  if (!site?.host || !Array.isArray(site.markets)) throw new Error("site: unexpected response");
  return { status: "known", site };
}

function refresh(storefrontHost: string, entry: Entry | undefined): Promise<void> {
  if (entry?.refreshing) return entry.refreshing;
  const refreshing = load(storefrontHost)
    .then((lookup) => {
      cache.set(storefrontHost, { at: Date.now(), lookup });
    })
    .catch(() => {
      // Keep the last good answer; retry after the TTL. Never cache an outage as "unknown".
      cache.set(storefrontHost, {
        at: Date.now(),
        lookup: entry && entry.lookup.status !== "unavailable" ? entry.lookup : { status: "unavailable" },
      });
    });
  cache.set(storefrontHost, {
    at: entry?.at ?? 0,
    lookup: entry?.lookup ?? { status: "unavailable" },
    refreshing,
  });
  return refreshing;
}

/**
 * The website for a storefront host. Waits only for the first load per address;
 * after that the cached answer is served and refreshed in the background.
 */
export async function lookupSite(storefrontHost: string): Promise<SiteLookup> {
  const key = storefrontHost.toLowerCase();
  let entry = cache.get(key);
  if (!entry || (entry.lookup.status === "unavailable" && !entry.refreshing)) {
    await refresh(key, entry);
    entry = cache.get(key);
  } else if (Date.now() - entry.at > TTL_MS) {
    void refresh(key, entry);
  }
  return entry?.lookup ?? { status: "unavailable" };
}

/** Test hook. */
export function clearSiteCache() {
  cache.clear();
}

/**
 * Where a root domain sends the visitor: the market they chose before (market
 * cookie), else the market of their country, else the brand's default market.
 * Only markets with a website of their own count; null keeps the root domain
 * serving pages itself (no market websites yet, e.g. locally).
 */
export function marketSiteForVisitor(
  site: SiteInfo,
  visitor: { zoneCode?: string | null; country?: string | null },
): string | null {
  if (site.siteMarketCode) return null;
  const withSite = site.markets.filter((market) => market.storefrontUrl);
  if (!withSite.length) return null;
  const pick =
    (visitor.zoneCode ? withSite.find((m) => m.zoneCode === visitor.zoneCode) : undefined) ??
    (visitor.country ? withSite.find((m) => m.countryCode.toUpperCase() === visitor.country) : undefined) ??
    (site.defaultMarketCode ? withSite.find((m) => m.zoneCode === site.defaultMarketCode) : undefined) ??
    withSite[0];
  return pick?.storefrontUrl ?? null;
}
