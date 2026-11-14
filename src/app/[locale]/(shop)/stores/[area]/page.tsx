import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { breadcrumbJsonLd } from "@/features/catalog/components/CatalogJsonLd";
import { loadStoreArea } from "@/features/stores/routes/storeRouteData";
import { storeListJsonLd } from "@/features/stores/utils/storeJsonLd";
import { storeAreaPath, storePath, storesPath } from "@/features/stores/utils/storeLinks";
import { pageMetadata } from "@/lib/seo/pageSeo";
import { absoluteUrl, requestOrigin } from "@/lib/seo/requestOrigin";
import { routeTranslator } from "@/lib/i18n/routeLocale";
import { withLocalePrefix } from "@/lib/i18n/localePath";
import { CatalogJsonLd, StoreAreaPageView } from "@brand-ui";
import { requireBrandFeature } from "@/lib/brand/featureGate";

type Params = { params: Promise<{ area: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  requireBrandFeature("storeLocator");
  const { area } = await params;
  const { data } = await loadStoreArea(area);
  if (!data) return { robots: { index: false, follow: true } };
  const { t } = await routeTranslator();
  return pageMetadata({
    path: storeAreaPath(data.area.slug),
    title: data.area.seoTitle || t("stores.areaMetaTitle", { area: data.area.name }),
    description: data.area.seoDescription || t("stores.areaMetaDescription", { area: data.area.name }),
  });
}

export default async function StoreAreaPage({ params }: Params) {
  requireBrandFeature("storeLocator");
  const { area } = await params;
  const { locale, data } = await loadStoreArea(area);
  if (!data) notFound();
  const { t, brandName } = await routeTranslator();
  const origin = await requestOrigin();
  const url = (path: string) => absoluteUrl(origin, withLocalePrefix(path, locale));
  return (
    <>
      <CatalogJsonLd
        data={breadcrumbJsonLd([
          { name: t("home"), url: url("/") },
          { name: t("pages.stores.title"), url: url(storesPath()) },
          { name: data.area.name, url: url(storeAreaPath(data.area.slug)) },
        ])}
      />
      <CatalogJsonLd data={storeListJsonLd(data.stores.map((store) => ({ store, url: url(storePath(store)) })), brandName)} />
      <StoreAreaPageView data={data} />
    </>
  );
}
