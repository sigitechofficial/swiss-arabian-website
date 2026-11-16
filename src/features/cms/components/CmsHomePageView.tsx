"use client";

import { env } from "@/lib/config/env";
import { CmsSectionList } from "./CmsSectionList";
import { LegacyHomeFallback } from "./LegacyHomeFallback";
import {
  cmsHomeEnabled,
  usePublishedHome,
  type CmsHomeInitial,
} from "../hooks/usePublishedHome";

export type { CmsHomeInitial };

function legacyFallbackEnabled(): boolean {
  // When CMS returns empty, keep the previous Homepage until markets are published.
  return env.cmsHomeLegacyFallback !== false;
}

export function CmsHomePageView({ initial }: { initial?: CmsHomeInitial | null } = {}) {
  const home = usePublishedHome(initial);

  if (!cmsHomeEnabled()) {
    return <LegacyHomeFallback />;
  }

  if (home.status === "loading") {
    return (
      <div
        className="min-h-[40vh] animate-pulse bg-[var(--cream,#faf6ee)]"
        aria-busy="true"
        aria-label="Loading homepage"
      />
    );
  }

  if (home.status === "error") {
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

  if (home.status === "empty") {
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

  const result = home.data;
  return (
    <div data-cms-home="published" data-zone={result.page?.zoneCode} data-locale={result.page?.locale}>
      <CmsSectionList sections={result.sections} logUnknown />
    </div>
  );
}
