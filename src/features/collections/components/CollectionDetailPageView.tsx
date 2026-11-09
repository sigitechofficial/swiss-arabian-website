"use client";

import { useEffect } from "react";
import { rememberBrowsedCollection } from "@/features/merchandising/utils/browsedCollection";
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

  useEffect(() => {
    if (collection?.slug && collection.name) {
      rememberBrowsedCollection({ slug: collection.slug, name: collection.name });
    }
  }, [collection?.slug, collection?.name]);

  const metafieldImage = metafieldMediaUrl(
    collection?.customMetafields?.collection_banner,
  );
  const apiImage = collection?.image?.trim() ? collection.image : null;
  // The imported banner (per language, desktop + mobile) wins.
  const heroImage = apiImage ?? metafieldImage;

  const banner = collection
    ? {
        title: collection.name,
        description: collection.description,
        ...(heroImage
          ? {
              image: heroImage,
              imageAlt: collection.imageAlt,
              mobileImage: apiImage ? (collection.imageMobile ?? null) : null,
              // Store banners are wide artwork: shown full width, never cropped.
              wide: Boolean(apiImage),
            }
          : {}),
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
