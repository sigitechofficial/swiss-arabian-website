import type { Metadata } from "next";
import { FeaturePlaceholder } from "@/components/shared/FeaturePlaceholder";
import {
  CatalogJsonLd,
  pageBreadcrumbJsonLd,
} from "@/features/catalog/components/CatalogJsonLd";
import { SitePageView } from "@/features/site-pages/components/SitePageView";
import {
  loadMarketFixedPage,
  marketFixedPageMetadata,
} from "@/features/site-pages/marketFixedPage";
import { pickStoresPage } from "@/features/site-pages/utils/pickMarketPage";
import { pageMetadata } from "@/lib/seo/pageSeo";

const loadStores = () => loadMarketFixedPage("stores", pickStoresPage);

export async function generateMetadata(): Promise<Metadata> {
  const { locale, page } = await loadStores();
  if (page) return marketFixedPageMetadata("/stores", locale, page);
  // No store list published for the market yet: kept out of search.
  const base = await pageMetadata({
    path: "/stores",
    title: "Our stores",
    titleAr: "متاجرنا",
    description: "Find a Swiss Arabian store near you, with addresses and opening hours.",
    descriptionAr: "اعثر على أقرب متجر لسويس أرابيان، مع العناوين وساعات العمل.",
  });
  return { ...base, robots: { index: false, follow: true } };
}

export default async function StoresPage() {
  const { locale, page } = await loadStores();
  if (page) {
    return (
      <>
        <CatalogJsonLd data={pageBreadcrumbJsonLd(locale, { name: page.title, path: "/stores" })} />
        <SitePageView page={page} locale={locale} />
      </>
    );
  }
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
