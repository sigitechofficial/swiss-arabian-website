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

const MEDAL_FILLS = ["#c9a36a", "#d7d7d7", "#d4b15a", "#eceae6", "#f3f1ee"];

function MembershipTiers({ wallet }: { wallet: LoyaltyWalletView }) {
  const tier = wallet.tier;
  const steps = tier?.steps ?? [];
  if (!tier || steps.length === 0) return null;

  const currency = wallet.currencyCode ?? "AED";
  const currentIndex = steps.findIndex((step) => step.name === tier.current?.name);
  const nextIndex = tier.next ? steps.findIndex((step) => step.name === tier.next?.name) : -1;
  const remaining =
    tier.next && tier.remainingAmount != null
      ? `${formatMoney(tier.remainingAmount, currency)} away from ${tier.next.name}`
      : null;
  const count = steps.length;
  const center = (index: number) => ((index + 0.5) / count) * 100;
  const trackStart = center(0);
  const trackEnd = center(count - 1);
  const segmentEnd =
    currentIndex >= 0 && nextIndex > currentIndex ? nextIndex : currentIndex >= 0 ? currentIndex : count - 1;
  const progress = tier.next ? Math.min(100, Math.max(0, tier.progressPercent ?? 0)) / 100 : 1;
  const thumb =
    currentIndex >= 0 ? center(currentIndex) + (center(segmentEnd) - center(currentIndex)) * progress : trackEnd;
  const thumbLeft = `${thumb}%`;

  return (
    <section
      className="overflow-hidden rounded-lg border border-[#eadfce] bg-[#f6f0e6] px-4 py-5 sm:px-7 sm:py-6"
      aria-label="Rewards tiers"
    >
      {tier.qualificationWindowDays != null && tier.qualificationWindowDays > 0 ? (
        <p className="text-right text-[12px] text-[#8a7764]">
          Qualification period: {windowCopy(tier.qualificationWindowDays)}
        </p>
      ) : null}

      <div className="mt-2 overflow-x-auto pb-1">
        <div className="relative min-w-[560px] pt-12">
          {remaining ? (
            <p
              className="absolute top-0 z-30 whitespace-nowrap rounded-md bg-[#8d5a32] px-2.5 py-1 text-[11px] font-semibold text-white"
              style={{
                left: thumbLeft,
                transform: thumb < 22 ? "translateX(0)" : thumb > 78 ? "translateX(-100%)" : "translateX(-50%)",
              }}
            >
              {remaining}
            </p>
          ) : null}
          {remaining ? (
            <span
              aria-hidden
              className="absolute z-20 w-px -translate-x-1/2 border-l border-dotted border-[#8d5a32]"
              style={{ left: thumbLeft, top: 28, height: 40 }}
            />
          ) : null}
          <div
            className="absolute top-[75px] z-0 h-1 -translate-y-1/2 rounded-full bg-[#e7ddd2]"
            style={{ left: `${trackStart}%`, width: `${trackEnd - trackStart}%` }}
          />
          <div
            className="absolute top-[75px] z-0 h-1.5 -translate-y-1/2 rounded-full bg-[#8d5a32]"
            style={{ left: `${trackStart}%`, width: `${Math.max(0, thumb - trackStart)}%` }}
          />
          <span
            aria-hidden
            className="absolute top-[75px] z-20 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8d5a32] ring-4 ring-[#f3e6d4]"
            style={{ left: thumbLeft }}
          />
          <ol className="relative flex">
            {steps.map((step, index) => {
              const isCurrent = index === currentIndex;
              return (
                <li key={`${step.name}-${step.threshold}`} className="flex min-w-0 flex-1 flex-col items-center px-1">
                  <div
                    className={`relative z-10 grid size-14 place-items-center rounded-full ${isCurrent ? "ring-2 ring-[#8d5a32] ring-offset-2 ring-offset-[#f6f0e6]" : ""}`}
                    style={{ background: MEDAL_FILLS[index] ?? MEDAL_FILLS[MEDAL_FILLS.length - 1] }}
                  >
                    <img src="/assets/sa-logo-clear.png" alt="" className="size-7 object-contain" />
                  </div>
                  <p
                    className={`mt-3 text-[10px] font-bold tracking-[0.14em] ${isCurrent ? "text-[#8d5a32]" : "invisible"}`}
                    aria-hidden={!isCurrent}
                  >
                    CURRENT TIER
                  </p>
                  <p className="mt-1 text-center font-[family-name:var(--font-display)] text-[15px] text-[#3a2e24]">
                    {step.name}
                  </p>
                  <p className="mt-0.5 text-center text-[12px] text-[#8a7764] tabular-nums" dir="ltr">
                    {formatMoney(step.threshold, currency)}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {!tier.next ? (
        <p className="mt-4 text-[13px] leading-relaxed text-[#8a7764]">
          You&apos;ve reached the highest current Rewards tier.
        </p>
      ) : null}
      {tier.next ? (
        <div
          className="sr-only"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(tier.progressPercent ?? 0)}
          aria-label={`Progress toward ${tier.next.name}`}
        />
      ) : null}
      {tier.qualifyingSpend != null ? (
        <p className="mt-4 text-[13px] leading-relaxed text-[#8a7764]">
          Eligible spend so far:{" "}
          <span className="font-semibold text-[#3a2e24] tabular-nums" dir="ltr">
            {formatMoney(tier.qualifyingSpend, currency)}
          </span>
        </p>
      ) : null}
    </section>
  );
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
  const percent = tier.progressPercent ?? 0;

  return (
    <div className="mt-4 min-w-0">
      {remaining ? (
        <p className="break-words text-[15px] font-semibold leading-relaxed text-sa-primary">{remaining}</p>
      ) : (
        <p className="text-[14px] leading-relaxed text-sa-secondary">
          Keep shopping to reach {tier.next.name}.
        </p>
      )}
      <div className="mt-3">
        <p className="sr-only">{`${Math.round(percent)} percent of the way to ${tier.next.name}`}</p>
        <div
          className="h-2 overflow-hidden rounded-full bg-sa-border"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(percent)}
          aria-label={`Progress toward ${tier.next.name}`}
        >
          <div className="h-full bg-terra" style={{ width: `${percent}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 text-[12px] text-sa-secondary">
          <span>Eligible spend</span>
          <span>{tier.next.name}</span>
        </div>
      </div>
    </div>
  );
}

export { MembershipTiers };

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
    <section className="mt-5 min-w-0 rounded-lg border border-sa-border bg-section-soft px-4 py-4 sm:px-5" aria-labelledby="rewards-tier-heading">
      <div className="flex items-start justify-between gap-4">
        {showCurrent ? (
          <div className="min-w-0">
            <h3
              id="rewards-tier-heading"
              className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted"
            >
              Current tier
            </h3>
            <p className="mt-1 break-words text-[22px] font-semibold leading-tight text-sa-primary">{tier.current?.name}</p>
          </div>
        ) : (
          <h3 id="rewards-tier-heading" className="sr-only">
            Rewards tier
          </h3>
        )}
        {tier.next ? (
          <div className="min-w-0 text-right">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">Next tier</p>
            <p className="mt-1 break-words text-[16px] font-semibold text-sa-primary">{tier.next.name}</p>
          </div>
        ) : null}
      </div>
      <TierProgress tier={tier} currency={currency} />
      {tier.qualifyingSpend != null ? (
        <p className="mt-4 break-words text-[13px] leading-relaxed text-sa-secondary">
          Eligible spend so far:{" "}
          <span className="font-semibold text-sa-primary tabular-nums" dir="ltr">
            {formatMoney(tier.qualifyingSpend, currency)}
          </span>
        </p>
      ) : null}
      {tier.qualificationWindowDays != null && tier.qualificationWindowDays > 0 ? (
        <p className="mt-1 break-words text-[13px] leading-relaxed text-sa-secondary">
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
