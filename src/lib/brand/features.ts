import { notFound } from "next/navigation";
import { stripLocalePrefix } from "@/lib/i18n/localePath";
import { envValue, readProcessPublicEnv } from "./publicEnv";
import { resolveBrand } from "./registry";
import type { BrandConfig } from "./types";

/**
 * Brand feature switches (`features` in `brands/<brand>.ts`) and the routes
 * each one owns. A section that is off:
 * - answers "not found" (`requireBrandFeature()` at the top of its page), and
 * - is never linked (`brandLinkEnabled()` filters navigation, menus, tiles).
 *
 * Features follow the deployment's brand (`NEXT_PUBLIC_STOREFRONT_BRAND_CODE`),
 * the same brand whose UI the build carries, so the server and the browser
 * always agree (a local `*.localhost` data alias does not switch them).
 */
export type BrandFeature = keyof BrandConfig["features"];
export type BrandFeatures = BrandConfig["features"];

/** Route prefixes per feature (locale prefix stripped; a prefix covers its sub-paths). */
export const FEATURE_ROUTES: Readonly<Record<BrandFeature, readonly string[]>> = {
  storeLocator: ["/stores"],
  blog: ["/blog"],
  loyalty: ["/account/rewards", "/account/membership"],
  subscriptions: ["/subscriptions", "/account/subscription"],
  giftBox: ["/gift-box"],
  employeeBenefits: ["/account/employee-benefits"],
};

/** The deployment's brand config (build-time brand code, else the default brand). */
function deploymentBrand(): BrandConfig {
  return resolveBrand({
    brandCode: envValue(readProcessPublicEnv(), "NEXT_PUBLIC_STOREFRONT_BRAND_CODE"),
  });
}

/** This deployment's feature switches. */
export function brandFeatures(): BrandFeatures {
  return deploymentBrand().features;
}

export function brandFeatureEnabled(
  feature: BrandFeature,
  features: BrandFeatures = brandFeatures(),
): boolean {
  return features[feature] === true;
}

function pathOnly(href: string): string {
  const path = href.split(/[?#]/)[0] || "/";
  return stripLocalePrefix(path.startsWith("/") ? path : `/${path}`).replace(/\/+$/, "") || "/";
}

/** The feature that owns a site path (`/ar/blog/x` → "blog"), or null. */
export function featureForPath(href: string): BrandFeature | null {
  if (!href || /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("//")) return null;
  const path = pathOnly(href);
  for (const [feature, prefixes] of Object.entries(FEATURE_ROUTES) as Array<[BrandFeature, readonly string[]]>) {
    if (prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) return feature;
  }
  return null;
}

/**
 * False when a link points into a section this brand has switched off.
 * External links and paths no feature owns are always allowed.
 */
export function brandLinkEnabled(href: string, features: BrandFeatures = brandFeatures()): boolean {
  const feature = featureForPath(href);
  return feature ? brandFeatureEnabled(feature, features) : true;
}

/**
 * Route guard (server): a page of a switched-off section answers "not found".
 * Call it first in the page (and in `generateMetadata` when that fetches data).
 */
export function requireBrandFeature(feature: BrandFeature, features: BrandFeatures = brandFeatures()): void {
  if (!brandFeatureEnabled(feature, features)) notFound();
}
