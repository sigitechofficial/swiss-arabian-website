import { cache } from "react";
import type { Metadata } from "next";
import {
  catalogMetadata,
  resolveServerCatalogMarket,
} from "@/lib/seo/catalogPage";
import { applySeoOverrides, loadPublishedPageSeo } from "@/lib/seo/pageSeo";
import { withLocalePrefix } from "@/lib/i18n/localePath";
import {
  fetchSitePage,
  fetchSitePages,
  type SitePage,
  type SitePageListItem,
} from "./api/sitePages.service";

type Picker = (pages: readonly SitePageListItem[]) => SitePageListItem | null;

/**
 * A fixed site address (/faq, /our-story, /stores) shows the market's own page
 * from Pages & policies when one is published; null otherwise (the address
 * then shows its built-in fallback).
 */
export const loadMarketFixedPage = cache(
  async (
    key: string,
    pick: Picker,
  ): Promise<{ locale: "en" | "ar"; page: SitePage | null }> => {
    const { locale, zoneCode } = await resolveServerCatalogMarket();
    if (!zoneCode) return { locale, page: null };
    const pages = await fetchSitePages(zoneCode).catch(() => []);
    const chosen = pick(pages);
    const page = chosen
      ? await fetchSitePage("PAGE", chosen.handle, locale, zoneCode).catch(
          () => null,
        )
      : null;
    return { locale, page };
  },
);

/** Head tags for a fixed address showing a market page; SEO Management can override. */
export async function marketFixedPageMetadata(
  path: string,
  locale: "en" | "ar",
  page: SitePage,
): Promise<Metadata> {
  const { seo } = await loadPublishedPageSeo(path);
  return applySeoOverrides(
    await catalogMetadata({
      locale,
      path: withLocalePrefix(path, locale),
      title: seo?.title || page.seoTitle || page.title,
      description: seo?.description || page.seoDescription || undefined,
    }),
    seo,
  );
}
