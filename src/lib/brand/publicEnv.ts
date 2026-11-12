import { z } from "zod";
import { cleanGa4Id, cleanGtmId } from "@/lib/analytics/analyticsIds";
import type { BrandConfig, BrandEnvKey, BrandIntegrations, BrandPublicEnv } from "./types";

/**
 * Per-brand settings from the build's env. Next.js only inlines NEXT_PUBLIC_*
 * written as static property paths, so every key is spelled out here.
 */
export function readProcessPublicEnv(): BrandPublicEnv {
  return {
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_STOREFRONT_BRAND_CODE: process.env.NEXT_PUBLIC_STOREFRONT_BRAND_CODE,
    NEXT_PUBLIC_STOREFRONT_HOST: process.env.NEXT_PUBLIC_STOREFRONT_HOST,
    NEXT_PUBLIC_STAGING_RETURN_URL: process.env.NEXT_PUBLIC_STAGING_RETURN_URL,
    NEXT_PUBLIC_PRODUCTION_RETURN_URL: process.env.NEXT_PUBLIC_PRODUCTION_RETURN_URL,
    NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID,
    NEXT_PUBLIC_GA4_ID: process.env.NEXT_PUBLIC_GA4_ID,
    NEXT_PUBLIC_INSIDER_ENABLED: process.env.NEXT_PUBLIC_INSIDER_ENABLED,
    NEXT_PUBLIC_INSIDER_ACCOUNT_ID: process.env.NEXT_PUBLIC_INSIDER_ACCOUNT_ID,
    NEXT_PUBLIC_INSIDER_SCRIPT_HOST: process.env.NEXT_PUBLIC_INSIDER_SCRIPT_HOST,
    NEXT_PUBLIC_TABBY_PUBLIC_KEY: process.env.NEXT_PUBLIC_TABBY_PUBLIC_KEY,
    NEXT_PUBLIC_TABBY_MERCHANT_CODE: process.env.NEXT_PUBLIC_TABBY_MERCHANT_CODE,
    NEXT_PUBLIC_ENABLE_TABBY: process.env.NEXT_PUBLIC_ENABLE_TABBY,
    NEXT_PUBLIC_ENABLE_TAMARA: process.env.NEXT_PUBLIC_ENABLE_TAMARA,
    NEXT_PUBLIC_ENABLE_PAYMOB: process.env.NEXT_PUBLIC_ENABLE_PAYMOB,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID,
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
  NEXT_PUBLIC_GTM_ID: z.string().regex(/^GTM-[A-Z0-9]{4,12}$/i, "a GTM container id like GTM-XXXXXXX"),
  NEXT_PUBLIC_GA4_ID: z.string().regex(/^G-[A-Z0-9]{4,16}$/i, "a GA4 measurement id like G-XXXXXXXXXX"),
  NEXT_PUBLIC_INSIDER_ENABLED: boolText,
  NEXT_PUBLIC_INSIDER_ACCOUNT_ID: z.string().regex(/^\d+$/, "a numeric Insider account id"),
  NEXT_PUBLIC_INSIDER_SCRIPT_HOST: hostText,
  NEXT_PUBLIC_ENABLE_TABBY: boolText,
  NEXT_PUBLIC_ENABLE_TAMARA: boolText,
  NEXT_PUBLIC_ENABLE_PAYMOB: boolText,
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
 * The brand's integration ids for this deployment. Malformed values are
 * dropped (never a broken or foreign tag); `npm run check:brand` reports them.
 */
export function parseBrandIntegrations(
  raw: BrandPublicEnv,
  brand: BrandConfig,
): BrandIntegrations {
  const appEnv = envValue(raw, "NEXT_PUBLIC_APP_ENV");
  const accountId =
    validValue(raw, "NEXT_PUBLIC_INSIDER_ACCOUNT_ID") ||
    brand.integrationDefaults.insiderAccountId ||
    "";
  return {
    analytics: {
      gtmId: cleanGtmId(envValue(raw, "NEXT_PUBLIC_GTM_ID")),
      ga4Id: cleanGa4Id(envValue(raw, "NEXT_PUBLIC_GA4_ID")),
    },
    insider: {
      enabled:
        envValue(raw, "NEXT_PUBLIC_INSIDER_ENABLED") !== "false" && Boolean(accountId),
      accountId,
      scriptHost:
        validValue(raw, "NEXT_PUBLIC_INSIDER_SCRIPT_HOST") ||
        brand.integrationDefaults.insiderScriptHost ||
        "",
    },
    tabby: {
      publicKey: envValue(raw, "NEXT_PUBLIC_TABBY_PUBLIC_KEY"),
      merchantCode: envValue(raw, "NEXT_PUBLIC_TABBY_MERCHANT_CODE"),
    },
    googleMaps: {
      apiKey: envValue(raw, "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"),
      mapId: envValue(raw, "NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID"),
    },
    payments: {
      paymob: envValue(raw, "NEXT_PUBLIC_ENABLE_PAYMOB") === "true",
      tabby: envValue(raw, "NEXT_PUBLIC_ENABLE_TABBY") === "true",
      tamara: envValue(raw, "NEXT_PUBLIC_ENABLE_TAMARA") === "true",
    },
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
