"use client";

import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { DEFAULT_ZONE_CODE } from "@/lib/storefront/context";
import { useMarket } from "@/providers/MarketProvider";
import {
  catalogListingQueryKey,
  fetchCatalogListing,
  type CatalogListingSource,
} from "../api/fetchCatalogListing";
import { toCatalogProducts } from "../utils/toCatalogProduct";
import type { CatalogListingQuery } from "../types/catalogFacets";

export function useCatalogPlp(
  source: CatalogListingSource,
  listingQuery: CatalogListingQuery,
) {
  const { marketId } = useMarket();
  const zoneCode = marketId || DEFAULT_ZONE_CODE;
  const filters = listingQuery;

  const query = useQuery({
    queryKey: catalogListingQueryKey(source, zoneCode, filters),
    queryFn: () => fetchCatalogListing(source, zoneCode, filters),
    placeholderData: keepPreviousData,
  });

  const serverFiltered = Boolean(query.data?.facets);
  const products = useMemo(
    () =>
      query.data
        ? toCatalogProducts(query.data.products, {
            guessFacets: !serverFiltered,
          })
        : query.isError
          ? []
          : undefined,
    [query.data, query.isError, serverFiltered],
  );

  return {
    products,
    facets: query.data?.facets ?? null,
    pagination: query.data?.pagination ?? null,
    serverFiltered,
    loading: query.isPending && !query.isError && !query.data,
    isFetching: query.isFetching,
  };
}
