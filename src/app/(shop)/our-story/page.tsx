import type { Metadata } from "next";
import { FeaturePlaceholder } from "@/components/shared/FeaturePlaceholder";
import {
  CatalogJsonLd,
  pageBreadcrumbJsonLd,
} from "@/features/catalog/components/CatalogJsonLd";
import { faqDrawers } from "@/features/faq/data/faqContent";
import { SitePageView } from "@/features/site-pages/components/SitePageView";
import {
  loadMarketFixedPage,
  marketFixedPageMetadata,
} from "@/features/site-pages/marketFixedPage";
import { pickStoryPage } from "@/features/site-pages/utils/pickMarketPage";

const loadStory = () => loadMarketFixedPage("our-story", pickStoryPage);

/** The brand history already published in the FAQ: shown until the market publishes its story page. */
const BRAND_HISTORY =
  faqDrawers
    .flatMap((drawer) => drawer.items)
    .find((item) => item.id === "general-name")?.answer ?? "";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, page } = await loadStory();
  if (page) return marketFixedPageMetadata("/our-story", locale, page);
  // No story page published for the market yet: kept out of search.
  return { title: "Our story", robots: { index: false, follow: true } };
}

export default async function OurStoryPage() {
  const { locale, page } = await loadStory();
  if (page) {
    return (
      <>
        <CatalogJsonLd data={pageBreadcrumbJsonLd(locale, { name: page.title, path: "/our-story" })} />
        <SitePageView page={page} locale={locale} />
      </>
    );
  }
  return <FeaturePlaceholder title="Our story" description={BRAND_HISTORY} />;
}
