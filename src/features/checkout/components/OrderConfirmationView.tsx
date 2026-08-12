"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatMoney } from "@/features/home/data/homeContent";
import { getOrder } from "../api/orders.service";
import { pollUntilPaymentSettles } from "../api/orders.service";
import type { OrderResponse } from "../types/checkout";

// ─── Status pill ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  AUTHORIZED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  DECLINED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function StatusPill({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? "bg-sa-border text-sa-muted";
  return (
    <span className={`rounded-full px-3 py-1 text-[12px] font-semibold ${cls}`}>
      {status}
    </span>
  );
}

// ─── Row helper ───────────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between py-2">
      <span className="text-[13px] text-sa-muted">{label}</span>
      <span className="text-[14px] font-medium text-sa-primary">{value}</span>
    </div>
  );
}

// ─── Main view ───────────────────────────────────────────────────────────────

export function OrderConfirmationView({ orderId }: { orderId: string }) {
  const searchParams = useSearchParams();
  const shouldVerify = searchParams.get("verify") === "1";

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        // C.8 — Poll payment status if returning from gateway redirect
        if (shouldVerify) {
          const result = await pollUntilPaymentSettles(orderId);
          setPaymentStatus(result.status);
        }

        // C.9 — Fetch order detail
        const orderData = await getOrder(orderId);
        setOrder(orderData);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Could not load order details.",
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [orderId, shouldVerify]);

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

  if (error || !order) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-[15px] text-sa-primary">
          {error ?? "Order not found."}
        </p>
        <Link href="/" className="text-[13px] text-terra underline">
          Return to home
        </Link>
      </div>
    );
  }

  const shippingAddress = order.addresses.find((a) => a.addressType === "SHIPPING");
  const effectivePaymentStatus = paymentStatus ?? order.paymentStatus;
  const isSuccess = ["PAID", "AUTHORIZED"].includes(effectivePaymentStatus);
  const isFailed = ["FAILED", "DECLINED"].includes(effectivePaymentStatus);
  const currency = order.currency;

  return (
    <div className="mx-auto w-full max-w-[640px] px-4 py-12">
      {/* ── Header ── */}
      <div className="mb-10 flex flex-col items-center gap-4 text-center">
        {isSuccess ? (
          <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <svg
              className="size-8 text-emerald-600 dark:text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : isFailed ? (
          <div className="flex size-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <svg
              className="size-8 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        ) : (
          <div className="flex size-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <svg
              className="size-8 text-amber-600 dark:text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        )}

        <div>
          <h1 className="text-[28px] font-bold text-sa-primary">
            {isSuccess
              ? "Order Confirmed"
              : isFailed
                ? "Payment Failed"
                : "Order Placed"}
          </h1>
          {order.orderNumber ? (
            <p className="mt-2 text-[14px] text-sa-muted">
              Order{" "}
              <span className="font-semibold text-sa-primary">{order.orderNumber}</span>
            </p>
          ) : null}
        </div>

        <StatusPill status={effectivePaymentStatus} />

        {isFailed ? (
          <div className="mt-2 rounded border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            Your payment was not completed. Please{" "}
            <Link href="/checkout" className="underline">
              try again
            </Link>
            .
          </div>
        ) : null}

        {/* Guest token notice */}
        {order.customer.isGuest && order.orderNumber ? (
          <div className="mt-2 w-full rounded border border-amber-200 bg-amber-50 px-4 py-3 text-left text-[12px] text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
            <strong>Save your order number:</strong>{" "}
            <span className="font-mono font-semibold">{order.orderNumber}</span>
            <br />
            You'll need it to track your order.
          </div>
        ) : null}
      </div>

      {/* ── Order items ── */}
      <div className="mb-8 border border-sa-border">
        <div className="border-b border-sa-border px-5 py-3">
          <h2 className="text-[14px] font-semibold uppercase tracking-wide text-sa-primary">
            Items
          </h2>
        </div>
        <ul className="divide-y divide-sa-border">
          {order.lines.map((line) => (
            <li key={line.orderLineId} className="flex items-center justify-between px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-sa-primary">
                  {line.productName ?? line.sku}
                </p>
                <p className="mt-0.5 text-[12px] text-sa-muted">
                  {line.variantName
                    ? `${line.variantName} · `
                    : ""}
                  Qty {line.quantity}
                </p>
              </div>
              <p className="ml-4 shrink-0 text-[14px] font-semibold text-sa-primary">
                {formatMoney(Number(line.lineTotal), line.currencyCode)}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Totals ── */}
      <div className="mb-8 border border-sa-border px-5 py-4">
        <h2 className="mb-3 text-[14px] font-semibold uppercase tracking-wide text-sa-primary">
          Summary
        </h2>
        <div className="divide-y divide-sa-border">
          <Row label="Subtotal" value={formatMoney(Number(order.totals.subtotal), currency)} />
          {Number(order.totals.discount) > 0 ? (
            <Row
              label="Discount"
              value={
                <span className="text-terra">
                  −{formatMoney(Number(order.totals.discount), currency)}
                </span>
              }
            />
          ) : null}
          <Row
            label="Shipping"
            value={
              Number(order.totals.shipping) === 0
                ? "Free"
                : formatMoney(Number(order.totals.shipping), currency)
            }
          />
          <div className="flex items-baseline justify-between pt-3">
            <span className="text-[16px] font-bold text-sa-primary">Total</span>
            <span className="text-[20px] font-bold text-sa-primary">
              {formatMoney(Number(order.totals.total), currency)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Shipping address ── */}
      {shippingAddress ? (
        <div className="mb-8 border border-sa-border px-5 py-4">
          <h2 className="mb-3 text-[14px] font-semibold uppercase tracking-wide text-sa-primary">
            Shipping to
          </h2>
          <address className="not-italic text-[13px] leading-6 text-sa-muted">
            {shippingAddress.fullName ? (
              <span className="block font-medium text-sa-primary">
                {shippingAddress.fullName}
              </span>
            ) : null}
            {shippingAddress.address1 ? (
              <span className="block">{shippingAddress.address1}</span>
            ) : null}
            {shippingAddress.city ? (
              <span className="block">
                {[shippingAddress.city, shippingAddress.countryCode]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            ) : null}
          </address>
        </div>
      ) : null}

      {/* ── Delivery + payment methods ── */}
      <div className="mb-10 grid grid-cols-2 gap-4">
        {order.selectedDeliveryMethod ? (
          <div className="border border-sa-border px-4 py-3">
            <p className="mb-1 text-[11px] uppercase tracking-wide text-sa-muted">
              Delivery
            </p>
            <p className="text-[13px] font-medium text-sa-primary">
              {order.selectedDeliveryMethod.methodCode ?? "Standard"}
            </p>
          </div>
        ) : null}
        {order.selectedPaymentMethod ? (
          <div className="border border-sa-border px-4 py-3">
            <p className="mb-1 text-[11px] uppercase tracking-wide text-sa-muted">
              Payment
            </p>
            <p className="text-[13px] font-medium text-sa-primary">
              {order.selectedPaymentMethod.methodCode ?? "—"}
            </p>
          </div>
        ) : null}
      </div>

      {/* ── Actions ── */}
      <div className="flex flex-col items-center gap-4">
        <Link
          href="/products"
          className="flex h-10 w-full max-w-[240px] items-center justify-center bg-terra text-[12px] font-semibold uppercase tracking-wide text-white hover:bg-[#a25e48]"
        >
          Continue shopping
        </Link>
        <Link
          href="/"
          className="text-[13px] text-sa-muted underline underline-offset-2 hover:text-sa-primary"
        >
          Return to home
        </Link>
      </div>
    </div>
  );
}
