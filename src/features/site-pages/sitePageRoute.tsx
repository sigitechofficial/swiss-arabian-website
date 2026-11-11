import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { resolveServerCatalogMarket } from "@/lib/seo/catalogPage";
import { applySeoOverrides, loadPublishedPageSeo } from "@/lib/seo/pageSeo";
import { catalogMetadata } from "@/lib/seo/catalogPage";
import { withLocalePrefix } from "@/lib/i18n/localePath";
import {
  breadcrumbJsonLd,
  CatalogJsonLd,
} from "@/features/catalog/components/CatalogJsonLd";
import { shopCopy } from "@/lib/i18n/shopCopy";
import {
  fetchSitePage,
  fetchSitePages,
  type SitePageKind,
} from "./api/sitePages.service";
import { SitePageView } from "./components/SitePageView";
import { fixedPathForPage } from "./utils/pickMarketPage";

/** Shared by /pages/[handle] and /policies/[handle]. */

async function load(kind: SitePageKind, handle: string) {
  const { locale, zoneCode } = await resolveServerCatalogMarket();
  if (kind === "PAGE" && zoneCode) {
    // The market's FAQ / story / store page has one address: /faq, /our-story, /stores.
    const pages = await fetchSitePages(zoneCode).catch(() => []);
    const fixedPath = fixedPathForPage(pages, handle);
    if (fixedPath) permanentRedirect(withLocalePrefix(fixedPath, locale));
  }
  const page = await fetchSitePage(kind, handle, locale, zoneCode);
  return { locale, zoneCode, page };
}

export async function sitePageMetadata(
  kind: SitePageKind,
  handle: string,
): Promise<Metadata> {
  const { locale, page } = await load(kind, handle);
  if (!page) notFound();
  // SEO Management (a page for this address) wins over the page's own SEO.
  const { seo } = await loadPublishedPageSeo(page.path);
  return applySeoOverrides(
    await catalogMetadata({
      locale,
      path: withLocalePrefix(page.path, locale),
      title: seo?.title || page.seoTitle || page.title,
      description: seo?.description || page.seoDescription || undefined,
      image: seo?.ogImage || null,
    }),
    seo,
  );
}

export async function SitePageRoute({
  kind,
  handle,
}: {
  kind: SitePageKind;
  handle: string;
}) {
  const { locale, zoneCode, page } = await load(kind, handle);
  if (!page) notFound();
  const contactDetails = page.templateSuffix?.includes("contact")
    ? await fetchSitePage(
        "POLICY",
        "contact-information",
        locale,
        zoneCode,
      ).catch(() => null)
    : null;
  return (
    <>
      <CatalogJsonLd
        data={breadcrumbJsonLd([
          {
            name: shopCopy(locale, "home"),
            url: withLocalePrefix("/", locale),
          },
          { name: page.title, url: withLocalePrefix(page.path, locale) },
        ])}
      />
      <SitePageView
        page={page}
        contactDetails={contactDetails}
        locale={locale}
      />
    </>
  );
}
