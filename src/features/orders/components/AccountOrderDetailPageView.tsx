"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Package } from "lucide-react";
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
import { AppliedCampaigns } from "@/features/promotions/components/AppliedCampaigns";
import { readPromotionSnapshot } from "@/features/promotions/types/promotions";
import { hasOrderLoyaltySection, OrderRewardNote } from "@/features/loyalty/components/OrderRewardNote";
import { useOrderReward } from "@/features/loyalty/hooks/useOrderReward";
import {
  accountCol,
  accountCrumbs,
  accountEyebrow,
  accountHead,
  accountLayout,
  accountLede,
  accountPanel,
  accountPanelBody,
  accountPanelHead,
  accountPanelTitle,
  accountPrimaryCta,
  orderCancel,
  orderCancelBtn,
  orderCancelConfirm,
  orderDetailBlock,
  orderDetailText,
  orderFactLabel,
  orderHeadMeta,
  orderLine,
  orderLineMeta,
  orderLineName,
  orderLinePrice,
  orderLineThumb,
  orderLines,
  orderNotice,
  orderNoticeTone,
  orderSave,
  orderTotalRow,
  orderTotals,
} from "@/styles/accountChrome";
import { crumbsList, pageTitle } from "@/styles/shopChrome";
import { HistoricalGiftNote } from "./HistoricalGiftNote";
import { HistoricalLineDiscount } from "./HistoricalLineDiscount";
import { trackingSummaryFromDetail } from "../utils/trackingFallback";

type Feedback = { tone: keyof typeof orderNoticeTone; text: string };

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

function Panel({
  title,
  flush = false,
  children,
}: {
  title: string;
  /** The body brings its own padding (item rows). */
  flush?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={accountPanel}>
      <header className={accountPanelHead}>
        <h2 className={accountPanelTitle}>{title}</h2>
      </header>
      {flush ? children : <div className={accountPanelBody}>{children}</div>}
    </section>
  );
}

