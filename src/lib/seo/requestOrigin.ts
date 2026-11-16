import { headers } from "next/headers";
import { currentSiteHost } from "@/lib/site/currentSite";
import { siteOriginFor } from "@/lib/site/siteKey";
import {
  configuredStorefrontHost,
  isLoopbackHost,
} from "@/lib/api/storefrontHost";

/**
 * The public origin of this request (scheme + host), e.g.
 * https://qa.swissarabian.com (development and tests).
 */
export function originFromHeaders(
  get: (name: string) => string | null,
): string | null {
  const host = (get("x-forwarded-host") || get("host") || "")
    .split(",")[0]
    ?.trim();
  if (!host) return null;
  const forwarded = (get("x-forwarded-proto") || "").split(",")[0]?.trim();
  const local =
    /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(host) ||
    host.endsWith(".localhost");
  const proto = forwarded || (local ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Local only: the origin a plain `localhost` stands for (STOREFRONT_HOST, see
 * src/lib/config/runtime.ts). Deployed websites always take the request's address.
 */
export function siteOrigin(): string | null {
  const host = configuredStorefrontHost(null);
  if (!host) return null;
  return `${isLoopbackHost(host) ? "http" : "https"}://${host}`;
}

/**
 * Origin for absolute SEO addresses (canonical, hreflang, og:url, sitemap): the
 * website address being rendered (`[site]` root param, or the address a route
 * handler set), so every market website names itself. Outside the site tree:
 * `next dev` follows the request, production the configured storefront.
 */
export async function requestOrigin(): Promise<string | null> {
  const site = await currentSiteHost();
  if (site) return siteOriginFor(site);
  if (process.env.NODE_ENV === "development") {
    try {
      const store = await headers();
      return originFromHeaders((name) => store.get(name)) ?? siteOrigin();
    } catch {
      return siteOrigin();
    }
  }
  return siteOrigin();
}

/** `/products/x` → `https://host/products/x`; absolute or empty values pass through. */
export function absoluteUrl(origin: string | null, value: string): string {
  if (!origin || !value.startsWith("/") || value.startsWith("//")) return value;
  return `${origin}${value}`;
}
