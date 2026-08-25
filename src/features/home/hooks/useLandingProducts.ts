"use client";

import { STATIC_PRODUCTS } from "../constants/staticProducts";

/** Landing sections (products band, trending grid, bundle panel) render
 *  this fully static product list — no live catalog call, no live image
 *  URLs — so the "shape" still matches a query result (`{ data }`) even
 *  though nothing is actually fetched. Swap back to a real `useQuery`
 *  against the catalog API once live data + images are ready. */
export function useLandingProducts(limit = 8) {
  return {
    data: { products: STATIC_PRODUCTS.slice(0, limit) },
    isLoading: false,
    isError: false,
  } as const;
}
