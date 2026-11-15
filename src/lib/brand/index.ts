import { storefrontBrand } from "@/lib/storefront/brand";
import { resolveBrand } from "./registry";
import type { ActiveBrand, BrandConfig } from "./types";

export type {
  ActiveBrand,
  BrandConfig,
  LocalizedText,
  SocialNetwork,
  ThemeKey,
} from "./types";
export { BRANDS, DEFAULT_BRAND_CODE, brandForCode, resolveBrand } from "./registry";

/**
 * The brand config for a shop address (default: this deployment). Each
 * deployment is one brand (NEXT_PUBLIC_STOREFRONT_BRAND_CODE); locally a
 * `*.localhost` alias (`sp.localhost` → Sapil) picks the brand instead.
 * Pass the request host on the server; the browser reads its own address.
 */
export function getBrandConfig(host?: string | null): BrandConfig {
  const { brandCode, host: shopHost } = storefrontBrand(host);
  return resolveBrand({ brandCode, host: shopHost });
}

/** The active brand (static config; environment settings: src/lib/config/runtime.ts). */
export function getBrand(host?: string | null): ActiveBrand {
  return getBrandConfig(host);
}

/** Text for a locale, falling back to the brand's default locale, then English. */
export function localized(
  text: Readonly<Record<string, string>>,
  locale: string,
  fallbackLocale = "en",
): string {
  const base = locale.split("-")[0];
  return text[locale] ?? text[base] ?? text[fallbackLocale] ?? text.en ?? "";
}

/** This deployment's brand name in a language ("Swiss Arabian" / "سويس أرابيان"). */
export function brandDisplayName(locale: string, host?: string | null): string {
  const brand = getBrandConfig(host);
  return localized(brand.name, locale, brand.defaultLocale);
}
