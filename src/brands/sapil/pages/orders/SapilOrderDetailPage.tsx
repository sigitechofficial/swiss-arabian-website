"use client";

import { useState } from "react";
import type { CancellationWindow } from "@/features/account/api/customerOrders.service";
import { orderDeliveryLabel, orderPaymentLabel } from "@/features/checkout/utils/methodLabels";
import { useCancellationCountdown, useCustomerOrderDetail, type OrderCancelError } from "@/features/orders/hooks/useCustomerOrders";
import { refundCustomerStatus } from "@/features/orders/utils/orderAftercare";
import { orderProgressStep } from "@/features/orders/utils/orderStatus";
import { intlLocale } from "@/lib/i18n/locales";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { Button } from "../../ui";
import { buttonClass } from "../../ui/Button";
import { cx } from "../../ui/shared";
import { useSapilCopy, type SapilTranslator } from "../../i18n/SapilCopy";
import { SapilLink, richText, useSapilDate, useSapilMoney } from "../../components/commerce/shared";
import { StatusPill, statusText } from "../../components/account/AccountChrome";
import { OrderSideCard, OrderStateCard, SapilOrderView } from "../../components/orders/SapilOrderView";
import { AddressLines, itemCountOf, orderLines, orderSteps, orderTenders, orderTotals } from "../../components/orders/orderParts";
import { TrackingDetails, stoppedText, trackingStep, useDeliveryHighlight } from "../../components/orders/TrackingDetails";

function cancelErrorText(t: SapilTranslator, error: OrderCancelError): string {
  if (error === "closed") return t("account.odCancelClosed");
  if (error === "notFound") return t("account.odNotFound");
  if (error === "failed") return t("account.odCancelFailed");
  return error.message;
}

