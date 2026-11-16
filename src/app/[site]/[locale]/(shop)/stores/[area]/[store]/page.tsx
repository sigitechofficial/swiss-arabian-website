import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { breadcrumbJsonLd } from "@/features/catalog/components/CatalogJsonLd";
import { loadStore } from "@/features/stores/routes/storeRouteData";
import { storePageJsonLd } from "@/features/stores/utils/storeJsonLd";
import { storeAreaPath, storePath, storesPath } from "@/features/stores/utils/storeLinks";
import { pageMetadata } from "@/lib/seo/pageSeo";
import { absoluteUrl, requestOrigin } from "@/lib/seo/requestOrigin";
import { routeTranslator } from "@/lib/i18n/routeLocale";
import { withLocalePrefix } from "@/lib/i18n/localePath";
import { CatalogJsonLd, StorePageView } from "@brand-ui";
import { requireBrandFeature } from "@/lib/brand/featureGate";

type Params = { params: Promise<{ area: string; store: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  requireBrandFeature("storeLocator");
  const { store: slug } = await params;
  const { store } = await loadStore(slug);
  if (!store || store.gone) return { robots: { index: false, follow: true } };
  const { t } = await routeTranslator();
  const meta = await pageMetadata({
    path: storePath(store),
    title: store.seoTitle || store.name,
    description: store.seoDescription || t("stores.storeMetaDescription", { name: store.name, address: store.address }),
  });
  // A closed shop's page stays for visitors (with nearby shops) but leaves search results.
  return store.openState === "CLOSED_PERMANENTLY" ? { ...meta, robots: { index: false, follow: true } } : meta;
}

export default async function StorePage({ params }: Params) {
  requireBrandFeature("storeLocator");
  const { area, store: slug } = await params;
  const { locale, store } = await loadStore(slug);
  if (!store) notFound();
  // Closed for good over 90 days ago: send visitors (and search engines) to the area page.
  if (store.gone) permanentRedirect(withLocalePrefix(storeAreaPath(store.areaSlug), locale));
  // The store moved to another area (or the address was typed wrong): one address per store.
  if (store.areaSlug !== area) permanentRedirect(withLocalePrefix(storePath(store), locale));

  const { t, brandName } = await routeTranslator();
  const origin = await requestOrigin();
  const url = (path: string) => absoluteUrl(origin, withLocalePrefix(path, locale));
  return (
    <>
      <CatalogJsonLd
        data={breadcrumbJsonLd([
          { name: t("home"), url: url("/") },
          { name: t("pages.stores.title"), url: url(storesPath()) },
          { name: store.area.name, url: url(storeAreaPath(store.areaSlug)) },
          { name: store.name, url: url(storePath(store)) },
        ])}
      />
      <CatalogJsonLd data={storePageJsonLd(store, url(storePath(store)), brandName)} />
      <StorePageView store={store} />
    </>
  );
}
