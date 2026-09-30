"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageLoading } from "@/components/ui/PageLoading";
import {
  cancelOrder,
  getCustomerOrderDetail,
  type CancelOrderResponse,
  type CancellationWindow,
} from "@/features/account/api/customerOrders.service";
import { AccountPageShell } from "@/features/account/components/AccountPageShell";
import { AccountStatusPill } from "@/features/account/components/AccountStatus";
import { accountContainer } from "@/features/account/constants/accountLayout";
import { orderDeliveryLabel, orderPaymentLabel } from "@/features/checkout/utils/methodLabels";
import { formatMoney } from "@/features/home/utils/formatMoney";
import {
  getOrderTracking,
  getOrderTrackingTimeline,
} from "@/features/tracking/api/orderTracking.service";
import { OrderTrackingPanel } from "@/features/tracking/components/OrderTrackingPanel";
import { ApiClientError } from "@/lib/api/apiError";
import { formatOrderDate, needsPayment, orderStatusDisplay } from "../utils/orderStatus";
import { HistoricalGiftNote } from "./HistoricalGiftNote";
import { HistoricalLineDiscount } from "./HistoricalLineDiscount";
import { trackingSummaryFromDetail } from "../utils/trackingFallback";

type Feedback = { tone: "success" | "info" | "error"; text: string };

const FEEDBACK_CLASS: Record<Feedback["tone"], string> = {
  success: "border-[#b7dfc4] bg-[#eef8f1] text-[#1a7338]",
  info: "border-sa-border bg-section-soft text-sa-primary",
  error: "border-[#e3b5a8] bg-[#fbefeb] text-[#8c3a2b]",
};

function cancelFeedback(result: CancelOrderResponse): Feedback {
  if (result.orderCancelled) {
    return {
      tone: "success",
      text: result.requiresRefund
        ? "Your order has been cancelled. Your refund will go back to your original payment method."
        : "Your order has been cancelled.",
    };
  }
  if (result.cancellationAccepted) {
    return { tone: "info", text: "We’ve received your cancellation request and will confirm it by email." };
  }
  return { tone: "error", text: "We couldn’t cancel this order. Please contact our customer care team." };
}

function cancelErrorText(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.code === "BUSINESS_RULE_FAILED") return "This order can no longer be cancelled.";
    if (error.status === 404) return "We couldn’t find this order.";
    return error.message;
  }
  return "We couldn’t cancel this order. Please try again.";
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-sa-border">
      <div className="border-b border-sa-border bg-section-soft px-5 py-3">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-sa-muted">{title}</h2>
      </div>
      <div className="bg-page px-5 py-4">{children}</div>
    </section>
  );
}

/**
 * Countdown for the cancellation window. Counts from the server's
 * `remainingSeconds` at fetch time rather than `endsAt`, so a skewed device
 * clock can't show a window that's already closed.
 */
function CancelOrderPanel({
  window: cw,
  fetchedAt,
  pending,
  onConfirm,
  onExpired,
}: {
  window: CancellationWindow;
  fetchedAt: number;
  pending: boolean;
  onConfirm: () => void;
  onExpired: () => void;
}) {
  const [now, setNow] = useState(fetchedAt);
  const [confirming, setConfirming] = useState(false);
  const expiredReported = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const endsAtMs =
    cw.remainingSeconds != null
      ? fetchedAt + cw.remainingSeconds * 1000
      : cw.endsAt
        ? Date.parse(cw.endsAt)
        : fetchedAt;
  const remaining = Math.max(0, Math.floor((endsAtMs - now) / 1000));

  useEffect(() => {
    if (remaining > 0 || expiredReported.current) return;
    expiredReported.current = true;
    onExpired();
  }, [remaining, onExpired]);

  if (remaining <= 0) return null;

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#e7d3a8] bg-[#f7efdd] px-5 py-4">
      <div>
        <p className="text-[13.5px] font-semibold text-[#6d5320]">You can still cancel this order</p>
        <p className="mt-0.5 text-[12px] text-[#8a6a2f]">
          Window closes in{" "}
          <span className="font-mono font-bold" aria-live="off">
            {mm}:{ss}
          </span>
        </p>
      </div>
      {confirming ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[12px] text-[#6d5320]">Cancel this order?</span>
          <button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className="flex h-9 items-center rounded-md bg-[#8c3a2b] px-4 text-[11px] font-semibold uppercase tracking-wide text-white transition-opacity disabled:opacity-60"
          >
            {pending ? "Cancelling…" : "Yes, cancel order"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirming(false)}
            className="text-[12px] font-medium text-[#6d5320] underline underline-offset-2"
          >
            Keep order
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="flex h-9 items-center rounded-md border border-[#c9a45c] bg-white px-4 text-[11px] font-semibold uppercase tracking-wide text-[#6d5320] transition-colors hover:bg-[#fbf5e8]"
        >
          Cancel order
        </button>
      )}
    </div>
  );
}

