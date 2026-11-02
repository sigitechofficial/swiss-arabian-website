"use client";

import { useMemo, useState } from "react";

import { PageLoading } from "@/components/ui/PageLoading";
import { useApiQuery } from "@/lib/api/queryHooks";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useUiStore } from "@/stores/useUiStore";
import { AccountPageShell } from "@/features/account/components/AccountPageShell";
import { accountContainer } from "@/features/account/constants/accountLayout";

import { listMySubscriptions } from "../api/subscription.api";
import { subscriptionKeys } from "../api/subscription.keys";
import { audienceLabel, statusLabel, subscriptionPriceLines } from "../utils/subscriptionRules";
import type { SubscriptionSummary } from "../types/subscription.types";

type ListFilter = "all" | "active" | "pending";

export function AgreementPrice({ item }: { item: Pick<SubscriptionSummary, "amount" | "currencyCode" | "shippingMode" | "shippingAmount" | "monthlyTotal"> }) {
  const price = subscriptionPriceLines(item);
  if (!price.available) {
    return <p className="mt-2">Accepted pricing is unavailable.</p>;
  }
  return (
    <div className="mt-2">
      <p>Accepted subscription {item.currencyCode} {item.amount}</p>
      <p>Accepted shipping {item.shippingMode === "EXTRA_FIXED" ? `${item.currencyCode} ${item.shippingAmount}` : "included"}</p>
      <p>Accepted monthly total {item.currencyCode} {price.totalAmount}</p>
    </div>
  );
}

function money(currency: string, amount: string) {
  return `${currency} ${amount}`;
}

