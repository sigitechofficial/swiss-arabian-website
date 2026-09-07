"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/features/home/data/homeContent";
import { useAuthStore } from "@/stores/useAuthStore";
import { listOrders } from "@/features/account/api/customerOrders.service";
import {
  getGuestOrderTracking,
  type GuestOrderTrackingSummaryResponse,
} from "../api/orderTracking.service";
import { getStoredGuestOrderAccessToken } from "@/features/checkout/utils/checkoutSession";
import { GuestAfterSalesSection } from "@/features/afterSales";
import { guestAfterSalesLines } from "@/features/afterSales/utils/lines";

// ─── Display maps ─────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Order Received",
  PAYMENT_PENDING: "Awaiting Payment",
  PAYMENT_AUTHORIZED: "Payment Authorized",
  PAID: "Payment Confirmed",
  CANCELLATION_WINDOW: "Processing",
  READY_FOR_FULFILLMENT: "Order Confirmed",
  FULFILLMENT_QUEUED: "Preparing Your Order",
  SHIPMENT_CREATED: "Shipped",
  IN_TRANSIT: "On the Way",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUND_PENDING: "Refund Processing",
  REFUNDED: "Refunded",
  MANUAL_REVIEW: "Under Review",
  FAILED: "Failed",
};

const EVENT_TITLE: Record<string, string> = {
  ORDER_CREATED: "Order placed",
  PAYMENT_PENDING: "Awaiting payment",
  PAYMENT_AUTHORIZED: "Payment authorized",
  PAYMENT_CONFIRMED: "Payment confirmed",
  PAID: "Payment confirmed",
  CANCELLATION_WINDOW_STARTED: "Order is being prepared",
  CANCELLATION_WINDOW: "Order is being prepared",
  READY_FOR_FULFILLMENT: "Ready for fulfillment",
  FULFILLMENT_QUEUED: "Preparing shipment",
  SHIPMENT_CREATED: "Shipment created",
  IN_TRANSIT: "Package in transit",
  DELIVERED: "Delivered",
  CANCELLED: "Order cancelled",
  REFUND_PENDING: "Refund in progress",
  REFUNDED: "Refunded",
};

function humanizeEventTitle(title: string | null, eventType: string): string {
  const key = (eventType || title || "").toUpperCase().replace(/\s+/g, "_");
  if (EVENT_TITLE[key]) return EVENT_TITLE[key];
  if (title) {
    // Soften raw backend titles: "payment confirmed" → "Payment confirmed"
    const cleaned = title.replace(/_/g, " ").trim();
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return "Order update";
}

/** Hide internal webhook / system noise from customers. */
function isCustomerFacingDescription(description: string | null): boolean {
  if (!description) return false;
  const lower = description.toLowerCase();
  if (lower.includes("webhook")) return false;
  if (lower.includes("session_created")) return false;
  if (lower.includes("->")) return false;
  if (lower.includes("reconciled")) return false;
  return true;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-AE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Token form ───────────────────────────────────────────────────────────────

function TokenForm({
  orderNumber,
  onLookup,
  errorMsg,
}: {
  orderNumber: string;
  onLookup: (token: string) => void;
  errorMsg?: string | null;
}) {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token.trim()) {
      setError("Please enter your tracking token.");
      return;
    }
    setError("");
    onLookup(token.trim());
  }

  return (
    <div className="mx-auto w-full max-w-md py-10 text-center">
      <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-section-soft">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-terra">
          <path d="M3 8l9-5 9 5v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 8l9 5 9-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <h1 className="text-[22px] font-bold tracking-tight text-sa-primary">Track your order</h1>
      <p className="mt-2 text-[13px] leading-relaxed text-sa-muted">
        Enter the tracking token from your confirmation email for order{" "}
        <span className="font-mono font-semibold text-sa-primary">{orderNumber}</span>.
      </p>
      {errorMsg ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {errorMsg}
        </p>
      ) : null}
      <form onSubmit={submit} className="mt-6 flex flex-col gap-3 text-left">
        <label className="text-[11px] font-semibold uppercase tracking-widest text-sa-muted">
          Tracking token
        </label>
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste your token here"
          className="h-11 w-full rounded-md border border-sa-border bg-page px-4 text-[13px] text-sa-primary placeholder:text-sa-muted focus:border-terra focus:outline-none"
        />
        {error ? <p className="text-[12px] text-red-600">{error}</p> : null}
        <button
          type="submit"
          className="mt-1 flex h-11 items-center justify-center rounded-md bg-terra text-[12px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-[#a25e48]"
        >
          Track Order
        </button>
      </form>
    </div>
  );
}

