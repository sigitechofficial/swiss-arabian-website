import {
  CATALOG_PAGE_SIZE,
  catalogKeys,
  fetchCategoryProducts,
  fetchCollectionProducts,
  fetchProducts,
  type ProductListResult,
} from "../api/catalog.service";
import type { CatalogListingFilters } from "../types/catalogFacets";

const LEGACY_LISTING_LIMIT = 100;

/** Session cache: unknown facet params 400 on today's API. */
let listingHasFacets: boolean | null = null;

export type CatalogListingSource =
  | { kind: "products" }
  | { kind: "collection"; slug: string; fallbackToProducts?: boolean }
  | { kind: "category"; slug: string };

function requestListing(
  source: CatalogListingSource,
  zoneCode: string | null | undefined,
  options: CatalogListingFilters,
): Promise<ProductListResult> {
  if (source.kind === "products" || (source.kind === "collection" && source.fallbackToProducts)) {
    return fetchProducts(zoneCode, options);
  }
  if (source.kind === "collection") {
    return fetchCollectionProducts(source.slug, zoneCode, options);
  }
  return fetchCategoryProducts(source.slug, zoneCode, options);
}

function hasServerFacetParams(filters: CatalogListingFilters): boolean {
  return Boolean(
    filters.minPrice ||
      filters.maxPrice ||
      filters.concentration ||
      filters.houseCollection ||
      filters.featuredNote,
  );
}

/**
 * Prefer server facets + `limit=24`. Until `data.facets` exists, pull the
 * legacy cap page and do not send the new facet query params (they 400).
 */
export async function fetchCatalogListing(
  source: CatalogListingSource,
  zoneCode: string | null | undefined,
  filters: CatalogListingFilters,
): Promise<ProductListResult> {
  const page = Math.max(1, filters.page ?? 1);
  const sort = filters.sort;

  if (listingHasFacets === false) {
    return requestListing(source, zoneCode, {
      page: 1,
      limit: LEGACY_LISTING_LIMIT,
    });
  }

  if (listingHasFacets === true) {
    return requestListing(source, zoneCode, {
      ...filters,
      page,
      limit: CATALOG_PAGE_SIZE,
    });
  }

  const pageQuery: CatalogListingFilters = {
    page,
    limit: CATALOG_PAGE_SIZE,
    ...(sort ? { sort } : {}),
  };

  try {
    const probed = await requestListing(source, zoneCode, pageQuery);
    listingHasFacets = Boolean(probed.facets);

    if (!probed.facets) {
      return requestListing(source, zoneCode, {
        page: 1,
        limit: LEGACY_LISTING_LIMIT,
      });
    }

    if (hasServerFacetParams(filters)) {
      return requestListing(source, zoneCode, {
        ...filters,
        page,
        limit: CATALOG_PAGE_SIZE,
      });
    }

    return probed;
  } catch {
    listingHasFacets = false;
    return requestListing(source, zoneCode, {
      page: 1,
      limit: LEGACY_LISTING_LIMIT,
    });
  }
}

export function catalogListingQueryKey(
  source: CatalogListingSource,
  zoneCode: string | null | undefined,
  filters: CatalogListingFilters,
) {
  const slug = source.kind === "products" ? null : source.slug;
  const kind =
    source.kind === "collection" && source.fallbackToProducts
      ? "products"
      : source.kind;
  return catalogKeys.listing(kind, slug, zoneCode, {
    ...filters,
    page: filters.page ?? 1,
    limit: CATALOG_PAGE_SIZE,
  });
}
