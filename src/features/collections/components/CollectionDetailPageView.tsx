"use client";

import { useQuery } from "@tanstack/react-query";
import { ProductCatalogView } from "@/features/catalog/components/ProductCatalogView";
import { catalogKeys, fetchCollectionBySlug } from "@/features/catalog/api/catalog.service";
import { useCatalogPlp } from "@/features/catalog/hooks/useCatalogPlp";
import type { CatalogListingQuery } from "@/features/catalog/types/catalogFacets";
import { metafieldMediaUrl } from "@/features/catalog/utils/collectionMetafields";
import { DEFAULT_ZONE_CODE } from "@/lib/storefront/context";
import { useMarket } from "@/providers/MarketProvider";

/** Slugs the collections API doesn't carry — these read the full catalog. */
const CATALOG_FALLBACK_SLUGS = new Set(["minis", "bundles"]);

export function CollectionDetailPageView({
  slug,
  listingQuery,
}: {
  slug: string;
  listingQuery: CatalogListingQuery;
}) {
  const { marketId } = useMarket();
  const zoneCode = marketId || DEFAULT_ZONE_CODE;
  const usingFallback = CATALOG_FALLBACK_SLUGS.has(slug);

  const { data: collection } = useQuery({
    queryKey: catalogKeys.collection(slug, zoneCode),
    queryFn: () => fetchCollectionBySlug(slug, zoneCode),
    enabled: !usingFallback,
  });

  const { products, facets, pagination, serverFiltered, loading } = useCatalogPlp(
    {
      kind: "collection",
      slug,
      fallbackToProducts: usingFallback,
    },
    listingQuery,
  );

  const metafieldImage = metafieldMediaUrl(
    collection?.customMetafields?.collection_banner,
  );
  const apiImage = collection?.image?.trim() ? collection.image : null;
  const heroImage = metafieldImage ?? apiImage;

  const banner = heroImage
    ? {
        image: heroImage,
        imageAlt: collection?.imageAlt,
        description: collection?.description,
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
    />
  );
}
