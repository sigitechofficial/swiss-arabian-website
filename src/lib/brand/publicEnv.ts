import { z } from "zod";
import type { BrandConfig, BrandEnvKey, BrandIntegrations, BrandPublicEnv } from "./types";

/**
 * Per-brand settings from the build's env. Next.js only inlines NEXT_PUBLIC_*
 * written as static property paths, so every key is spelled out here.
 * Analytics, Insider, Tabby / Tamara and Google Maps are not build settings any
 * more (ADR-005 phase E): src/lib/site/siteIntegrations.ts.
 */
export function readProcessPublicEnv(): BrandPublicEnv {
  return {
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_STOREFRONT_BRAND_CODE: process.env.NEXT_PUBLIC_STOREFRONT_BRAND_CODE,
    NEXT_PUBLIC_STOREFRONT_HOST: process.env.NEXT_PUBLIC_STOREFRONT_HOST,
    NEXT_PUBLIC_STAGING_RETURN_URL: process.env.NEXT_PUBLIC_STAGING_RETURN_URL,
    NEXT_PUBLIC_PRODUCTION_RETURN_URL: process.env.NEXT_PUBLIC_PRODUCTION_RETURN_URL,
    NEXT_PUBLIC_CATALOG_MEDIA_BASE_URL: process.env.NEXT_PUBLIC_CATALOG_MEDIA_BASE_URL,
    NEXT_PUBLIC_SEO_INDEXING_ENABLED: process.env.NEXT_PUBLIC_SEO_INDEXING_ENABLED,
  };
}

const boolText = z.enum(["true", "false"]);
const hostText = z
  .string()
  .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i, "a hostname (no scheme, port or path)");
const urlText = z.url({ protocol: /^https?$/ });

/** Expected format of each per-brand setting (when it is set). */
export const BRAND_ENV_FORMATS: Partial<Record<BrandEnvKey, z.ZodType<string>>> = {
  NEXT_PUBLIC_STOREFRONT_BRAND_CODE: z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/, "a brand code like SWISS_ARABIAN"),
  NEXT_PUBLIC_STOREFRONT_HOST: hostText,
  NEXT_PUBLIC_STAGING_RETURN_URL: urlText,
  NEXT_PUBLIC_PRODUCTION_RETURN_URL: urlText,
  NEXT_PUBLIC_CATALOG_MEDIA_BASE_URL: urlText,
  NEXT_PUBLIC_SEO_INDEXING_ENABLED: boolText,
};

/** Trimmed value without trailing slashes; "" when unset. */
export function envValue(raw: BrandPublicEnv, key: keyof BrandPublicEnv): string {
  return (raw[key] ?? "").trim().replace(/\/+$/, "");
}

/** The value when it is set and well-formed, else "". */
function validValue(raw: BrandPublicEnv, key: BrandEnvKey): string {
  const value = envValue(raw, key);
  if (!value) return "";
  const format = BRAND_ENV_FORMATS[key];
  return !format || format.safeParse(value).success ? value : "";
}

function hostOf(value: string): string {
  return value
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "");
}

/**
 * This deployment's own settings (catalog media, storefront host, return
 * addresses, SEO indexing). Malformed values are dropped; `npm run check:brand`
 * reports them.
 */
export function parseBrandIntegrations(
  raw: BrandPublicEnv,
  _brand: BrandConfig,
): BrandIntegrations {
  const appEnv = envValue(raw, "NEXT_PUBLIC_APP_ENV");
  return {
    catalogMediaBaseUrl: validValue(raw, "NEXT_PUBLIC_CATALOG_MEDIA_BASE_URL"),
    storefrontHost: hostOf(envValue(raw, "NEXT_PUBLIC_STOREFRONT_HOST")),
    returnUrls: {
      staging: validValue(raw, "NEXT_PUBLIC_STAGING_RETURN_URL"),
      production: validValue(raw, "NEXT_PUBLIC_PRODUCTION_RETURN_URL"),
    },
    seoIndexingEnabled:
      appEnv === "production" &&
      envValue(raw, "NEXT_PUBLIC_SEO_INDEXING_ENABLED") === "true",
  };
}
