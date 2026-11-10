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
 * Kept in memory per website address for a minute and refreshed in the
 * background; when the backend cannot be reached the site keeps working
 * (no redirects) rather than failing.
 */

export type RedirectMap = Map<string, string>;

const TTL_MS = 60_000;
const FETCH_TIMEOUT_MS = 1_500;

type CacheEntry = { at: number; map: RedirectMap; refreshing?: Promise<void> };
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
 * An Arabic address (/ar/…) uses its own redirect first, else the English
 * one with the /ar prefix kept on a site target.
 */
export function matchRedirect(
  map: RedirectMap,
  pathname: string,
): string | null {
  const path = normalizeRequestPath(pathname);
  const exact = map.get(path);
  if (exact) return exact;
  if (path.startsWith("/ar/")) {
    const target = map.get(path.slice(3));
    if (!target) return null;
    if (!isSitePath(target) || target === "/ar" || target.startsWith("/ar/"))
      return target;
    return target === "/" ? "/ar" : `/ar${target}`;
  }
  return null;
}

/** Full redirect address: a site target keeps the shopper's query (utm etc.) unless it has its own. */
export function redirectLocation(target: string, requestUrl: URL): URL {
  const url = new URL(target, requestUrl.origin);
  if (isSitePath(target) && !url.search && requestUrl.search)
    url.search = requestUrl.search;
  return url;
}

async function loadMap(host: string): Promise<RedirectMap> {
  const res = await fetch(`${env.apiBaseUrl}/storefront/website/redirects`, {
    headers: { "x-storefront-host": host },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`redirects ${res.status}`);
  const json = (await res.json()) as {
    data?: { redirects?: Array<{ from: string; to: string }> };
  };
  return new Map((json.data?.redirects ?? []).map((r) => [r.from, r.to]));
}

function refresh(host: string, entry: CacheEntry | undefined): Promise<void> {
  if (entry?.refreshing) return entry.refreshing;
  const refreshing = loadMap(host)
    .then((map) => {
      cache.set(host, { at: Date.now(), map });
    })
    .catch((error: unknown) => {
      console.warn("[redirects] could not load", {
        host,
        error: error instanceof Error ? error.message : String(error),
      });
      // Try again after the TTL; keep the last good list meanwhile.
      cache.set(host, { at: Date.now(), map: entry?.map ?? new Map() });
    });
  cache.set(host, {
    at: entry?.at ?? 0,
    map: entry?.map ?? new Map(),
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
  return configuredStorefrontHost();
}

/** Redirects for this website: waits only for the very first load, then serves the cached list. */
export async function redirectsFor(host: string): Promise<RedirectMap> {
  const entry = cache.get(host);
  if (!entry) {
    await refresh(host, undefined);
    return cache.get(host)?.map ?? new Map();
  }
  if (Date.now() - entry.at > TTL_MS) void refresh(host, entry);
  return entry.map;
}
