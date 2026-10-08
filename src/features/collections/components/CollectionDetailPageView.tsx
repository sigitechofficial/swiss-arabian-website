"use client";

import { ProductCatalogView } from "@/features/catalog/components/ProductCatalogView";
import type { CatalogCollection, ProductListResult } from "@/features/catalog/api/catalog.service";
import { useCatalogPlp } from "@/features/catalog/hooks/useCatalogPlp";
import type { CatalogListingQuery } from "@/features/catalog/types/catalogFacets";
import { metafieldMediaUrl } from "@/features/catalog/utils/collectionMetafields";

/** Slugs the collections API doesn't carry — these read the full catalog. */
const CATALOG_FALLBACK_SLUGS = new Set(["minis", "bundles"]);

export function CollectionDetailPageView({
  slug,
  listingQuery,
  collection,
  initialListing,
}: {
  slug: string;
  listingQuery: CatalogListingQuery;
  collection: CatalogCollection | null;
  initialListing?: ProductListResult | null;
}) {
  const usingFallback = CATALOG_FALLBACK_SLUGS.has(slug);

  const { products, facets, pagination, serverFiltered, loading, hasNextPage, isFetchingNextPage, fetchNextPage   } = useCatalogPlp(
    {
      kind: "collection",
      slug,
      fallbackToProducts: usingFallback,
    },
    listingQuery,
    initialListing,
  );

  const metafieldImage = metafieldMediaUrl(
    collection?.customMetafields?.collection_banner,
  );
  const apiImage = collection?.image?.trim() ? collection.image : null;
  const heroImage = metafieldImage ?? apiImage;

  const banner = collection
    ? {
        title: collection.name,
        description: collection.description,
        ...(heroImage ? { image: heroImage, imageAlt: collection.imageAlt } : {}),
      }
    : null;

  return (
    <ProductCatalogView
      slug={slug}
      products={products}
      banner={banner}
      listingQuery={listingQuery}
      facets={facets}
      pagination={pagination}
      serverFiltered={serverFiltered}
      loading={loading}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={fetchNextPage}
    />
  );
}
