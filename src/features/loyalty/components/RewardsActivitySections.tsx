"use client";

import { useState } from "react";
import { knownText } from "@/lib/i18n/formErrors";
import type { Translator } from "@/lib/i18n/messages";
import { intlLocale } from "@/lib/i18n/locales";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import {
  fetchLoyaltyTransactions,
  type LoyaltyMarketQuery,
} from "../api/loyalty.service";
import { LOYALTY_ACTIVITY_PAGE_SIZE } from "../api/loyalty.keys";
import {
  coerceLoyaltyActivityPage,
  formatPoints,
  type LoyaltyActivityPageView,
  type LoyaltyTransactionView,
} from "../types/loyalty";
import {
  externalActivityLabel,
  formatExternalActivityPoints,
  type ExternalLoyaltyActivityView,
} from "../types/omnichannel";
import { useOmnichannelCopy } from "./useOmnichannelCopy";

function activityDate(value: string | null, locale = "en"): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : intlLocale(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function pointsLabel(points: number, t: Translator): string {
  const formatted = formatPoints(Math.abs(points));
  if (points > 0) return t("loyalty.points", { points: `+${formatted}` });
  if (points < 0) return t("loyalty.points", { points: `−${formatted}` });
  return t("loyalty.points", { points: formatted });
}

function OnlineActivity({
  rows,
  pending,
  error,
  hasMore,
  loadingMore,
  onRetry,
  onLoadMore,
}: {
  rows: LoyaltyTransactionView[];
  pending: boolean;
  error: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  onRetry: () => void;
  onLoadMore: () => void;
}) {
  const omni = useOmnichannelCopy();
  const t = useShopCopy();
  const locale = useShopLocale();
  return (
    <section aria-labelledby="online-activity-heading">
      <h2
        id="online-activity-heading"
        className="text-[16px] font-semibold text-sa-primary sm:text-[18px]"
      >
        {omni.onlineActivity}
      </h2>
      {pending ? (
        <p className="mt-4 text-[13px] text-sa-secondary" role="status">
          {t("loyalty.activityLoading")}
        </p>
      ) : error ? (
        <div className="mt-4 rounded-lg border border-sa-border bg-section-soft px-5 py-8">
          <p className="text-[14px] text-sa-primary">
            {t("loyalty.loadFailed")}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 text-[12.5px] font-semibold text-terra hover:underline"
          >
            {t("tryAgain")}
          </button>
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-[13px] leading-relaxed text-sa-secondary">
          {omni.onlineEmpty}
        </p>
      ) : (
        <>
          <ul className="mt-4 divide-y divide-sa-border rounded-lg border border-sa-border">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex items-start justify-between gap-3 px-4 py-4 sm:gap-4"
              >
                <div className="min-w-0">
                  <p className="break-words text-[13px] font-medium text-sa-primary">
                    {knownText(t, "loyalty.text.", row.label)}
                  </p>
                  {row.detail ? (
                    <p className="mt-0.5 text-[12px] text-sa-muted">
                      {row.detail}
                    </p>
                  ) : null}
                  {row.state ? (
                    <p className="mt-0.5 text-[12px] text-sa-secondary">
                      {knownText(t, "loyalty.text.", row.state)}
                    </p>
                  ) : null}
                  {activityDate(row.occurredAt, locale) ? (
                    <p className="mt-1 text-[12px] text-sa-muted">
                      {activityDate(row.occurredAt, locale)}
                    </p>
                  ) : null}
                </div>
                {row.points != null ? (
                  <p className="shrink-0 break-words text-end text-[13px] font-semibold text-sa-primary tabular-nums">
                    {pointsLabel(row.points, t)}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
          {hasMore ? (
            <button
              type="button"
              onClick={onLoadMore}
              disabled={loadingMore}
              className="mt-4 text-[12.5px] font-semibold text-terra hover:underline disabled:opacity-60"
            >
              {omni.loadMoreOnline}
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}

function StoreActivity({
  rows,
  pending,
  error,
  hasMore,
  loadingMore,
  stale,
  onRetry,
  onLoadMore,
}: {
  rows: ExternalLoyaltyActivityView[];
  pending: boolean;
  error: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  stale: boolean;
  onRetry: () => void;
  onLoadMore: () => void;
}) {
  const omni = useOmnichannelCopy();
  const t = useShopCopy();
  const locale = useShopLocale();
  return (
    <section aria-labelledby="store-activity-heading">
      <h2
        id="store-activity-heading"
        className="text-[16px] font-semibold text-sa-primary sm:text-[18px]"
      >
        {omni.activityHeading}
      </h2>
      {stale && !pending && !error ? (
        <p className="mt-2 text-[13px] text-sa-secondary" role="status">
          {omni.activityStale}
        </p>
      ) : null}
      {pending ? (
        <p className="mt-4 text-[13px] text-sa-secondary" role="status">
          {omni.activityLoading}
        </p>
      ) : error ? (
        <div className="mt-4 rounded-lg border border-sa-border bg-section-soft px-5 py-8">
          <p className="text-[14px] text-sa-primary">
            {omni.activityError}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 text-[12.5px] font-semibold text-terra hover:underline"
          >
            {t("tryAgain")}
          </button>
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-[13px] leading-relaxed text-sa-secondary">
          {omni.activityEmpty}
        </p>
      ) : (
        <>
          <ul className="mt-4 divide-y divide-sa-border rounded-lg border border-sa-border">
            {rows.map((row, index) => {
              const originLabel = row.origin === "STORE" ? t("loyalty.store") : null;
              const receipt = row.receiptId ? t("loyalty.receipt", { id: row.receiptId }) : null;
              const expires = activityDate(row.expirationDate, locale);
              return (
                <li
                  key={`${row.entryDate ?? "row"}-${row.receiptId ?? index}-${row.points}`}
                  className="flex items-start justify-between gap-3 px-4 py-4 sm:gap-4"
                >
                  <div className="min-w-0">
                    <p className="break-words text-[13px] font-medium text-sa-primary">
                      {knownText(t, "loyalty.text.", externalActivityLabel(row))}
                    </p>
                    {originLabel ? (
                      <p className="mt-0.5 text-[12px] text-sa-muted">
                        {originLabel}
                      </p>
                    ) : null}
                    {receipt ? (
                      <p className="mt-0.5 text-[12px] text-sa-muted">
                        {receipt}
                      </p>
                    ) : null}
                    {expires ? (
                      <p className="mt-0.5 text-[12px] text-sa-secondary">
                        {t("loyalty.expires", { date: expires })}
                      </p>
                    ) : null}
                    {activityDate(row.entryDate, locale) ? (
                      <p className="mt-1 text-[12px] text-sa-muted">
                        {activityDate(row.entryDate, locale)}
                      </p>
                    ) : null}
                  </div>
                  <p className="shrink-0 break-words text-end text-[13px] font-semibold text-sa-primary tabular-nums">
                    {t("loyalty.points", { points: formatExternalActivityPoints(row).replace(/ points$/, "") })}
                  </p>
                </li>
              );
            })}
          </ul>
          {hasMore ? (
            <button
              type="button"
              onClick={onLoadMore}
              disabled={loadingMore}
              className="mt-4 text-[12.5px] font-semibold text-terra hover:underline disabled:opacity-60"
            >
              {omni.loadMore}
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}

export function RewardsActivitySections({
  page,
  market,
  pending,
  error,
  showStore,
  onRetry,
}: {
  page: LoyaltyActivityPageView | undefined;
  market: LoyaltyMarketQuery | null;
  pending: boolean;
  error: boolean;
  showStore: boolean;
  onRetry: () => void;
}) {
  const firstPage = coerceLoyaltyActivityPage(page);
  const [extraPlatform, setExtraPlatform] = useState<LoyaltyTransactionView[]>(
    [],
  );
  const [extraExternal, setExtraExternal] = useState<
    ExternalLoyaltyActivityView[]
  >([]);
  const [platformHasMore, setPlatformHasMore] = useState(
    firstPage.pageInfo.hasMore,
  );
  const [externalHasMore, setExternalHasMore] = useState(
    firstPage.externalPageInfo.hasMore,
  );
  const [loadingMorePlatform, setLoadingMorePlatform] = useState(false);
  const [loadingMoreExternal, setLoadingMoreExternal] = useState(false);

  const platformRows = [...firstPage.platformActivity, ...extraPlatform];
  const externalRows = [...firstPage.externalActivity, ...extraExternal];
  const stale = firstPage.activityIsFresh === false;

  async function loadMorePlatform() {
    if (!market || loadingMorePlatform || !platformHasMore) return;
    setLoadingMorePlatform(true);
    try {
      const next = await fetchLoyaltyTransactions(market, {
        limit: LOYALTY_ACTIVITY_PAGE_SIZE,
        offset: platformRows.length,
      });
      setExtraPlatform((current) => [...current, ...next.platformActivity]);
      setPlatformHasMore(next.pageInfo.hasMore);
    } finally {
      setLoadingMorePlatform(false);
    }
  }

  async function loadMoreExternal() {
    if (!market || loadingMoreExternal || !externalHasMore) return;
    setLoadingMoreExternal(true);
    try {
      const next = await fetchLoyaltyTransactions(market, {
        limit: LOYALTY_ACTIVITY_PAGE_SIZE,
        offset: externalRows.length,
      });
      setExtraExternal((current) => [...current, ...next.externalActivity]);
      setExternalHasMore(next.externalPageInfo.hasMore);
    } finally {
      setLoadingMoreExternal(false);
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <OnlineActivity
        rows={platformRows}
        pending={pending && platformRows.length === 0}
        error={error}
        hasMore={platformHasMore}
        loadingMore={loadingMorePlatform}
        onRetry={onRetry}
        onLoadMore={() => void loadMorePlatform()}
      />
      {showStore ? (
        <StoreActivity
          rows={error ? [] : externalRows}
          pending={pending}
          error={false}
          hasMore={!error && externalHasMore}
          loadingMore={loadingMoreExternal}
          stale={!error && stale}
          onRetry={onRetry}
          onLoadMore={() => void loadMoreExternal()}
        />
      ) : null}
    </div>
  );
}