function billingNote(item: SubscriptionSummary) {
  if (item.status === "PENDING_ACTIVATION") return "Not started yet — no payment has been taken.";
  if (item.status === "PAUSED") return "Paused. Renewals stay paused until you resume.";
  if (item.status === "CANCELLED") return "Cancelled. Future renewals have stopped.";
  if (item.nextBillingAt) {
    return `Next billing ${new Date(item.nextBillingAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
  }
  return "No billing date is scheduled yet.";
}

export function AccountSubscriptionsPageView() {
  const zoneCode = useUiStore((s) => s.catalogContext?.zoneCode || s.selectedMarketId || "");
  const list = useApiQuery(subscriptionKeys.mine(zoneCode), () => listMySubscriptions(zoneCode), {
    enabled: Boolean(zoneCode),
  });
  const [filter, setFilter] = useState<ListFilter>("all");
  const items = list.data ?? [];
  const active = items.filter((item) => item.status === "ACTIVE");
  const pending = items.filter((item) => item.status === "PENDING_ACTIVATION");
  const visible = filter === "active" ? active : filter === "pending" ? pending : items;
  const monthly = useMemo(() => {
    const totals = active
      .map((item) => subscriptionPriceLines(item))
      .filter((price) => price.available);
    if (totals.length === 0 || !active[0]) return null;
    const sum = totals.reduce((total, price) => total + Number(price.totalAmount), 0);
    return `${active[0].currencyCode} ${sum.toFixed(2)}`;
  }, [active]);

  return (
    <AccountPageShell>
      <div className={`${accountContainer} flex flex-col gap-6 pt-7 pb-16 text-[#2B1D17] sm:pt-8`}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex max-w-[640px] flex-col gap-2">
            <h1 className="m-0 text-[2rem] font-semibold tracking-[-0.01em]">My subscriptions</h1>
            <p className="m-0 text-[15px] font-normal text-[#6E5A50]">Each subscription is its own agreement with its own monthly price. You&apos;re only charged once a subscription is active.</p>
          </div>
          <LocaleLink href="/subscriptions" className="inline-flex h-11 items-center gap-2 rounded-full bg-[#8E4636] px-5 text-sm font-semibold text-white no-underline">
            New subscription
          </LocaleLink>
        </div>

        {!zoneCode ? <p>Select a market to see agreements for that zone.</p> : null}
        {list.isLoading ? <PageLoading label="Loading your subscriptions…" /> : null}
        {list.isError ? <p role="alert">Subscriptions could not be loaded. {list.error.message}</p> : null}

        {list.isSuccess ? (
          <>
            <section aria-label="Overview" className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
              <Overview label="ACTIVE" value={`${active.length} subscription${active.length === 1 ? "" : "s"}`} hint="Delivering a fragrance every month" />
              <Overview label="YOU PAY EACH MONTH" value={monthly ?? "—"} hint="Across your active subscriptions" />
              <Overview label="WAITING TO START" value={`${pending.length} pending`} hint="No payment taken yet" />
            </section>
            <div role="tablist" aria-label="Filter subscriptions" className="flex flex-wrap gap-2">
              <FilterTab label="All" count={items.length} on={filter === "all"} onPick={() => setFilter("all")} />
              <FilterTab label="Active" count={active.length} on={filter === "active"} onPick={() => setFilter("active")} />
              <FilterTab label="Pending" count={pending.length} on={filter === "pending"} onPick={() => setFilter("pending")} />
            </div>
            {visible.length === 0 ? (
              <p>
                You have no subscriptions in this market.{" "}
                <LocaleLink href="/subscriptions" className="font-semibold text-[#8E4636]">Browse plans</LocaleLink>
              </p>
            ) : (
              <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-5 p-0">
                {visible.map((item) => {
                  const price = subscriptionPriceLines(item);
                  const pendingCard = item.status === "PENDING_ACTIVATION";
                  return (
                    <li key={item.id} className="flex flex-col overflow-hidden rounded-[20px] border border-[#E6DCCB] bg-white">
                      <div className={`relative flex h-[170px] items-center justify-center overflow-hidden ${pendingCard ? "bg-[#F3EEE6]" : "bg-[#F1E6D6]"}`}>
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="" className="h-full w-full object-contain p-6" />
                        ) : (
                          <FragrancePair muted={pendingCard} />
                        )}
                        <span className={`absolute top-3.5 left-3.5 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold ${pendingCard ? "text-[#7A4B0B]" : item.status === "ACTIVE" ? "text-[#1F5B30]" : "text-[#5A463C]"}`}>
                          <span className={`size-2 rounded-full ${pendingCard ? "bg-[#C98A1E]" : item.status === "ACTIVE" ? "bg-[#2E7D45]" : "bg-[#8E4636]"}`} />
                          {statusLabel(item.status)}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col gap-3.5 px-[22px] py-5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-medium tracking-[0.08em] text-[#6E5A50]">AGREEMENT</span>
                          <span className="text-lg font-semibold tracking-[0.04em] break-all">{item.planCode}</span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[1.75rem] font-semibold">{price.available ? money(item.currencyCode, price.totalAmount) : "—"}</span>
                          <span className="text-sm text-[#6E5A50]">/ month</span>
                        </div>
                        <dl className="m-0 flex flex-col gap-2 rounded-xl bg-[#F8F4EC] p-3.5 text-sm">
                          <div className="flex justify-between gap-3"><dt className="text-[#6E5A50]">Fragrance</dt><dd className="m-0 font-medium">{item.currencyCode} {item.amount}</dd></div>
                          <div className="flex justify-between gap-3"><dt className="text-[#6E5A50]">Shipping</dt><dd className={`m-0 font-medium ${item.shippingMode === "EXTRA_FIXED" ? "text-[#2B1D17]" : "text-[#1F5B30]"}`}>{item.shippingMode === "EXTRA_FIXED" ? `${item.currencyCode} ${item.shippingAmount}` : "Included"}</dd></div>
                          <div className="flex justify-between gap-3"><dt className="text-[#6E5A50]">Picks from</dt><dd className="m-0 font-medium">{item.audience ? audienceLabel(item.audience) : "This plan"}</dd></div>
                        </dl>
                        <p className={`m-0 text-[13px] ${pendingCard ? "text-[#7A4B0B]" : "text-[#5A463C]"}`}>{billingNote(item)}</p>
                        <LocaleLink href={`/account/subscription/${item.id}`} className={`mt-auto inline-flex h-11 items-center justify-center rounded-full px-4 text-sm font-semibold no-underline ${pendingCard ? "border border-[#C9B49C] bg-white text-[#2B1D17]" : "bg-[#8E4636] text-white"}`}>
                          View agreement
                        </LocaleLink>
                      </div>
                    </li>
                  );
                })}
                <li className="flex min-h-[300px] rounded-[20px] border-2 border-dashed border-[#D9CBB6]">
                  <LocaleLink href="/subscriptions" className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-[#2B1D17] no-underline">
                    <span className="flex size-14 items-center justify-center rounded-full bg-[#F1E6D6] text-2xl font-medium text-[#8E4636]">+</span>
                    <strong className="text-[17px] font-semibold">Start another subscription</strong>
                    <span className="max-w-[240px] text-sm text-[#6E5A50]">Get a new fragrance delivered every month for yourself or as a gift.</span>
                  </LocaleLink>
                </li>
              </ul>
            )}
          </>
        ) : null}
      </div>
    </AccountPageShell>
  );
}

function Overview({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border border-[#E6DCCB] bg-white p-5">
      <span className="text-xs font-medium tracking-[0.08em] text-[#6E5A50]">{label}</span>
      <span className="text-2xl font-semibold">{value}</span>
      <span className="text-[13px] text-[#6E5A50]">{hint}</span>
    </div>
  );
}

function FilterTab({ label, count, on, onPick }: { label: string; count: number; on: boolean; onPick: () => void }) {
  return (
    <button type="button" role="tab" aria-selected={on} onClick={onPick} className={`h-10 rounded-full px-4 text-sm font-medium ${on ? "border border-[#2B1D17] bg-[#2B1D17] text-white" : "border border-[#D9CBB6] bg-white text-[#2B1D17]"}`}>
      {label} <span className="font-semibold opacity-75">{count}</span>
    </button>
  );
}

function FragrancePair({ muted }: { muted: boolean }) {
  return (
    <svg width="140" height="120" viewBox="0 0 200 160" aria-hidden="true" style={{ opacity: muted ? 0.55 : 1 }}>
      <rect x="58" y="18" width="22" height="20" rx="4" fill="#C9A46A" />
      <rect x="40" y="42" width="58" height="90" rx="14" fill="#8E4636" />
      <rect x="118" y="8" width="16" height="24" rx="4" fill="#2B1D17" />
      <rect x="104" y="36" width="44" height="100" rx="8" fill="#C9A46A" />
    </svg>
  );
}
