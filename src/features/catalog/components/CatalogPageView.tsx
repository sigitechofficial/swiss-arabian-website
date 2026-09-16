"use client";

import { ProductCatalogView } from "./ProductCatalogView";
import { useCatalogPlp } from "../hooks/useCatalogPlp";
import type { CatalogListingQuery } from "../types/catalogFacets";

/** All fragrances — `GET /storefront/catalog/products` with listing facets. */
export function CatalogPageView({
  listingQuery,
}: {
  listingQuery: CatalogListingQuery;
}) {
  const { products, facets, pagination, serverFiltered, loading, hasNextPage, isFetchingNextPage, fetchNextPage } = useCatalogPlp(
    { kind: "products" },
    listingQuery,
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
    />
  );
}
