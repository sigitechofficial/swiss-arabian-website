import { storefrontBrand } from "@/lib/storefront/brand";
import { parseBrandIntegrations, readProcessPublicEnv } from "./publicEnv";
import { resolveBrand } from "./registry";
import type { ActiveBrand, BrandConfig, BrandIntegrations } from "./types";

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

/**
 * NEXT_PUBLIC_* values are fixed per build, so a brand's integrations are
 * parsed once per brand (image URLs and analytics read them on every render).
 * Tests change env between cases, so they always re-read.
 */
const integrationsByBrand = new Map<string, BrandIntegrations>();

function integrationsFor(config: BrandConfig): BrandIntegrations {
  if (process.env.NODE_ENV === "test") {
    return parseBrandIntegrations(readProcessPublicEnv(), config);
  }
  let cached = integrationsByBrand.get(config.code);
  if (!cached) {
    cached = parseBrandIntegrations(readProcessPublicEnv(), config);
    integrationsByBrand.set(config.code, cached);
  }
  return cached;
}

/** The active brand with this deployment's public integration ids. */
export function getBrand(host?: string | null): ActiveBrand {
  const config = getBrandConfig(host);
  return { ...config, integrations: integrationsFor(config) };
}

/**
 * This deployment's integration ids (analytics, Insider, Tabby, Maps, payment
 * switches, catalog media, storefront host). Use instead of reading
 * `process.env.NEXT_PUBLIC_*` or `env.*` for anything per brand.
 */
export function brandIntegrations(host?: string | null): BrandIntegrations {
  return integrationsFor(getBrandConfig(host));
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
