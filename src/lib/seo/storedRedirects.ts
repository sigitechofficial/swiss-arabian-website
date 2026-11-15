import {
  localePrefixOf,
  stripLocalePrefix,
  withLocalePrefix,
} from "@/lib/i18n/localePath";
import { env } from "@/lib/config/env";
import {
  configuredStorefrontHost,
  isLoopbackHost,
  storefrontHostFromHeaderValues,
} from "@/lib/api/storefrontHost";

/**
 * URL redirects managed in the admin (Website → URL redirects, imported from
 * Shopify or added by hand). The backend gives one hop per old path.
 *
 * Redirects belong to a market. The market is the one the pages use: the
 * shopper's market cookie when set (one address can serve several markets,
 * e.g. the dev site), else the market of the domain.
 *
 * Kept in memory per website address for a minute and refreshed in the
 * background; when the backend cannot be reached the site keeps working
 * (no redirects) rather than failing.
 */

export type RedirectMap = Map<string, string>;

const TTL_MS = 60_000;
const FETCH_TIMEOUT_MS = 1_500;

type CacheEntry = {
  at: number;
  map: RedirectMap | null;
  /** The backend does not know the cookie's market for this website. */
  unknownMarket?: boolean;
  refreshing?: Promise<void>;
};
const cache = new Map<string, CacheEntry>();

/** Same form the backend stores: lower case, decoded, no trailing slash. */
export function normalizeRequestPath(pathname: string): string {
  let value = pathname;
  try {
    value = decodeURI(value);
  } catch {
    // keep as is
  }
  value = value.replace(/\/{2,}/g, "/").toLowerCase();
  if (value.length > 1) value = value.replace(/\/+$/, "");
  return value || "/";
}

function isSitePath(target: string) {
  return target.startsWith("/");
}

/**
 * The new address for a request path, or null.
 * An address in another language (/ar/…) uses its own redirect first, else
 * the default language's one with the language prefix kept on a site target.
 */
export function matchRedirect(
  map: RedirectMap,
  pathname: string,
): string | null {
  const path = normalizeRequestPath(pathname);
  const exact = map.get(path);
  if (exact) return exact;
  const prefix = localePrefixOf(path);
  if (prefix && path !== `/${prefix}`) {
    const target = map.get(stripLocalePrefix(path));
    if (!target) return null;
    if (!isSitePath(target) || localePrefixOf(target)) return target;
    return withLocalePrefix(target, prefix);
  }
  return null;
}

/**
 * Full redirect address: a site target keeps the shopper's query (utm etc.) unless it has its own.
 * A site target loses its trailing slash (Shopify stored many as "/collections/"),
 * which the site would otherwise answer with a second redirect.
 */
export function redirectLocation(target: string, requestUrl: URL): URL {
  const url = new URL(target, requestUrl.origin);
  if (isSitePath(target) && url.pathname.length > 1)
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  if (isSitePath(target) && !url.search && requestUrl.search)
    url.search = requestUrl.search;
  return url;
}

const ZONE_CODE = /^[A-Za-z0-9_-]{1,40}$/;

/** A market code from the shopper's cookie, or null when absent or malformed. */
export function redirectZone(value: string | null | undefined): string | null {
  const zone = value?.trim() ?? "";
  return ZONE_CODE.test(zone) ? zone : null;
}

/** Cache key: one list per website address and market (no market = the domain's market). */
export function redirectCacheKey(host: string, zoneCode: string | null): string {
  return zoneCode ? `${host}|${zoneCode}` : host;
}

async function loadMap(
  host: string,
  zoneCode: string | null,
): Promise<RedirectMap | null> {
  const query = zoneCode ? `?zoneCode=${encodeURIComponent(zoneCode)}` : "";
  const res = await fetch(
    `${env.apiBaseUrl}/storefront/website/redirects${query}`,
    {
      headers: { "x-storefront-host": host },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    },
  );
  if (!res.ok) throw new Error(`redirects ${res.status}`);
  const json = (await res.json()) as {
    data?: {
      zoneCode?: string | null;
      redirects?: Array<{ from: string; to: string }>;
    };
  };
  // A market this website does not have: the pages fall back to the
  // domain's market, so the redirects do too.
  if (zoneCode && !json.data?.zoneCode) return null;
  return new Map((json.data?.redirects ?? []).map((r) => [r.from, r.to]));
}

function refresh(
  host: string,
  zoneCode: string | null,
  entry: CacheEntry | undefined,
): Promise<void> {
  if (entry?.refreshing) return entry.refreshing;
  const key = redirectCacheKey(host, zoneCode);
  const refreshing = loadMap(host, zoneCode)
    .then((map) => {
      cache.set(key, { at: Date.now(), map, unknownMarket: map === null });
    })
    .catch((error: unknown) => {
      console.warn("[redirects] could not load", {
        host,
        zoneCode,
        error: error instanceof Error ? error.message : String(error),
      });
      // Try again after the TTL; keep the last good list meanwhile.
      cache.set(key, {
        at: Date.now(),
        map: entry?.map ?? new Map(),
        unknownMarket: entry?.unknownMarket,
      });
    });
  cache.set(key, {
    at: entry?.at ?? 0,
    map: entry?.map ?? new Map(),
    unknownMarket: entry?.unknownMarket,
    refreshing,
  });
  return refreshing;
}

/** The storefront host the backend knows this website by. */
export function redirectHost(headers: Headers): string | null {
  const host = storefrontHostFromHeaderValues(
    headers.get("x-forwarded-host"),
    headers.get("host"),
  );
  if (host && !isLoopbackHost(host))
    return host.toLowerCase().replace(/:\d+$/, "");
  return configuredStorefrontHost(host);
}

/**
 * Redirects for this website and market (the shopper's market cookie, else the
 * domain's market): waits only for the very first load, then serves the cached list.
 */
export async function redirectsFor(
  host: string,
  zoneCode: string | null = null,
): Promise<RedirectMap> {
  const key = redirectCacheKey(host, zoneCode);
  let entry = cache.get(key);
  if (!entry) {
    await refresh(host, zoneCode, undefined);
    entry = cache.get(key);
  } else if (Date.now() - entry.at > TTL_MS) {
    void refresh(host, zoneCode, entry);
  }
  if (zoneCode && (entry?.unknownMarket || !entry?.map))
    return redirectsFor(host, null);
  return entry?.map ?? new Map();
}
