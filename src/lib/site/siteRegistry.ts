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
  /**
   * The brand's shared address serves this market (it has no website of its own):
   * the shared address opens it instead of sending the visitor on. Older backends
   * omit it (then only markets with a website of their own are routed to).
   */
  onSharedAddress?: boolean;
  languages: string[];
};

export type SiteInfo = {
  host: string;
  brandCode: string;
  storefrontCode: string | null;
  /** The brand's root domain this address sits under (address table); null when under none. */
  brandDomain?: string | null;
  /**
   * The brand's live shared address (`https://swissarabian.com`), where the markets
   * without a website of their own are served; null when none (older backends omit it).
   */
  sharedSiteUrl?: string | null;
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

/** Market codes are compared without case (a link may carry `kwt`). */
function sameCode(a: string | null | undefined, b: string | null | undefined): boolean {
  const code = a?.trim().toUpperCase();
  return Boolean(code) && code === b?.trim().toUpperCase();
}

/** The address's market with this code (codes compared without case). */
export function siteMarketFor(
  site: Pick<SiteInfo, "markets">,
  zoneCode: string | null | undefined,
): SiteMarket | undefined {
  return zoneCode ? site.markets.find((market) => sameCode(market.zoneCode, zoneCode)) : undefined;
}

/**
 * Whether this address opens `zoneCode` itself: an address with no market of its
 * own (the brand's shared address) serving a market that has no website of its own.
 */
export function servedHere(
  site: Pick<SiteInfo, "siteMarketCode" | "markets">,
  zoneCode: string | null | undefined,
): boolean {
  if (site.siteMarketCode) return false;
  const market = siteMarketFor(site, zoneCode);
  return Boolean(market && !market.storefrontUrl && market.onSharedAddress);
}

/**
 * Where a root domain sends the visitor: the market they chose before (market
 * cookie), else the market of their country, else the brand's default market.
 * A market with a website of its own sends them there; a market this address
 * serves (no website of its own) keeps them here (null). Markets that are neither
 * (an own address not live yet) are passed over. Null also keeps the root domain
 * serving pages itself when no market has a website yet (e.g. locally).
 */
export function marketSiteForVisitor(
  site: SiteInfo,
  visitor: { zoneCode?: string | null; country?: string | null },
): string | null {
  if (site.siteMarketCode) return null;
  const withSite = site.markets.filter((market) => market.storefrontUrl);
  if (!withSite.length) return null;
  const routed = (market: SiteMarket | undefined) =>
    market && (market.storefrontUrl || market.onSharedAddress) ? market : undefined;
  const country = visitor.country?.trim().toUpperCase();
  const pick =
    routed(siteMarketFor(site, visitor.zoneCode)) ??
    routed(country ? site.markets.find((m) => m.countryCode.trim().toUpperCase() === country) : undefined) ??
    routed(siteMarketFor(site, site.defaultMarketCode)) ??
    withSite[0];
  return pick.storefrontUrl ?? null;
}

/**
 * The market of the visitor's country among the markets this address offers:
 * every brand market on an address that serves several (markets switch on the
 * page), the address's own market and the markets with a website of their own on
 * a market website (switching goes there). Null: no country, or no market for it
 * (the country is not one of the brand's markets).
 */
export function marketForCountry(
  site: Pick<SiteInfo, "siteMarketCode" | "markets" | "sharedSiteUrl">,
  country: string | null,
): string | null {
  if (!country) return null;
  // On a market website: its own market, the markets with a website of their own
  // and those the brand's shared address serves (switching goes there).
  const offered = site.siteMarketCode
    ? site.markets.filter(
        (m) =>
          m.zoneCode === site.siteMarketCode ||
          m.storefrontUrl ||
          (m.onSharedAddress && site.sharedSiteUrl),
      )
    : site.markets;
  return offered.find((m) => m.countryCode.trim().toUpperCase() === country)?.zoneCode ?? null;
}

/**
 * The market a first visit to an address that serves several markets starts in:
 * the visitor's country's market, only when they have no market yet (a saved
 * market, chosen or set by an earlier visit, always wins). Market websites and
 * root domains that send visitors on never need one.
 */
export function firstVisitMarket(
  site: Pick<SiteInfo, "siteMarketCode">,
  visitor: { savedZone: string | null; countryMarket: string | null },
): string | null {
  if (site.siteMarketCode || visitor.savedZone) return null;
  return visitor.countryMarket;
}
