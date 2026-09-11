"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  CATALOG_PAGE_SIZE,
  catalogKeys,
  fetchCatalogSearch,
  fetchProducts,
  type CatalogSearchSort,
} from "@/features/catalog/api/catalog.service";
import type { ProductSummary } from "@/features/catalog/types/product";
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
};

export type CatalogSearchState = {
  products: ProductSummary[];
  total: number;
  totalPages: number;
  /** Query is below the minimum length — nothing was requested. */
  tooShort: boolean;
  /** Results shown are the browse preview, not matches for a query. */
  isPreview: boolean;
  isLoading: boolean;
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

  const debounced = useDebounce(rawQuery.trim(), SEARCH_DEBOUNCE_MS);
  const query = debounced.trim();
  const tooShort = query.length < SEARCH_MIN_QUERY_LENGTH;
  const isPreview = tooShort && previewWhenEmpty;

  const search = useQuery({
    queryKey: catalogKeys.search(query, zoneCode, page, limit, sort),
    queryFn: () =>
      fetchCatalogSearch(zoneCode, { q: query, page, limit, sort }),
    enabled: !tooShort,
    placeholderData: keepPreviousData,
  });

  // Browse preview for the empty input — products list, never blank search.
  const preview = useQuery({
    queryKey: catalogKeys.list(zoneCode, 1, limit),
    queryFn: () => fetchProducts(zoneCode, { page: 1, limit }),
    enabled: isPreview,
    staleTime: 5 * 60 * 1000,
  });

  const active = isPreview ? preview : search;
  const result = active.data;

  return {
    products: result?.products ?? [],
    total: result?.pagination.total ?? 0,
    totalPages: result?.pagination.totalPages ?? 1,
    tooShort: tooShort && !previewWhenEmpty,
    isPreview,
    isLoading: active.isLoading && (isPreview || !tooShort),
    isError: active.isError,
    refetch: () => void active.refetch(),
  };
}

export { CATALOG_PAGE_SIZE };
