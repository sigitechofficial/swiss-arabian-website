import type { Metadata } from "next";
import { FeaturePlaceholder } from "@/components/shared/FeaturePlaceholder";
import { SitePageView } from "@/features/site-pages/components/SitePageView";
import {
  loadMarketFixedPage,
  marketFixedPageMetadata,
} from "@/features/site-pages/marketFixedPage";
import { pickStoresPage } from "@/features/site-pages/utils/pickMarketPage";

const loadStores = () => loadMarketFixedPage("stores", pickStoresPage);

export async function generateMetadata(): Promise<Metadata> {
  const { locale, page } = await loadStores();
  if (page) return marketFixedPageMetadata("/stores", locale, page);
  // No store list published for the market yet: kept out of search.
  return { title: "Our stores", robots: { index: false, follow: true } };
}

export default async function StoresPage() {
  const { locale, page } = await loadStores();
  if (page) return <SitePageView page={page} locale={locale} />;
  return (
    <FeaturePlaceholder
      title={locale === "ar" ? "متاجرنا" : "Our stores"}
      description={
        locale === "ar"
          ? "قائمة متاجرنا قريباً. للمساعدة، تواصل معنا عبر صفحة اتصل بنا."
          : "Our store list is coming soon. For help finding a store, contact us from the Contact us page."
      }
    />
  );
}
