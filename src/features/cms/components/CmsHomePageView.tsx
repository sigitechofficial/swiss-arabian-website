"use client";

import { useShopCopy } from "@/lib/i18n/useShopCopy";
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
  const t = useShopCopy();
  const home = usePublishedHome(initial);

  if (!cmsHomeEnabled()) {
    return <LegacyHomeFallback />;
  }

  if (home.status === "loading") {
    return (
      <div
        className="min-h-[40vh] animate-pulse bg-[var(--cream,#faf6ee)]"
        aria-busy="true"
        aria-label={t("cms.home.loading")}
      />
    );
  }

  if (home.status === "error") {
    if (legacyFallbackEnabled()) return <LegacyHomeFallback />;
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-[var(--ink,#241f1b)]">
          {t("cms.home.unavailable")}
        </h1>
        <p className="mt-2 text-[var(--ink-2,#5b5148)]">
          {t("cms.home.unavailableBody")}
        </p>
      </div>
    );
  }

  if (home.status === "empty") {
    if (legacyFallbackEnabled()) return <LegacyHomeFallback />;
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-[var(--ink,#241f1b)]">
          {t("checkout.pay.comingSoon")}
        </h1>
        <p className="mt-2 text-[var(--ink-2,#5b5148)]">
          {t("cms.home.empty")}
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
