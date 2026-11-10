import { notFound, permanentRedirect } from "next/navigation";
import { CategoryDetailPageView } from "@/features/collections/components/CategoryDetailPageView";
import {
  breadcrumbJsonLd,
  CatalogJsonLd,
} from "@/features/catalog/components/CatalogJsonLd";
import { parseCatalogListingParams } from "@/features/catalog/types/catalogFacets";
import { shopCopy } from "@/lib/i18n/shopCopy";
import { withLocalePrefix } from "@/lib/i18n/localePath";
import {
  canonicalCatalogPath,
  catalogMetadata,
  loadCatalogDocument,
  loadServerListing,
} from "@/lib/seo/catalogPage";
import { applySeoOverrides, loadPublishedPageSeo } from "@/lib/seo/pageSeo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { locale, category, missing } = await loadCatalogDocument(
    "category",
    slug,
  );
  if (missing) notFound();
  const handle = category?.slug || slug;
  // SEO Management (a page for this address) wins, then the category's own SEO fields.
  const { seo } = await loadPublishedPageSeo(`/categories/${handle}`);
  return applySeoOverrides(
    await catalogMetadata({
      locale,
      path: canonicalCatalogPath(`/categories/${handle}`, locale),
      title: seo?.title || category?.seoTitle?.trim() || category?.name || slug,
      description:
        seo?.description ||
        category?.seoDescription?.trim() ||
        category?.description ||
        undefined,
      image: seo?.ogImage || category?.image || null,
    }),
    seo,
  );
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const { locale, category, missing } = await loadCatalogDocument(
    "category",
    slug,
  );
  if (missing) notFound();
  if (category?.slug && category.slug !== slug) {
    permanentRedirect(withLocalePrefix(`/categories/${category.slug}`, locale));
  }
  const listingQuery = parseCatalogListingParams(await searchParams);
  const handle = category?.slug || slug;
  // Plain pages (no sort / price filter) are server-rendered so crawlers see the products.
  const serverRendered = !listingQuery.minPrice && !listingQuery.sort;
  const { listing, zoneCode } = serverRendered
    ? await loadServerListing("category", handle, listingQuery.page)
    : { listing: null, zoneCode: "" };
  const path = canonicalCatalogPath(`/categories/${handle}`, locale);
  const name = category?.name || slug;
  return (
    <>
      <CatalogJsonLd
        data={breadcrumbJsonLd([
          {
            name: shopCopy(locale, "home"),
            url: withLocalePrefix("/", locale),
          },
          { name, url: path },
        ])}
      />
      <CategoryDetailPageView
        slug={handle}
        listingQuery={listingQuery}
        category={category}
        initialListing={listing}
        initialZoneCode={zoneCode}
      />
    </>
  );
}
