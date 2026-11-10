import type { Metadata } from "next";
import { FaqPageView } from "@/features/faq";
import {
  loadMarketFixedPage,
  marketFixedPageMetadata,
} from "@/features/site-pages/marketFixedPage";
import { SitePageView } from "@/features/site-pages/components/SitePageView";
import { pickFaqPage } from "@/features/site-pages/utils/pickMarketPage";
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
  if (page) return <SitePageView page={page} locale={locale} />;
  const { topic } = await searchParams;
  return <FaqPageView initialDrawer={topic} />;
}
