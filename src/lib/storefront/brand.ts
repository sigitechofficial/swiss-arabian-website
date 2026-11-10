import { env } from "@/lib/config/env";

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

/**
 * Shop hostname for brand helpers (logo / Sapil checks).
 * Live window hostname wins (except loopback). Local Sapil uses env override.
 */
export function resolveStorefrontHost(): string {
  const configured = normalizeStorefrontHost(env.storefrontHost);
  if (typeof window === "undefined") return configured;
  const live = normalizeStorefrontHost(window.location.hostname);
  if (live && !isLoopbackHost(live)) return live;
  return configured;
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
  const configured = normalizeStorefrontHost(env.storefrontHost);
  if (isLoopbackHost(live) && configured) return `${base}:${configured}`;
  return base;
}

export function filterMarketsForTenant<
  T extends { catalogContext: { brandCode?: string | null } },
>(markets: T[]): T[] {
  const tenant = env.storefrontBrandCode.trim().toUpperCase();
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

export function isSapilStorefront(): boolean {
  if (env.storefrontBrandCode.trim().toUpperCase() === "SAPIL") return true;
  return resolveStorefrontHost().includes("sapil");
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
export function storefrontLogo(): StorefrontLogo {
  if (isSapilStorefront()) {
    return {
      src: "/assets/sapil-online-perfume-store.png",
      alt: "Sapil Online Perfume Store",
      name: "Sapil",
      width: 195,
      height: 80,
    };
  }
  return {
    src: "/assets/swiss-arabian-online-perfume-store.png",
    alt: "Swiss Arabian Online Perfume Store",
    name: "Swiss Arabian",
    width: 428,
    height: 218,
  };
}
