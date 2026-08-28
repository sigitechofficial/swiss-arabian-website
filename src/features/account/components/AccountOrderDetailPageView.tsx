"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AccountPageShell } from "@/features/account/components/AccountPageShell";
import { AccountStatusPill } from "@/features/account/components/AccountStatus";
import { accountContainer } from "@/features/account/constants/accountLayout";
import { formatMoney } from "@/features/home/data/homeContent";
import {
  getCustomerOrderDetail,
  cancelOrder,
} from "@/features/account/api/customerOrders.service";
import type { AccountStatusTone } from "@/features/account/components/AccountStatus";
import type { OrderStatus, CancellationWindow } from "@/features/account/api/customerOrders.service";

// ─── Status display ───────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; tone: AccountStatusTone }> = {
  DRAFT:                 { label: "Draft",            tone: "muted" },
  PAYMENT_PENDING:       { label: "Awaiting Payment", tone: "warning" },
  PAYMENT_AUTHORIZED:    { label: "Authorized",       tone: "accent" },
  PAID:                  { label: "Paid",             tone: "success" },
  CANCELLATION_WINDOW:   { label: "Processing",       tone: "accent" },
  READY_FOR_FULFILLMENT: { label: "Confirmed",        tone: "accent" },
  FULFILLMENT_QUEUED:    { label: "Preparing",        tone: "accent" },
  SHIPMENT_CREATED:      { label: "Shipped",          tone: "accent" },
  IN_TRANSIT:            { label: "On the Way",       tone: "accent" },
  DELIVERED:             { label: "Delivered",        tone: "success" },
  CANCELLED:             { label: "Cancelled",        tone: "danger" },
  REFUND_PENDING:        { label: "Refund Pending",   tone: "warning" },
  REFUNDED:              { label: "Refunded",         tone: "muted" },
  MANUAL_REVIEW:         { label: "Under Review",     tone: "warning" },
  FAILED:                { label: "Failed",           tone: "danger" },
};

function statusDisplay(status: string) {
  return STATUS_MAP[status] ?? { label: status, tone: "muted" as AccountStatusTone };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AE", { year: "numeric", month: "long", day: "numeric" });
}

// ─── Cancellation countdown ───────────────────────────────────────────────────

