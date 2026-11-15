"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { publicPathname } from "@/lib/i18n/localeRouting";
import {
  catalogListingHref,
  type CatalogListingQuery,
} from "../types/catalogFacets";

/**
 * Listing filters live in the address (?houseCollection=…&sort=…). These
 * helpers write a new filter state there (without scrolling), which the
 * listing reads back through `useUrlListingQuery`. Shared by every brand's
 * listing view.
 */
export function useListingNavigation(
  listingQuery: CatalogListingQuery | undefined,
  /** Other address parameters the page keeps on every change (e.g. a brand's `under=99`). */
  keep?: Record<string, string>,
) {
  const router = useRouter();
  // Public address: a prerendered listing sees its internal `/en/...` path.
  const pathname = publicPathname(usePathname() || "/");
  const keepKey = keep ? new URLSearchParams(keep).toString() : "";

  /** Go to exactly this filter state. */
  const push = useCallback(
    (next: CatalogListingQuery) => {
      const href = catalogListingHref(pathname, next);
      const target = keepKey ? `${href}${href.includes("?") ? "&" : "?"}${keepKey}` : href;
      router.push(target, { scroll: false });
    },
    [keepKey, pathname, router],
  );

  /** Change some filters; the listing starts again at page 1. */
  const patch = useCallback(
    (changes: Partial<CatalogListingQuery>) => {
      if (!listingQuery) return;
      push({ ...listingQuery, ...changes, page: 1 });
    },
    [listingQuery, push],
  );

  /** Drop every filter (keeps the sort). */
  const clearFilters = useCallback(() => {
    if (!listingQuery) return;
    push({ page: 1, ...(listingQuery.sort ? { sort: listingQuery.sort } : {}) });
  }, [listingQuery, push]);

  return { pathname, push, patch, clearFilters };
}
