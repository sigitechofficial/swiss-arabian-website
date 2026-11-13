"use client";

import { useMarketCurrency } from "@/features/markets/hooks/useMarketCurrency";
import { PageLoading } from "@/components/ui/PageLoading";
import { accountContainer } from "@/features/account/constants/accountLayout";
import { AccountBreadcrumb } from "@/features/account/components/AccountBreadcrumb";
import { AccountPageShell } from "@/features/account/components/AccountPageShell";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { useLoyaltyAccount } from "../hooks/useLoyaltyAccount";
import { useOmnichannelRefresh } from "../hooks/useOmnichannelRefresh";
import {
  DEFAULT_DEBT_COPY,
  formatPoints,
  hasHistoricalRewards,
  hasRewardsFigures,
  isEmptyRewardsWallet,
  type LoyaltyWalletView,
} from "../types/loyalty";
import { useOmnichannelCopy } from "./useOmnichannelCopy";
import { knownText } from "@/lib/i18n/formErrors";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { OmnichannelRewardsCard } from "./OmnichannelRewardsCard";
import { RewardsActivitySections } from "./RewardsActivitySections";
import {
  MembershipTiers,
  RewardsTierHistory,
  RewardsTierSection,
} from "./RewardsTierSection";

function RewardsSummary({ wallet }: { wallet: LoyaltyWalletView }) {
  const marketCurrency = useMarketCurrency();
  const omni = useOmnichannelCopy();
  const t = useShopCopy();
  const currency = wallet.currencyCode ?? marketCurrency;
  if (isEmptyRewardsWallet(wallet) && !wallet.tier?.current) {
    return (
      <section aria-labelledby="rewards-balance-heading">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">
          {omni.onlineEyebrow}
        </p>
        <p className="mt-3 font-sans text-[40px] font-medium leading-none tracking-[-0.03em] text-sa-primary tabular-nums sm:text-[48px]">
          0
        </p>
        <h2
          id="rewards-balance-heading"
          className="mt-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-sa-muted"
        >
          {t("loyalty.availablePoints")}
        </h2>
        <p className="mt-4 max-w-[420px] text-[13px] leading-relaxed text-sa-secondary">
          {t("loyalty.startEarning")}
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="rewards-balance-heading">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">
        {omni.onlineEyebrow}
      </p>
      <p className="mt-3 font-sans text-[40px] font-medium leading-none tracking-[-0.03em] text-sa-primary tabular-nums sm:text-[48px]">
        {formatPoints(wallet.availablePoints)}
      </p>
      <h2
        id="rewards-balance-heading"
        className="mt-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-sa-muted"
      >
        {t("loyalty.availablePoints")}
      </h2>
      {wallet.availableValue != null ? (
        <p className="mt-3 text-[14px] text-sa-primary">
          {t("loyalty.worth")}{" "}
          <span dir="ltr">{formatMoney(wallet.availableValue, currency)}</span>
        </p>
      ) : null}
      {wallet.tier?.steps.length ? null : (
        <RewardsTierSection wallet={wallet} />
      )}
      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="min-w-0 rounded-lg border border-sa-border px-4 py-3">
          <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">
            {t("loyalty.pending")}
          </dt>
          <dd className="mt-1 break-words text-[14px] font-semibold text-sa-primary tabular-nums">
            {t("loyalty.points", { points: formatPoints(wallet.pendingPoints) })}
          </dd>
        </div>
        <div className="min-w-0 rounded-lg border border-sa-border px-4 py-3">
          <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">
            {t("loyalty.reserved")}
          </dt>
          <dd className="mt-1 break-words text-[14px] font-semibold text-sa-primary tabular-nums">
            {t("loyalty.points", { points: formatPoints(wallet.reservedPoints) })}
          </dd>
        </div>
      </dl>
      {wallet.debtPoints > 0 ? (
        <div className="mt-4 min-w-0 rounded-lg border border-sa-border px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-sa-muted">
            {t("loyalty.adjustment")}
          </p>
          <p className="mt-1 break-words text-[14px] font-semibold text-sa-primary tabular-nums">
            {t("loyalty.points", { points: formatPoints(wallet.debtPoints) })}
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-sa-secondary">
            {knownText(t, "loyalty.text.", wallet.debtLabel ?? DEFAULT_DEBT_COPY)}
          </p>
        </div>
      ) : null}
    </section>
  );
}

/** Signed-in rewards account for the current Market wallet. */
export function RewardsAccountView() {
  const {
    wallet,
    transactions,
    activity,
    market,
    tierHistory,
    bootstrapped,
    isAuthenticated,
    zoneCode,
  } = useLoyaltyAccount();
  const t = useShopCopy();

  const omnichannel = wallet.data?.omnichannel ?? null;
  const refresh = useOmnichannelRefresh({
    omnichannel,
    market,
    activityLoaded: omnichannel != null && !transactions.isError,
    lastTransactionImportSuccessAt: activity.lastTransactionImportSuccessAt,
    refetchWallet: async () => (await wallet.refetch()).data,
    refetchTransactions: async () => (await transactions.refetch()).data,
  });
  const refreshControl = {
    visible: refresh.visible,
    busy: refresh.busy,
    disabled: refresh.disabled,
    message: refresh.message,
    onRefresh: () => void refresh.refresh(),
  };
  const activityBlock = (
    <RewardsActivitySections
      key={zoneCode ?? ""}
      page={activity}
      market={market}
      pending={transactions.isLoading}
      error={transactions.isError}
      showStore={
        !transactions.isError &&
        (omnichannel != null || activity.externalActivity.length > 0)
      }
      onRetry={() => void transactions.refetch()}
    />
  );

  let body;
  if (!bootstrapped || !isAuthenticated) {
    body = (
      <PageLoading
        label={!bootstrapped ? t("loadingLabel.session") : t("loadingLabel.redirecting")}
      />
    );
  } else if (!zoneCode || wallet.isPending) {
    body = <PageLoading label={t("loyalty.loading")} />;
  } else if (wallet.isError || !wallet.data) {
    body = (
      <div className="rounded-lg border border-sa-border bg-section-soft px-6 py-10">
        <p className="text-[14px] text-sa-primary">
          {t("loyalty.loadFailed")}
        </p>
        <button
          type="button"
          onClick={() => void wallet.refetch()}
          className="mt-4 text-[12.5px] font-semibold text-terra hover:underline"
        >
          {t("tryAgain")}
        </button>
      </div>
    );
  } else if (wallet.data.availability === "DISABLED") {
    const historyVisible =
      hasHistoricalRewards(wallet.data) ||
      hasRewardsFigures(wallet.data) ||
      activity.platformActivity.length > 0 ||
      activity.externalActivity.length > 0 ||
      transactions.isPending ||
      omnichannel != null;
    body = historyVisible ? (
      <div className="flex flex-col gap-10">
        {wallet.data.hasServerWallet ? (
          <div className="flex flex-col gap-6">
            <MembershipTiers wallet={wallet.data} />
            <div className="rounded-lg border border-sa-border bg-page px-5 py-6 sm:px-7 sm:py-7">
              <RewardsSummary wallet={wallet.data} />
              {wallet.data.unavailableMessage ? (
                <p className="mt-5 max-w-[520px] text-[13px] leading-relaxed text-sa-secondary">
                  {knownText(t, "loyalty.text.", wallet.data.unavailableMessage)}
                </p>
              ) : null}
            </div>
          </div>
        ) : wallet.data.unavailableMessage ? (
          <p className="max-w-[520px] text-[13px] leading-relaxed text-sa-secondary">
            {knownText(t, "loyalty.text.", wallet.data.unavailableMessage)}
          </p>
        ) : null}
        <OmnichannelRewardsCard
          omnichannel={omnichannel}
          refresh={refreshControl}
        />
        {activityBlock}
        <RewardsTierHistory
          rows={tierHistory.data ?? []}
          pending={tierHistory.isPending}
          error={tierHistory.isError}
          onRetry={() => void tierHistory.refetch()}
        />
      </div>
    ) : (
      <div className="flex flex-col gap-10">
        <div className="rounded-lg border border-sa-border bg-section-soft px-6 py-10">
          <p className="max-w-[520px] text-[14px] leading-relaxed text-sa-primary">
            {knownText(t, "loyalty.text.", wallet.data.unavailableMessage)}
          </p>
        </div>
        <OmnichannelRewardsCard
          omnichannel={omnichannel}
          refresh={refreshControl}
        />
      </div>
    );
  } else {
    body = (
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-6">
          <MembershipTiers wallet={wallet.data} />
          <div className="rounded-lg border border-sa-border bg-page px-5 py-6 sm:px-7 sm:py-7">
            <RewardsSummary wallet={wallet.data} />
          </div>
        </div>
        <OmnichannelRewardsCard
          omnichannel={omnichannel}
          refresh={refreshControl}
        />
        {activityBlock}
        <RewardsTierHistory
          rows={tierHistory.data ?? []}
          pending={tierHistory.isPending}
          error={tierHistory.isError}
          onRetry={() => void tierHistory.refetch()}
        />
      </div>
    );
  }

  return (
    <AccountPageShell>
      <AccountBreadcrumb label={t("account.tab.rewards")} />
      <div className={`${accountContainer} pb-2 pt-7 sm:pt-8`}>
        <h1 className="text-[22px] font-bold leading-tight text-sa-primary sm:text-[26px] lg:text-[30px]">
          {t("pages.title.rewards")}
        </h1>
      </div>
      <div className={`${accountContainer} pb-16 pt-4`}>{body}</div>
    </AccountPageShell>
  );
}
