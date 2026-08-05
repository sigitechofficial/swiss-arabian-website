"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { AccountStatusLabel } from "@/features/account/components/AccountStatus";
import { AccountUnderlineTabs } from "@/features/account/components/AccountTabs";

import {
  subscriptionMonths,
  subscriptionStatusMeta,
} from "../data/mySubscriptionContent";

type HistoryFilter = "all" | "delivered" | "upcoming";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "delivered", label: "Delivered" },
  { value: "upcoming", label: "Upcoming" },
] as const satisfies readonly { value: HistoryFilter; label: string }[];

/** Figma · History tabs + table (1236:9674 → 1236:9767) */
export function SubscriptionHistoryTable() {
  const [filter, setFilter] = useState<HistoryFilter>("all");

  const rows = useMemo(() => {
    if (filter === "all") return subscriptionMonths;
    if (filter === "delivered") {
      return subscriptionMonths.filter((row) => row.status === "DELIVERED");
    }
    return subscriptionMonths.filter((row) => row.status !== "DELIVERED");
  }, [filter]);

  return (
    <section className="flex flex-col gap-5">
      <h2 className="text-[19px] font-bold text-sa-primary lg:text-[22px]">
        Delivery &amp; Purchase History
      </h2>

      <AccountUnderlineTabs
        options={FILTERS}
        value={filter}
        onChange={setFilter}
        ariaLabel="Filter subscription history"
      />

      <div className="overflow-hidden border border-sa-border">
        <div className="hidden grid-cols-[110px_minmax(0,1fr)_110px_150px_110px] items-center gap-4 border-b border-sa-border bg-section-soft px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-sa-secondary lg:grid">
          <span>Month</span>
          <span>Scent</span>
          <span>Amount</span>
          <span>Billing date</span>
          <span>Status</span>
        </div>

        {rows.map((row) => {
          const status = subscriptionStatusMeta[row.status];
          return (
            <div
              key={row.monthLabel}
              className="grid grid-cols-[68px_minmax(0,1fr)_auto] items-center gap-4 border-b border-sa-border px-4 py-3 last:border-b-0 sm:grid-cols-[80px_minmax(0,1fr)_92px_auto] lg:grid-cols-[110px_minmax(0,1fr)_110px_150px_110px]"
            >
              <span className="text-[13px] text-sa-primary">
                {row.monthLabel}
              </span>
              <span className="flex min-w-0 items-center gap-3">
                <Image
                  src={row.thumbnail}
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 shrink-0 object-cover"
                />
                <span className="truncate text-[13px] font-medium text-sa-primary">
                  {row.scent}
                </span>
              </span>
              <span className="hidden text-[13px] text-sa-primary sm:inline">
                {row.amountLabel}
              </span>
              <span className="hidden text-[13px] text-sa-secondary lg:inline">
                {row.billingLabel}
              </span>
              <span className="justify-self-end lg:justify-self-start">
                <AccountStatusLabel label={status.label} tone={status.tone} />
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
