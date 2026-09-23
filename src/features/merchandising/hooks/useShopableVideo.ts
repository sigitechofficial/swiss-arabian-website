"use client";

import { ApiClientError } from "@/lib/api/apiError";
import { useApiQuery } from "@/lib/api/queryHooks";
import { useUiStore } from "@/stores/useUiStore";
import { merchKeys } from "../api/merch.keys";
import { fetchShopableVideo } from "../api/merch.service";
import { playableShopableSlides } from "../utils/playableShopableSlides";

function retryUnlessClientError(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiClientError && error.status >= 400 && error.status < 500) {
    return false;
  }
  return failureCount < 1;
}

export function useShopableVideo() {
  const zoneCode = useUiStore((s) => s.catalogContext?.zoneCode);
  const currencyCode = useUiStore((s) => s.catalogContext?.currencyCode);
  const languageCode = useUiStore((s) => s.catalogContext?.languageCode);
  const salesChannelCode = useUiStore((s) => s.catalogContext?.salesChannelCode);

  const query = useApiQuery(merchKeys.shopableVideo(zoneCode, currencyCode, languageCode, salesChannelCode), fetchShopableVideo, {
    staleTime: 45_000,
    gcTime: 60_000,
    retry: retryUnlessClientError,
  });

  const slides = playableShopableSlides(query.data);
  return {
    slides,
    sectionTitle: query.data?.sectionTitle?.trim() || "Watch & Shop!",
    isReady: !query.isPending,
  };
}
