"use client";

import { useApiQuery } from "@/lib/api/queryHooks";
import { useUiStore } from "@/stores/useUiStore";
import { merchKeys } from "../api/merch.keys";
import { fetchShopableVideo } from "../api/merch.service";
import { playableShopableSlides } from "../utils/playableShopableSlides";

export function useShopableVideo() {
  const zoneCode = useUiStore((s) => s.catalogContext?.zoneCode);
  const currencyCode = useUiStore((s) => s.catalogContext?.currencyCode);
  const languageCode = useUiStore((s) => s.catalogContext?.languageCode);
  const salesChannelCode = useUiStore((s) => s.catalogContext?.salesChannelCode);

  const query = useApiQuery(merchKeys.shopableVideo(zoneCode, currencyCode, languageCode, salesChannelCode), fetchShopableVideo, {
    // The API answers 422 without a market: wait until it is known.
    enabled: Boolean(zoneCode && salesChannelCode),
    staleTime: 45_000,
    gcTime: 60_000,
  });

  const slides = playableShopableSlides(query.data);
  return {
    slides,
    sectionTitle: query.data?.sectionTitle?.trim() || "Watch & Shop!",
    isReady: !query.isPending,
  };
}