function CancellationCountdown({ window: cw, onCancel }: { window: CancellationWindow; onCancel: () => void }) {
  const [remaining, setRemaining] = useState(cw.remainingSeconds ?? 0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!cw.canCancel || remaining <= 0) return;
    intervalRef.current = setInterval(() => setRemaining((s) => Math.max(0, s - 1)), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [cw.canCancel, remaining]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const expired = remaining <= 0;

  if (!cw.canCancel) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-md border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-700 dark:bg-amber-900/20">
      <div>
        <p className="text-[14px] font-semibold text-amber-800 dark:text-amber-200">
          {expired ? "Cancellation window closed" : "You can still cancel this order"}
        </p>
        {!expired ? (
          <p className="mt-0.5 text-[13px] text-amber-700 dark:text-amber-300">
            Window closes in{" "}
            <span className="font-mono font-bold">{mm}:{ss}</span>
          </p>
        ) : null}
      </div>
      {!expired ? (
        <button
          type="button"
          onClick={onCancel}
          className="flex h-9 items-center rounded border border-amber-400 bg-white px-4 text-[12px] font-semibold text-amber-800 hover:bg-amber-100 transition-colors dark:bg-transparent dark:text-amber-200"
        >
          Cancel Order
        </button>
      ) : null}
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden border border-sa-border">
      <div className="border-b border-sa-border bg-section-soft px-5 py-3">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-sa-muted">{title}</h2>
      </div>
      <div className="bg-page px-5 py-4">{children}</div>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export function AccountOrderDetailPageView({ orderId }: { orderId: string }) {
  const queryClient = useQueryClient();
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["customer-order-detail", orderId],
    queryFn: () => getCustomerOrderDetail(orderId),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(orderId),
    onSuccess: (res) => {
      if (res.cancellationAccepted) {
        setCancelSuccess(true);
        queryClient.invalidateQueries({ queryKey: ["customer-order-detail", orderId] });
        queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
      } else {
        setCancelError("Cancellation could not be processed. Please contact support.");
      }
    },
    onError: () => setCancelError("Could not cancel order. Please try again."),
  });

  if (isLoading) {
    return (
      <AccountPageShell newsletter={false}>
        <div className={`${accountContainer} flex items-center justify-center py-24`}>
          <span className="size-8 animate-spin rounded-full border-2 border-sa-border border-t-terra" />
        </div>
      </AccountPageShell>
    );
  }

  if (isError || !data) {
    return (
      <AccountPageShell newsletter={false}>
        <div className={`${accountContainer} py-20 text-center`}>
          <p className="text-[15px] text-sa-primary">Order not found.</p>
          <Link href="/account/orders" className="mt-3 inline-block text-[13px] text-terra underline underline-offset-4">
            Back to Orders
          </Link>
        </div>
      </AccountPageShell>
    );
  }

  const { order, cancellationWindow } = data;
  const { label, tone } = statusDisplay(order.status);
  const shippingAddress = order.addresses.find((a) => a.addressType === "SHIPPING");
  const billingAddress = order.addresses.find((a) => a.addressType === "BILLING");
  const currency = order.currency;

  return (
    <AccountPageShell newsletter={false}>
      <div className={`${accountContainer} py-8 lg:py-10`}>

        {/* Back link */}
        <Link href="/account/orders" className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-sa-muted hover:text-terra transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M8 3L4 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Orders
        </Link>

        {/* Order header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold text-sa-primary lg:text-[26px]">
              Order {order.orderNumber ?? orderId.slice(0, 8).toUpperCase()}
            </h1>
            <p className="mt-1 text-[13px] text-sa-muted">Placed on {formatDate(order.createdAt)}</p>
          </div>
          <AccountStatusPill label={label} tone={tone} />
        </div>

        {/* Cancellation window */}
        {cancelSuccess ? (
          <div className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 px-5 py-4 text-[14px] text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200">
            ✓ Cancellation request received. You&apos;ll receive a confirmation by email.
          </div>
        ) : null}
        {cancelError ? (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-5 py-3 text-[13px] text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">{cancelError}</div>
        ) : null}
        {cancellationWindow?.canCancel && !cancelSuccess ? (
          <CancellationCountdown
            window={cancellationWindow}
            onCancel={() => { setCancelError(null); cancelMutation.mutate(); }}
          />
        ) : null}

        <div className="flex flex-col gap-5">

          {/* Line items */}
          <SectionCard title="Items Ordered">
            <ul className="divide-y divide-sa-border">
              {order.lines.map((line) => (
                <li key={line.orderLineId} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="size-14 shrink-0 border border-sa-border bg-section-soft overflow-hidden">
                    {line.imageUrl ? (
                      <Image src={line.imageUrl} alt={line.productName ?? ""} width={56} height={56} className="h-full w-full object-contain p-1" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[9px] uppercase text-sa-muted">SA</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-[14px] font-semibold text-sa-primary">{line.productName ?? line.sku}</p>
                    <p className="mt-0.5 text-[12px] text-sa-muted">
                      {[line.variantName, `Qty ${line.quantity}`].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <p className="shrink-0 text-[14px] font-semibold text-sa-primary">
                    {formatMoney(Number(line.lineTotal), line.currencyCode ?? currency)}
                  </p>
                </li>
              ))}
            </ul>
          </SectionCard>

          {/* Two column: totals + address */}
          <div className="grid gap-5 sm:grid-cols-2">
            <SectionCard title="Order Summary">
              <div className="flex flex-col gap-2.5 text-[13px]">
                <div className="flex justify-between"><span className="text-sa-muted">Subtotal</span><span className="font-medium text-sa-primary">{formatMoney(Number(order.totals.subtotal), currency)}</span></div>
                {Number(order.totals.discount) > 0 ? (
                  <div className="flex justify-between"><span className="text-sa-muted">Discount</span><span className="font-medium text-terra">−{formatMoney(Number(order.totals.discount), currency)}</span></div>
                ) : null}
                <div className="flex justify-between"><span className="text-sa-muted">Shipping</span><span className="font-medium text-sa-primary">{Number(order.totals.shipping) === 0 ? "Free" : formatMoney(Number(order.totals.shipping), currency)}</span></div>
                <div className="my-1 h-px bg-sa-border" />
                <div className="flex justify-between"><span className="text-[15px] font-bold text-sa-primary">Total</span><span className="text-[15px] font-bold text-sa-primary">{formatMoney(Number(order.totals.total), currency)}</span></div>
              </div>
            </SectionCard>

            <div className="flex flex-col gap-5">
              {shippingAddress ? (
                <SectionCard title="Shipped To">
                  <address className="not-italic text-[13px] leading-6 text-sa-primary">
                    {shippingAddress.fullName ? <span className="block font-medium">{shippingAddress.fullName}</span> : null}
                    {shippingAddress.address1 ? <span className="block text-sa-muted">{shippingAddress.address1}</span> : null}
                    {shippingAddress.city ? <span className="block text-sa-muted">{[shippingAddress.city, shippingAddress.countryCode].filter(Boolean).join(", ")}</span> : null}
                  </address>
                </SectionCard>
              ) : null}

              {billingAddress ? (
                <SectionCard title="Billed To">
                  <address className="not-italic text-[13px] leading-6 text-sa-primary">
                    {billingAddress.fullName ? <span className="block font-medium">{billingAddress.fullName}</span> : null}
                    {billingAddress.address1 ? <span className="block text-sa-muted">{billingAddress.address1}</span> : null}
                    {billingAddress.city ? <span className="block text-sa-muted">{[billingAddress.city, billingAddress.countryCode].filter(Boolean).join(", ")}</span> : null}
                  </address>
                </SectionCard>
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                {order.selectedDeliveryMethod ? (
                  <div className="border border-sa-border px-4 py-3">
                    <p className="mb-1 text-[10px] uppercase tracking-widest text-sa-muted">Delivery</p>
                    <p className="text-[13px] font-medium text-sa-primary">{order.selectedDeliveryMethod.methodCode ?? "Standard"}</p>
                  </div>
                ) : null}
                {order.selectedPaymentMethod ? (
                  <div className="border border-sa-border px-4 py-3">
                    <p className="mb-1 text-[10px] uppercase tracking-widest text-sa-muted">Payment</p>
                    <p className="text-[13px] font-medium text-sa-primary">{order.selectedPaymentMethod.methodCode ?? "—"}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Shipments */}
          {order.shipments?.length > 0 ? (
            <SectionCard title={`Shipments (${order.shipments.length})`}>
              <div className="flex flex-col gap-5">
                {order.shipments.map((shipment) => (
                  <div key={shipment.shipmentId} className="rounded-md border border-sa-border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-semibold text-sa-primary capitalize">{shipment.status.toLowerCase().replace(/_/g, " ")}</p>
                        {shipment.trackingNumber ? (
                          <p className="mt-0.5 text-[12px] text-sa-muted">
                            Tracking: <span className="font-mono text-sa-primary">{shipment.trackingNumber}</span>
                          </p>
                        ) : null}
                      </div>
                      {shipment.trackingUrl ? (
                        <a href={shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="flex h-8 items-center rounded border border-sa-border px-3 text-[11px] font-semibold text-sa-primary hover:border-terra hover:text-terra transition-colors">
                          Track →
                        </a>
                      ) : null}
                    </div>
                    {shipment.events?.length > 0 ? (
                      <ul className="flex flex-col gap-2.5 border-t border-sa-border pt-3">
                        {shipment.events.slice(0, 4).map((ev, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-sa-muted" />
                            <div>
                              <p className="text-[12px] font-medium text-sa-primary">{ev.status}</p>
                              {ev.description ? <p className="text-[11px] text-sa-muted">{ev.description}</p> : null}
                              <p className="text-[11px] text-sa-muted">{formatDate(ev.occurredAt)}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            </SectionCard>
          ) : null}

          {/* Timeline */}
          {order.timeline?.length > 0 ? (
            <SectionCard title="Order Timeline">
              <ul className="flex flex-col gap-3">
                {[...order.timeline].reverse().map((ev, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-terra" />
                    <div>
                      <p className="text-[13px] font-medium text-sa-primary">{ev.title ?? ev.eventType}</p>
                      <p className="text-[11px] text-sa-muted">{formatDate(ev.occurredAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </SectionCard>
          ) : null}
        </div>
      </div>
    </AccountPageShell>
  );
}
