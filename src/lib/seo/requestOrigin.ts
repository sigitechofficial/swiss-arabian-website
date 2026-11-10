import { headers } from "next/headers";

/**
 * The public origin of this request (scheme + host), e.g.
 * https://qa.swissarabian.com. Each market has its own domain, so SEO addresses
 * (canonical, hreflang, og:url, structured data) are built per request.
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

export async function requestOrigin(): Promise<string | null> {
  const store = await headers();
  return originFromHeaders((name) => store.get(name));
}

/** `/products/x` → `https://host/products/x`; absolute or empty values pass through. */
export function absoluteUrl(origin: string | null, value: string): string {
  if (!origin || !value.startsWith("/") || value.startsWith("//")) return value;
  return `${origin}${value}`;
}
