import { storefrontBrand } from "@/lib/storefront/brand";
import { parseBrandIntegrations, readProcessPublicEnv } from "./publicEnv";
import { resolveBrand } from "./registry";
import type { ActiveBrand, BrandConfig } from "./types";

export type {
  ActiveBrand,
  BrandConfig,
  BrandIntegrations,
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

/** The active brand with this deployment's public integration ids. */
export function getBrand(host?: string | null): ActiveBrand {
  const config = getBrandConfig(host);
  return { ...config, integrations: parseBrandIntegrations(readProcessPublicEnv(), config) };
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
