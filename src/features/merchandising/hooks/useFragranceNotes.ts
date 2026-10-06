"use client";

import { ApiClientError } from "@/lib/api/apiError";
import { useApiQuery } from "@/lib/api/queryHooks";
import { useUiStore } from "@/stores/useUiStore";
import { merchKeys } from "../api/merch.keys";
import { fetchFragranceNotes } from "../api/merch.service";
import { visibleFragranceNoteTiles } from "../utils/visibleFragranceNoteTiles";

function retryUnlessClientError(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiClientError && error.status >= 400 && error.status < 500) {
    return false;
  }
  return failureCount < 1;
}

export function useFragranceNotes() {
  const zoneCode = useUiStore((s) => s.catalogContext?.zoneCode);
  const currencyCode = useUiStore((s) => s.catalogContext?.currencyCode);
  const languageCode = useUiStore((s) => s.catalogContext?.languageCode);
  const salesChannelCode = useUiStore((s) => s.catalogContext?.salesChannelCode);

  const query = useApiQuery(
    merchKeys.fragranceNotes(zoneCode, currencyCode, languageCode, salesChannelCode),
    fetchFragranceNotes,
    {
      staleTime: 45_000,
      gcTime: 60_000,
      retry: retryUnlessClientError,
    },
  );

  return {
    tiles: visibleFragranceNoteTiles(query.data),
    sectionTitle: query.data?.sectionTitle?.trim() || "Shop by Fragrance Notes",
    isReady: !query.isPending,
  };
}
