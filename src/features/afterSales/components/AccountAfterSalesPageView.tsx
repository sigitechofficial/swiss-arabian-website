"use client";

import { useMemo, useState } from "react";
import { PageLoading } from "@/components/ui";
import { AccountPageShell } from "@/features/account/components/AccountPageShell";
import { AccountPageTitle } from "@/features/account/components/AccountPageTitle";
import { accountContainer } from "@/features/account/constants/accountLayout";
import {
  useCustomerExchangesFeed,
  useCustomerReturnsFeed,
} from "../hooks/useAfterSales";
import {
  ExchangeRequestCard,
  ReturnRequestCard,
} from "./AfterSalesRequestCards";

const KIND_TABS = [
  { value: "returns" as const, label: "Returns" },
  { value: "exchanges" as const, label: "Exchanges" },
];

const STATUS_FILTERS: { value: string | null; label: string }[] = [
  { value: null, label: "All" },
  { value: "REQUESTED", label: "Requested" },
  { value: "PENDING_REVIEW", label: "Pending review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

export function AccountAfterSalesPageView() {
  const [kind, setKind] = useState<"returns" | "exchanges">("returns");
  const [status, setStatus] = useState<string | null>(null);
  const returns = useCustomerReturnsFeed(status);
  const exchanges = useCustomerExchangesFeed(status);

  const returnItems = useMemo(
    () => returns.data?.pages.flatMap((page) => page.items) ?? [],
    [returns.data],
  );
  const exchangeItems = useMemo(
    () => exchanges.data?.pages.flatMap((page) => page.items) ?? [],
    [exchanges.data],
  );

  const feed = kind === "returns" ? returns : exchanges;
  const items = kind === "returns" ? returnItems : exchangeItems;
  const emptyCopy =
    kind === "returns"
      ? "You have no return requests yet."
      : "You have no exchange requests yet.";

  return (
    <AccountPageShell>
      <AccountPageTitle
        title="Returns & exchanges"
        subtitle="Requests are reviewed by our team. Submitting a request does not refund or ship a replacement."
      />

      <div className={`${accountContainer} pb-16`}>
        <div className="mb-4 flex flex-wrap gap-2">
          {KIND_TABS.map((tab) => {
            const active = kind === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setKind(tab.value)}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${
                  active
                    ? "bg-terra text-white"
                    : "border border-sa-border text-sa-secondary hover:border-terra hover:text-terra"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => {
            const active = status === filter.value;
            return (
              <button
                key={filter.label}
                type="button"
                onClick={() => setStatus(filter.value)}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${
                  active
                    ? "bg-sa-primary text-white dark:bg-white dark:text-sa-primary"
                    : "border border-sa-border text-sa-secondary hover:border-terra hover:text-terra"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {feed.isLoading ? <PageLoading /> : null}
        {feed.isError ? (
          <p className="text-[14px] text-sa-muted">
            Could not load your requests. Please try again.
          </p>
        ) : null}
        {!feed.isLoading && !feed.isError && items.length === 0 ? (
          <p className="text-[14px] text-sa-muted">{emptyCopy}</p>
        ) : null}

        <div className="flex flex-col gap-4">
          {kind === "returns"
            ? returnItems.map((item) => (
                <ReturnRequestCard key={item.returnRequestId} item={item} />
              ))
            : exchangeItems.map((item) => (
                <ExchangeRequestCard
                  key={item.exchangeRequestId}
                  item={item}
                />
              ))}
        </div>

        {feed.hasNextPage ? (
          <button
            type="button"
            className="mt-6 text-[13px] font-semibold text-terra hover:underline"
            onClick={() => feed.fetchNextPage()}
            disabled={feed.isFetchingNextPage}
          >
            {feed.isFetchingNextPage ? "Loading…" : "Load more"}
          </button>
        ) : null}
      </div>
    </AccountPageShell>
  );
}
