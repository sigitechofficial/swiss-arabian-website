"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import type { Translator } from "@/lib/i18n/messages";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { useState, type ReactNode } from "react";
import { Package } from "lucide-react";
import { PageLoading } from "@/components/ui/PageLoading";
import {
  type CancellationWindow,
} from "@/features/account/api/customerOrders.service";
import { AccountPageShell } from "@/features/account/components/AccountPageShell";
import { AccountStatusPill } from "@/features/account/components/AccountStatus";
import { accountContainer } from "@/features/account/constants/accountLayout";
import { orderDeliveryLabel, orderPaymentLabel } from "@/features/checkout/utils/methodLabels";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { OrderTrackingPanel } from "@/features/tracking/components/OrderTrackingPanel";
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
import { OrderAfterSalesSection } from "@/features/afterSales";
import { mapOrderLinesForAfterSales } from "@/features/afterSales/utils/lines";
import { HistoricalGiftNote } from "./HistoricalGiftNote";
import { HistoricalLineDiscount } from "./HistoricalLineDiscount";
import { trackingSummaryFromDetail } from "../utils/trackingFallback";
import { refundCustomerStatus } from "../utils/orderAftercare";
import { useCancellationCountdown, useCustomerOrderDetail, type OrderCancelError } from "../hooks/useCustomerOrders";
import { StaffDiscountSummary } from "@/features/employeeBenefits/components/StaffDiscountSummary";
import { readEmployeeCheckout } from "@/features/employeeBenefits/types/employeeCheckout";

type Feedback = { tone: keyof typeof orderNoticeTone; text: string };

function cancelErrorText(error: OrderCancelError, t: Translator): string {
  if (error === "closed") return t("orders.cancel.closed");
  if (error === "notFound") return t("orders.notFound");
  if (error === "failed") return t("orders.cancel.failed");
  return error.message;
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
  const t = useShopCopy();
  const [confirming, setConfirming] = useState(false);
  const { remaining, mmss } = useCancellationCountdown(cw, fetchedAt, onExpired);

  if (remaining <= 0) return null;

  return (
    <div className={orderCancel}>
      <div>
        <p className="m-0 text-[0.86rem] font-semibold">{t("orders.cancel.stillCan")}</p>
        <p className="m-0 mt-0.5 text-[0.76rem]">
          {t("orders.cancel.closesIn")}{" "}
          <span className="font-semibold tabular-nums" aria-live="off">
            {mmss}
          </span>
        </p>
      </div>
      {confirming ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[0.76rem]">{t("orders.cancel.confirm")}</span>
          <button type="button" disabled={pending} onClick={onConfirm} className={orderCancelConfirm}>
            {pending ? t("orders.cancel.cancelling") : t("orders.cancel.yes")}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirming(false)}
            className="cursor-pointer border-0 bg-transparent p-0 text-[0.76rem] font-medium text-inherit underline underline-offset-2 [font:inherit]"
          >
            {t("orders.cancel.keep")}
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} className={orderCancelBtn}>
          {t("orders.cancel.button")}
        </button>
      )}
    </div>
  );
}

