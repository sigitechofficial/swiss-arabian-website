import type { MetadataRoute } from "next";
import { fetchCatalogSitemap } from "@/features/catalog/api/catalog.service";
import { withLocalePrefix } from "@/lib/i18n/localePath";
import { resolveServerCatalogMarket } from "@/lib/seo/catalogPage";
import { requestOrigin } from "@/lib/seo/requestOrigin";
import { shopifyLegacyRedirect } from "@/lib/seo/shopifyLegacyRedirects";
import { fetchSitePages } from "@/features/site-pages/api/sitePages.service";
import { fixedPathForPage } from "@/features/site-pages/utils/pickMarketPage";

/** Public pages that are not catalog entities (search is noindex, so not listed). */
// Placeholder pages (blog, our story, stores) join when their CMS content exists.
const STATIC_PATHS = ["/", "/collections", "/faq"];

function absolute(origin: string, path: string) {
  return `${origin}${path === "/" ? "" : path}`;
}

/**
 * This market's sitemap: fixed pages plus every product, collection and
 * category visible in the market (market product addresses), English and
 * Arabic, with last-updated dates. Served per market domain.
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

  const seen = new Set<string>();
  const out: MetadataRoute.Sitemap = [];
  for (const { path, lastModified } of entries) {
    if (seen.has(path)) continue;
    seen.add(path);
    const english = withLocalePrefix(path, "en");
    const arabic = withLocalePrefix(path, "ar");
    const languages = origin
      ? {
          en: absolute(origin, english),
          ar: absolute(origin, arabic),
          "x-default": absolute(origin, english),
        }
      : undefined;
    for (const url of [english, arabic]) {
      out.push({
        url: origin ? absolute(origin, url) : url,
        ...(lastModified ? { lastModified } : {}),
        alternates: languages ? { languages } : undefined,
      });
    }
  }
  return out;
}
