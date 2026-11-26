import type { MetadataRoute } from "next";
import { fetchCatalogSitemap } from "@/features/catalog/api/catalog.service";
import { withLocalePrefix } from "@/lib/i18n/localePath";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";
import { marketLocaleConfig } from "@/lib/i18n/serverLocaleConfig";
import { sitemapAlternates } from "@/lib/seo/sitemapEntries";
import {
  loadServerMarkets,
  pageOwnMarketCode,
  resolveCatalogMarketFor,
} from "@/lib/seo/serverMarket";
import { requestSiteBase } from "@/lib/seo/requestOrigin";
import { shopifyLegacyRedirect } from "@/lib/seo/shopifyLegacyRedirects";
import {
  buildMarketHreflang,
  catalogPathsOf,
  marketSites,
} from "@/lib/seo/marketAlternates";
import { fetchSitePages } from "@/features/site-pages/api/sitePages.service";
import { fixedPathForPage } from "@/features/site-pages/utils/pickMarketPage";
import { fetchBlogSlugs } from "@/features/blog/api/blogApi";
import { fetchStoreSlugs } from "@/features/stores/api/storesApi";
import { brandFeatureEnabled } from "@/lib/brand/features";

/** Public pages that are not catalog entities (search is noindex, so not listed). */
// Placeholder pages (our story, stores) join when their CMS content exists.
// The Journal (/blog) and its posts are added below once posts are live.
const STATIC_PATHS = ["/", "/collections", "/faq"];

function absolute(origin: string, path: string) {
  return `${origin}${path === "/" ? "" : path}`;
}

/**
 * hreflang across the brand's markets for each page of this one (only markets
 * where the page exists), or null when this sitemap is no market's (a root
 * domain) or the brand has no other market.
 */
async function crossMarketFor(origin: string) {
  const list = await loadServerMarkets();
  const ownZoneCode = await pageOwnMarketCode();
  const sites = marketSites(list ?? null);
  if (!ownZoneCode || sites.length < 2 || !origin) return undefined;
  const catalogPaths = new Map(
    await Promise.all(
      sites
        .filter((site) => site.zoneCode !== ownZoneCode)
        .map(async (site) => [site.zoneCode, await catalogPathsOf(site)] as const),
    ),
  );
  return (path: string) => {
    const languages = buildMarketHreflang({
      path,
      ownZoneCode,
      defaultZoneCode: list?.brandDefaultMarketCode ?? null,
      sites,
      catalogPaths,
    });
    if (!languages) return null;
    // Own website's addresses come back relative: the sitemap needs absolute ones.
    return Object.fromEntries(
      Object.entries(languages).map(([code, href]) => [
        code,
        href.startsWith("/") ? absolute(origin, href) : href,
      ]),
    );
  };
}

/**
 * The sitemap of the website being served (run inside `withSiteHost`): fixed
 * pages plus every product, collection and category visible in its market, in
 * every language the market serves, with last-updated dates and hreflang (languages,
 * and other markets where the page exists). A market the shared address serves
 * has its own sitemap there (`/~KWT/sitemap.xml`, addresses under `/~KWT`). The
 * shared address's own sitemap lists nothing while its markets have addresses
 * (it redirects to them).
 */