export function AccountOrderDetailPageView({ orderId }: { orderId: string }) {
  const {
    detailQuery,
    trackingSummary: trackingFromHook,
    timeline,
    showCancel,
    cancel,
    cancelling,
    cancelResult,
    cancelFailure,
    refreshOrder,
    refunds: refundsFromHook,
  } = useCustomerOrderDetail(orderId);
  const t = useShopCopy();
  const locale = useShopLocale();
  const orderReward = useOrderReward(orderId);
  const feedback: Feedback | null = cancelResult
    ? cancelResult
    : cancelFailure
      ? { tone: "error", text: cancelErrorText(cancelFailure, t) }
      : null;

  if (detailQuery.isPending) {
    return (
      <AccountPageShell>
        <PageLoading label={t("orders.loadingOne")} />
      </AccountPageShell>
    );
  }

  const data = detailQuery.data;
  if (detailQuery.isError || !data) {
    return (
      <AccountPageShell>
        <div className={`${accountContainer} py-20 text-center`}>
          <p className={`${accountLede} mx-auto mt-0!`}>{t("orders.notFound")}</p>
          <LocaleLink
            href="/account/orders"
            className="mt-4 inline-block text-[0.8rem] font-medium text-[var(--copper,#8c4435)] underline underline-offset-4"
          >
            {t("orders.backToHistory")}
          </LocaleLink>
        </div>
      </AccountPageShell>
    );
  }

  const { order, cancellationWindow } = data;
  const { label, tone } = orderStatusDisplay(order.status, t);
  const currency = order.currency;
  const reference = order.orderNumber ?? orderId.slice(0, 8).toUpperCase();
  const shippingAddress = order.addresses.find((a) => a.addressType === "SHIPPING");
  const billingAddress = order.addresses.find((a) => a.addressType === "BILLING");
  const trackingSummary = trackingFromHook ?? trackingSummaryFromDetail(data);
  const payable = needsPayment(order.status, order.paymentStatus);
  const needsSupport = order.status === "FAILED" || order.status === "MANUAL_REVIEW";
  const itemCount = order.lines.reduce((sum, line) => sum + (Number.parseInt(line.quantity, 10) || 1), 0);
  const refunds = refundsFromHook;
  const staffQuote = readEmployeeCheckout(
    (order as { staffPurchase?: unknown }).staffPurchase ??
      (
        order.promotionSnapshot as
          | { staffPurchase?: unknown; employeeCheckout?: unknown }
          | null
          | undefined
      )?.staffPurchase ??
      (
        order.promotionSnapshot as
          | { staffPurchase?: unknown; employeeCheckout?: unknown }
          | null
          | undefined
      )?.employeeCheckout,
  );

  return (
    <AccountPageShell>
      <div className={accountContainer}>
        <nav aria-label={t("account.breadcrumbNav")} className={accountCrumbs}>
          <ol className={crumbsList} role="list">
            <li>
              <LocaleLink href="/">{t("home")}</LocaleLink>
            </li>
            <li>
              <LocaleLink href="/account/orders">{t("account.tab.orders")}</LocaleLink>
            </li>
            <li aria-current="page">{reference}</li>
          </ol>
        </nav>

        <header className={accountHead}>
          <div className="min-w-0">
            <p className={accountEyebrow}>{t("account.orderLabel")}</p>
            <h1 className={`${pageTitle} break-words`}>{reference}</h1>
            <p className={orderHeadMeta}>
              <AccountStatusPill label={label} tone={tone} />
              <span className={`${accountLede} mt-0!`}>
                {t("orders.placedOn", { date: formatOrderDate(order.createdAt, { long: true, locale }) })} ·{" "}
                {t("account.itemCount", { count: itemCount })}
              </span>
            </p>
          </div>
          {payable ? (
            <LocaleLink
              href={`/checkout/payment/cancel?orderId=${encodeURIComponent(order.orderId)}`}
              className={accountPrimaryCta}
            >
              {t("orders.completePayment")}
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
                pending={cancelling}
                onConfirm={() => {
                  cancel();
                }}
                onExpired={refreshOrder}
              />
            ) : null}

            {needsSupport ? (
              <p className={`${orderNotice} ${orderNoticeTone.info}`}>
                {t("orders.needHelp")}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className={accountLayout}>
          {/* Progress first, then what was ordered, then the shipment history. */}
          <OrderTrackingPanel summary={trackingSummary} timeline={timeline}>
            <Panel title={t("orders.items", { count: order.lines.length })} flush>
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
                            line.isGift ? t("orders.freeGift") : null,
                            t("orders.qty", { count: quantity }),
                            quantity > 1 && !line.isGift
                              ? t("orders.each", { price: formatMoney(Number(line.unitPrice), lineCurrency) })
                              : null,
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
                      <p className={orderLinePrice}>
                        {line.isGift ? t("orders.free") : formatMoney(Number(line.lineTotal), lineCurrency)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          </OrderTrackingPanel>

          <OrderAfterSalesSection
            orderId={order.orderId}
            status={order.status}
            fulfillmentStatus={order.fulfillmentStatus}
            lines={mapOrderLinesForAfterSales(order.lines)}
          />

          <aside className={accountCol} aria-label={t("orders.summaryAndDelivery")}>
            <Panel title={t("orders.summary")}>
              <dl className={orderTotals}>
                <div>
                  <dt>{t("orders.subtotal")}</dt>
                  <dd>{formatMoney(Number(order.totals.subtotal), currency)}</dd>
                </div>
                {Number(order.totals.discount) > 0 ? (
                  <div>
                    <dt>{t("orders.discount")}</dt>
                    <dd className={orderSave}>−{formatMoney(Number(order.totals.discount), currency)}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>{t("orders.shipping")}</dt>
                  <dd>
                    {Number(order.totals.shipping) > 0 ? formatMoney(Number(order.totals.shipping), currency) : t("orders.free")}
                  </dd>
                </div>
                {Number(order.totals.tax) > 0 ? (
                  <div>
                    <dt>{t("orders.tax")}</dt>
                    <dd>{formatMoney(Number(order.totals.tax), currency)}</dd>
                  </div>
                ) : null}
                <HistoricalGiftNote snapshot={order.promotionSnapshot} className={orderLineMeta} />
                <AppliedCampaigns snapshot={readPromotionSnapshot(order.promotionSnapshot)} />
                <div className={orderTotalRow}>
                  <dt>{t("orders.total")}</dt>
                  <dd>{formatMoney(Number(order.totals.total), currency)}</dd>
                </div>
              </dl>
            </Panel>

            <Panel title={t("orders.deliveryAndPayment")}>
              {shippingAddress ? <AddressBlock label={t("orders.shipTo")} address={shippingAddress} /> : null}
              {billingAddress ? <AddressBlock label={t("orders.billTo")} address={billingAddress} /> : null}
              <dl className={`${orderDetailBlock} m-0 grid grid-cols-2 gap-4`}>
                <div>
                  <dt className={orderFactLabel}>{t("orders.delivery")}</dt>
                  <dd className={`${orderDetailText} font-medium text-[var(--ink,#241f1b)]!`}>
                    {orderDeliveryLabel(order.selectedDeliveryMethod)}
                  </dd>
                </div>
                <div>
                  <dt className={orderFactLabel}>{t("orders.payment")}</dt>
                  <dd className={`${orderDetailText} font-medium text-[var(--ink,#241f1b)]!`}>
                    {orderPaymentLabel(order.selectedPaymentMethod)}
                  </dd>
                </div>
              </dl>
            </Panel>

            {hasOrderLoyaltySection(orderReward) ? (
              <Panel title={t("account.tab.rewards")}>
                <OrderRewardNote reward={orderReward} showHeading={false} />
              </Panel>
            ) : null}

            {refunds.length > 0 ? (
              <Panel title={t("orders.refunds")}>
                <ul className="m-0 grid list-none gap-3 p-0">
                  {refunds.map((refund, index) => (
                    <li key={refund.refundId ?? `refund-${index}`} className="text-[13px] leading-relaxed text-sa-primary">
                      {refund.amount ? (
                        <p className="m-0 font-semibold">
                          {refund.currency ? `${refund.currency} ` : ""}
                          {refund.amount}
                        </p>
                      ) : null}
                      <p className="m-0 mt-1 text-sa-secondary">{refundCustomerStatus(refund, t)}</p>
                      {refund.refundId ? (
                        <p className="m-0 mt-1 text-[12px] text-sa-muted">{t("orders.reference", { id: refund.refundId })}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </Panel>
            ) : null}

            {staffQuote ? (
              <Panel title={t("orders.staffDiscount")}>
                <StaffDiscountSummary checkout={staffQuote} currency={currency} surface="order" />
              </Panel>
            ) : null}
          </aside>
        </div>
      </div>
    </AccountPageShell>
  );
}
