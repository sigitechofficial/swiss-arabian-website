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
  fetchSitePagePreview,
  fetchSitePages,
  type SitePageKind,
  type SitePagePreviewParams,
} from "./api/sitePages.service";
import { SitePageView } from "./components/SitePageView";
import { fixedPathForPage } from "./utils/pickMarketPage";

/** Shared by /pages/[handle] and /policies/[handle]. */

async function load(
  kind: SitePageKind,
  handle: string,
  preview?: SitePagePreviewParams | null,
) {
  const { locale, zoneCode } = await resolveServerCatalogMarket();
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

export async function SitePageRoute({
  kind,
  handle,
  previewParams,
}: {
  kind: SitePageKind;
  handle: string;
  previewParams?: SitePagePreviewParams | null;
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
      {preview ? (
        <div
          role="status"
          className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900"
        >
          Preview of version {preview.number} “{preview.label}”
          {preview.status === "SCHEDULED" && preview.effectiveFrom
            ? `, scheduled for ${new Date(preview.effectiveFrom).toUTCString()}`
            : preview.status === "ACTIVE"
              ? " (live now)"
              : ` (${preview.status.toLowerCase()}, not live)`}
          . Shoppers do not see this link.
        </div>
      ) : null}
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
