import type { Metadata } from "next";
import {
  CatalogJsonLd,
  faqPageJsonLd,
  pageBreadcrumbJsonLd,
} from "@/features/catalog/components/CatalogJsonLd";
import { FaqPageView } from "@/features/faq";
import {
  loadMarketFixedPage,
  marketFixedPageMetadata,
} from "@/features/site-pages/marketFixedPage";
import { SitePageView } from "@/features/site-pages/components/SitePageView";
import { pickFaqPage } from "@/features/site-pages/utils/pickMarketPage";
import { sanitizePageHtml } from "@/lib/html/sanitizePageHtml";
import { shopCopy } from "@/lib/i18n/shopCopy";
import { faqEntriesFromHtml } from "@/lib/seo/faqContent";
import { pageMetadata } from "@/lib/seo/pageSeo";

/**
 * The market's own FAQ from Pages & policies (imported from its store or
 * written in the admin). The built-in FAQ is only the fallback for a market
 * that has none: its answers are written for the UAE.
 */
const loadMarketFaq = () => loadMarketFixedPage("faq", pickFaqPage);

export async function generateMetadata(): Promise<Metadata> {
  const { locale, page } = await loadMarketFaq();
  if (!page) {
    return pageMetadata({
      path: "/faq",
      title: "FAQ",
      titleAr: "الأسئلة الشائعة",
      description:
        "Answers about orders, delivery, payments, samples and Swiss Arabian scents.",
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
        <CatalogJsonLd data={pageBreadcrumbJsonLd(locale, { name: page.title, path: "/faq" })} />
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
        data={pageBreadcrumbJsonLd(locale, { name: shopCopy(locale, "faqs"), path: "/faq" })}
      />
      <FaqPageView initialDrawer={topic} />
    </>
  );
}
