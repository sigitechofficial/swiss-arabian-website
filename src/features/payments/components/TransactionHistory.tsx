"use client";

import { useMemo, useState } from "react";

import { toast } from "@/components/ui/Toaster";
import { AccountStatusLabel } from "@/features/account/components/AccountStatus";
import { AccountPillTabs } from "@/features/account/components/AccountTabs";

import { transactions } from "../data/paymentsContent";

type TxFilter = "all" | "payments" | "upcoming" | "refunds";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "payments", label: "Payments" },
  { value: "upcoming", label: "Upcoming" },
  { value: "refunds", label: "Refunds" },
] as const satisfies readonly { value: TxFilter; label: string }[];

/** Figma · Tx-Wrap (1318:10044) */
export function TransactionHistory() {
  const [filter, setFilter] = useState<TxFilter>("all");

  const rows = useMemo(() => {
    if (filter === "all") return transactions;
    const kind =
      filter === "payments"
        ? "PAYMENT"
        : filter === "refunds"
          ? "REFUND"
          : "UPCOMING";
    return transactions.filter((tx) => tx.kind === kind);
  }, [filter]);

  return (
    <div className="overflow-hidden rounded-[10px] border border-sa-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sa-border bg-section-soft px-4 py-2.5">
        <AccountPillTabs
          options={FILTERS}
          value={filter}
          onChange={setFilter}
          ariaLabel="Filter transactions"
        />
        <button
          type="button"
          onClick={() =>
            toast("Statement downloads will be available soon.", "info")
          }
          className="text-[12px] font-semibold text-terra hover:underline"
        >
          Download statement ↓
        </button>
      </div>

      <div className="hidden grid-cols-[110px_minmax(0,1fr)_130px_120px_110px] items-center gap-4 border-b border-sa-border px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-sa-secondary lg:grid">
        <span>Date</span>
        <span>Description</span>
        <span>Card</span>
        <span>Amount</span>
        <span>Status</span>
      </div>

      {rows.map((tx, index) => (
        <div
          key={tx.id}
          className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-b border-sa-border px-5 py-3.5 last:border-b-0 lg:grid-cols-[110px_minmax(0,1fr)_130px_120px_110px] ${
            tx.kind === "UPCOMING"
              ? "bg-section-soft"
              : index % 2 === 1
                ? "bg-ash"
                : "bg-surface"
          }`}
        >
          <span className="order-2 text-[12px] text-sa-secondary lg:order-none lg:text-[13px]">
            {tx.dateLabel}
          </span>
          <div className="order-1 min-w-0 lg:order-none">
            <p className="truncate text-[13px] font-semibold text-sa-primary">
              {tx.title}
            </p>
            <p className="truncate text-[12px] text-sa-secondary">
              {tx.subtitle}
            </p>
          </div>
          <span className="order-4 hidden text-[13px] text-sa-secondary lg:order-none lg:inline">
            {tx.cardLabel}
          </span>
          <span
            className={`order-3 justify-self-end text-[13px] font-semibold lg:order-none lg:justify-self-start ${
              tx.kind === "REFUND"
                ? "text-[#b4483f]"
                : tx.kind === "UPCOMING"
                  ? "text-terra"
                  : "text-sa-primary"
            }`}
          >
            {tx.amountLabel}
          </span>
          <span className="order-5 justify-self-end lg:order-none lg:justify-self-start">
            <AccountStatusLabel label={tx.statusLabel} tone={tx.statusTone} />
          </span>
        </div>
      ))}

      {!rows.length ? (
        <p className="px-5 py-10 text-[14px] text-sa-secondary">
          No transactions in this view.
        </p>
      ) : null}
    </div>
  );
}
