import { isLoopbackHost } from "@/lib/api/storefrontHost";

/**
 * One deployment per brand serves every market website of the brand
 * (`uae.swissarabian.com`, `ksa.swissarabian.com` …). The proxy rewrites each
 * request to `/<site>/<locale>/…`, where `<site>` is the address the shopper
 * used, so every address gets its own prerendered and cached pages (prices,
 * currency, canonical, hreflang, sitemap). Shoppers never see the segment.
 *
 * The segment is the live host in lower case with the port written as `__`
 * (`sp.localhost__3045`): a hostname never contains `__`, and a colon is not
 * safe in a path segment.
 */
const PORT_SEPARATOR = "__";
/** Host-name labels start and end with a letter or digit (RFC 1123): `-`, `a-.b` are not hosts. */
const HOST_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*(?::\d{1,5})?$/;
const KEY_PATTERN = /^[a-z0-9.-]+(?:__\d{1,5})?$/;

/**
 * An address that serves several markets (no market of its own) gets one page
 * tree per market: `swissarabian.com~KSA`. The proxy picks the market (the
 * shopper's saved market, else their first-visit market, else the default) and
 * pages read it from the route, never from the request, so each market's pages
 * are cached on their own. `~` never appears in a host name.
 */
const MARKET_SEPARATOR = "~";
const MARKET_CODE = /^[A-Za-z0-9_-]{1,40}$/;

/** `KSA.swissarabian.com.` → `ksa.swissarabian.com`; null when it is not a plain host. */
export function normalizeSiteHost(raw: string | null | undefined): string | null {
  const host = (raw ?? "").split(",")[0]?.trim().toLowerCase().replace(/\.(?=:|$)/, "") ?? "";
  if (!host || host.length > 253 || !HOST_PATTERN.test(host)) return null;
  if (host.startsWith(".") || host.includes("..")) return null;
  return host;
}

/** `sp.localhost:3045` → `sp.localhost__3045`. */
export function siteKeyFromHost(host: string): string {
  return host.replace(":", PORT_SEPARATOR);
}

/** A page tree's key: the address, plus the market on an address that serves several. */
export function siteTreeKey(host: string, marketCode?: string | null): string {
  const key = siteKeyFromHost(host);
  return marketCode && MARKET_CODE.test(marketCode) ? `${key}${MARKET_SEPARATOR}${marketCode}` : key;
}

/** `swissarabian.com~KSA` → host and market; null for anything else. */
export function parseSiteKey(
  key: string | null | undefined,
): { host: string; marketCode: string | null } | null {
  const [hostPart = "", marketCode, extra] = (key ?? "").trim().split(MARKET_SEPARATOR);
  if (extra !== undefined) return null;
  if (marketCode !== undefined && !MARKET_CODE.test(marketCode)) return null;
  const value = hostPart.toLowerCase();
  if (!KEY_PATTERN.test(value)) return null;
  const host = normalizeSiteHost(value.replace(PORT_SEPARATOR, ":"));
  return host ? { host, marketCode: marketCode ?? null } : null;
}

/** `sp.localhost__3045` (or `…~KSA`) → `sp.localhost:3045`; null for anything else. */
export function hostFromSiteKey(key: string | null | undefined): string | null {
  return parseSiteKey(key)?.host ?? null;
}

/** `https://ksa.swissarabian.com`; local addresses use http. */
export function siteOriginFor(host: string): string {
  return `${isLoopbackHost(host) ? "http" : "https"}://${host}`;
}
