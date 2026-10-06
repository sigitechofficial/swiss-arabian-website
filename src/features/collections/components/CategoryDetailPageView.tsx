"use client";

import { useQuery } from "@tanstack/react-query";
import { ProductCatalogView } from "@/features/catalog/components/ProductCatalogView";
import { catalogKeys, fetchCategoryBySlug } from "@/features/catalog/api/catalog.service";
import { useCatalogPlp } from "@/features/catalog/hooks/useCatalogPlp";
import type { CatalogListingQuery } from "@/features/catalog/types/catalogFacets";
import { useSelectedCatalogMarket } from "@/features/markets/hooks/useSelectedCatalogMarket";

export function CategoryDetailPageView({
  slug,
  listingQuery,
}: {
  slug: string;
  listingQuery: CatalogListingQuery;
}) {
  const market = useSelectedCatalogMarket();
  const zoneCode = market?.zoneCode ?? "";

  const { data: category } = useQuery({
    queryKey: [...catalogKeys.category(slug, zoneCode), market?.salesChannelCode ?? ""],
    queryFn: () => fetchCategoryBySlug(slug, zoneCode, market),
    enabled: Boolean(market),
  });

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
