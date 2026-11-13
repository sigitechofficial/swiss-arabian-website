import type { Metadata } from "next";
import { faqPageJsonLd, pageBreadcrumbJsonLd } from "@/features/catalog/components/CatalogJsonLd";
import {
  loadMarketFixedPage,
  marketFixedPageMetadata,
} from "@/features/site-pages/marketFixedPage";
import { pickFaqPage } from "@/features/site-pages/utils/pickMarketPage";
import { sanitizePageHtml } from "@/lib/html/sanitizePageHtml";
import { getTranslator } from "@/lib/i18n/messages";
import { faqEntriesFromHtml } from "@/lib/seo/faqContent";
import { pageMetadata } from "@/lib/seo/pageSeo";
import { CatalogJsonLd, FaqPageView, SitePageView } from "@brand-ui";

/**
 * The market's own FAQ from Pages & policies (imported from its store or
 * written in the admin). The built-in FAQ is only the fallback for a market
 * that has none: its answers are written for the UAE.
 */
const loadMarketFaq = () => loadMarketFixedPage("faq", pickFaqPage);

export async function generateMetadata(): Promise<Metadata> {
  const { locale, page } = await loadMarketFaq();
  if (!page) {
    const t = await getTranslator(locale);
    return pageMetadata({
      path: "/faq",
      title: t("pages.faq.title"),
      description: t("pages.faq.description"),
    });
  }
  return marketFixedPageMetadata("/faq", locale, page);
}

export default async function FaqPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { locale, page } = await loadMarketFaq();
  if (page) {
    // The same questions and answers the page shows (its cleaned HTML), as plain text.
    const entries = faqEntriesFromHtml(sanitizePageHtml(page.bodyHtml));
    return (
      <>
        <CatalogJsonLd data={await pageBreadcrumbJsonLd(locale, { name: page.title, path: "/faq" })} />
        {entries.length ? <CatalogJsonLd data={faqPageJsonLd(entries)} /> : null}
        <SitePageView page={page} locale={locale} />
      </>
    );
  }
  const { topic } = await searchParams;
  // The built-in FAQ shows an answer only once its question is opened, so it
  // carries no FAQPage data (Google requires the answers on the page).
  return (
    <>
      <CatalogJsonLd
        data={await pageBreadcrumbJsonLd(locale, { name: (await getTranslator(locale))("faqs"), path: "/faq" })}
      />
      <FaqPageView initialDrawer={topic} />
    </>
  );
}
