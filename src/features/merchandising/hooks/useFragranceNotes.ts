"use client";

import { useApiQuery } from "@/lib/api/queryHooks";
import { useUiStore } from "@/stores/useUiStore";
import { merchKeys } from "../api/merch.keys";
import { fetchFragranceNotes } from "../api/merch.service";
import { visibleFragranceNoteTiles } from "../utils/visibleFragranceNoteTiles";

export function useFragranceNotes() {
  const zoneCode = useUiStore((s) => s.catalogContext?.zoneCode);
  const currencyCode = useUiStore((s) => s.catalogContext?.currencyCode);
  const languageCode = useUiStore((s) => s.catalogContext?.languageCode);
  const salesChannelCode = useUiStore((s) => s.catalogContext?.salesChannelCode);

  const query = useApiQuery(
    merchKeys.fragranceNotes(zoneCode, currencyCode, languageCode, salesChannelCode),
    fetchFragranceNotes,
    {
      // The API answers 422 without a market: wait until it is known.
      enabled: Boolean(zoneCode && salesChannelCode),
      staleTime: 45_000,
      gcTime: 60_000,
    },
  );

  return {
    tiles: visibleFragranceNoteTiles(query.data),
    sectionTitle: query.data?.sectionTitle?.trim() || "Shop by Fragrance Notes",
    isReady: !query.isPending,
  };
}
