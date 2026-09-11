"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DEFAULT_ZONE_CODE } from "@/lib/storefront/context";
import { useMarket } from "@/providers/MarketProvider";
import { catalogKeys, fetchProducts } from "../api/catalog.service";
import { toCatalogProducts } from "../utils/toCatalogProduct";
import { ProductCatalogView } from "./ProductCatalogView";

/**
 * The filter rail computes its facet counts from the whole result set, so this
 * pulls one large page (100 is the API's cap) rather than paginating.
 */
const ALL_PRODUCTS_LIMIT = 100;

/** All fragrances — the live `/storefront/catalog/products` feed. */
export function CatalogPageView() {
  const { marketId } = useMarket();
  const zoneCode = marketId || DEFAULT_ZONE_CODE;

  const { data, isPending, isError } = useQuery({
    queryKey: catalogKeys.list(zoneCode, 1, ALL_PRODUCTS_LIMIT),
    queryFn: () => fetchProducts(zoneCode, { page: 1, limit: ALL_PRODUCTS_LIMIT }),
  });

  // No static fallback: an empty or failed feed shows the empty state.
  const products = useMemo(
    () => (data ? toCatalogProducts(data.products) : isError ? [] : undefined),
    [data, isError],
  );

  return <ProductCatalogView products={products} loading={isPending && !isError} />;
}
