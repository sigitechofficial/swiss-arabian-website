"use client";

import { useMemo } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { ApiClientError } from "@/lib/api/apiError";
import { useApiQuery } from "@/lib/api/queryHooks";
import { toCatalogProduct } from "@/features/catalog/utils/toCatalogProduct";
import type { CatalogProduct } from "@/features/catalog/constants/catalogProducts";
import { useCartStore } from "@/stores/useCartStore";
import { useUiStore } from "@/stores/useUiStore";
import { merchKeys } from "../api/merch.keys";
import { fetchMerchCollectionRail } from "../api/merch.service";
import { isRailCardShown } from "../utils/isRailCardShown";
import { merchCardToSummary } from "../utils/merchCardToSummary";

function retryUnless404(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiClientError && error.status === 404) return false;
  return failureCount < 1;
}

export function useMerchRail(
  slug: string,
  excludeProductIds: string[] = [],
): CatalogProduct[] {
  const zoneCode = useUiStore((s) => s.catalogContext?.zoneCode);
  const currencyCode = useUiStore((s) => s.catalogContext?.currencyCode);
  const lines = useCartStore((s) => s.lines);

  const query = useApiQuery(
    merchKeys.collection(slug, zoneCode, currencyCode),
    () => fetchMerchCollectionRail(slug),
    {
      enabled: Boolean(slug),
      staleTime: 60_000,
      placeholderData: keepPreviousData,
      retry: retryUnless404,
    },
  );

  return useMemo(() => {
    const excludeIds = new Set(excludeProductIds.filter(Boolean));
    const excludeSkus = new Set<string>();
    const inCartSlugs = new Set<string>();
    for (const line of lines) {
      if (line.productId) excludeIds.add(line.productId);
      if (line.variantId) excludeSkus.add(line.variantId);
      if (line.slug) {
        excludeSkus.add(line.slug);
        inCartSlugs.add(line.slug);
      }
    }

    const fallbackCurrency =
      query.data?.context.currencyCode?.trim() || currencyCode || "AED";

    return (query.data?.products ?? [])
      .filter((card) => isRailCardShown(card, excludeIds, excludeSkus))
      .map((card) => merchCardToSummary(card, fallbackCurrency))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .filter((item) => item.isSellable && !inCartSlugs.has(item.slug))
      .map((product) => toCatalogProduct(product));
  }, [currencyCode, excludeProductIds, lines, query.data]);
}
