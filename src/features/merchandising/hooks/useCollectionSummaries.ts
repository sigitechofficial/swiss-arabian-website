"use client";

import { useApiQuery } from "@/lib/api/queryHooks";
import { useUiStore } from "@/stores/useUiStore";
import { merchKeys } from "../api/merch.keys";
import { fetchCollectionSummaries, type CollectionSummaryItem } from "../api/merch.service";

/**
 * The market's collections with summaries (count, from-price, up to 3 bottle
 * images): `GET /storefront/merchandising/collections?includeSummary=true`.
 * Waits for the shopper's catalog context.
 */
export function useCollectionSummaries({ enabled = true }: { enabled?: boolean } = {}): {
  collections: CollectionSummaryItem[] | undefined;
  isLoading: boolean;
} {
  const context = useUiStore((s) => s.catalogContext);
  const query = useApiQuery(
    merchKeys.collectionSummaries(context?.zoneCode, context?.currencyCode, context?.languageCode),
    () => fetchCollectionSummaries(),
    { enabled: enabled && Boolean(context?.zoneCode), staleTime: 5 * 60 * 1000, retry: 1 },
  );
  return { collections: query.data, isLoading: query.isLoading };
}
