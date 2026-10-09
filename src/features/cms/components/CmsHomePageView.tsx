"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { localeFromPathname } from "@/lib/i18n/localePath";
import { useSelectedCatalogMarket } from "@/features/markets/hooks/useSelectedCatalogMarket";
import { env } from "@/lib/config/env";
import {
  cmsContentKeys,
  fetchPublishedHome,
} from "../api/cmsContent.service";
import { CmsSectionList } from "./CmsSectionList";
import { LegacyHomeFallback } from "./LegacyHomeFallback";

function cmsHomeEnabled(): boolean {
  // Default ON — set NEXT_PUBLIC_CMS_HOME_ENABLED=false to force legacy only.
  return env.cmsHomeEnabled !== false;
}

function legacyFallbackEnabled(): boolean {
  // When CMS returns empty, keep the previous Homepage until markets are published.
  return env.cmsHomeLegacyFallback !== false;
}

export function CmsHomePageView() {
  const pathname = usePathname() || "/";
  const languageCode = localeFromPathname(pathname);
  const market = useSelectedCatalogMarket();
  const zoneCode =
    market?.zoneCode?.trim() ||
    market?.countryCode?.trim() ||
    "";
  const enabled = cmsHomeEnabled() && Boolean(zoneCode);

  const query = useQuery({
    queryKey: cmsContentKeys.home(zoneCode, languageCode),
    queryFn: () =>
      fetchPublishedHome({
        zoneCode,
        languageCode,
      }),
    enabled,
    staleTime: 60_000,
    // Bound revalidation: refetch on window focus / reconnect for publish visibility.
    refetchOnWindowFocus: true,
  });

  if (!cmsHomeEnabled()) {
    return <LegacyHomeFallback />;
  }

  if (!zoneCode || query.isPending) {
    return (
      <div
        className="min-h-[40vh] animate-pulse bg-[var(--cream,#faf6ee)]"
        aria-busy="true"
        aria-label="Loading homepage"
      />
    );
  }

  if (query.isError) {
    if (legacyFallbackEnabled()) return <LegacyHomeFallback />;
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-[var(--ink,#241f1b)]">
          Homepage unavailable
        </h1>
        <p className="mt-2 text-[var(--ink-2,#5b5148)]">
          We could not load storefront content right now. Please try again
          shortly.
        </p>
      </div>
    );
  }

  const result = query.data;
  const hasCms =
    Boolean(result?.page) && Array.isArray(result?.sections) && result.sections.length > 0;

  if (!hasCms) {
    if (legacyFallbackEnabled()) return <LegacyHomeFallback />;
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-[var(--ink,#241f1b)]">
          Coming soon
        </h1>
        <p className="mt-2 text-[var(--ink-2,#5b5148)]">
          This market does not have a published Homepage yet.
        </p>
      </div>
    );
  }

  return (
    <div data-cms-home="published" data-zone={result?.page?.zoneCode} data-locale={result?.page?.locale}>
      <CmsSectionList sections={result!.sections} logUnknown />
    </div>
  );
}