function CancelPanel({
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
  const t = useSapilCopy();
  const [confirming, setConfirming] = useState(false);
  const { remaining, mmss } = useCancellationCountdown(cw, fetchedAt, onExpired);
  if (remaining <= 0) return null;
  return (
    <div className="flex items-center justify-between gap-[12px] flex-wrap bg-sapil-p-butter rounded-[20px] py-[16px] px-[20px] mb-[20px]">
      <div>
        <b className="block text-[15px] font-[600]">{t("account.odCancelTitle")}</b>
        <span className="text-[13px] text-sapil-ink-2">
          {richText(t("account.odCancelWindow"), {
            time: (
              <span className="font-[600] tabular-nums" aria-live="off">
                {mmss}
              </span>
            ),
          })}
        </span>
      </div>
      {confirming ? (
        <div className="flex items-center gap-[12px] flex-wrap">
          <span className="text-[14px]">{t("account.odCancelConfirm")}</span>
          <Button onClick={onConfirm} disabled={pending} className="!h-[40px] !px-[16px] !text-[14px]">
            {pending ? t("account.odCancelling") : t("account.odCancelYes")}
          </Button>
          <button type="button" disabled={pending} onClick={() => setConfirming(false)} className={cx(buttonClass("link"), "!text-[14px]")}>
            {t("account.odCancelKeep")}
          </button>
        </div>
      ) : (
        <Button variant="line" onClick={() => setConfirming(true)} className="!h-[40px] !px-[16px] !text-[14px]">
          {t("account.odCancel")}
        </Button>
      )}
    </div>
  );
}

/** `/account/orders/[id]`: one order in the v9 order layout, with tracking, cancelling and refunds. */
export function SapilOrderDetailPage({ orderId }: { orderId: string }) {
  const t = useSapilCopy();
  const money = useSapilMoney();
  const date = useSapilDate();
  const locale = useShopLocale();
  const detail = useCustomerOrderDetail(orderId);
  const deliveryHighlight = useDeliveryHighlight();
  const { order } = detail;

  if (detail.loading) return <OrderStateCard busy title={t("account.odLoading")} />;
  if (detail.notFound || !order) {
    return (
      <OrderStateCard
        title={t("account.odNotFound")}
        actions={
          <Button href="/account/orders" LinkComponent={SapilLink}>
            {t("account.odAllOrders")}
          </Button>
        }
      />
    );
  }

  const currency = order.currency;
  const totals = orderTotals(t, money, order.totals, currency);
  const tracking = detail.trackingSummary;
  const step = tracking ? trackingStep(tracking) : orderProgressStep(order.status);
  const delivery = deliveryHighlight(tracking ?? { status: order.status, deliveredAt: null, estimatedDeliveryAt: null });
  const statusLabel = statusText(t, order.status);
  const total = money(Number(order.totals.total), currency);
  const tenders = orderTenders(t, money, order.totals, currency, orderPaymentLabel(order.selectedPaymentMethod));
  // What the payment method itself takes: less than the total when a gift card or points paid part.
  const charged = tenders.charged != null ? money(tenders.charged, currency) : total;
  const feedback = detail.cancelResult
    ? detail.cancelResult.text
    : detail.cancelFailure
      ? cancelErrorText(t, detail.cancelFailure)
      : null;

  return (
    <SapilOrderView
      crumbs={[
        { label: t("account.home"), href: "/" },
        { label: t("account.ordersTitle"), href: "/account/orders" },
        { label: detail.reference },
      ]}
      tone={order.status === "CANCELLED" || order.status === "FAILED" ? "failed" : detail.payable ? "pending" : step >= 4 ? "ok" : "info"}
      eyebrow={<span dir="ltr">{t("account.odEyebrow", { number: detail.reference, date: date(order.createdAt) })}</span>}
      headline={
        <>
          {t("account.odOrder")} <span dir="ltr">{detail.reference}</span>
        </>
      }
      intro={<StatusPill status={order.status} label={statusLabel} />}
      highlight={
        delivery
          ? { ...delivery, detail: orderDeliveryLabel(order.selectedDeliveryMethod) }
          : { label: t("account.odTotalLabel"), value: total, detail: orderPaymentLabel(order.selectedPaymentMethod) }
      }
      steps={step >= 0 ? orderSteps(t, step) : undefined}
      stopped={step < 0 ? stoppedText(t, order.status) : undefined}
      notices={
        <>
          {feedback ? (
            <p className="bg-sapil-white rounded-[20px] py-[14px] px-[20px] mb-[20px] text-[14px]" role="status">
              {feedback}
            </p>
          ) : null}
          {detail.showCancel && detail.cancellationWindow ? (
            <CancelPanel
              window={detail.cancellationWindow}
              fetchedAt={detail.fetchedAt}
              pending={detail.cancelling}
              onConfirm={detail.cancel}
              onExpired={detail.refreshOrder}
            />
          ) : null}
          {tracking ? <TrackingDetails summary={tracking} timeline={detail.timeline} /> : null}
        </>
      }
      itemsTitle={t("account.odItems", { count: itemCountOf(order.lines) })}
      lines={orderLines(t, money, order.lines, currency)}
      totals={totals.rows}
      grandTotal={totals.grandTotal}
      tenders={tenders.rows}
      vatNote={totals.vatNote}
      side={
        <>
          <OrderSideCard title={t("account.odDeliveryCard")}>
            {detail.shippingAddress ? <AddressLines address={detail.shippingAddress} locale={intlLocale(locale)} /> : null}
            <p className="mt-[10px] text-sapil-ink-2 text-[14px]">{orderDeliveryLabel(order.selectedDeliveryMethod)}</p>
          </OrderSideCard>
          <OrderSideCard title={t("account.odPaymentCard")}>
            <p>
              {orderPaymentLabel(order.selectedPaymentMethod)}
              <br />
              <small className="text-[13px] text-sapil-ink-2">
                {detail.payable ? t("account.odPayPending", { amount: charged }) : t("account.odPaid", { amount: charged })}
              </small>
            </p>
            {detail.payable ? (
              <Button
                href={`/checkout/payment/cancel?orderId=${encodeURIComponent(order.orderId)}`}
                LinkComponent={SapilLink}
                className="mt-[12px] !h-[44px] !px-[18px] !text-[14px]"
              >
                {t("account.ordersPay")}
              </Button>
            ) : null}
          </OrderSideCard>
          {detail.refunds.length ? (
            <OrderSideCard title={t("account.odRefunds")}>
              <ul className="list-none">
                {detail.refunds.map((refund, index) => (
                  <li key={refund.refundId ?? index} className="flex justify-between gap-[12px] py-[4px]">
                    <span>{refundCustomerStatus(refund)}</span>
                    <span className="font-[600] tabular-nums">
                      {refund.amount ? money(Number(refund.amount), refund.currency || currency) : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </OrderSideCard>
          ) : null}
          <OrderSideCard title={t("account.odHelp")} help>
            <p>{t("account.odHelpBody")}</p>
            <p className="mt-[10px] text-[14px]">
              {richText(t("account.odReturns"), {
                link: (
                  <SapilLink href="/account/returns" className="underline">
                    {t("account.odReturnsLink")}
                  </SapilLink>
                ),
              })}
            </p>
          </OrderSideCard>
        </>
      }
      actions={
        <>
          <Button href="/account/orders" variant="line" LinkComponent={SapilLink}>
            {t("account.odAllOrders")}
          </Button>
          <SapilLink href="/products" className={buttonClass("link")}>
            {t("account.odContinue")}
          </SapilLink>
        </>
      }
    />
  );
}
