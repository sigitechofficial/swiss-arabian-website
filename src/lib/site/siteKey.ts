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
const HOST_PATTERN = /^[a-z0-9.-]+(?::\d{1,5})?$/;
const KEY_PATTERN = /^[a-z0-9.-]+(?:__\d{1,5})?$/;

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

/** `sp.localhost__3045` → `sp.localhost:3045`; null for anything else. */
export function hostFromSiteKey(key: string | null | undefined): string | null {
  const value = (key ?? "").trim().toLowerCase();
  if (!KEY_PATTERN.test(value)) return null;
  return normalizeSiteHost(value.replace(PORT_SEPARATOR, ":"));
}

/** `https://ksa.swissarabian.com`; local addresses use http. */
export function siteOriginFor(host: string): string {
  return `${isLoopbackHost(host) ? "http" : "https"}://${host}`;
}
