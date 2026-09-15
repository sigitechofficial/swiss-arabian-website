"use client";

import { useQuery } from "@tanstack/react-query";
import { ProductCatalogView } from "@/features/catalog/components/ProductCatalogView";
import { catalogKeys, fetchCategoryBySlug } from "@/features/catalog/api/catalog.service";
import { useCatalogPlp } from "@/features/catalog/hooks/useCatalogPlp";
import type { CatalogListingQuery } from "@/features/catalog/types/catalogFacets";
import { DEFAULT_ZONE_CODE } from "@/lib/storefront/context";
import { useMarket } from "@/providers/MarketProvider";

export function CategoryDetailPageView({
  slug,
  listingQuery,
}: {
  slug: string;
  listingQuery: CatalogListingQuery;
}) {
  const { marketId } = useMarket();
  const zoneCode = marketId || DEFAULT_ZONE_CODE;

  const { data: category } = useQuery({
    queryKey: catalogKeys.category(slug, zoneCode),
    queryFn: () => fetchCategoryBySlug(slug, zoneCode),
  });

  const { products, facets, pagination, serverFiltered, loading } = useCatalogPlp(
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
    />
  );
}
