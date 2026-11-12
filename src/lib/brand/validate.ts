import { BRAND_ENV_FORMATS, envValue } from "./publicEnv";
import {
  BRANDS,
  DEFAULT_BRAND_CODE,
  brandHosts,
  brandOwningHost,
  normalizeBrandCode,
} from "./registry";
import {
  BRAND_ENV_KEYS,
  type BrandConfig,
  type BrandEnvKey,
  type BrandPublicEnv,
} from "./types";

/**
 * What src/lib/config/env.ts uses when NEXT_PUBLIC_INSIDER_ACCOUNT_ID /
 * _SCRIPT_HOST are empty (Swiss Arabian's UAT account). Kept in sync by
 * validate.spec.ts. Any brand that leaves them empty ships these values.
 */
export const ENV_TS_INSIDER_FALLBACK = {
  accountId: "10015366",
  scriptHost: "swissarabianuatnew.api.useinsider.com",
} as const;

type AppEnv = "local" | "dev" | "staging" | "production";

export type BrandCheckResult = {
  ok: boolean;
  brandCode: string;
  appEnv: AppEnv;
  errors: string[];
  warnings: string[];
};

function appEnvOf(raw: BrandPublicEnv): AppEnv {
  const value = envValue(raw, "NEXT_PUBLIC_APP_ENV") || "dev";
  return value === "local" || value === "staging" || value === "production"
    ? value
    : "dev";
}

function hostOf(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");
}

/** Never print keys in CI logs; ids are public and printed as-is. */
function shown(key: BrandEnvKey, value: string): string {
  if (!key.includes("KEY")) return `"${value}"`;
  return value.length <= 8 ? '"****"' : `"${value.slice(0, 4)}…${value.slice(-2)}"`;
}

/** Settings compared against the ids other brands own. */
const OWNED_ID_FIELDS: Array<{ key: BrandEnvKey; field: keyof BrandConfig["ownedIds"] }> = [
  { key: "NEXT_PUBLIC_GTM_ID", field: "gtmIds" },
  { key: "NEXT_PUBLIC_GA4_ID", field: "ga4Ids" },
  { key: "NEXT_PUBLIC_INSIDER_ACCOUNT_ID", field: "insiderAccountIds" },
  { key: "NEXT_PUBLIC_INSIDER_SCRIPT_HOST", field: "insiderScriptHosts" },
  { key: "NEXT_PUBLIC_TABBY_MERCHANT_CODE", field: "tabbyMerchantCodes" },
  { key: "NEXT_PUBLIC_TABBY_PUBLIC_KEY", field: "tabbyPublicKeys" },
  { key: "NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID", field: "googleMapsMapIds" },
];

const HOST_SETTINGS: BrandEnvKey[] = [
  "NEXT_PUBLIC_STOREFRONT_HOST",
  "NEXT_PUBLIC_STAGING_RETURN_URL",
  "NEXT_PUBLIC_PRODUCTION_RETURN_URL",
];

/**
 * Checks this deployment's per-brand settings against the brand registry.
 * Errors stop the build; warnings are printed only.
 */
