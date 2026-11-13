import type { ComponentType } from "react";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { resolveRequestCatalogMarket } from "@/lib/seo/requestMarket";
import { applySeoOverrides, loadPublishedPageSeo } from "@/lib/seo/pageSeo";
import { catalogMetadata } from "@/lib/seo/catalogPage";
import { withLocalePrefix } from "@/lib/i18n/localePath";
import type { ShopLocale } from "@/lib/i18n/locales";
import {
  breadcrumbJsonLd,
  CatalogJsonLd,
} from "@/features/catalog/components/CatalogJsonLd";
import { getTranslator } from "@/lib/i18n/messages";
import {
  fetchSitePage,
  fetchSitePagePreview,
  fetchSitePages,
  type SitePage,
  type SitePageKind,
  type SitePagePreview,
  type SitePagePreviewParams,
} from "./api/sitePages.service";
import { fixedPathForPage } from "./utils/pickMarketPage";

/**
 * Shared by /pages/[handle] and /policies/[handle] for every brand: loading,
 * the fixed-address redirect, metadata, breadcrumbs. The brand supplies the
 * view (`SitePageView`) and the admin preview notice (see `SitePageRoute` in
 * each brand's `brand-ui.ts`).
 */

export type SitePageViewProps = {
  page: SitePage;
  contactDetails?: SitePage | null;
  locale: ShopLocale;
  contactDetailsLabel?: string;
};

/** The saved version an admin preview link shows. */
export type SitePagePreviewInfo = SitePagePreview["preview"];

export type SitePageRouteProps = {
  kind: SitePageKind;
  handle: string;
  previewParams?: SitePagePreviewParams | null;
};

async function load(
  kind: SitePageKind,
  handle: string,
  preview?: SitePagePreviewParams | null,
) {
  const { locale, zoneCode } = await resolveRequestCatalogMarket();
  if (preview) {
    // A saved version from an admin preview link: its own text, never indexed.
    const page = await fetchSitePagePreview(preview, locale);
    return { locale, zoneCode, page, preview: page?.preview ?? null };
  }
  if (kind === "PAGE" && zoneCode) {
    // The market's FAQ / story / store page has one address: /faq, /our-story, /stores.
    const pages = await fetchSitePages(zoneCode).catch(() => []);
    const fixedPath = fixedPathForPage(pages, handle);
    if (fixedPath) permanentRedirect(withLocalePrefix(fixedPath, locale));
  }
  const page = await fetchSitePage(kind, handle, locale, zoneCode);
  return { locale, zoneCode, page, preview: null };
}

export async function sitePageMetadata(
  kind: SitePageKind,
  handle: string,
  previewParams?: SitePagePreviewParams | null,
): Promise<Metadata> {
  const { locale, page, preview } = await load(kind, handle, previewParams);
  if (!page) notFound();
  if (preview) {
    return {
      title: `Preview · ${page.title}`,
      robots: { index: false, follow: false },
    };
  }
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

/** Renders a text page / policy with the brand's view and preview notice. */
export async function SitePageRouteBase({
  kind,
  handle,
  previewParams,
  View,
  PreviewNotice,
}: SitePageRouteProps & {
  View: ComponentType<SitePageViewProps>;
  PreviewNotice: ComponentType<{ preview: SitePagePreviewInfo }>;
}) {
  const { locale, zoneCode, page, preview } = await load(
    kind,
    handle,
    previewParams,
  );
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
      {preview ? <PreviewNotice preview={preview} /> : null}
      <CatalogJsonLd
        data={breadcrumbJsonLd([
          {
            name: (await getTranslator(locale))("home"),
            url: withLocalePrefix("/", locale),
          },
          { name: page.title, url: withLocalePrefix(page.path, locale) },
        ])}
      />
      <View
        page={page}
        contactDetails={contactDetails}
        locale={locale}
        contactDetailsLabel={(await getTranslator(locale))("sitePage.contactDetails")}
      />
    </>
  );
}
