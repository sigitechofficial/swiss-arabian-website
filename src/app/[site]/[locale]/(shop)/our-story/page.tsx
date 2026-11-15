import type { Metadata } from "next";
import { pageBreadcrumbJsonLd } from "@/features/catalog/components/CatalogJsonLd";
import {
  loadMarketFixedPage,
  marketFixedPageMetadata,
} from "@/features/site-pages/marketFixedPage";
import { pickStoryPage } from "@/features/site-pages/utils/pickMarketPage";
import { CatalogJsonLd, OurStoryFallbackView, SitePageView } from "@brand-ui";

const loadStory = () => loadMarketFixedPage("our-story", pickStoryPage);

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
        <CatalogJsonLd data={await pageBreadcrumbJsonLd(locale, { name: page.title, path: "/our-story" })} />
        <SitePageView page={page} locale={locale} />
      </>
    );
  }
  // The brand's own words until the market publishes its story (never another brand's history).
  return <OurStoryFallbackView />;
}
