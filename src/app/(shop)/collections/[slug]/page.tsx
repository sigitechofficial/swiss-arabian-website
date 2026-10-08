import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { CollectionDetailPageView } from "@/features/collections";
import { breadcrumbJsonLd, CatalogJsonLd } from "@/features/catalog/components/CatalogJsonLd";
import { parseCatalogListingParams } from "@/features/catalog/types/catalogFacets";
import { shopCopy } from "@/lib/i18n/shopCopy";
import { withLocalePrefix } from "@/lib/i18n/localePath";
import { canonicalCatalogPath, catalogMetadata, loadCatalogDocument } from "@/lib/seo/catalogPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { locale, collection } = await loadCatalogDocument("collection", slug);
  const handle = collection?.slug || slug;
  const title = collection?.seoTitle?.trim() || collection?.name || slug;
  const description = collection?.seoDescription?.trim() || collection?.description || undefined;
  return catalogMetadata({
    locale,
    path: canonicalCatalogPath(`/collections/${handle}`, locale),
    title,
    description: description || undefined,
  });
}

export default async function CollectionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const loaded = await loadCatalogDocument("collection", slug);
  const { locale, collection, listing } = loaded;
  if (collection?.slug && collection.slug !== slug) {
    permanentRedirect(withLocalePrefix(`/collections/${collection.slug}`, locale));
  }
  const listingQuery = parseCatalogListingParams(await searchParams);
  const handle = collection?.slug || slug;
  const path = canonicalCatalogPath(`/collections/${handle}`, locale);
  const name = collection?.name || slug;
  return (
    <>
      <CatalogJsonLd
        data={breadcrumbJsonLd([
          { name: shopCopy(locale, "home"), url: withLocalePrefix("/", locale) },
          { name, url: path },
        ])}
      />
      <CollectionDetailPageView
        slug={handle}
        listingQuery={listingQuery}
        collection={collection}
        initialListing={listingQuery.page === 1 && !listingQuery.minPrice && !listingQuery.sort ? listing : null}
      />
    </>
  );
}
