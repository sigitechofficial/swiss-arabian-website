"use client";

import { ProductCatalogView } from "@/features/catalog/components/ProductCatalogView";
import type {
  CatalogCategory,
  ProductListResult,
} from "@/features/catalog/api/catalog.service";
import { useCatalogPlp } from "@/features/catalog/hooks/useCatalogPlp";
import type { CatalogListingQuery } from "@/features/catalog/types/catalogFacets";
import { useMarketDocument } from "@/features/catalog/hooks/useMarketDocument";
import { catalogKeys, fetchCategoryBySlug } from "@/features/catalog/api/catalog.service";

export function CategoryDetailPageView({
  slug,
  listingQuery,
  category: serverCategory,
  initialListing,
  initialZoneCode,
}: {
  slug: string;
  listingQuery: CatalogListingQuery;
  category: CatalogCategory | null;
  /** Products the server already rendered (crawlable). */
  initialListing?: ProductListResult | null;
  initialZoneCode?: string | null;
}) {
  // Prerendered for the default market: another market shows its own banner and text.
  const { data: category } = useMarketDocument({
    server: serverCategory,
    serverZoneCode: initialZoneCode,
    queryKey: (zone) => catalogKeys.category(slug, zone),
    fetch: (market) => fetchCategoryBySlug(slug, market.zoneCode, market),
    fetchWhenMissing: false,
  });
  const { products, facets, pagination, serverFiltered, loading, hasNextPage, isFetchingNextPage, fetchNextPage, loadFailed, retry } = useCatalogPlp(
    { kind: "category", slug },
    listingQuery,
    initialListing,
    initialZoneCode,
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
      loadFailed={loadFailed}
      onRetry={retry}
    />
  );
}
