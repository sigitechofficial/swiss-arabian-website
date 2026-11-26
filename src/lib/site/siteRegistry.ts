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
  /**
   * What the brand's main address does with a visitor of another market when it is
   * a market's own website (swissarabian.com for Global): REDIRECT, SUGGEST (the
   * country banner) or STAY. Admin → Brands; older backends omit it (SUGGEST).
   */
  mainAddressVisitors?: "REDIRECT" | "SUGGEST" | "STAY";
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

/** The host of an address (`https://swissarabian.com` → `swissarabian.com`), lower-case. */
function hostOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Whether this address is the brand's shared address (where the markets without
 * a website of their own live, at `/~CODE`): one with no market of its own, or
 * the brand's main address when it is a market's own website (swissarabian.com
 * for Global, the backend's `sharedSiteUrl`).
 */
export function isSharedAddress(
  site: Pick<SiteInfo, "siteMarketCode" | "host" | "sharedSiteUrl">,
): boolean {
  if (!site.siteMarketCode) return true;
  return hostOf(site.sharedSiteUrl) === site.host.trim().toLowerCase();
}

/**
 * Whether this address opens `zoneCode` itself at `/~CODE`: the brand's shared
 * address (isSharedAddress) serving a market that has no website of its own.
 */
export function servedHere(
  site: Pick<SiteInfo, "siteMarketCode" | "markets" | "host" | "sharedSiteUrl">,
  zoneCode: string | null | undefined,
): boolean {
  if (!isSharedAddress(site)) return false;
  const market = siteMarketFor(site, zoneCode);
  return Boolean(
    market && !market.storefrontUrl && market.onSharedAddress && market.zoneCode !== site.siteMarketCode,
  );
}

/**
 * Whether this address is the brand's main address and a market's own website at
 * once (swissarabian.com for Global): its rule for visitors of other markets
 * (`mainAddressVisitors`) applies.
 */
export function isMainMarketAddress(
  site: Pick<SiteInfo, "siteMarketCode" | "host" | "brandDomain">,
): boolean {
  const domain = site.brandDomain?.trim().toLowerCase();
  return Boolean(site.siteMarketCode && domain && domain === site.host.trim().toLowerCase());
}

/**
 * The market a root domain (no market of its own) opens for a visitor: the market
 * they chose before (market cookie), else the market of their country, else the
 * brand's default market. Only markets that can be reached count: one with a
 * website of its own (the visitor is sent there) or one this address serves
 * (no website of its own: its `/~CODE` address here). A market that is neither
 * (an own address not live yet) is passed over. Null on a market website, and
 * when no market can be reached (older backends without `onSharedAddress` and no
 * market website: the address serves pages itself, e.g. locally).
 */
export function marketForVisitor(
  site: SiteInfo,
  visitor: { zoneCode?: string | null; country?: string | null },
): SiteMarket | null {
  if (site.siteMarketCode) return mainAddressVisitorMarket(site, visitor);
  const reachable = (market: SiteMarket | undefined) =>
    market && (market.storefrontUrl || servedHere(site, market.zoneCode)) ? market : undefined;
  const candidates = site.markets.filter((market) => reachable(market));
  if (!candidates.length) return null;
  const country = visitor.country?.trim().toUpperCase();
  return (
    reachable(siteMarketFor(site, visitor.zoneCode)) ??
    reachable(country ? site.markets.find((m) => m.countryCode.trim().toUpperCase() === country) : undefined) ??
    reachable(siteMarketFor(site, site.defaultMarketCode)) ??
    candidates.find((market) => market.storefrontUrl) ??
    candidates[0] ??
    null
  );
}

/**
 * On the brand's main address that is a market's own website (swissarabian.com for
 * Global), with the brand's rule REDIRECT: the visitor's market (their choice, else
 * their country) when it is another one that can be reached (its website, or its
 * `/~CODE` address here). Null keeps them on this market's pages: the rule is
 * SUGGEST (the country banner) or STAY, their market is this one, or none applies.
 */
function mainAddressVisitorMarket(
  site: SiteInfo,
  visitor: { zoneCode?: string | null; country?: string | null },
): SiteMarket | null {
  if (!isMainMarketAddress(site) || site.mainAddressVisitors !== "REDIRECT") return null;
  const reachable = (market: SiteMarket | undefined) =>
    market && (market.storefrontUrl || servedHere(site, market.zoneCode)) ? market : undefined;
  const country = visitor.country?.trim().toUpperCase();
  const pick =
    siteMarketFor(site, visitor.zoneCode) ??
    (country ? site.markets.find((m) => m.countryCode.trim().toUpperCase() === country) : undefined);
  if (!pick || pick.zoneCode === site.siteMarketCode) return null;
  const target = reachable(pick);
  // Its own website is this address (a stale address table): stay.
  return target && hostOf(target.storefrontUrl) !== site.host.trim().toLowerCase() ? target : null;
}

/** The market website a root domain sends the visitor to (see marketForVisitor); null keeps them here. */
export function marketSiteForVisitor(
  site: SiteInfo,
  visitor: { zoneCode?: string | null; country?: string | null },
): string | null {
  return marketForVisitor(site, visitor)?.storefrontUrl ?? null;
}

/**
 * The market of the visitor's country among the markets this address offers:
 * every brand market on an address that serves several (markets switch on the
 * page), the address's own market and the markets with a website of their own on
 * a market website (switching goes there). Null: no country, or no market for it
 * (the country is not one of the brand's markets).
 */
export function marketForCountry(
  site: Pick<SiteInfo, "siteMarketCode" | "markets" | "sharedSiteUrl"> &
    Partial<Pick<SiteInfo, "host" | "brandDomain" | "mainAddressVisitors">>,
  country: string | null,
): string | null {
  if (!country) return null;
  // The main address with the rule STAY suggests nothing (the client's choice).
  if (
    site.mainAddressVisitors === "STAY" &&
    site.host &&
    isMainMarketAddress({ siteMarketCode: site.siteMarketCode, host: site.host, brandDomain: site.brandDomain })
  ) {
    return null;
  }
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