export async function siteSitemap(): Promise<MetadataRoute.Sitemap> {
  // The market's base: `https://swissarabian.com/~KWT` for a market the shared address serves.
  const origin = (await requestSiteBase()) ?? "";
  const list = await loadServerMarkets();
  if (list && !(await pageOwnMarketCode()) && marketSites(list).length > 0) return [];

  const entries: Array<{ path: string; lastModified?: string }> = STATIC_PATHS.map((path) => ({ path }));
  const resolved = await resolveCatalogMarketFor(DEFAULT_LOCALE);
  // The market's languages (admin: Markets → languages), its default unprefixed.
  const localeConfig = marketLocaleConfig(resolved.languages);
  // Addresses the admin publishes as noindex (SEO Management): left out wherever they come from.
  let noindex = new Set<string>();

  try {
    const catalog = await fetchCatalogSitemap(resolved.zoneCode, resolved.market);
    noindex = new Set(catalog.noindexPaths);
    for (const entry of catalog.entries) {
      if (entry.noindex || !entry.path) continue;
      // An address that redirects (e.g. Shopify's /collections/all → /products) is not listed.
      if (shopifyLegacyRedirect(entry.path)) continue;
      entries.push({ path: entry.path, lastModified: entry.updatedAt ?? undefined });
    }
  } catch {
    // The market cannot be read: still publish the fixed pages.
  }

  try {
    const pages = await fetchSitePages(resolved.zoneCode);
    for (const page of pages) {
      // Addresses that redirect to a platform page (e.g. /pages/faqs → /faq) are not listed.
      if (shopifyLegacyRedirect(page.path)) continue;
      // The market's FAQ / story / store page is listed at its fixed address instead.
      const fixedPath = page.kind === "PAGE" ? fixedPathForPage(pages, page.handle) : null;
      entries.push({ path: fixedPath ?? page.path, lastModified: page.updatedAt });
    }
  } catch {
    // Pages cannot be read: the rest of the sitemap still publishes.
  }

  // Store locator: the list, each area page and each store page (every language),
  // only for brands that have it and once stores are on the website.
  if (brandFeatureEnabled("storeLocator")) try {
    const stores = await fetchStoreSlugs({ zoneCode: resolved.zoneCode });
    if (stores.stores.length) {
      const latest = stores.stores.reduce((a, s) => (s.updatedAt > a ? s.updatedAt : a), "");
      // The market's CMS store page (if any) is replaced by the locator at /store-locator.
      const i = entries.findIndex((e) => e.path === "/store-locator");
      if (i >= 0) entries.splice(i, 1);
      entries.push({ path: "/store-locator", lastModified: latest || undefined });
      for (const area of stores.areas) entries.push({ path: `/store-locator/${area.slug}`, lastModified: area.updatedAt });
      for (const store of stores.stores) entries.push({ path: `/store-locator/${store.areaSlug}/${store.slug}`, lastModified: store.updatedAt });
    }
  } catch {
    // Stores cannot be read: the rest of the sitemap still publishes.
  }

  // Journal posts exist in one language each: list them only at that language's address.
  const blogEntries: MetadataRoute.Sitemap = [];
  if (brandFeatureEnabled("blog")) try {
    for (const language of localeConfig.locales) {
      const posts = await fetchBlogSlugs({ zoneCode: resolved.zoneCode, languageCode: language });
      for (const post of posts) {
        if (noindex.has(`/blog/${post.slug}`)) continue;
        const url = withLocalePrefix(`/blog/${post.slug}`, language, localeConfig);
        blogEntries.push({ url: origin ? absolute(origin, url) : url, lastModified: post.updatedAt });
      }
    }
    if (blogEntries.length) entries.push({ path: "/blog" });
  } catch {
    // The Journal cannot be read: the rest of the sitemap still publishes.
  }

  const crossMarket = await crossMarketFor(origin);
  const listed = entries.filter((entry) => !noindex.has(entry.path));
  return [
    ...sitemapAlternates(listed, origin, localeConfig.locales, localeConfig.defaultLocale, crossMarket),
    ...blogEntries,
  ];
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** sitemaps.org XML with xhtml:link hreflang alternates. */
export function sitemapXml(entries: MetadataRoute.Sitemap): string {
  const urls = entries.map((entry) => {
    const lines = [`<url>`, `<loc>${escapeXml(entry.url)}</loc>`];
    for (const [code, href] of Object.entries(entry.alternates?.languages ?? {})) {
      if (typeof href !== "string") continue;
      lines.push(
        `<xhtml:link rel="alternate" hreflang="${escapeXml(code)}" href="${escapeXml(href)}" />`,
      );
    }
    if (entry.lastModified) {
      const date = new Date(entry.lastModified);
      if (!Number.isNaN(date.getTime())) lines.push(`<lastmod>${date.toISOString()}</lastmod>`);
    }
    lines.push(`</url>`);
    return lines.join("\n");
  });
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
    ...urls,
    `</urlset>`,
    ``,
  ].join("\n");
}
