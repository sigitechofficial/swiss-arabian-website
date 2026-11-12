import { resolveBrand } from "@/lib/brand/registry";
import { env } from "@/lib/config/env";
import { localStorefrontForHost } from "./localStorefront";

export const STOREFRONT_HOST_HEADER = "X-Storefront-Host";
export const STOREFRONT_CLIENT_ID_HEADER = "X-Storefront-Client-Id";
export const SHOP_UNAVAILABLE_PATH = "/shop-unavailable";

export const SHOP_UNAVAILABLE_CODES = new Set([
  "STOREFRONT_HOST_UNKNOWN",
  "BRAND_INACTIVE",
]);

/** Hostname only: lowercase, no scheme / path / port. */
export function normalizeStorefrontHost(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "");
}

function isLoopbackHost(host: string): boolean {
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "[::1]" ||
    host.endsWith(".localhost")
  );
}

/** The browser's address, or the given request host (server / first render). */
function liveHost(host?: string | null): string {
  if (host) return normalizeStorefrontHost(host);
  if (typeof window === "undefined") return "";
  return normalizeStorefrontHost(window.location.hostname);
}

/**
 * Shop host and brand for an address. Local `*.localhost` aliases
 * (`sp.localhost` → Sapil) win over the .env storefront.
 */
export function storefrontBrand(host?: string | null): {
  host: string;
  configuredHost: string;
  brandCode: string;
} {
  const live = liveHost(host);
  const local = localStorefrontForHost(live);
  const configuredHost = local?.host ?? normalizeStorefrontHost(env.storefrontHost);
  const brandCode = (local?.brandCode ?? env.storefrontBrandCode).trim().toUpperCase();
  return {
    host: live && !isLoopbackHost(live) ? live : configuredHost,
    configuredHost,
    brandCode,
  };
}

/**
 * Shop hostname for brand helpers (logo / Sapil checks).
 * Live hostname wins (except loopback). Locally: the alias's shop, else env.
 * Pass the request host on the server; the browser reads its own address.
 */
export function resolveStorefrontHost(host?: string | null): string {
  return storefrontBrand(host).host;
}

export function isShopUnavailablePath(pathname?: string): boolean {
  const path =
    pathname ??
    (typeof window !== "undefined" ? window.location.pathname : "");
  return path === SHOP_UNAVAILABLE_PATH || path.startsWith(`${SHOP_UNAVAILABLE_PATH}/`);
}

/** localStorage / persist suffix so SA and Sapil on localhost stay apart. */
export function storefrontStorageKey(base: string): string {
  if (typeof window === "undefined") return base;
  const live = normalizeStorefrontHost(window.location.hostname);
  const configured = storefrontBrand(live).configuredHost;
  if (isLoopbackHost(live) && configured) return `${base}:${configured}`;
  return base;
}

export function filterMarketsForTenant<
  T extends { catalogContext: { brandCode?: string | null } },
>(markets: T[], host?: string | null): T[] {
  const tenant = storefrontBrand(host).brandCode;
  if (!tenant) return markets;
  const tagged = markets.filter((market) =>
    Boolean(market.catalogContext.brandCode?.trim()),
  );
  if (!tagged.length) return markets;
  return markets.filter(
    (market) =>
      (market.catalogContext.brandCode ?? "").trim().toUpperCase() === tenant,
  );
}

/** Brand config for this address (code first, then the host's owner, then the default). */
function brandConfigFor(host?: string | null) {
  const brand = storefrontBrand(host);
  return resolveBrand({ brandCode: brand.brandCode, host: brand.host });
}

export function isSapilStorefront(host?: string | null): boolean {
  return brandConfigFor(host).code === "SAPIL";
}

export type StorefrontLogo = {
  src: string;
  /** Descriptive alt text (SEO audit): "<brand> Online Perfume Store". */
  alt: string;
  name: string;
  width: number;
  height: number;
};

/**
 * The brand's logo. File names describe the image for search engines; the old
 * files (sa-logo-clear.png, sapil-logo.png) stay so existing links keep working.
 */
export function storefrontLogo(host?: string | null): StorefrontLogo {
  const { logo, name } = brandConfigFor(host);
  return {
    src: logo.src,
    alt: logo.alt.en,
    name: name.en,
    width: logo.width,
    height: logo.height,
  };
}
