import { headers } from "next/headers";
import { currentSiteHost } from "@/lib/site/currentSite";
import { siteOriginFor } from "@/lib/site/siteKey";
import { marketPagePath } from "@/lib/site/marketLink";
import { sharedAddressMarketCode } from "@/lib/seo/serverMarket";
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

/**
 * Where this page's own addresses start (canonical, hreflang, og:url, sitemap
 * entries, page links in structured data): the origin, plus the market's segment
 * for a market the shared address serves (`https://swissarabian.com/~KWT`, see
 * src/lib/site/marketLink.ts). Files (images, logos) keep requestOrigin().
 */
export async function requestSiteBase(): Promise<string | null> {
  const origin = await requestOrigin();
  if (!origin) return null;
  const market = await sharedAddressMarketCode();
  return market ? `${origin}${marketPagePath(market, "/")}` : origin;
}

/**
 * `/products/x` → `https://host/products/x`; absolute or empty values pass through.
 * On a market's base (`https://host/~KWT`) its home is the base itself, as its canonical.
 */
export function absoluteUrl(origin: string | null, value: string): string {
  if (!origin || !value.startsWith("/") || value.startsWith("//")) return value;
  if (value === "/" && /^[a-z]+:\/\/[^/]+\/./i.test(origin)) return origin;
  return `${origin}${value}`;
}
