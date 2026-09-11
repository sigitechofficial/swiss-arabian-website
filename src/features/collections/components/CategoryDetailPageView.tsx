"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProductCatalogView } from "@/features/catalog/components/ProductCatalogView";
import {
  catalogKeys,
  fetchCategoryBySlug,
  fetchCategoryProducts,
} from "@/features/catalog/api/catalog.service";
import { toCatalogProducts } from "@/features/catalog/utils/toCatalogProduct";
import { DEFAULT_ZONE_CODE } from "@/lib/storefront/context";
import { useMarket } from "@/providers/MarketProvider";

/** Same single-page pull as collections — the filter rail needs every product. */
const CATEGORY_LIMIT = 100;

/**
 * Category listing — where navigation `CATEGORY` items (`/categories/:slug`)
 * land. Same catalog design as a collection page, fed by the category
 * endpoints for the shopper's selected country.
 */
export function CategoryDetailPageView({ slug }: { slug: string }) {
  const { marketId } = useMarket();
  const zoneCode = marketId || DEFAULT_ZONE_CODE;

  const { data: category } = useQuery({
    queryKey: catalogKeys.category(slug, zoneCode),
    queryFn: () => fetchCategoryBySlug(slug, zoneCode),
  });

  const {
    data: feed,
    isPending: feedPending,
    isError: feedError,
  } = useQuery({
    queryKey: catalogKeys.categoryProducts(slug, zoneCode, 1, CATEGORY_LIMIT),
    queryFn: () => fetchCategoryProducts(slug, zoneCode, { page: 1, limit: CATEGORY_LIMIT }),
  });

  // No static fallback: an empty (or failed) category shows the empty state.
  const products = useMemo(
    () => (feed ? toCatalogProducts(feed.products ?? []) : feedError ? [] : undefined),
    [feed, feedError],
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
      loading={feedPending && !feedError}
    />
  );
}