function AddressBlock({
  label,
  address,
}: {
  label: string;
  address: { fullName: string | null; address1: string | null; city: string | null; countryCode: string | null };
}) {
  return (
    <div className={orderDetailBlock}>
      <p className={orderFactLabel}>{label}</p>
      <address className={orderDetailText}>
        {address.fullName ? <b>{address.fullName}</b> : null}
        {address.address1 ? <span className="block">{address.address1}</span> : null}
        <span className="block">{[address.city, address.countryCode].filter(Boolean).join(", ")}</span>
      </address>
    </div>
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
    <div className={orderCancel}>
      <div>
        <p className="m-0 text-[0.86rem] font-semibold">You can still cancel this order</p>
        <p className="m-0 mt-0.5 text-[0.76rem]">
          Window closes in{" "}
          <span className="font-semibold tabular-nums" aria-live="off">
            {mm}:{ss}
          </span>
        </p>
      </div>
      {confirming ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[0.76rem]">Cancel this order?</span>
          <button type="button" disabled={pending} onClick={onConfirm} className={orderCancelConfirm}>
            {pending ? "Cancelling…" : "Yes, cancel order"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirming(false)}
            className="cursor-pointer border-0 bg-transparent p-0 text-[0.76rem] font-medium text-inherit underline underline-offset-2 [font:inherit]"
          >
            Keep order
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} className={orderCancelBtn}>
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
  const orderReward = useOrderReward(orderId);

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
          <p className={`${accountLede} mx-auto mt-0!`}>We couldn’t find this order.</p>
          <LocaleLink
            href="/account/orders"
            className="mt-4 inline-block text-[0.8rem] font-medium text-[var(--copper,#8c4435)] underline underline-offset-4"
          >
            Back to Purchase History
          </LocaleLink>
        </div>
      </AccountPageShell>
    );
  }

  const { order, cancellationWindow } = data;
  const { label, tone } = orderStatusDisplay(order.status);
  const currency = order.currency;
  const reference = order.orderNumber ?? orderId.slice(0, 8).toUpperCase();
  const shippingAddress = order.addresses.find((a) => a.addressType === "SHIPPING");
  const billingAddress = order.addresses.find((a) => a.addressType === "BILLING");
  const trackingSummary = trackingQuery.data ?? trackingSummaryFromDetail(data);
  const payable = needsPayment(order.status, order.paymentStatus);
  const showCancel =
    Boolean(cancellationWindow?.canCancel && cancellationWindow.isInsideWindow) &&
    !cancelMutation.isSuccess;
  const needsSupport = order.status === "FAILED" || order.status === "MANUAL_REVIEW";
  const itemCount = order.lines.reduce((sum, line) => sum + (Number.parseInt(line.quantity, 10) || 1), 0);

  return (
    <AccountPageShell>
      <div className={accountContainer}>
        <nav aria-label="Breadcrumb" className={accountCrumbs}>
          <ol className={crumbsList} role="list">
            <li>
              <LocaleLink href="/">Home</LocaleLink>
            </li>
            <li>
              <LocaleLink href="/account/orders">Purchase History</LocaleLink>
            </li>
            <li aria-current="page">{reference}</li>
          </ol>
        </nav>

        <header className={accountHead}>
          <div className="min-w-0">
            <p className={accountEyebrow}>Order</p>
            <h1 className={`${pageTitle} break-words`}>{reference}</h1>
            <p className={orderHeadMeta}>
              <AccountStatusPill label={label} tone={tone} />
              <span className={`${accountLede} mt-0!`}>
                Placed on {formatOrderDate(order.createdAt, { long: true })} · {itemCount}{" "}
                {itemCount === 1 ? "item" : "items"}
              </span>
            </p>
          </div>
          {payable ? (
            <LocaleLink
              href={`/checkout/payment/cancel?orderId=${encodeURIComponent(order.orderId)}`}
              className={accountPrimaryCta}
            >
              Complete payment
            </LocaleLink>
          ) : null}
        </header>

        {feedback || (showCancel && cancellationWindow) || needsSupport ? (
          <div className="mb-[clamp(20px,3vw,28px)] flex flex-col gap-3">
            {feedback ? (
              <p className={`${orderNotice} ${orderNoticeTone[feedback.tone]}`} role="status">
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
              <p className={`${orderNotice} ${orderNoticeTone.info}`}>
                Need help with this order? Please contact our customer care team and quote the order number above.
              </p>
            ) : null}
          </div>
        ) : null}

        <div className={accountLayout}>
          {/* Progress first, then what was ordered, then the shipment history. */}
          <OrderTrackingPanel summary={trackingSummary} timeline={timelineQuery.data}>
            <Panel title={`Items (${order.lines.length})`} flush>
              <ul className={orderLines} role="list">
                {order.lines.map((line) => {
                  const quantity = Number.parseInt(line.quantity, 10) || 1;
                  const lineCurrency = line.currencyCode || currency;
                  return (
                    <li key={line.orderLineId} className={orderLine}>
                      <span className={orderLineThumb} aria-hidden="true">
                        {line.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={line.imageUrl} alt="" loading="lazy" />
                        ) : (
                          <Package size={20} strokeWidth={1.6} />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={orderLineName}>{line.productName ?? line.sku}</p>
                        <p className={orderLineMeta}>
                          {[
                            // "Default Title" is the placeholder a single-variant product carries, not a size.
                            line.variantName &&
                            line.variantName !== line.productName &&
                            line.variantName.trim().toLowerCase() !== "default title"
                              ? line.variantName
                              : null,
                            `Qty ${quantity}`,
                            quantity > 1 ? `${formatMoney(Number(line.unitPrice), lineCurrency)} each` : null,
                            line.sku,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        <HistoricalLineDiscount
                          snapshot={line.promotionSnapshot}
                          currency={lineCurrency}
                          className={orderLineMeta}
                        />
                      </div>
                      <p className={orderLinePrice}>{formatMoney(Number(line.lineTotal), lineCurrency)}</p>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          </OrderTrackingPanel>

          <aside className={accountCol} aria-label="Order summary and delivery">
            <Panel title="Order summary">
              <dl className={orderTotals}>
                <div>
                  <dt>Subtotal</dt>
                  <dd>{formatMoney(Number(order.totals.subtotal), currency)}</dd>
                </div>
                {Number(order.totals.discount) > 0 ? (
                  <div>
                    <dt>Discount</dt>
                    <dd className={orderSave}>−{formatMoney(Number(order.totals.discount), currency)}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Shipping</dt>
                  <dd>
                    {Number(order.totals.shipping) > 0 ? formatMoney(Number(order.totals.shipping), currency) : "Free"}
                  </dd>
                </div>
                {Number(order.totals.tax) > 0 ? (
                  <div>
                    <dt>Tax</dt>
                    <dd>{formatMoney(Number(order.totals.tax), currency)}</dd>
                  </div>
                ) : null}
                <HistoricalGiftNote snapshot={order.promotionSnapshot} className={orderLineMeta} />
                <AppliedCampaigns snapshot={readPromotionSnapshot(order.promotionSnapshot)} />
                <div className={orderTotalRow}>
                  <dt>Total</dt>
                  <dd>{formatMoney(Number(order.totals.total), currency)}</dd>
                </div>
              </dl>
            </Panel>

            <Panel title="Delivery and payment">
              {shippingAddress ? <AddressBlock label="Ship to" address={shippingAddress} /> : null}
              {billingAddress ? <AddressBlock label="Bill to" address={billingAddress} /> : null}
              <dl className={`${orderDetailBlock} m-0 grid grid-cols-2 gap-4`}>
                <div>
                  <dt className={orderFactLabel}>Delivery</dt>
                  <dd className={`${orderDetailText} font-medium text-[var(--ink,#241f1b)]!`}>
                    {orderDeliveryLabel(order.selectedDeliveryMethod)}
                  </dd>
                </div>
                <div>
                  <dt className={orderFactLabel}>Payment</dt>
                  <dd className={`${orderDetailText} font-medium text-[var(--ink,#241f1b)]!`}>
                    {orderPaymentLabel(order.selectedPaymentMethod)}
                  </dd>
                </div>
              </dl>
            </Panel>

            {hasOrderLoyaltySection(orderReward) ? (
              <Panel title="Rewards">
                <OrderRewardNote reward={orderReward} showHeading={false} />
              </Panel>
            ) : null}
          </aside>
        </div>
      </div>
    </AccountPageShell>
  );
}