export function validateBrandEnv(
  raw: BrandPublicEnv,
  brands: Readonly<Record<string, BrandConfig>> = BRANDS,
): BrandCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const appEnv = appEnvOf(raw);
  const isProduction = appEnv === "production";
  const known = Object.keys(brands).join(", ");

  // 1. Which brand is this deployment?
  const rawCode = normalizeBrandCode(raw.NEXT_PUBLIC_STOREFRONT_BRAND_CODE);
  let selected: BrandConfig | undefined = rawCode ? brands[rawCode] : undefined;
  if (rawCode && !selected) {
    errors.push(
      `NEXT_PUBLIC_STOREFRONT_BRAND_CODE="${rawCode}" is not a known brand (known: ${known}). Add src/lib/brand/brands/<brand>.ts and register it in registry.ts.`,
    );
  }
  if (!rawCode) {
    const byHost = brandOwningHost(envValue(raw, "NEXT_PUBLIC_STOREFRONT_HOST"));
    selected = (byHost && brands[byHost.code]) || brands[DEFAULT_BRAND_CODE];
    const message = `NEXT_PUBLIC_STOREFRONT_BRAND_CODE is not set; checking as ${selected?.code ?? DEFAULT_BRAND_CODE}. Set it explicitly (one of: ${known}).`;
    if (isProduction) errors.push(message);
    else warnings.push(message);
  }
  if (!selected) {
    return { ok: false, brandCode: rawCode, appEnv, errors, warnings };
  }
  const brand: BrandConfig = selected;
  const label = `${brand.name.en} (${brand.code})`;
  const others = Object.values(brands).filter((other) => other.code !== brand.code);

  // 2. Well-formed values.
  for (const key of BRAND_ENV_KEYS) {
    const value = envValue(raw, key);
    const format = BRAND_ENV_FORMATS[key];
    if (!value || !format) continue;
    const parsed = format.safeParse(value);
    if (!parsed.success) {
      errors.push(`${key}=${shown(key, value)} is not ${parsed.error.issues[0]?.message ?? "valid"}.`);
    }
  }

  // 3. Required settings.
  const require = (key: BrandEnvKey, why: string) => {
    if (envValue(raw, key)) return;
    const message = `${key} is missing (${why}).`;
    if (isProduction) errors.push(message);
    else if (appEnv === "staging") warnings.push(message);
  };
  for (const key of brand.requiredInProduction) {
    require(key, `required for a production ${label} build`);
  }
  if (envValue(raw, "NEXT_PUBLIC_ENABLE_TABBY") === "true") {
    require("NEXT_PUBLIC_TABBY_PUBLIC_KEY", "NEXT_PUBLIC_ENABLE_TABBY=true");
    require("NEXT_PUBLIC_TABBY_MERCHANT_CODE", "NEXT_PUBLIC_ENABLE_TABBY=true");
  }
  if (
    isProduction &&
    !envValue(raw, "NEXT_PUBLIC_GTM_ID") &&
    !envValue(raw, "NEXT_PUBLIC_GA4_ID")
  ) {
    warnings.push("Neither NEXT_PUBLIC_GTM_ID nor NEXT_PUBLIC_GA4_ID is set: no analytics on this production build.");
  }

  // 4. Nothing that belongs to another brand. Empty Insider settings count as
  //    the env.ts fallback, because that is what the site would load.
  const insiderOn = envValue(raw, "NEXT_PUBLIC_INSIDER_ENABLED") !== "false";
  const effective = (key: BrandEnvKey): { value: string; fallback: boolean } => {
    const value = envValue(raw, key);
    if (value || !insiderOn) return { value, fallback: false };
    if (key === "NEXT_PUBLIC_INSIDER_ACCOUNT_ID") {
      return { value: ENV_TS_INSIDER_FALLBACK.accountId, fallback: true };
    }
    if (key === "NEXT_PUBLIC_INSIDER_SCRIPT_HOST") {
      return { value: ENV_TS_INSIDER_FALLBACK.scriptHost, fallback: true };
    }
    return { value, fallback: false };
  };
  for (const { key, field } of OWNED_ID_FIELDS) {
    const { value, fallback } = effective(key);
    if (!value) continue;
    const owner = others.find((other) =>
      other.ownedIds[field].some((id) => id.toLowerCase() === value.toLowerCase()),
    );
    if (!owner) continue;
    errors.push(
      fallback
        ? `${key} is empty, so the site falls back to ${shown(key, value)}, which belongs to ${owner.name.en} (${owner.code}), not ${label}. Set ${brand.name.en}'s own value or NEXT_PUBLIC_INSIDER_ENABLED=false.`
        : `${key}=${shown(key, value)} belongs to ${owner.name.en} (${owner.code}), not ${label}.`,
    );
  }
  for (const key of HOST_SETTINGS) {
    const value = envValue(raw, key);
    if (!value) continue;
    const host = hostOf(value);
    const owner = others.find((other) => brandHosts(other).includes(host));
    if (owner) {
      errors.push(`${key}=${shown(key, value)} is a ${owner.name.en} (${owner.code}) host, not ${label}.`);
    }
  }

  // 5. Hosts must be this brand's.
  const storefrontHost = hostOf(envValue(raw, "NEXT_PUBLIC_STOREFRONT_HOST"));
  const productionReturn = hostOf(envValue(raw, "NEXT_PUBLIC_PRODUCTION_RETURN_URL"));
  const stagingReturn = hostOf(envValue(raw, "NEXT_PUBLIC_STAGING_RETURN_URL"));
  const production = brand.hosts.production;
  const liveOrStaging = [...production, ...brand.hosts.staging];
  if (isProduction && production.length === 0) {
    errors.push(
      `${label} has no production hosts in src/lib/brand/brands/*.ts (hosts.production is empty). Add the shop domains before a production build.`,
    );
  }
  const expectHost = (key: BrandEnvKey, host: string, allowed: string[], strict: boolean) => {
    if (!host || allowed.length === 0 || allowed.includes(host)) return;
    const message = `${key} host "${host}" is not one of ${label}'s hosts (${allowed.join(", ")}).`;
    if (strict) errors.push(message);
    else warnings.push(message);
  };
  if (isProduction) {
    expectHost("NEXT_PUBLIC_STOREFRONT_HOST", storefrontHost, production, true);
    expectHost("NEXT_PUBLIC_PRODUCTION_RETURN_URL", productionReturn, production, true);
  } else if (appEnv === "staging") {
    expectHost("NEXT_PUBLIC_STOREFRONT_HOST", storefrontHost, liveOrStaging, true);
    expectHost("NEXT_PUBLIC_STAGING_RETURN_URL", stagingReturn, brand.hosts.staging, false);
  } else {
    expectHost("NEXT_PUBLIC_STOREFRONT_HOST", storefrontHost, brandHosts(brand), false);
  }

  if (!isProduction && envValue(raw, "NEXT_PUBLIC_SEO_INDEXING_ENABLED") === "true") {
    warnings.push(`NEXT_PUBLIC_SEO_INDEXING_ENABLED=true has no effect on a ${appEnv} build (production only).`);
  }

  return { ok: errors.length === 0, brandCode: brand.code, appEnv, errors, warnings };
}

/** Human-readable report for the CLI. */
export function formatBrandCheck(result: BrandCheckResult): string {
  const lines = [
    `Brand config check: ${result.brandCode || "(unknown)"} / NEXT_PUBLIC_APP_ENV=${result.appEnv}`,
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
