import { BRAND_ENV_FORMATS, envValue } from "./publicEnv";
import { BRANDS, normalizeBrandCode } from "./registry";
import {
  REMOVED_ENV_KEYS,
  REMOVED_ENV_SETTINGS,
  type BrandConfig,
  type BrandPublicEnv,
} from "./types";

export type BrandCheckResult = {
  ok: boolean;
  brandCode: string;
  errors: string[];
  warnings: string[];
};

/**
 * Checks a brand image's build settings (`npm run check:brand`, run by the
 * Dockerfile before `next build`). A build has one setting: which brand it is.
 * Environment settings are checked when the server starts
 * (src/lib/config/runtime.ts `assertRuntimeConfig`), because one image serves
 * every environment (deployment plan W4).
 */
export function validateBrandEnv(
  raw: BrandPublicEnv,
  brands: Readonly<Record<string, BrandConfig>> = BRANDS,
): BrandCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const known = Object.keys(brands).join(", ");

  // 1. Which brand this image is: required, and known.
  const value = envValue(raw, "NEXT_PUBLIC_STOREFRONT_BRAND_CODE");
  const rawCode = normalizeBrandCode(value);
  if (!rawCode) {
    errors.push(`NEXT_PUBLIC_STOREFRONT_BRAND_CODE is not set: a brand image must name its brand (one of: ${known}).`);
  } else if (!BRAND_ENV_FORMATS.NEXT_PUBLIC_STOREFRONT_BRAND_CODE.safeParse(value).success) {
    errors.push(`NEXT_PUBLIC_STOREFRONT_BRAND_CODE="${value}" is not a brand code like SWISS_ARABIAN.`);
  } else if (!brands[rawCode]) {
    errors.push(
      `NEXT_PUBLIC_STOREFRONT_BRAND_CODE="${rawCode}" is not a known brand (known: ${known}). Add src/lib/brand/brands/<brand>.ts and register it in registry.ts.`,
    );
  }

  // 2. Settings no longer read: set here they would do nothing.
  for (const key of REMOVED_ENV_KEYS) {
    if (!envValue(raw, key)) continue;
    errors.push(`${key} is no longer read: ${REMOVED_ENV_SETTINGS[key]}. Remove it from this build.`);
  }

  return { ok: errors.length === 0, brandCode: rawCode, errors, warnings };
}

/** Human-readable report for the CLI. */
export function formatBrandCheck(result: BrandCheckResult): string {
  const lines = [
    `Brand build check: ${result.brandCode || "(unknown)"}`,
  ];
  for (const error of result.errors) lines.push(`  ✖ ${error}`);
  for (const warning of result.warnings) lines.push(`  ⚠ ${warning}`);
  lines.push(
    result.ok
      ? `  ✔ OK${result.warnings.length ? ` (${result.warnings.length} warning(s))` : ""}`
      : `  ✖ ${result.errors.length} error(s): fix the settings above before building.`,
  );
  return lines.join("\n");
}
