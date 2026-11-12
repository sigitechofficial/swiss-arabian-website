import { headers } from "next/headers";
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
 * The storefront's public origin from build-time settings
 * (`NEXT_PUBLIC_STOREFRONT_HOST`): one deployment per brand, so pages can be
 * prerendered without reading the request.
 */
export function siteOrigin(): string | null {
  const host = configuredStorefrontHost(null);
  if (!host) return null;
  return `${isLoopbackHost(host) ? "http" : "https"}://${host}`;
}

/**
 * Origin for absolute SEO addresses. Production uses the configured storefront
 * (static rendering); `next dev` follows the address in use (local brand
 * aliases such as sp.localhost).
 */
export async function requestOrigin(): Promise<string | null> {
  if (process.env.NODE_ENV === "development") {
    const store = await headers();
    return originFromHeaders((name) => store.get(name)) ?? siteOrigin();
  }
  return siteOrigin();
}

/** `/products/x` → `https://host/products/x`; absolute or empty values pass through. */
export function absoluteUrl(origin: string | null, value: string): string {
  if (!origin || !value.startsWith("/") || value.startsWith("//")) return value;
  return `${origin}${value}`;
}
