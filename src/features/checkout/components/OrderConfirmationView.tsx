"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { formatMoney } from "@/features/home/data/homeContent";
import {
  consumeHeadInsiderInit,
  insiderPurchasePage,
  type InsiderPurchaseValue,
} from "@/lib/insider";
import { getOrder, pollUntilPaymentSettles } from "../api/orders.service";
import {
  getStoredInsiderPurchasePayload,
  persistInsiderPurchaseFromOrder,
} from "../utils/checkoutSession";
import { CheckoutStepBar } from "./CheckoutShell";
import type { OrderAddressSummary, OrderResponse } from "../types/checkout";

// ─── Status config ────────────────────────────────────────────────────────────

type PaymentState = "success" | "pending" | "failed";

function getPaymentState(status: string): PaymentState {
  if (["PAID", "AUTHORIZED"].includes(status)) return "success";
  if (["FAILED", "DECLINED"].includes(status)) return "failed";
  return "pending";
}

const STATE_BADGE: Record<
  PaymentState,
  { bg: string; text: string; dot: string; label: string }
> = {
  success: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
    label: "Confirmed",
  },
  pending: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
    label: "Pending",
  },
  failed: {
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-700 dark:text-red-400",
    dot: "bg-red-500",
    label: "Payment Failed",
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusIcon({ state }: { state: PaymentState }) {
  if (state === "success") {
    return (
      <div className="flex size-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
        <svg
          className="size-10 text-emerald-600 dark:text-emerald-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  if (state === "failed") {
    return (
      <div className="flex size-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
        <svg
          className="size-10 text-red-600 dark:text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    );
  }
  return (
    <div className="flex size-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
      <svg
        className="size-10 text-amber-600 dark:text-amber-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
  );
}

function StatusBadge({ state }: { state: PaymentState }) {
  const cfg = STATE_BADGE[state];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold uppercase tracking-wide ${cfg.bg} ${cfg.text}`}
    >
      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function AddressCard({
  title,
  address,
}: {
  title: string;
  address: OrderAddressSummary;
}) {
  return (
    <div className="border border-sa-border px-5 py-4">
      <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-sa-muted">
        {title}
      </h2>
      <address className="space-y-0.5 not-italic text-[13px] leading-6 text-sa-primary">
        {address.fullName ? (
          <span className="block font-medium">{address.fullName}</span>
        ) : null}
        {address.address1 ? (
          <span className="block text-sa-muted">{address.address1}</span>
        ) : null}
        {address.city ? (
          <span className="block text-sa-muted">
            {[address.city, address.countryCode].filter(Boolean).join(", ")}
          </span>
        ) : null}
      </address>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: React.ReactNode;
  bold?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between py-2.5">
      <span
        className={
          bold
            ? "text-[15px] font-bold text-sa-primary"
            : "text-[13px] text-sa-muted"
        }
      >
        {label}
      </span>
      <span
        className={
          bold
            ? "text-[18px] font-bold text-sa-primary"
            : "text-[14px] font-medium text-sa-primary"
        }
      >
        {value}
      </span>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export function OrderConfirmationView({ orderId }: { orderId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const shouldVerify = searchParams.get("verify") === "1";
  const purchaseQueued = useRef(false);

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (purchaseQueued.current) return;
    if (consumeHeadInsiderInit(pathname)) {
      purchaseQueued.current = true;
      return;
    }
    const stored = getStoredInsiderPurchasePayload();
    if (
      !stored ||
      !Array.isArray(stored.items) ||
      (stored.matchId !== orderId && stored.order_id !== orderId)
    ) {
      return;
    }
    const value: InsiderPurchaseValue = {
      order_id: String(stored.order_id),
      total: Number(stored.total) || 0,
      quantity: Number(stored.quantity) || 0,
      items: stored.items as Record<string, unknown>[],
    };
    if (typeof stored.shipping_cost === "number") {
      value.shipping_cost = stored.shipping_cost;
    }
    insiderPurchasePage(value);
    purchaseQueued.current = true;
  }, [pathname, orderId]);

  useEffect(() => {
    if (!order) return;
    const value = persistInsiderPurchaseFromOrder(order);
    if (purchaseQueued.current) return;
    if (consumeHeadInsiderInit(pathname)) {
      purchaseQueued.current = true;
      return;
    }
    insiderPurchasePage(value);
    purchaseQueued.current = true;
  }, [order, pathname]);

  useEffect(() => {
    async function load() {
      try {
        if (shouldVerify) {
          const result = await pollUntilPaymentSettles(orderId);
          setPaymentStatus(result.status);
        }
        const orderData = await getOrder(orderId);
        setOrder(orderData);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load order details.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [orderId, shouldVerify]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="size-8 animate-spin rounded-full border-2 border-sa-border border-t-terra" />
          <p className="text-[14px] text-sa-muted">
            {shouldVerify ? "Verifying payment…" : "Loading order…"}
          </p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !order) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-[15px] text-sa-primary">{error ?? "Order not found."}</p>
        <Link href="/" className="text-[13px] text-terra underline">
          Return to home
        </Link>
      </div>
    );
  }

  const shippingAddress = order.addresses?.find((a) => a.addressType === "SHIPPING");
  const billingAddress = order.addresses?.find((a) => a.addressType === "BILLING");
  const effectiveStatus = paymentStatus ?? order.paymentStatus;
  const state = getPaymentState(effectiveStatus);
  const currency = order.currency;
  const isGuest = order.customer?.isGuest;

  return (
    <section className="bg-page py-14">
      {/* Checkout progress — step 3 Done */}
      <div className="mb-8 border-b border-sa-border">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <CheckoutStepBar step={3} />
        </div>
      </div>
      <div className="mx-auto w-full max-w-170 px-4">

        {/* ── Hero status block ── */}
        <div className="mb-12 flex flex-col items-center gap-4 text-center">
          <StatusIcon state={state} />

          <div className="space-y-1">
            <h1 className="text-[30px] font-bold tracking-tight text-sa-primary">
              {state === "success"
                ? "Thank you for your order!"
                : state === "failed"
                  ? "Payment Unsuccessful"
                  : "Order Received"}
            </h1>
            <p className="text-[15px] text-sa-muted">
              {state === "success"
                ? "We've received your order and will start processing it shortly."
                : state === "failed"
                  ? "Your payment could not be processed. Please try again."
                  : "We've received your order and are awaiting payment confirmation."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge state={state} />
            {order.orderNumber ? (
              <span className="rounded border border-sa-border bg-cream px-3 py-1 font-mono text-[12px] font-semibold text-sa-primary dark:bg-[#1e1812]">
                {order.orderNumber}
              </span>
            ) : null}
          </div>

          {/* Guest: track via public token URL · Logged-in: account order detail */}
          {isGuest && order.orderNumber ? (
            <div className="mt-1 flex w-full max-w-105 flex-col gap-3 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-left dark:border-amber-700 dark:bg-amber-900/20">
              <p className="text-[12px] text-amber-800 dark:text-amber-300">
                <strong className="font-semibold">Save your order number</strong>
                <span className="mx-1 font-mono font-bold">{order.orderNumber}</span>
                — you&apos;ll need it to track your order.
              </p>
              <Link
                href={`/track/${order.orderNumber}`}
                className="flex h-10 w-full items-center justify-center rounded bg-terra text-[12px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#a25e48]"
              >
                Track Order
              </Link>
            </div>
          ) : state === "success" ? (
            <Link
              href={`/account/orders/${orderId}`}
              className="mt-1 flex h-10 items-center justify-center rounded bg-terra px-6 text-[12px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#a25e48]"
            >
              Track Order
            </Link>
          ) : null}

          {/* Failed CTA */}
          {state === "failed" ? (
            <Link
              href="/checkout"
              className="mt-1 flex h-10 items-center justify-center rounded bg-terra px-6 text-[13px] font-semibold uppercase tracking-wide text-white hover:bg-[#a25e48]"
            >
              Try Again
            </Link>
          ) : null}
        </div>

        {/* ── Items ── */}
        <div className="mb-6 overflow-hidden border border-sa-border">
          <div className="border-b border-sa-border bg-cream px-5 py-3 dark:bg-[#1e1812]">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-sa-muted">
              Items Ordered
            </h2>
          </div>
          <ul className="divide-y divide-sa-border">
            {order.lines.map((line) => (
              <li
                key={line.orderLineId}
                className="flex items-center gap-4 px-5 py-4"
              >
                {/* Thumbnail placeholder */}
                <div className="size-14 shrink-0 overflow-hidden border border-sa-border bg-cream dark:bg-[#1e1812]">
                  {line.imageUrl ? (
                    <Image
                      src={line.imageUrl}
                      alt={line.productName ?? ""}
                      width={56}
                      height={56}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <svg
                        className="size-6 text-sa-border"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-sa-primary">
                    {line.productName ?? line.sku}
                  </p>
                  <p className="mt-0.5 text-[12px] text-sa-muted">
                    {[line.variantName, `Qty ${line.quantity}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>

                <p className="ml-4 shrink-0 text-[14px] font-semibold text-sa-primary">
                  {formatMoney(Number(line.lineTotal), line.currencyCode ?? currency)}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Two-column: summary + details ── */}
        <div className="mb-6 grid gap-6 sm:grid-cols-2">
          {/* Totals */}
          <div className="border border-sa-border px-5 py-4">
            <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-sa-muted">
              Order Summary
            </h2>
            <div className="divide-y divide-sa-border">
              <SummaryRow
                label="Subtotal"
                value={formatMoney(Number(order.totals.subtotal), currency)}
              />
              {Number(order.totals.discount) > 0 ? (
                <SummaryRow
                  label="Discount"
                  value={
                    <span className="text-terra">
                      −{formatMoney(Number(order.totals.discount), currency)}
                    </span>
                  }
                />
              ) : null}
              <SummaryRow
                label="Shipping"
                value={
                  Number(order.totals.shipping) === 0
                    ? "Free"
                    : formatMoney(Number(order.totals.shipping), currency)
                }
              />
              <SummaryRow
                label="Total"
                value={formatMoney(Number(order.totals.total), currency)}
                bold
              />
            </div>
          </div>

          {/* Shipping + billing addresses */}
          <div className="space-y-4">
            {shippingAddress ? (
              <AddressCard title="Ship to" address={shippingAddress} />
            ) : null}
            {billingAddress ? (
              <AddressCard title="Bill to" address={billingAddress} />
            ) : null}

            {/* Delivery & payment method */}
            <div className="grid grid-cols-2 gap-3">
              {order.selectedDeliveryMethod ? (
                <div className="border border-sa-border px-4 py-3">
                  <p className="mb-1 text-[10px] uppercase tracking-widest text-sa-muted">
                    Delivery
                  </p>
                  <p className="text-[13px] font-medium text-sa-primary">
                    {order.selectedDeliveryMethod.methodCode ?? "Standard"}
                  </p>
                </div>
              ) : null}
              {order.selectedPaymentMethod ? (
                <div className="border border-sa-border px-4 py-3">
                  <p className="mb-1 text-[10px] uppercase tracking-widest text-sa-muted">
                    Payment
                  </p>
                  <p className="text-[13px] font-medium text-sa-primary">
                    {order.selectedPaymentMethod.methodCode ?? "—"}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-col items-center gap-3 pt-4">
          <Link
            href="/products"
            className="flex h-11 w-full max-w-70 items-center justify-center bg-terra text-[12px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-[#a25e48]"
          >
            Continue Shopping
          </Link>
          <Link
            href="/"
            className="text-[13px] text-sa-muted underline underline-offset-4 hover:text-sa-primary"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </section>
  );
}
