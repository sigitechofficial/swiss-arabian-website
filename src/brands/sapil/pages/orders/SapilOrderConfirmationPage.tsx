"use client";

import { useEffect, useState } from "react";
import { useOrderConfirmation } from "@/features/checkout/hooks/useOrderConfirmation";
import { orderDeliveryLabel, orderPaymentLabel } from "@/features/checkout/utils/methodLabels";
import { intlLocale } from "@/lib/i18n/locales";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { Button, Serif } from "../../ui";
import { buttonClass } from "../../ui/Button";
import { cx } from "../../ui/shared";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { SapilLink, richText, useSapilDate, useSapilMoney } from "../../components/commerce/shared";
import { OrderSideCard, OrderStateCard, SapilOrderView, type OrderTone } from "../../components/orders/SapilOrderView";
import { AddressLines, orderLines, orderSteps, orderTenders, orderTotals } from "../../components/orders/orderParts";

function CopyNumber({ value }: { value: string }) {
  const t = useSapilCopy();
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(id);
  }, [copied]);
  return (
    <button
      type="button"
      onClick={() => void navigator.clipboard?.writeText(value).then(() => setCopied(true))}
      className={cx(buttonClass("link"), "!text-[12px] ms-[8px] normal-case tracking-normal")}
    >
      <span aria-live="polite">{copied ? t("account.odCopied") : t("account.odCopy")}</span>
    </button>
  );
}

/** `/order-confirmation/[orderId]`: the v9 "Your order is confirmed" view from the placed order. */
export function SapilOrderConfirmationPage({ orderId }: { orderId: string }) {
  const t = useSapilCopy();
  const money = useSapilMoney();
  const date = useSapilDate();
  const locale = useShopLocale();
  const { order, loading, polling, failedToLoad, state, payOffline, details, checking, checkAgain } = useOrderConfirmation(orderId);

  if (loading) {
    return (
      <OrderStateCard
        busy
        title={polling ? t("account.odConfirming") : t("account.odLoading")}
        body={polling ? t("account.odConfirmingBody") : undefined}
      />
    );
  }
  if (failedToLoad || !order || !details) {
    return (
      <OrderStateCard
        title={t("account.odLoadFailed")}
        body={t("account.odLoadFailedBody")}
        actions={
          <Button href="/" LinkComponent={SapilLink}>
            {t("account.odBackHome")}
          </Button>
        }
      />
    );
  }

  const currency = order.currency;
  const total = money(Number(order.totals.total), currency);
  const number = order.orderNumber ?? order.orderId.slice(0, 8).toUpperCase();
  const tone: OrderTone = state === "success" ? "ok" : state === "failed" ? "failed" : "pending";
  const totals = orderTotals(t, money, order.totals, currency);
  const deliveryLabel = orderDeliveryLabel(order.selectedDeliveryMethod);
  const paymentLabel = orderPaymentLabel(order.selectedPaymentMethod);
  const tenders = orderTenders(t, money, order.totals, currency, paymentLabel);
  // What the payment method itself takes: less than the total when a gift card or points paid part.
  const charged = tenders.charged != null ? money(tenders.charged, currency) : total;

  const headline =
    state === "failed" ? (
      <>
        {t("account.odFailedTitle")} <Serif className="serif">{t("account.odFailedAccent")}</Serif>
      </>
    ) : state === "pending" ? (
      <>
        {t("account.odPendingTitle")} <Serif className="serif">{t("account.odPendingAccent")}</Serif>
      </>
    ) : (
      <>
        {details.firstName ? t("account.odThanks", { name: details.firstName }) : t("account.odThanksNoName")}
        <br />
        <Serif className="serif">{t("account.odConfirmed")}</Serif>
      </>
    );

  const intro =
    state === "failed"
      ? t("account.odFailedBody")
      : state === "pending"
        ? t("account.odPendingBody")
        : details.email
          ? richText(t("account.odReceipt"), { email: <b>{details.email}</b> })
          : t("account.odReceiptNoEmail");

  return (
    <SapilOrderView
      crumbs={[
        { label: t("account.home"), href: "/" },
        details.isGuest ? { label: t("account.ordersTitle") } : { label: t("account.ordersTitle"), href: "/account/orders" },
        { label: number },
      ]}
      tone={tone}
      eyebrow={
        <>
          <span dir="ltr">{t("account.odEyebrow", { number, date: date(order.createdAt) })}</span>
          {order.orderNumber ? <CopyNumber value={order.orderNumber} /> : null}
        </>
      }
      headline={headline}
      intro={intro}
      highlight={{ label: t("account.odTotalLabel"), value: total, detail: paymentLabel }}
      steps={details.showProgress ? orderSteps(t, details.currentStep) : undefined}
      itemsTitle={t("account.odItems", { count: details.itemCount })}
      lines={orderLines(t, money, order.lines, currency)}
      totals={totals.rows}
      grandTotal={totals.grandTotal}
      tenders={tenders.rows}
      vatNote={totals.vatNote}
      side={
        <>
          <OrderSideCard title={t("account.odDeliveryCard")}>
            {details.shippingAddress ? <AddressLines address={details.shippingAddress} locale={intlLocale(locale)} /> : null}
            <p className="mt-[10px] text-sapil-ink-2 text-[14px]">{deliveryLabel}</p>
          </OrderSideCard>
          <OrderSideCard title={t("account.odPaymentCard")}>
            <p>
              {paymentLabel}
              <br />
              <small className="text-[13px] text-sapil-ink-2">
                {state === "failed"
                  ? t("account.odPayFailed", { amount: charged })
                  : payOffline
                    ? t("account.odPayCash", { amount: charged })
                    : state === "pending"
                      ? t("account.odPayPending", { amount: charged })
                      : t("account.odPaid", { amount: charged })}
              </small>
            </p>
          </OrderSideCard>
          <OrderSideCard title={t("account.odHelp")} help>
            <p>{t("account.odHelpBody")}</p>
            <div className="flex gap-[8px] flex-wrap mt-[14px]">
              {state === "failed" ? (
                <Button href={details.retryHref} LinkComponent={SapilLink} className="!h-[44px] !px-[18px] !text-[14px]">
                  {t("account.odRetry")}
                </Button>
              ) : state === "pending" ? (
                <>
                  <Button onClick={checkAgain} disabled={checking} className="!h-[44px] !px-[18px] !text-[14px]">
                    {checking ? t("account.odChecking") : t("account.odCheckAgain")}
                  </Button>
                  <Button href={details.retryHref} variant="line" LinkComponent={SapilLink} className="!h-[44px] !px-[18px] !text-[14px]">
                    {t("account.odPayNow")}
                  </Button>
                </>
              ) : details.trackHref ? (
                <Button href={details.trackHref} LinkComponent={SapilLink} className="!h-[44px] !px-[18px] !text-[14px]">
                  {t("account.odTrack")}
                </Button>
              ) : null}
              {!details.isGuest ? (
                <Button href="/account/orders" variant="line" LinkComponent={SapilLink} className="!h-[44px] !px-[18px] !text-[14px]">
                  {t("account.odAllOrders")}
                </Button>
              ) : null}
            </div>
          </OrderSideCard>
        </>
      }
      actions={
        <>
          <Button href="/products" LinkComponent={SapilLink}>
            {t("account.odContinue")}
          </Button>
          <SapilLink href="/" className={buttonClass("link")}>
            {t("account.odBackHome")}
          </SapilLink>
        </>
      }
    />
  );
}
