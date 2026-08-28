"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AccountPageShell } from "@/features/account/components/AccountPageShell";
import { AccountPageTitle } from "@/features/account/components/AccountPageTitle";
import { AccountStatusPill } from "@/features/account/components/AccountStatus";
import { accountContainer } from "@/features/account/constants/accountLayout";
import { listOrders } from "@/features/account/api/customerOrders.service";
import { formatMoney } from "@/features/home/data/homeContent";
import type { AccountStatusTone } from "@/features/account/components/AccountStatus";
import type { OrderStatus, OrderSummaryApi } from "@/features/account/api/customerOrders.service";

// ─── Status → display ─────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; tone: AccountStatusTone }> = {
  DRAFT:                  { label: "Draft",         tone: "muted" },
  PAYMENT_PENDING:        { label: "Awaiting Payment", tone: "warning" },
  PAYMENT_AUTHORIZED:     { label: "Authorized",    tone: "accent" },
  PAID:                   { label: "Paid",          tone: "success" },
  CANCELLATION_WINDOW:    { label: "Processing",    tone: "accent" },
  READY_FOR_FULFILLMENT:  { label: "Confirmed",     tone: "accent" },
  FULFILLMENT_QUEUED:     { label: "Preparing",     tone: "accent" },
  SHIPMENT_CREATED:       { label: "Shipped",       tone: "accent" },
  IN_TRANSIT:             { label: "On the Way",    tone: "accent" },
  DELIVERED:              { label: "Delivered",     tone: "success" },
  CANCELLED:              { label: "Cancelled",     tone: "danger" },
  REFUND_PENDING:         { label: "Refund Pending", tone: "warning" },
  REFUNDED:               { label: "Refunded",      tone: "muted" },
  MANUAL_REVIEW:          { label: "Under Review",  tone: "warning" },
  FAILED:                 { label: "Failed",        tone: "danger" },
};

function statusDisplay(status: OrderStatus) {
  return STATUS_MAP[status] ?? { label: status, tone: "muted" as AccountStatusTone };
}

function isActive(status: OrderStatus): boolean {
  return [
    "PAYMENT_PENDING", "PAYMENT_AUTHORIZED", "PAID",
    "CANCELLATION_WINDOW", "READY_FOR_FULFILLMENT",
    "FULFILLMENT_QUEUED", "SHIPMENT_CREATED", "IN_TRANSIT",
  ].includes(status);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AE", {
    year: "numeric", month: "short", day: "numeric",
  });
}

// ─── Order row card ───────────────────────────────────────────────────────────

