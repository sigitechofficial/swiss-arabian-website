import { sapil } from "./brands/sapil";
import { swissArabian } from "./brands/swiss-arabian";
import type { BrandConfig } from "./types";

/** Every brand this codebase can be deployed as, keyed by brand code. */
export const BRANDS: Readonly<Record<string, BrandConfig>> = Object.freeze({
  [swissArabian.code]: swissArabian,
  [sapil.code]: sapil,
});

/** Used when a deployment names no brand (today's Swiss Arabian builds). */
export const DEFAULT_BRAND_CODE = swissArabian.code;

export function normalizeBrandCode(code: string | null | undefined): string {
  return (code ?? "").trim().toUpperCase();
}

export function brandForCode(code: string | null | undefined): BrandConfig | null {
  const key = normalizeBrandCode(code);
  return Object.prototype.hasOwnProperty.call(BRANDS, key) ? BRANDS[key] : null;
}

function hostOnly(raw: string | null | undefined): string {
  return (raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");
}

export function brandHosts(brand: BrandConfig): string[] {
  return [...brand.hosts.production, ...brand.hosts.staging, ...brand.hosts.local];
}

/** The brand that lists this host (production, staging or local), if any. */
export function brandOwningHost(host: string | null | undefined): BrandConfig | null {
  const name = hostOnly(host);
  if (!name) return null;
  return Object.values(BRANDS).find((brand) => brandHosts(brand).includes(name)) ?? null;
}

/**
 * Brand for a brand code and shop host: a known code wins, then the brand that
 * owns the host, then the default brand.
 */
export function resolveBrand(input: {
  brandCode?: string | null;
  host?: string | null;
}): BrandConfig {
  return (
    brandForCode(input.brandCode) ??
    brandOwningHost(input.host) ??
    BRANDS[DEFAULT_BRAND_CODE]
  );
}
