"use client";

import { useCallback, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useSelectedCatalogMarket } from "@/features/markets/hooks/useSelectedCatalogMarket";
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
  const market = useSelectedCatalogMarket();
  const zoneCode = market?.zoneCode ?? "";
  const filterKey = { ...listingQuery, page: 1 };

  const query = useInfiniteQuery({
    queryKey: [
      ...catalogListingQueryKey(source, zoneCode, filterKey),
      market?.salesChannelCode ?? "",
    ],
    queryFn: ({ pageParam }) =>
      fetchCatalogListing(
        source,
        zoneCode,
        {
          ...listingQuery,
          page: pageParam,
        },
        market,
      ),
    enabled: Boolean(market),
    placeholderData: (previous, previousQuery) => {
      const key = previousQuery?.queryKey ?? [];
      const channel = market?.salesChannelCode ?? "";
      if (!zoneCode || !channel) return undefined;
      if (!key.includes(zoneCode) || !key.includes(channel)) return undefined;
      return previous;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage.facets) return undefined;
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
  });

  const firstPage = query.data?.pages[0];
  const lastPage = query.data?.pages.at(-1);
  const serverFiltered = Boolean(firstPage?.facets);

  const products = useMemo(() => {
    const pages = query.data?.pages;
    if (!pages?.length) {
      return query.isError ? [] : undefined;
    }
    const seen = new Set<string>();
    const merged = pages.flatMap((page) => page.products).filter((product) => {
      if (seen.has(product.id)) return false;
      seen.add(product.id);
      return true;
    });
    return toCatalogProducts(merged, { guessFacets: !serverFiltered });
  }, [query.data?.pages, query.isError, serverFiltered]);

  const fetchNextPage = useCallback(() => {
    void query.fetchNextPage();
  }, [query.fetchNextPage]);

  return {
    products,
    facets: firstPage?.facets ?? null,
    pagination: lastPage?.pagination ?? firstPage?.pagination ?? null,
    serverFiltered,
    loading: !market || (query.isPending && !query.isError && !query.data),
    isFetching: query.isFetching,
    hasNextPage: Boolean(query.hasNextPage),
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage,
  };
}
