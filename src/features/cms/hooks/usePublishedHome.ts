"use client";

import { useQuery } from "@tanstack/react-query";
import { useSelectedCatalogMarket } from "@/features/markets/hooks/useSelectedCatalogMarket";
import { useMarket } from "@/providers/MarketProvider";
import { env } from "@/lib/config/env";
import { cmsContentKeys, fetchPublishedHome } from "../api/cmsContent.service";
import type { CmsHomeResult } from "../types/cmsHome.types";

/** Homepage the server already loaded, and which market and language it is for. */
export type CmsHomeInitial = {
  zoneCode: string;
  languageCode: string;
  data: CmsHomeResult;
};

export function cmsHomeEnabled(): boolean {
  // Default ON — set NEXT_PUBLIC_CMS_HOME_ENABLED=false to force legacy only.
  return env.cmsHomeEnabled !== false;
}

export type PublishedHomeState =
  /** Market or homepage still loading. */
  | { status: "loading" }
  /** Nothing to show and the request failed. */
  | { status: "error" }
  /** No published homepage (or no sections) for this market + language. */
  | { status: "empty" }
  | { status: "ready"; data: CmsHomeResult };

export function publishedHomeState(input: {
  shown: CmsHomeResult | undefined;
  known: boolean;
  isPending: boolean;
  isError: boolean;
}): PublishedHomeState {
  const { shown, known, isPending, isError } = input;
  if (!shown && (!known || isPending)) return { status: "loading" };
  if (!shown && isError) return { status: "error" };
  const hasSections = Boolean(shown?.page) && Array.isArray(shown?.sections) && shown!.sections.length > 0;
  return hasSections ? { status: "ready", data: shown! } : { status: "empty" };
}

/**
 * The published homepage for the selected market and its language. The server's
 * homepage (`initial`) is used only for the market + language it was loaded for,
 * or while the browser has not worked out the market yet.
 */
export function usePublishedHome(initial?: CmsHomeInitial | null): PublishedHomeState {
  // The Homepage is published under the market's own language code ("en-us"),
  // not the "en" in the address. Wait until the market's languages are known.
  const languageCode = useMarket().contentLanguage ?? "";
  const market = useSelectedCatalogMarket();
  const zoneCode = market?.zoneCode?.trim() || market?.countryCode?.trim() || "";
  const known = Boolean(zoneCode && languageCode);
  const enabled = cmsHomeEnabled() && known;
  const initialMatches =
    initial && known && initial.zoneCode === zoneCode && initial.languageCode === languageCode;

  const query = useQuery({
    queryKey: cmsContentKeys.home(zoneCode, languageCode),
    queryFn: () => fetchPublishedHome({ zoneCode, languageCode }),
    enabled,
    initialData: initialMatches ? initial.data : undefined,
    staleTime: 60_000,
    // Bound revalidation: refetch on window focus / reconnect for publish visibility.
    refetchOnWindowFocus: true,
  });

  return publishedHomeState({
    shown: query.data ?? (!known ? initial?.data : undefined),
    known,
    isPending: query.isPending,
    isError: query.isError,
  });
}
