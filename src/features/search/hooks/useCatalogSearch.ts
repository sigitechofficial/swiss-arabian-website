"use client";

import { useCallback, useMemo } from "react";
import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  CATALOG_PAGE_SIZE,
  catalogKeys,
  fetchCatalogSearch,
  fetchProducts,
  type CatalogSearchSort,
  type ProductListResult,
} from "@/features/catalog/api/catalog.service";
import { DEFAULT_ZONE_CODE } from "@/lib/storefront/context";
import { useDebounce } from "@/hooks/useDebounce";
import { useMarket } from "@/providers/MarketProvider";
import { SEARCH_DEBOUNCE_MS, SEARCH_MIN_QUERY_LENGTH, SEARCH_PAGE_SIZE } from "../constants";

type UseCatalogSearchOptions = {
  limit?: number;
  page?: number;
  sort?: CatalogSearchSort;
  /**
   * What to show before the shopper has typed enough. The guide forbids
   * calling search with a blank `q` (it dumps the whole catalog), so the
   * preview comes from the products list instead.
   */
  previewWhenEmpty?: boolean;
  /** Skip debounce — use for `/search?q=` where the query is already committed. */
  immediate?: boolean;
  /** Append pages on scroll instead of replacing them. */
  infinite?: boolean;
};

export type CatalogSearchState = {
  products: ProductListResult["products"];
  total: number;
  totalPages: number;
  /** Query is below the minimum length — nothing was requested. */
  tooShort: boolean;
  /** Results shown are the browse preview, not matches for a query. */
  isPreview: boolean;
  isLoading: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  isError: boolean;
  refetch: () => void;
};

/**
 * Shared search data source for the header dropdown, the overlay and the
 * `/search` page, so all three debounce and gate identically.
 */
export function useCatalogSearch(
  rawQuery: string,
  options: UseCatalogSearchOptions = {},
): CatalogSearchState {
  const { marketId } = useMarket();
  const zoneCode = marketId || DEFAULT_ZONE_CODE;
  const limit = options.limit ?? SEARCH_PAGE_SIZE;
  const page = options.page ?? 1;
  const sort = options.sort ?? "newest";
  const previewWhenEmpty = options.previewWhenEmpty ?? false;
  const immediate = options.immediate ?? false;
  const infinite = options.infinite ?? false;

  const debounced = useDebounce(rawQuery.trim(), SEARCH_DEBOUNCE_MS);
  const query = (immediate ? rawQuery : debounced).trim();
  const tooShort = query.length < SEARCH_MIN_QUERY_LENGTH;
  const isPreview = tooShort && previewWhenEmpty;

  const search = useQuery({
    queryKey: catalogKeys.search(query, zoneCode, page, limit, sort),
    queryFn: () =>
      fetchCatalogSearch(zoneCode, { q: query, page, limit, sort }),
    enabled: !tooShort && !infinite,
    placeholderData: keepPreviousData,
  });

  const infiniteSearch = useInfiniteQuery({
    queryKey: [...catalogKeys.search(query, zoneCode, 1, limit, sort), "infinite"],
    queryFn: ({ pageParam }) =>
      fetchCatalogSearch(zoneCode, { q: query, page: pageParam, limit, sort }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page: current, totalPages } = lastPage.pagination;
      return current < totalPages ? current + 1 : undefined;
    },
    enabled: !tooShort && infinite,
    placeholderData: keepPreviousData,
  });

  const preview = useQuery({
    queryKey: catalogKeys.list(zoneCode, 1, limit),
    queryFn: () => fetchProducts(zoneCode, { page: 1, limit }),
    enabled: isPreview,
    staleTime: 5 * 60 * 1000,
  });

  const products = useMemo(() => {
    if (isPreview) return preview.data?.products ?? [];
    if (infinite) {
      const seen = new Set<string>();
      return (infiniteSearch.data?.pages ?? [])
        .flatMap((item) => item.products)
        .filter((product) => {
          if (seen.has(product.id)) return false;
          seen.add(product.id);
          return true;
        });
    }
    return search.data?.products ?? [];
  }, [infinite, infiniteSearch.data?.pages, isPreview, preview.data?.products, search.data?.products]);

  const pagination = isPreview
    ? preview.data?.pagination
    : infinite
      ? infiniteSearch.data?.pages[0]?.pagination
      : search.data?.pagination;

  const fetchNextPage = useCallback(() => {
    void infiniteSearch.fetchNextPage();
  }, [infiniteSearch.fetchNextPage]);

  const activePending = isPreview ? preview : infinite ? infiniteSearch : search;

  return {
    products,
    total: pagination?.total ?? 0,
    totalPages: pagination?.totalPages ?? 1,
    tooShort: tooShort && !previewWhenEmpty,
    isPreview,
    isLoading: activePending.isLoading && (isPreview || !tooShort),
    isFetching: activePending.isFetching,
    isFetchingNextPage: infiniteSearch.isFetchingNextPage,
    hasNextPage: Boolean(infinite && infiniteSearch.hasNextPage),
    fetchNextPage,
    isError: activePending.isError,
    refetch: () => void activePending.refetch(),
  };
}

export { CATALOG_PAGE_SIZE };