// ─── Progress stepper ─────────────────────────────────────────────────────────

function ProgressStepper({ currentStep }: { currentStep: number }) {
  const steps = ["Received", "Confirmed", "Preparing", "Shipped", "Delivered"];

  return (
    <div className="overflow-hidden border border-sa-border bg-page">
      <div className="border-b border-sa-border bg-section-soft px-5 py-3">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-sa-muted">
          Delivery progress
        </h2>
      </div>
      <div className="px-4 py-6 sm:px-6">
        <div className="flex items-start justify-between">
          {steps.map((step, idx) => {
            const active = currentStep === idx;
            const done = idx < currentStep;
            return (
              <div key={step} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-2">
                  <span
                    className={`flex size-8 items-center justify-center rounded-full border-2 text-[12px] font-bold transition-colors ${
                      active
                        ? "border-terra bg-terra text-white"
                        : done
                          ? "border-terra bg-page text-terra"
                          : "border-sa-border bg-page text-sa-muted"
                    }`}
                  >
                    {done && !active ? (
                      <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                        <path
                          d="M1 5l3.5 3.5L11 1"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      idx + 1
                    )}
                  </span>
                  <span
                    className={`max-w-18 text-center text-[11px] font-medium leading-tight sm:text-[12px] ${
                      active ? "text-terra" : done ? "text-sa-primary" : "text-sa-muted"
                    }`}
                  >
                    {step}
                  </span>
                </div>
                {idx < steps.length - 1 ? (
                  <div
                    className={`mx-1 mb-5 h-px flex-1 sm:mx-2 ${
                      idx < currentStep ? "bg-terra" : "bg-sa-border"
                    }`}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden border border-sa-border bg-page">
      <div className="border-b border-sa-border bg-section-soft px-5 py-3">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-sa-muted">
          {title}
        </h2>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export function GuestTrackingPageView({ orderNumber }: { orderNumber: string }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [token, setToken] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<GuestOrderTrackingSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authRedirecting, setAuthRedirecting] = useState(false);

  // Logged-in users should use account order detail (JWT), not guest token API
  useEffect(() => {
    if (!isAuthenticated || !orderNumber) return;
    let cancelled = false;
    setAuthRedirecting(true);

    listOrders({ limit: 50, offset: 0 })
      .then((res) => {
        if (cancelled) return;
        const match = res.items.find((o) => o.orderNumber === orderNumber);
        if (match) {
          router.replace(`/account/orders/${match.orderId}`);
          return;
        }
        setAuthRedirecting(false);
        setErrorMsg(
          "This order was not found in your account. Use Purchase History, or track as guest with your email token.",
        );
      })
      .catch(() => {
        if (cancelled) return;
        setAuthRedirecting(false);
        router.replace("/account/orders");
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, orderNumber, router]);

  // Guest: load order-scoped token only (never use orderNumber as token)
  useEffect(() => {
    if (isAuthenticated) return;
    const stored = getStoredGuestOrderAccessToken(orderNumber);
    if (stored && stored !== orderNumber) {
      setToken(stored);
    }
  }, [orderNumber, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated || !token || token === orderNumber) return;
    setLoading(true);
    setErrorMsg(null);
    getGuestOrderTracking(orderNumber, token)
      .then((res) => {
        setOrderData(res);
        setLoading(false);
      })
      .catch(() => {
        setErrorMsg(
          "Could not find your order. Use the tracking token from your confirmation email — not the order number.",
        );
        setLoading(false);
        setToken(null);
      });
  }, [orderNumber, token, isAuthenticated]);

  function handleTokenLookup(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === orderNumber) {
      setErrorMsg(
        "Please paste the tracking token from your email — not the order number.",
      );
      return;
    }
    setErrorMsg(null);
    setToken(trimmed);
  }

  const statusLabel = orderData
    ? (STATUS_LABEL[orderData.status] ?? orderData.status)
    : "";

  const stepMap: Record<string, number> = {
    DRAFT: 0,
    PAYMENT_PENDING: 0,
    PAYMENT_AUTHORIZED: 1,
    PAID: 1,
    CANCELLATION_WINDOW: 1,
    READY_FOR_FULFILLMENT: 1,
    FULFILLMENT_QUEUED: 2,
    SHIPMENT_CREATED: 3,
    IN_TRANSIT: 3,
    DELIVERED: 4,
    CANCELLED: -1,
    FAILED: -1,
  };
  const currentStep = orderData ? (stepMap[orderData.status] ?? 0) : 0;

  if (isAuthenticated || authRedirecting) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 bg-page px-4 py-20 text-center">
        <span className="size-9 animate-spin rounded-full border-2 border-sa-border border-t-terra" />
        <p className="text-[13px] text-sa-muted">Opening your order…</p>
        {errorMsg ? (
          <div className="mt-2 max-w-md space-y-3">
            <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
              {errorMsg}
            </p>
            <Link
              href="/account/orders"
              className="inline-flex h-10 items-center justify-center rounded-md bg-terra px-5 text-[12px] font-semibold uppercase tracking-wide text-white hover:bg-[#a25e48]"
            >
              Go to Purchase History
            </Link>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] flex-col bg-page font-sans text-sa-primary">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-10 sm:px-8">
        {!token || loading ? (
          loading ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
              <span className="size-9 animate-spin rounded-full border-2 border-sa-border border-t-terra" />
              <p className="text-[13px] text-sa-muted">Looking up your order…</p>
            </div>
          ) : (
            <TokenForm
              orderNumber={orderNumber}
              onLookup={handleTokenLookup}
              errorMsg={errorMsg}
            />
          )
        ) : orderData ? (
          <div className="flex flex-col gap-6">
            {/* Hero */}
            <div className="text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gold">
                Order Tracking
              </p>
              <h1 className="mt-2 font-mono text-[22px] font-bold tracking-tight text-sa-primary sm:text-[26px]">
                {orderData.orderNumber}
              </h1>
              <p className="mt-2 text-[14px] text-sa-muted">
                Placed on {formatDateShort(orderData.createdAt)}
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-sa-border bg-section-soft px-4 py-1.5">
                <span className="size-1.5 rounded-full bg-terra" />
                <span className="text-[13px] font-semibold text-sa-primary">{statusLabel}</span>
              </div>
            </div>

            {/* Progress */}
            {currentStep >= 0 ? <ProgressStepper currentStep={currentStep} /> : null}

            {/* Summary + shipments grid */}
            <div className="grid gap-5 sm:grid-cols-2">
              <SectionCard title="Order Summary">
                <div className="flex flex-col gap-2.5 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-sa-muted">Items</span>
                    <span className="font-medium text-sa-primary">
                      {orderData.itemCount} item{orderData.itemCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sa-muted">Total</span>
                    <span className="font-semibold text-sa-primary">
                      {formatMoney(Number(orderData.total), orderData.currency)}
                    </span>
                  </div>
                  <div className="my-1 h-px bg-sa-border" />
                  <div className="flex justify-between">
                    <span className="text-sa-muted">Status</span>
                    <span className="font-medium text-terra">{statusLabel}</span>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Estimated Delivery">
                {orderData.estimatedDeliveryAt ? (
                  <p className="text-[15px] font-semibold text-sa-primary">
                    {formatDateShort(orderData.estimatedDeliveryAt)}
                  </p>
                ) : orderData.deliveredAt ? (
                  <p className="text-[15px] font-semibold text-sa-primary">
                    Delivered {formatDateShort(orderData.deliveredAt)}
                  </p>
                ) : (
                  <p className="text-[13px] leading-relaxed text-sa-muted">
                    We&apos;ll share an estimated delivery date once your order ships.
                  </p>
                )}
                {orderData.latestTrackingStatus ? (
                  <p className="mt-3 text-[12px] text-sa-muted">
                    Latest:{" "}
                    <span className="font-medium text-sa-primary">
                      {orderData.latestTrackingStatus.replace(/_/g, " ")}
                    </span>
                  </p>
                ) : null}
              </SectionCard>
            </div>

            {/* Shipments */}
            {orderData.shipments?.length > 0 ? (
              <SectionCard title={`Shipments (${orderData.shipments.length})`}>
                <div className="flex flex-col gap-4">
                  {orderData.shipments.map((shipment) => (
                    <div
                      key={shipment.shipmentId}
                      className="rounded-md border border-sa-border bg-section-soft/50 p-4 dark:bg-section-soft/20"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-[14px] font-semibold capitalize text-sa-primary">
                            {shipment.status.toLowerCase().replace(/_/g, " ")}
                          </p>
                          {shipment.deliveryMethod.displayName ? (
                            <p className="mt-0.5 text-[12px] text-sa-muted">
                              {shipment.deliveryMethod.displayName}
                            </p>
                          ) : null}
                          {shipment.trackingNumber ? (
                            <p className="mt-1 text-[12px] text-sa-muted">
                              Tracking{" "}
                              <span className="font-mono font-medium text-sa-primary">
                                {shipment.trackingNumber}
                              </span>
                            </p>
                          ) : null}
                        </div>
                        {shipment.trackingUrl ? (
                          <a
                            href={shipment.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-8 items-center rounded-md border border-sa-border bg-page px-3 text-[11px] font-semibold text-sa-primary transition-colors hover:border-terra hover:text-terra"
                          >
                            Carrier tracking →
                          </a>
                        ) : null}
                      </div>
                      {shipment.latestTrackingEvent ? (
                        <div className="mt-3 border-t border-sa-border pt-3">
                          <p className="text-[12px] font-semibold text-sa-primary">
                            {humanizeEventTitle(
                              shipment.latestTrackingEvent.title,
                              shipment.latestTrackingEvent.eventStatus,
                            )}
                          </p>
                          {isCustomerFacingDescription(shipment.latestTrackingEvent.description) ? (
                            <p className="mt-0.5 text-[12px] text-sa-muted">
                              {shipment.latestTrackingEvent.description}
                            </p>
                          ) : null}
                          <p className="mt-1 text-[11px] text-sa-muted">
                            {formatDate(shipment.latestTrackingEvent.eventTime)}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </SectionCard>
            ) : null}

            {token ? (
              <GuestAfterSalesSection
                orderNumber={orderData.orderNumber}
                orderAccessToken={token}
                status={orderData.status}
                fulfillmentStatus={orderData.fulfillmentStatus}
                lines={guestAfterSalesLines(orderData)}
              />
            ) : null}

            {/* Timeline */}
            {orderData.timeline?.length > 0 ? (
              <SectionCard title="Order Timeline">
                <ul className="relative flex flex-col gap-0">
                  {[...orderData.timeline].reverse().map((ev, i, arr) => (
                    <li key={i} className="relative flex gap-4 pb-5 last:pb-0">
                      {/* Rail */}
                      <div className="flex w-3 shrink-0 flex-col items-center">
                        <span
                          className={`mt-1.5 size-2.5 shrink-0 rounded-full ${
                            i === 0 ? "bg-terra" : "bg-sa-border"
                          }`}
                        />
                        {i < arr.length - 1 ? (
                          <span className="mt-1 w-px flex-1 bg-sa-border" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold text-sa-primary">
                          {humanizeEventTitle(ev.title, ev.eventType)}
                        </p>
                        {isCustomerFacingDescription(ev.description) ? (
                          <p className="mt-0.5 text-[13px] leading-relaxed text-sa-muted">
                            {ev.description}
                          </p>
                        ) : null}
                        <p className="mt-1 text-[12px] text-sa-muted">
                          {formatDate(ev.occurredAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            ) : null}

            {/* Footer CTA */}
            <div className="flex flex-col items-center gap-3 border-t border-sa-border pt-8 pb-4">
              <Link
                href="/products"
                className="flex h-11 w-full max-w-xs items-center justify-center rounded-md bg-terra text-[12px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-[#a25e48]"
              >
                Continue Shopping
              </Link>
              <Link
                href="/"
                className="text-[13px] text-sa-muted underline-offset-4 hover:text-sa-primary hover:underline"
              >
                Return to Home
              </Link>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
