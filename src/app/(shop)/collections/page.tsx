import type { Metadata } from "next";
import {
  CatalogJsonLd,
  pageBreadcrumbJsonLd,
} from "@/features/catalog/components/CatalogJsonLd";
import { CollectionsPageView } from "@/features/collections";
import { fetchCollections } from "@/features/catalog/api/catalog.service";
import { resolveServerCatalogMarket } from "@/lib/seo/catalogPage";
import { pageMetadata } from "@/lib/seo/pageSeo";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    path: "/collections",
    title: "All collections",
    titleAr: "جميع المجموعات",
    description: "Browse every Swiss Arabian collection: oud, musk, gift sets and more.",
    descriptionAr: "تصفح جميع مجموعات سويس أرابيان: العود والمسك وأطقم الهدايا والمزيد.",
  });
}

export default async function CollectionsPage() {
  const { locale, zoneCode, market } = await resolveServerCatalogMarket();
  const collections = zoneCode
    ? await fetchCollections(zoneCode, market).catch(() => null)
    : null;
  const title = locale === "ar" ? "المجموعات" : "Collections";
  return (
    <>
      <CatalogJsonLd data={pageBreadcrumbJsonLd(locale, { name: title, path: "/collections" })} />
      <CollectionsPageView
        title={title}
        initial={collections ? { zoneCode, collections } : null}
      />
    </>
  );
}
