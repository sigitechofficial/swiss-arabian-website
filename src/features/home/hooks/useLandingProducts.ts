"use client";

import { STATIC_PRODUCTS } from "../constants/staticProducts";

/** The bundle panel still uses this hand-picked list. The best-sellers and
 *  trending strips load their collections and only fall back here when that
 *  collection has nothing to show. */
export function useLandingProducts(limit = 8) {
  return {
    data: { products: STATIC_PRODUCTS.slice(0, limit) },
    isLoading: false,
    isError: false,
  } as const;
}
