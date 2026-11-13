"use client";

import { ProductCatalogView } from "./ProductCatalogView";
import { useCatalogPlp } from "../hooks/useCatalogPlp";
import type { CatalogListingQuery } from "../types/catalogFacets";
import type { ProductListResult } from "../api/catalog.service";

/** All fragrances — `GET /storefront/catalog/products` with listing facets. */
export function CatalogPageView({
  listingQuery,
  initialListing,
  initialZoneCode,
}: {
  listingQuery: CatalogListingQuery;
  /** Products the server already rendered (crawlable). */
  initialListing?: ProductListResult | null;
  initialZoneCode?: string | null;
}) {
  const { products, facets, pagination, serverFiltered, loading, hasNextPage, isFetchingNextPage, fetchNextPage, loadFailed, retry } = useCatalogPlp(
    { kind: "products" },
    listingQuery,
    initialListing,
    initialZoneCode,
  );

  return (
    <ProductCatalogView
      products={products}
      listingQuery={listingQuery}
      facets={facets}
      pagination={pagination}
      serverFiltered={serverFiltered}
      loading={loading}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={fetchNextPage}
      loadFailed={loadFailed}
      onRetry={retry}
    />
  );
}
