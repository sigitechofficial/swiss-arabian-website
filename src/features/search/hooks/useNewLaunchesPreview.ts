"use client";

import { useMemo } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { ApiClientError } from "@/lib/api/apiError";
import { useApiQuery } from "@/lib/api/queryHooks";
import type { ProductSummary } from "@/features/catalog/types/product";
import { merchKeys } from "@/features/merchandising/api/merch.keys";
import { fetchMerchCollectionRail } from "@/features/merchandising/api/merch.service";
import { merchCardToSummary } from "@/features/merchandising/utils/merchCardToSummary";
import { useUiStore } from "@/stores/useUiStore";
import { SEARCH_NEW_IN_LIMIT, SEARCH_NEW_IN_SLUG } from "../constants";

function retryUnless404(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiClientError && error.status === 404) return false;
  return failureCount < 1;
}

/** Idle search rail — merchandised new launches, not a blank catalog dump. */
export function useNewLaunchesPreview(enabled = true, limit = SEARCH_NEW_IN_LIMIT): ProductSummary[] {
  const zoneCode = useUiStore((s) => s.catalogContext?.zoneCode);
  const currencyCode = useUiStore((s) => s.catalogContext?.currencyCode);

  const query = useApiQuery(
    merchKeys.collection(SEARCH_NEW_IN_SLUG, zoneCode, currencyCode),
    () => fetchMerchCollectionRail(SEARCH_NEW_IN_SLUG),
    {
      enabled,
      staleTime: 60_000,
      placeholderData: keepPreviousData,
      retry: retryUnless404,
    },
  );

  return useMemo(() => {
    const fallbackCurrency =
      query.data?.context.currencyCode?.trim() || currencyCode || "AED";
    return (query.data?.products ?? [])
      .map((card) => merchCardToSummary(card, fallbackCurrency))
      .filter((item): item is ProductSummary => Boolean(item?.slug))
      .slice(0, limit);
  }, [currencyCode, limit, query.data]);
}
