"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProductCatalogView } from "@/features/catalog/components/ProductCatalogView";
import {
  catalogKeys,
  fetchCollectionBySlug,
  fetchCollectionProducts,
  fetchProducts,
} from "@/features/catalog/api/catalog.service";
import { toCatalogProducts } from "@/features/catalog/utils/toCatalogProduct";
import { DEFAULT_ZONE_CODE } from "@/lib/storefront/context";
import { useMarket } from "@/providers/MarketProvider";

/**
 * The filter rail needs the whole result set to compute its facet counts, so
 * the page pulls one large page instead of paginating. 100 is the API's cap;
 * every real collection today is well under it.
 */
const COLLECTION_LIMIT = 100;

/** Slugs the collections API doesn't carry — these read the full catalog. */
const CATALOG_FALLBACK_SLUGS = new Set(["minis", "bundles"]);

export function CollectionDetailPageView({ slug }: { slug: string }) {
  const { marketId } = useMarket();
  const zoneCode = marketId || DEFAULT_ZONE_CODE;
  const usingFallback = CATALOG_FALLBACK_SLUGS.has(slug);

  const { data: collection } = useQuery({
    queryKey: catalogKeys.collection(slug, zoneCode),
    queryFn: () => fetchCollectionBySlug(slug, zoneCode),
    enabled: !usingFallback,
  });

  const {
    data: feed,
    isPending: feedPending,
    isError: feedError,
  } = useQuery({
    queryKey: catalogKeys.collectionProducts(
      slug,
      zoneCode,
      1,
      COLLECTION_LIMIT,
    ),
    queryFn: () =>
      usingFallback
        ? fetchProducts(zoneCode, { page: 1, limit: COLLECTION_LIMIT })
        : fetchCollectionProducts(slug, zoneCode, {
            page: 1,
            limit: COLLECTION_LIMIT,
          }),
  });

  // Live products carry no facet attributes, so they're classified for the
  // filter rail on the way in. See `toCatalogProduct`. Never fall back to the
  // static catalog here: an empty (or failed) collection passes `[]`, which
  // renders the empty state under the collection's banner.
  const products = useMemo(
    () => (feed ? toCatalogProducts(feed.products ?? []) : feedError ? [] : undefined),
    [feed, feedError],
  );

  // Show the API's banner only when it actually has one — otherwise the
  // designed hero for this slug stays exactly as it is.
  const banner = collection?.image
    ? {
        image: collection.image,
        imageAlt: collection.imageAlt,
        description: collection.description,
      }
    : null;

  return (
    <ProductCatalogView
      slug={slug}
      products={products}
      banner={banner}
      loading={feedPending && !feedError}
    />
  );
}