export function AccountOrderDetailPageView({ orderId }: { orderId: string }) {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const detailQuery = useQuery({
    queryKey: ["customer-order-detail", orderId],
    queryFn: () => getCustomerOrderDetail(orderId),
    retry: 1,
  });
  const orderNumber = detailQuery.data?.order.orderNumber ?? null;

  // Richer tracking view (carrier, estimated delivery, shipment items). The
  // detail payload is the fallback if it can't be loaded.
  const trackingQuery = useQuery({
    queryKey: ["order-tracking", orderNumber, "account"],
    queryFn: () => getOrderTracking(orderNumber as string),
    enabled: Boolean(orderNumber),
    retry: false,
    staleTime: 60_000,
  });
  const shipmentCount =
    trackingQuery.data?.shipments.length ?? detailQuery.data?.order.shipments?.length ?? 0;
  const timelineQuery = useQuery({
    queryKey: ["order-tracking-timeline", orderNumber, "account"],
    queryFn: () => getOrderTrackingTimeline(orderNumber as string),
    enabled: Boolean(orderNumber) && shipmentCount > 0,
    retry: false,
    staleTime: 60_000,
  });

  const refreshOrder = () => {
    void queryClient.invalidateQueries({ queryKey: ["customer-order-detail", orderId] });
    void queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
    void queryClient.invalidateQueries({ queryKey: ["order-tracking"] });
  };

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(orderId, "Cancelled by customer"),
    onSuccess: (result) => setFeedback(cancelFeedback(result)),
    onError: (error) => setFeedback({ tone: "error", text: cancelErrorText(error) }),
    onSettled: refreshOrder,
  });

  if (detailQuery.isPending) {
    return (
      <AccountPageShell>
        <PageLoading label="Loading your order…" />
      </AccountPageShell>
    );
  }

  const data = detailQuery.data;
  if (detailQuery.isError || !data) {
    return (
      <AccountPageShell>
        <div className={`${accountContainer} py-20 text-center`}>
          <p className="text-[14.5px] text-sa-primary">We couldn’t find this order.</p>
          <Link
            href="/account/orders"
            className="mt-3 inline-block text-[12px] text-terra underline underline-offset-4"
          >
            Back to Purchase History
          </Link>
        </div>
      </AccountPageShell>
    );
  }

  const { order, cancellationWindow } = data;
  const { label, tone } = orderStatusDisplay(order.status);
  const currency = order.currency;
  const shippingAddress = order.addresses.find((a) => a.addressType === "SHIPPING");
  const billingAddress = order.addresses.find((a) => a.addressType === "BILLING");
  const trackingSummary = trackingQuery.data ?? trackingSummaryFromDetail(data);
  const payable = needsPayment(order.status, order.paymentStatus);
  const showCancel =
    Boolean(cancellationWindow?.canCancel && cancellationWindow.isInsideWindow) &&
    !cancelMutation.isSuccess;
  const needsSupport = order.status === "FAILED" || order.status === "MANUAL_REVIEW";

  return (
    <AccountPageShell>
      <div className={`${accountContainer} flex flex-col gap-5 py-8 lg:py-10`}>
        <Link
          href="/account/orders"
          className="inline-flex w-fit items-center gap-1.5 text-[12px] text-sa-muted transition-colors hover:text-terra"
        >
          <span aria-hidden="true">←</span> Back to Purchase History
        </Link>

        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[19px] font-bold text-sa-primary lg:text-[22px]">
              Order <span className="font-mono">{order.orderNumber ?? orderId.slice(0, 8).toUpperCase()}</span>
            </h1>
            <p className="mt-1 text-[12px] text-sa-muted">
              Placed on {formatOrderDate(order.createdAt, { long: true })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <AccountStatusPill label={label} tone={tone} />
            {payable ? (
              <Link
                href={`/checkout/payment/cancel?orderId=${encodeURIComponent(order.orderId)}`}
                className="flex h-9 items-center bg-terra px-4 text-[11px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#a25e48]"
              >
                Complete payment
              </Link>
            ) : null}
          </div>
        </header>

        {feedback ? (
          <p className={`rounded-lg border px-5 py-3 text-[13px] ${FEEDBACK_CLASS[feedback.tone]}`} role="status">
            {feedback.text}
          </p>
        ) : null}

        {showCancel && cancellationWindow ? (
          <CancelOrderPanel
            window={cancellationWindow}
            fetchedAt={detailQuery.dataUpdatedAt}
            pending={cancelMutation.isPending}
            onConfirm={() => {
              setFeedback(null);
              cancelMutation.mutate();
            }}
            onExpired={refreshOrder}
          />
        ) : null}

        {needsSupport ? (
          <p className="rounded-lg border border-sa-border bg-section-soft px-5 py-3 text-[13px] text-sa-primary">
            Need help with this order? Please contact our customer care team and quote the order number above.
          </p>
        ) : null}

        <OrderTrackingPanel summary={trackingSummary} timeline={timelineQuery.data} />

        <Card title={`Items ordered (${order.lines.length})`}>
          <ul className="divide-y divide-sa-border">
            {order.lines.map((line) => {
              const quantity = Number.parseInt(line.quantity, 10) || 1;
              return (
                <li key={line.orderLineId} className="flex items-start gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-sa-primary">
                      {line.productName ?? line.sku}
                    </p>
                    <p className="mt-0.5 text-[12px] text-sa-muted">
                      {[
                        line.variantName && line.variantName !== line.productName ? line.variantName : null,
                        `Qty ${quantity}`,
                        quantity > 1 ? `${formatMoney(Number(line.unitPrice), line.currencyCode || currency)} each` : null,
                        line.sku,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <HistoricalLineDiscount
                      snapshot={line.promotionSnapshot}
                      currency={line.currencyCode || currency}
                      className="mt-1 text-[12px] text-sa-muted"
                    />
                  </div>
                  <p className="shrink-0 text-[13px] font-semibold text-sa-primary">
                    {formatMoney(Number(line.lineTotal), line.currencyCode || currency)}
                  </p>
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="grid gap-5 sm:grid-cols-2">
          <Card title="Order summary">
            <dl className="flex flex-col gap-2.5 text-[12px]">
              <div className="flex justify-between">
                <dt className="text-sa-muted">Subtotal</dt>
                <dd className="font-medium text-sa-primary">{formatMoney(Number(order.totals.subtotal), currency)}</dd>
              </div>
              {Number(order.totals.discount) > 0 ? (
                <div className="flex justify-between">
                  <dt className="text-sa-muted">Discount</dt>
                  <dd className="font-medium text-terra">−{formatMoney(Number(order.totals.discount), currency)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-sa-muted">Shipping</dt>
                <dd className="font-medium text-sa-primary">
                  {Number(order.totals.shipping) > 0 ? formatMoney(Number(order.totals.shipping), currency) : "Free"}
                </dd>
              </div>
              {Number(order.totals.tax) > 0 ? (
                <div className="flex justify-between">
                  <dt className="text-sa-muted">Tax</dt>
                  <dd className="font-medium text-sa-primary">{formatMoney(Number(order.totals.tax), currency)}</dd>
                </div>
              ) : null}
              <HistoricalGiftNote
                snapshot={order.promotionSnapshot}
                className="text-[12px] text-sa-muted"
              />
              <div className="mt-1 flex justify-between border-t border-sa-border pt-3.5">
                <dt className="text-[13.5px] font-bold text-sa-primary">Total</dt>
                <dd className="text-[13.5px] font-bold text-sa-primary">{formatMoney(Number(order.totals.total), currency)}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Delivery & payment">
            <div className="flex flex-col gap-4 text-[12px] leading-6">
              {shippingAddress ? (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-sa-muted">Ship to</p>
                  <address className="not-italic text-sa-primary">
                    {shippingAddress.fullName ? <span className="block font-medium">{shippingAddress.fullName}</span> : null}
                    {shippingAddress.address1 ? <span className="block text-sa-muted">{shippingAddress.address1}</span> : null}
                    <span className="block text-sa-muted">
                      {[shippingAddress.city, shippingAddress.countryCode].filter(Boolean).join(", ")}
                    </span>
                  </address>
                </div>
              ) : null}
              {billingAddress ? (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-sa-muted">Bill to</p>
                  <address className="not-italic text-sa-primary">
                    {billingAddress.fullName ? <span className="block font-medium">{billingAddress.fullName}</span> : null}
                    {billingAddress.address1 ? <span className="block text-sa-muted">{billingAddress.address1}</span> : null}
                    <span className="block text-sa-muted">
                      {[billingAddress.city, billingAddress.countryCode].filter(Boolean).join(", ")}
                    </span>
                  </address>
                </div>
              ) : null}
              <dl className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-sa-muted">Delivery</dt>
                  <dd className="font-medium text-sa-primary">{orderDeliveryLabel(order.selectedDeliveryMethod)}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-sa-muted">Payment</dt>
                  <dd className="font-medium text-sa-primary">{orderPaymentLabel(order.selectedPaymentMethod)}</dd>
                </div>
              </dl>
            </div>
          </Card>
        </div>
      </div>
    </AccountPageShell>
  );
}
