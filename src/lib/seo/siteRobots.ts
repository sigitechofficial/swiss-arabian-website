import { seoIndexingEnabled } from "@/lib/config/runtime";
import { LOCALES } from "@/lib/i18n/locales";
import { requestOrigin } from "@/lib/seo/requestOrigin";
import { loadServerMarkets } from "@/lib/seo/serverMarket";
import { marketSites } from "@/lib/seo/marketAlternates";

/** Private or endless pages (like Shopify's robots.txt): never in search results. */
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

/**
 * robots.txt of the website being served (run inside `withSiteHost`). Nothing
 * is crawled until indexing is switched on for the production site
 * (seoIndexingEnabled(): production with SEO_INDEXING_ENABLED=true). A market website names its own
 * sitemap; a root domain without a market of its own (it redirects to market
 * websites) names its market websites' sitemaps.
 */
export async function siteRobotsTxt(): Promise<string> {
  if (!seoIndexingEnabled()) {
    return ["User-agent: *", "Disallow: /", ""].join("\n");
  }
  const origin = await requestOrigin();
  const list = await loadServerMarkets();
  const sites = marketSites(list ?? null);
  const sitemaps =
    list && !list.siteMarketCode && sites.length > 0
      ? sites.map((site) => `${site.origin}/sitemap.xml`)
      : origin
        ? [`${origin}/sitemap.xml`]
        : [];
  const disallow = PRIVATE_PATHS.flatMap((path) => [
    path,
    // Every language prefix the website knows (any market's default may differ).
    ...LOCALES.map((code) => `/${code}${path}`),
  ]);
  return [
    "User-agent: *",
    "Allow: /",
    ...disallow.map((path) => `Disallow: ${path}`),
    "",
    ...(origin ? [`Host: ${origin}`] : []),
    ...sitemaps.map((url) => `Sitemap: ${url}`),
    "",
  ].join("\n");
}
