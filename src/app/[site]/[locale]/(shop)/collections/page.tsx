import type { Metadata } from "next";
import { pageBreadcrumbJsonLd } from "@/features/catalog/components/CatalogJsonLd";
import { fetchCollections } from "@/features/catalog/api/catalog.service";
import { resolveRequestCatalogMarket } from "@/lib/seo/requestMarket";
import { pageMetadata } from "@/lib/seo/pageSeo";
import { getTranslator } from "@/lib/i18n/messages";
import { routeTranslator } from "@/lib/i18n/routeLocale";
import { CatalogJsonLd, CollectionsPageView } from "@brand-ui";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await routeTranslator();
  return pageMetadata({
    path: "/collections",
    title: t("pages.collections.title"),
    description: t("pages.collections.description"),
  });
}

export default async function CollectionsPage() {
  const { locale, zoneCode, market } = await resolveRequestCatalogMarket();
  const collections = zoneCode
    ? await fetchCollections(zoneCode, market).catch(() => null)
    : null;
  const title = (await getTranslator(locale))("pages.collections.heading");
  return (
    <>
      <CatalogJsonLd data={await pageBreadcrumbJsonLd(locale, { name: title, path: "/collections" })} />
      <CollectionsPageView
        title={title}
        initial={collections ? { zoneCode, collections } : null}
      />
    </>
  );
}
