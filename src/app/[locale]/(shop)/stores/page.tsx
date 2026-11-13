import type { Metadata } from "next";
import { pageBreadcrumbJsonLd } from "@/features/catalog/components/CatalogJsonLd";
import {
  loadMarketFixedPage,
  marketFixedPageMetadata,
} from "@/features/site-pages/marketFixedPage";
import { pickStoresPage } from "@/features/site-pages/utils/pickMarketPage";
import { pageMetadata } from "@/lib/seo/pageSeo";
import { getTranslator } from "@/lib/i18n/messages";
import { brandDisplayName } from "@/lib/brand";
import { CatalogJsonLd, FeaturePlaceholder, SitePageView } from "@brand-ui";

const loadStores = () => loadMarketFixedPage("stores", pickStoresPage);

export async function generateMetadata(): Promise<Metadata> {
  const { locale, page } = await loadStores();
  if (page) return marketFixedPageMetadata("/stores", locale, page);
  // No store list published for the market yet: kept out of search.
  const t = await getTranslator(locale);
  const base = await pageMetadata({
    path: "/stores",
    title: t("pages.stores.title"),
    description: t("pages.stores.description", { brand: brandDisplayName(locale) }),
  });
  return { ...base, robots: { index: false, follow: true } };
}

export default async function StoresPage() {
  const { locale, page } = await loadStores();
  if (page) {
    return (
      <>
        <CatalogJsonLd data={await pageBreadcrumbJsonLd(locale, { name: page.title, path: "/stores" })} />
        <SitePageView page={page} locale={locale} />
      </>
    );
  }
  const t = await getTranslator(locale);
  return (
    <FeaturePlaceholder
      title={t("pages.stores.title")}
      description={t("pages.stores.comingSoon")}
    />
  );
}