function OrderRow({ order }: { order: OrderSummaryApi }) {
  const { label, tone } = statusDisplay(order.status);
  const hasTracking = order.shipment?.trackingNumber;

  return (
    <article className="border border-sa-border bg-page">
      {/* Header bar */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-sa-border bg-section-soft px-5 py-3 sm:px-6">
        {order.orderNumber ? (
          <p className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wide text-sa-muted">Order</span>
            <span className="font-mono text-[12px] font-semibold text-sa-primary">{order.orderNumber}</span>
          </p>
        ) : null}
        <p className="flex items-center gap-1.5 sm:ml-auto">
          <span className="text-[10px] font-bold uppercase tracking-wide text-sa-muted">Date</span>
          <span className="text-[12px] font-semibold text-sa-primary">{formatDate(order.createdAt)}</span>
        </p>
        <Link
          href={`/account/orders/${order.orderId}`}
          className="text-[13px] font-medium text-sa-primary hover:text-terra transition-colors"
        >
          View Details →
        </Link>
      </div>

      {/* Body */}
      <div className="flex items-start gap-4 px-5 py-5 sm:px-6">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-sa-muted">
            {order.itemCount} item{order.itemCount !== 1 ? "s" : ""} &nbsp;·&nbsp; Standard Delivery
          </p>
          <p className="mt-1.5 text-[16px] font-bold text-sa-primary">
            {formatMoney(Number(order.total), order.currency)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <AccountStatusPill label={label} tone={tone} />
            {order.shipment?.trackingNumber ? (
              <span className="text-[12px] text-sa-muted">
                Tracking: <span className="font-mono text-sa-primary">{order.shipment.trackingNumber}</span>
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {order.orderNumber ? (
            <Link
              href={`/account/orders/${order.orderId}`}
              className="flex h-8 items-center gap-1.5 rounded border border-sa-border px-3 text-[11px] font-semibold text-sa-primary transition-colors hover:border-terra hover:text-terra"
            >
              Track Order →
            </Link>
          ) : hasTracking && order.shipment?.trackingUrl ? (
            <a
              href={order.shipment.trackingUrl}
              className="flex h-8 items-center gap-1.5 rounded border border-sa-border px-3 text-[11px] font-semibold text-sa-primary transition-colors hover:border-terra hover:text-terra"
            >
              Track Order →
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyOrders() {
  return (
    <div className={`${accountContainer} py-16 text-center`}>
      <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-section-soft">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-sa-muted">
          <rect x="4" y="8" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M9 8V6a5 5 0 0110 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-[16px] font-semibold text-sa-primary">No orders yet</p>
      <p className="mt-1 text-[13px] text-sa-muted">Your purchase history will appear here.</p>
      <Link href="/products" className="mt-5 inline-flex h-10 items-center justify-center rounded bg-terra px-6 text-[12px] font-semibold uppercase tracking-wide text-white hover:bg-[#a25e48] transition-colors">
        Start Shopping
      </Link>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export function PurchaseHistoryPageView() {
  const [offset, setOffset] = useState(0);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["customer-orders", offset],
    queryFn: () => listOrders({ limit: PAGE_SIZE, offset }),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const orders = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  const active = orders.filter((o) => isActive(o.status));
  const past = orders.filter((o) => !isActive(o.status));

  return (
    <AccountPageShell>
      <AccountPageTitle title="Purchase History" />

      {isLoading ? (
        <div className={`${accountContainer} flex items-center justify-center py-20`}>
          <span className="size-8 animate-spin rounded-full border-2 border-sa-border border-t-terra" />
        </div>
      ) : isError ? (
        <div className={`${accountContainer} py-16 text-center`}>
          <p className="text-[14px] text-red-600">Could not load orders. Please refresh.</p>
        </div>
      ) : orders.length === 0 ? (
        <EmptyOrders />
      ) : (
        <>
          {active.length > 0 ? (
            <section className={`${accountContainer} pt-8 pb-2`}>
              <h2 className="text-[19px] font-bold text-sa-primary lg:text-[22px]">Active Orders</h2>
              <div className="mt-5 flex flex-col gap-6">
                {active.map((o) => <OrderRow key={o.orderId} order={o} />)}
              </div>
            </section>
          ) : null}

          {past.length > 0 ? (
            <section className={`${accountContainer} pt-8 pb-2`}>
              <h2 className="text-[19px] font-bold text-sa-primary lg:text-[22px]">Past Purchases</h2>
              <div className="mt-5 flex flex-col gap-6">
                {past.map((o) => <OrderRow key={o.orderId} order={o} />)}
              </div>
            </section>
          ) : null}

          {/* Pagination */}
          {totalPages > 1 ? (
            <div className={`${accountContainer} flex items-center justify-center gap-3 py-8`}>
              <button
                type="button"
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                disabled={currentPage === 1}
                className="flex h-9 items-center gap-1.5 rounded border border-sa-border px-4 text-[12px] font-medium text-sa-primary hover:border-terra disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
              >
                ← Previous
              </button>
              <span className="text-[13px] text-sa-muted">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setOffset(offset + PAGE_SIZE)}
                disabled={currentPage === totalPages}
                className="flex h-9 items-center gap-1.5 rounded border border-sa-border px-4 text-[12px] font-medium text-sa-primary hover:border-terra disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
              >
                Next →
              </button>
            </div>
          ) : null}
        </>
      )}

      <div className="h-10" />
    </AccountPageShell>
  );
}
