import { env } from "@/lib/config/env";
import { localePrefixOf, internalLocalePath } from "@/lib/i18n/localePath";

/**
 * Old product addresses (a SKU such as `/products/SOTO098501`, or a former handle)
 * are sent to the product's own address here, in the proxy, with one 308.
 *
 * The product page used to do it while rendering (`permanentRedirect`). On an
 * uncached render Next 16 sends that redirect's `Location` twice, joined by a
 * comma (`/products/a,/products/a`), so the first visitor (often a search engine
 * following an old link) landed on "Page not found". The page keeps its own
 * redirect only as a fallback.
 *
 * The product is found the way the page finds it: the product address endpoint,
 * then an exact SKU / handle / id match in search. Answers are kept per website
 * address, market and requested address for a few minutes.
 */

const PRODUCT_PATH = /^\/products\/([^/]+)\/?$/;
const TTL_MS = 5 * 60_000;
const MISS_TTL_MS = 60_000;
const MAX_ENTRIES = 5_000;
const FETCH_TIMEOUT_MS = 1_500;

type Entry = { canonical: string | null; until: number };
const cache = new Map<string, Entry>();

/** Test hook. */
export function clearProductAddressCache() {
  cache.clear();
}

type ProductRow = { slug?: string | null; sku?: string | null; productId?: string | null };

function unwrap(json: unknown): Record<string, unknown> | null {
  if (!json || typeof json !== "object") return null;
  const data = (json as { data?: unknown }).data;
  return data && typeof data === "object" ? (data as Record<string, unknown>) : null;
}

async function getJson(url: string, storefrontHost: string): Promise<{ status: number; data: Record<string, unknown> | null }> {
  const res = await fetch(url, {
    headers: { "x-storefront-host": storefrontHost, accept: "application/json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    cache: "no-store",
  });
  const data = res.ok ? unwrap(await res.json().catch(() => null)) : null;
  return { status: res.status, data };
}

/**
 * The product's own handle for a requested address, null when there is no such
 * product, undefined when it could not be told (backend unreachable: the page decides).
 */
async function lookupCanonical(
  slug: string,
  storefrontHost: string,
  zoneCode: string | null,
): Promise<string | null | undefined> {
  const zone = zoneCode ? `zoneCode=${encodeURIComponent(zoneCode)}` : "";
  try {
    const detail = await getJson(
      `${env.apiBaseUrl}/storefront/catalog/products/${encodeURIComponent(slug)}?${zone}`,
      storefrontHost,
    );
    const direct = typeof detail.data?.slug === "string" ? detail.data.slug : null;
    if (detail.status === 200 && direct) return direct;
    if (detail.status >= 500) return undefined;

    // Same fallback as the page: an exact SKU / handle / id match, never "first result".
    const search = await getJson(
      `${env.apiBaseUrl}/storefront/catalog/search?${zone}${zone ? "&" : ""}q=${encodeURIComponent(slug)}&limit=5`,
      storefrontHost,
    );
    if (search.status >= 500) return undefined;
    const wanted = slug.trim().toLowerCase();
    const products = Array.isArray(search.data?.products) ? (search.data.products as ProductRow[]) : [];
    const hit = products.find(
      (p) =>
        p.slug?.toLowerCase() === wanted || p.sku?.toLowerCase() === wanted || p.productId === slug,
    );
    return hit?.slug ?? null;
  } catch {
    return undefined;
  }
}

/**
 * The address to send a product request to, or null to serve the page as it is
 * (already the product's own address, not a product address, unknown product, or
 * the backend could not answer).
 */
export async function productAddressRedirect(input: {
  pathname: string;
  storefrontHost: string;
  zoneCode: string | null;
}): Promise<string | null> {
  const prefix = localePrefixOf(input.pathname);
  const rest = prefix ? input.pathname.slice(prefix.length + 1) || "/" : input.pathname;
  const match = PRODUCT_PATH.exec(rest);
  if (!match) return null;
  let slug: string;
  try {
    slug = decodeURIComponent(match[1]);
  } catch {
    return null;
  }

  const key = `${input.storefrontHost}|${input.zoneCode ?? ""}|${slug}`;
  const now = Date.now();
  let entry = cache.get(key);
  if (!entry || entry.until < now) {
    const canonical = await lookupCanonical(slug, input.storefrontHost, input.zoneCode);
    if (canonical === undefined) return null; // not cached: try again next time
    entry = { canonical, until: now + (canonical ? TTL_MS : MISS_TTL_MS) };
    if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
    cache.set(key, entry);
  }
  if (!entry.canonical || entry.canonical === slug) return null;
  const target = `/products/${encodeURIComponent(entry.canonical)}`;
  return prefix ? internalLocalePath(target, prefix) : target;
}
