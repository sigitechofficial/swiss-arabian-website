import { permanentRedirect } from "next/navigation";
import { CategoryDetailPageView } from "@/features/collections/components/CategoryDetailPageView";
import { breadcrumbJsonLd, CatalogJsonLd } from "@/features/catalog/components/CatalogJsonLd";
import { parseCatalogListingParams } from "@/features/catalog/types/catalogFacets";
import { shopCopy } from "@/lib/i18n/shopCopy";
import { withLocalePrefix } from "@/lib/i18n/localePath";
import { canonicalCatalogPath, catalogMetadata, loadCatalogDocument } from "@/lib/seo/catalogPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { locale, category } = await loadCatalogDocument("category", slug);
  const handle = category?.slug || slug;
  return catalogMetadata({
    locale,
    path: canonicalCatalogPath(`/categories/${handle}`, locale),
    title: category?.name || slug,
    description: category?.description || undefined,
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const { locale, category } = await loadCatalogDocument("category", slug);
  if (category?.slug && category.slug !== slug) {
    permanentRedirect(withLocalePrefix(`/categories/${category.slug}`, locale));
  }
  const listingQuery = parseCatalogListingParams(await searchParams);
  const handle = category?.slug || slug;
  const path = canonicalCatalogPath(`/categories/${handle}`, locale);
  const name = category?.name || slug;
  return (
    <>
      <CatalogJsonLd
        data={breadcrumbJsonLd([
          { name: shopCopy(locale, "home"), url: withLocalePrefix("/", locale) },
          { name, url: path },
        ])}
      />
      <CategoryDetailPageView slug={handle} listingQuery={listingQuery} category={category} />
    </>
  );
}
