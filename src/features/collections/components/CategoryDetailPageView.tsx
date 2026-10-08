"use client";

import { ProductCatalogView } from "@/features/catalog/components/ProductCatalogView";
import type { CatalogCategory } from "@/features/catalog/api/catalog.service";
import { useCatalogPlp } from "@/features/catalog/hooks/useCatalogPlp";
import type { CatalogListingQuery } from "@/features/catalog/types/catalogFacets";

export function CategoryDetailPageView({
  slug,
  listingQuery,
  category,
}: {
  slug: string;
  listingQuery: CatalogListingQuery;
  category: CatalogCategory | null;
}) {

  const { products, facets, pagination, serverFiltered, loading, hasNextPage, isFetchingNextPage, fetchNextPage } = useCatalogPlp(
    { kind: "category", slug },
    listingQuery,
  );

  const banner = category
    ? {
        title: category.name,
        description: category.description,
        image: category.image,
        imageAlt: category.imageAlt,
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
