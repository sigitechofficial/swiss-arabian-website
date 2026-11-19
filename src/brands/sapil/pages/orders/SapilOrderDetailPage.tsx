"use client";

import { SapilOrderAfterSales } from "../../components/afterSales/SapilAfterSales";
import { mapOrderLinesForAfterSales } from "@/features/afterSales/utils/lines";
import { orderDeliveryLabel, orderPaymentLabel } from "@/features/checkout/utils/methodLabels";
import { useCustomerOrderDetail, type OrderCancelError } from "@/features/orders/hooks/useCustomerOrders";
import { cancellableOrderLines } from "@/features/orders/utils/cancelItems";
import { orderProgressStep } from "@/features/orders/utils/orderStatus";
import { intlLocale } from "@/lib/i18n/locales";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { Button } from "../../ui";
import { buttonClass } from "../../ui/Button";
import { useSapilCopy, type SapilTranslator } from "../../i18n/SapilCopy";
import { SapilLink, richText, useSapilDate, useSapilMoney } from "../../components/commerce/shared";
import { StatusPill, statusText } from "../../components/account/AccountChrome";
import { OrderSideCard, OrderStateCard, SapilOrderView } from "../../components/orders/SapilOrderView";
import { SapilCancelPanel, SapilRefunds } from "../../components/orders/SapilOrderAftercare";
import { AddressLines, itemCountOf, orderLines, orderSteps, orderTenders, orderTotals } from "../../components/orders/orderParts";
import { TrackingDetails, stoppedText, trackingStep, useDeliveryHighlight } from "../../components/orders/TrackingDetails";

function cancelErrorText(t: SapilTranslator, error: OrderCancelError): string {
  if (error === "closed") return t("account.odCancelClosed");
  if (error === "notFound") return t("account.odNotFound");
  if (error === "failed") return t("account.odCancelFailed");
  return error.message;
}

/**
 * `/account/orders/[id]`: one order in the v9 order layout, with tracking,
 * cancelling (whole order or some items), refunds, and returns / exchanges.
 * Same rules and data as Swiss Arabian (shared hooks); Sapil's own design.
 */
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
  const activeLines = order.lines.filter((line) => !line.cancelled);
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
            <SapilCancelPanel
              orderId={order.orderId}
              window={detail.cancellationWindow}
              fetchedAt={detail.fetchedAt}
              pending={detail.cancelling}
              onConfirm={detail.cancel}
              onExpired={detail.refreshOrder}
              cancellableLines={cancellableOrderLines(activeLines)}
              hasGifts={activeLines.some((line) => line.isGift)}
              currency={currency}
              pendingItems={detail.cancellingItems}
              itemsCancelledAt={detail.itemsCancelledAt}
              onConfirmItems={detail.cancelItems}
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
          {detail.customerRefunds.length ? (
            <OrderSideCard title={t("account.odRefunds")}>
              <SapilRefunds refunds={detail.customerRefunds} currency={currency} />
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
      after={
        <div className="mt-[20px]">
          <SapilOrderAfterSales
            orderId={order.orderId}
            status={order.status}
            fulfillmentStatus={order.fulfillmentStatus}
            lines={mapOrderLinesForAfterSales(activeLines)}
          />
        </div>
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
