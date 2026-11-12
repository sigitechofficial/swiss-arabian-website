import type { MetadataRoute } from "next";
import { fetchCatalogSitemap } from "@/features/catalog/api/catalog.service";
import { withLocalePrefix } from "@/lib/i18n/localePath";
import { DEFAULT_LOCALE, LOCALES } from "@/lib/i18n/locales";
import { sitemapAlternates } from "@/lib/seo/sitemapEntries";
import { resolveCatalogMarketFor } from "@/lib/seo/serverMarket";
import { requestOrigin } from "@/lib/seo/requestOrigin";
import { shopifyLegacyRedirect } from "@/lib/seo/shopifyLegacyRedirects";
import { fetchSitePages } from "@/features/site-pages/api/sitePages.service";
import { fixedPathForPage } from "@/features/site-pages/utils/pickMarketPage";
import { fetchBlogSlugs } from "@/features/blog/api/blogApi";

/** Public pages that are not catalog entities (search is noindex, so not listed). */
// Placeholder pages (our story, stores) join when their CMS content exists.
// The Journal (/blog) and its posts are added below once posts are live.
const STATIC_PATHS = ["/", "/collections", "/faq"];

function absolute(origin: string, path: string) {
  return `${origin}${path === "/" ? "" : path}`;
}

/** Rebuilt at most once an hour (no request data is read). */
export const revalidate = 3600;

const resolveServerCatalogMarket = () => resolveCatalogMarketFor(DEFAULT_LOCALE);

/**
 * The storefront market's sitemap: fixed pages plus every product, collection
 * and category visible in the market (market product addresses), in every
 * configured language, with last-updated dates.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = (await requestOrigin()) ?? "";
  const entries: Array<{ path: string; lastModified?: string }> = STATIC_PATHS.map((path) => ({ path }));

  try {
    const { zoneCode, market } = await resolveServerCatalogMarket();
    const catalog = await fetchCatalogSitemap(zoneCode, market);
    for (const entry of catalog) {
      if (entry.noindex || !entry.path) continue;
      // An address that redirects (e.g. Shopify's /collections/all → /products) is not listed.
      if (shopifyLegacyRedirect(entry.path)) continue;
      entries.push({ path: entry.path, lastModified: entry.updatedAt ?? undefined });
    }
  } catch {
    // The market cannot be read: still publish the fixed pages.
  }

  try {
    const { zoneCode } = await resolveServerCatalogMarket();
    const pages = await fetchSitePages(zoneCode);
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

  // Journal posts exist in one language each: list them only at that language's address.
  const blogEntries: MetadataRoute.Sitemap = [];
  try {
    const { zoneCode } = await resolveServerCatalogMarket();
    for (const language of LOCALES) {
      const posts = await fetchBlogSlugs({ zoneCode, languageCode: language });
      for (const post of posts) {
        const url = withLocalePrefix(`/blog/${post.slug}`, language);
        blogEntries.push({ url: origin ? absolute(origin, url) : url, lastModified: post.updatedAt });
      }
    }
    if (blogEntries.length) entries.push({ path: "/blog" });
  } catch {
    // The Journal cannot be read: the rest of the sitemap still publishes.
  }

  return [...sitemapAlternates(entries, origin), ...blogEntries];
}
