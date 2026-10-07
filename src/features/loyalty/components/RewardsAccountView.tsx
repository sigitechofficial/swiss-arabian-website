"use client";

import { PageLoading } from "@/components/ui/PageLoading";
import { accountContainer } from "@/features/account/constants/accountLayout";
import { AccountBreadcrumb } from "@/features/account/components/AccountBreadcrumb";
import { AccountPageShell } from "@/features/account/components/AccountPageShell";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { useLoyaltyAccount } from "../hooks/useLoyaltyAccount";
import {
  formatPoints,
  isEmptyRewardsWallet,
  type LoyaltyTransactionView,
  type LoyaltyWalletView,
} from "../types/loyalty";

function activityDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function pointsLabel(points: number): string {
  const formatted = formatPoints(Math.abs(points));
  if (points > 0) return `+${formatted} points`;
  if (points < 0) return `−${formatted} points`;
  return `${formatted} points`;
}

function RewardsSummary({ wallet }: { wallet: LoyaltyWalletView }) {
  const currency = wallet.currencyCode ?? "AED";
  if (isEmptyRewardsWallet(wallet)) {
    return (
      <section aria-labelledby="rewards-balance-heading">
        <p className="font-sans text-[40px] font-medium leading-none tracking-[-0.03em] text-sa-primary tabular-nums sm:text-[48px]">
          0
        </p>
        <h2
          id="rewards-balance-heading"
          className="mt-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-sa-muted"
        >
          Available points
        </h2>
        <p className="mt-4 max-w-[420px] text-[13px] leading-relaxed text-sa-secondary">
          Start earning rewards with eligible purchases.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="rewards-balance-heading">
      <p className="font-sans text-[40px] font-medium leading-none tracking-[-0.03em] text-sa-primary tabular-nums sm:text-[48px]">
        {formatPoints(wallet.availablePoints)}
      </p>
      <h2
        id="rewards-balance-heading"
        className="mt-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-sa-muted"
      >
        Available points
      </h2>
      {wallet.availableValue != null ? (
        <p className="mt-3 text-[14px] text-sa-primary">
          Worth <span dir="ltr">{formatMoney(wallet.availableValue, currency)}</span>
        </p>
      ) : null}
      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-sa-border px-4 py-3">
          <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">Pending</dt>
          <dd className="mt-1 text-[14px] font-semibold text-sa-primary tabular-nums">
            {formatPoints(wallet.pendingPoints)} points
          </dd>
        </div>
        <div className="rounded-lg border border-sa-border px-4 py-3">
          <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">Reserved</dt>
          <dd className="mt-1 text-[14px] font-semibold text-sa-primary tabular-nums">
            {formatPoints(wallet.reservedPoints)} points
          </dd>
        </div>
      </dl>
      {wallet.debtLabel ? (
        <p className="mt-4 max-w-[420px] text-[13px] leading-relaxed text-sa-secondary">{wallet.debtLabel}</p>
      ) : null}
    </section>
  );
}

function RewardActivity({
  rows,
  pending,
  error,
  onRetry,
}: {
  rows: LoyaltyTransactionView[];
  pending: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  return (
    <section aria-labelledby="reward-activity-heading">
      <h2 id="reward-activity-heading" className="text-[16px] font-semibold text-sa-primary sm:text-[18px]">
        Reward activity
      </h2>
      {pending ? (
        <p className="mt-4 text-[13px] text-sa-secondary" role="status">
          Loading reward activity…
        </p>
      ) : error ? (
        <div className="mt-4 rounded-lg border border-sa-border bg-section-soft px-5 py-8">
          <p className="text-[14px] text-sa-primary">We couldn&apos;t load your rewards right now.</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 text-[12.5px] font-semibold text-terra hover:underline"
          >
            Try again
          </button>
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-[13px] leading-relaxed text-sa-secondary">No reward activity yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-sa-border rounded-lg border border-sa-border">
          {rows.map((row) => (
            <li key={row.id} className="flex items-start justify-between gap-4 px-4 py-4">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-sa-primary">{row.label}</p>
                {row.detail ? <p className="mt-0.5 text-[12px] text-sa-muted">{row.detail}</p> : null}
                {/* The lifecycle word is spelled out, never a colour or icon. */}
                {row.state ? (
                  <p className="mt-0.5 text-[12px] text-sa-secondary">{row.state}</p>
                ) : null}
                {activityDate(row.occurredAt) ? (
                  <p className="mt-1 text-[12px] text-sa-muted">{activityDate(row.occurredAt)}</p>
                ) : null}
              </div>
              {row.points != null ? (
                <p className="shrink-0 text-[13px] font-semibold text-sa-primary tabular-nums">
                  {pointsLabel(row.points)}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Signed-in rewards account for the current Market wallet. */
export function RewardsAccountView() {
  const { wallet, transactions, bootstrapped, isAuthenticated, zoneCode } = useLoyaltyAccount();

  let body;
  if (!bootstrapped || !isAuthenticated) {
    body = <PageLoading label={!bootstrapped ? "Checking session…" : "Redirecting…"} />;
  } else if (!zoneCode || wallet.isPending) {
    body = <PageLoading label="Loading your rewards…" />;
  } else if (wallet.isError || !wallet.data) {
    body = (
      <div className="rounded-lg border border-sa-border bg-section-soft px-6 py-10">
        <p className="text-[14px] text-sa-primary">We couldn&apos;t load your rewards right now.</p>
        <button
          type="button"
          onClick={() => void wallet.refetch()}
          className="mt-4 text-[12.5px] font-semibold text-terra hover:underline"
        >
          Try again
        </button>
      </div>
    );
  } else if (wallet.data.availability === "DISABLED") {
    body = (
      <div className="rounded-lg border border-sa-border bg-section-soft px-6 py-10">
        <p className="max-w-[520px] text-[14px] leading-relaxed text-sa-primary">
          {wallet.data.unavailableMessage}
        </p>
      </div>
    );
  } else {
    body = (
      <div className="flex flex-col gap-10">
        <div className="rounded-lg border border-sa-border bg-page px-5 py-6 sm:px-7 sm:py-7">
          <RewardsSummary wallet={wallet.data} />
        </div>
        <RewardActivity
          rows={transactions.data ?? []}
          pending={transactions.isPending}
          error={transactions.isError}
          onRetry={() => void transactions.refetch()}
        />
      </div>
    );
  }

  return (
    <AccountPageShell>
      <AccountBreadcrumb label="Rewards" />
      <div className={`${accountContainer} pb-2 pt-7 sm:pt-8`}>
        <h1 className="text-[22px] font-bold leading-tight text-sa-primary sm:text-[26px] lg:text-[30px]">
          My rewards
        </h1>
      </div>
      <div className={`${accountContainer} pb-16 pt-4`}>{body}</div>
    </AccountPageShell>
  );
}
