"use client";

import { formatMoney } from "@/features/home/utils/formatMoney";
import {
  hasLoyaltyTier,
  type LoyaltyTierHistoryView,
  type LoyaltyTierView,
  type LoyaltyWalletView,
} from "../types/loyalty";

function windowCopy(days: number): string {
  return days === 1 ? "Last 1 day" : `Last ${days} days`;
}

function historyDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function TierProgress({
  tier,
  currency,
}: {
  tier: LoyaltyTierView;
  currency: string;
}) {
  if (!tier.next) {
    return (
      <p className="mt-4 max-w-[420px] text-[13px] leading-relaxed text-sa-secondary">
        You&apos;ve reached the highest current Rewards tier.
      </p>
    );
  }

  const remaining =
    tier.remainingAmount != null
      ? `${formatMoney(tier.remainingAmount, currency)} away from ${tier.next.name}`
      : null;
  const percent = tier.progressPercent;

  return (
    <div className="mt-4 min-w-0">
      {remaining ? (
        <p className="break-words text-[14px] leading-relaxed text-sa-primary">{remaining}</p>
      ) : null}
      {percent != null ? (
        <div className="mt-3">
          <p className="sr-only">{`${Math.round(percent)} percent of the way to ${tier.next.name}`}</p>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-sa-border"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(percent)}
            aria-label={`Progress toward ${tier.next.name}`}
          >
            <div className="h-full bg-terra" style={{ width: `${percent}%` }} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Server L5 tier snapshot. Remaining spend is never derived here. */
export function RewardsTierSection({
  wallet,
  hideCurrentName = false,
}: {
  wallet: LoyaltyWalletView;
  hideCurrentName?: boolean;
}) {
  if (!hasLoyaltyTier(wallet) || !wallet.tier) return null;
  const tier = wallet.tier;
  const currency = wallet.currencyCode ?? "AED";
  const showCurrent = Boolean(tier.current) && !hideCurrentName;

  return (
    <section className="mt-6 min-w-0" aria-labelledby="rewards-tier-heading">
      {showCurrent ? (
        <div className="min-w-0">
          <p className="break-words text-[20px] font-semibold text-sa-primary">{tier.current?.name}</p>
          <h3
            id="rewards-tier-heading"
            className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted"
          >
            Current tier
          </h3>
        </div>
      ) : (
        <h3 id="rewards-tier-heading" className="sr-only">
          Rewards tier
        </h3>
      )}
      {tier.qualifyingSpend != null ? (
        <div className="mt-4 min-w-0">
          <p className="break-words text-[16px] font-semibold text-sa-primary tabular-nums" dir="ltr">
            {formatMoney(tier.qualifyingSpend, currency)}
          </p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">
            Qualifying spend
          </p>
        </div>
      ) : null}
      <TierProgress tier={tier} currency={currency} />
      {tier.qualificationWindowDays != null && tier.qualificationWindowDays > 0 ? (
        <p className="mt-3 break-words text-[13px] leading-relaxed text-sa-secondary">
          Qualification period: {windowCopy(tier.qualificationWindowDays)}
        </p>
      ) : null}
    </section>
  );
}

export function RewardsTierHistory({
  rows,
  pending = false,
  error = false,
  onRetry,
}: {
  rows: LoyaltyTierHistoryView[];
  pending?: boolean;
  error?: boolean;
  onRetry?: () => void;
}) {
  if (pending) {
    return (
      <section aria-labelledby="tier-history-heading">
        <h2 id="tier-history-heading" className="text-[16px] font-semibold text-sa-primary sm:text-[18px]">
          Tier history
        </h2>
        <p className="mt-4 text-[13px] text-sa-secondary" role="status">
          Loading tier history…
        </p>
      </section>
    );
  }
  if (error) {
    return (
      <section aria-labelledby="tier-history-heading">
        <h2 id="tier-history-heading" className="text-[16px] font-semibold text-sa-primary sm:text-[18px]">
          Tier history
        </h2>
        <div className="mt-4 rounded-lg border border-sa-border bg-section-soft px-5 py-8">
          <p className="text-[14px] text-sa-primary">We couldn&apos;t load your rewards right now.</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 text-[12.5px] font-semibold text-terra hover:underline"
            >
              Try again
            </button>
          ) : null}
        </div>
      </section>
    );
  }
  if (rows.length === 0) return null;
  return (
    <section aria-labelledby="tier-history-heading">
      <h2 id="tier-history-heading" className="text-[16px] font-semibold text-sa-primary sm:text-[18px]">
        Tier history
      </h2>
      <ul className="mt-4 divide-y divide-sa-border rounded-lg border border-sa-border">
        {rows.map((row) => (
          <li key={row.id} className="min-w-0 px-4 py-4">
            {row.tierName ? (
              <p className="break-words text-[13px] font-medium text-sa-primary">{row.tierName}</p>
            ) : null}
            <p className="mt-0.5 break-words text-[12px] text-sa-secondary">{row.label}</p>
            {historyDate(row.occurredAt) ? (
              <p className="mt-1 text-[12px] text-sa-muted">{historyDate(row.occurredAt)}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
