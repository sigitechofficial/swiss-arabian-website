import type { Metadata } from "next";
import { breadcrumbJsonLd, pageBreadcrumbJsonLd } from "@/features/catalog/components/CatalogJsonLd";
import {
  loadMarketFixedPage,
  marketFixedPageMetadata,
} from "@/features/site-pages/marketFixedPage";
import { pickStoresPage } from "@/features/site-pages/utils/pickMarketPage";
import { loadStoreLocator } from "@/features/stores/routes/storeRouteData";
import { storeListJsonLd } from "@/features/stores/utils/storeJsonLd";
import { storePath, storesPath } from "@/features/stores/utils/storeLinks";
import { pageMetadata } from "@/lib/seo/pageSeo";
import { absoluteUrl, requestOrigin } from "@/lib/seo/requestOrigin";
import { routeTranslator } from "@/lib/i18n/routeLocale";
import { withLocalePrefix } from "@/lib/i18n/localePath";
import { CatalogJsonLd, FeaturePlaceholder, SitePageView, StoreLocatorPageView } from "@brand-ui";
import { requireBrandFeature } from "@/lib/brand/featureGate";

const loadCmsStoresPage = () => loadMarketFixedPage("stores", pickStoresPage);

export async function generateMetadata(): Promise<Metadata> {
  requireBrandFeature("storeLocator");
  const { data } = await loadStoreLocator();
  const { t } = await routeTranslator();
  const base = await pageMetadata({
    path: storesPath(),
    title: t("pages.stores.title"),
    description: t("pages.stores.description"),
  });
  if (data.stores.length) return base;
  // No stores in the database yet: the market's CMS store page, else a placeholder kept out of search.
  const { locale, page } = await loadCmsStoresPage();
  if (page) return marketFixedPageMetadata(storesPath(), locale, page);
  return { ...base, robots: { index: false, follow: true } };
}

export default async function StoresPage() {
  requireBrandFeature("storeLocator");
  const { locale, data } = await loadStoreLocator();
  const { t, brandName } = await routeTranslator();

  if (data.stores.length) {
    const origin = await requestOrigin();
    const url = (path: string) => absoluteUrl(origin, withLocalePrefix(path, locale));
    return (
      <>
        <CatalogJsonLd
          data={breadcrumbJsonLd([
            { name: t("home"), url: url("/") },
            { name: t("pages.stores.title"), url: url(storesPath()) },
          ])}
        />
        <CatalogJsonLd data={storeListJsonLd(data.stores.map((store) => ({ store, url: url(storePath(store)) })), brandName)} />
        <StoreLocatorPageView data={data} />
      </>
    );
  }

  const { page } = await loadCmsStoresPage();
  if (page) {
    return (
      <>
        <CatalogJsonLd data={await pageBreadcrumbJsonLd(locale, { name: page.title, path: storesPath() })} />
        <SitePageView page={page} locale={locale} />
      </>
    );
  }
  return <FeaturePlaceholder title={t("pages.stores.title")} description={t("pages.stores.comingSoon")} />;
}
