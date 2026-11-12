"use client";

import { useSearchParams } from "next/navigation";
import {
  parseCatalogListingParams,
  type CatalogListingQuery,
} from "../types/catalogFacets";

/**
 * Listing filters from the address (?page, ?sort, ?minPrice …), read in the
 * browser so the listing page itself can be prerendered (static/ISR).
 *
 * The server renders one page of the plain listing (`serverPage`, from the
 * route). Its products are reused only when the address asks for exactly that
 * page with no sort or price filter.
 */
export function useUrlListingQuery(serverPage: number): {
  listingQuery: CatalogListingQuery;
  useServerListing: boolean;
} {
  const listingQuery = parseCatalogListingParams(new URLSearchParams(useSearchParams()?.toString() ?? ""));
  const useServerListing =
    !listingQuery.minPrice && !listingQuery.sort && listingQuery.page === serverPage;
  return { listingQuery, useServerListing };
}
