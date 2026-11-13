import type { MetadataRoute } from "next";
import { brandIntegrations } from "@/lib/brand";
import { requestOrigin } from "@/lib/seo/requestOrigin";
import { DEFAULT_LOCALE, LOCALES } from "@/lib/i18n/locales";

/** Rebuilt at most once an hour (no request data is read). */
export const revalidate = 3600;

/**
 * Nothing is crawled until indexing is switched on for the production site
 * (brandIntegrations().seoIndexingEnabled: production + NEXT_PUBLIC_SEO_INDEXING_ENABLED=true).
 */
const PRIVATE_PATHS = [
  "/cart",
  "/checkout",
  "/account",
  "/order-confirmation",
  "/payments",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify",
  "/search",
  "/track",
  "/preview",
  "/api",
  "/*?*sort=",
  "/*?*q=",
];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await requestOrigin();
  if (!brandIntegrations().seoIndexingEnabled) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private or endless pages (like Shopify's robots.txt): never in search results.
      disallow: PRIVATE_PATHS.flatMap((path) => [
        path,
        ...LOCALES.filter((code) => code !== DEFAULT_LOCALE).map((code) => `/${code}${path}`),
      ]),
    },
    ...(origin ? { sitemap: `${origin}/sitemap.xml`, host: origin } : {}),
  };
}
