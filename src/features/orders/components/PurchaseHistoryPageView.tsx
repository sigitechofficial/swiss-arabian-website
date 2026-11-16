"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { PageLoading } from "@/components/ui/PageLoading";
import { AccountPageShell } from "@/features/account/components/AccountPageShell";
import { AccountPageTitle } from "@/features/account/components/AccountPageTitle";
import { AccountStatusPill } from "@/features/account/components/AccountStatus";
import { accountContainer } from "@/features/account/constants/accountLayout";
import type { OrderSummaryApi } from "@/features/account/api/customerOrders.service";
import { formatMoney } from "@/features/home/utils/formatMoney";
import {
  formatOrderDate,
  orderPrimaryAction,
  orderStatusDisplay,
  shipmentStatusLabel,
} from "../utils/orderStatus";
import { useCustomerOrders } from "../hooks/useCustomerOrders";

const ACTION_CLASS =
  "flex h-8 items-center gap-1.5 rounded border px-3 text-[11px] font-semibold transition-colors";

function OrderRow({ order }: { order: OrderSummaryApi }) {
  const t = useShopCopy();
  const locale = useShopLocale();
  const { label, tone } = orderStatusDisplay(order.status, t);
  const action = orderPrimaryAction(order.status, order.paymentStatus);
  const detailHref = `/account/orders/${order.orderId}`;
  const shipmentNote = order.shipment ? shipmentStatusLabel(order.shipment.status, t) : null;

  return (
    <article className="overflow-hidden rounded-lg border border-sa-border bg-page">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-sa-border bg-section-soft px-5 py-3 sm:px-6">
        {order.orderNumber ? (
          <p className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wide text-sa-muted">{t("account.orderLabel")}</span>
            <span className="font-mono text-[12px] font-semibold text-sa-primary">{order.orderNumber}</span>
          </p>
        ) : null}
        <p className="flex items-center gap-1.5 sm:ms-auto">
          <span className="text-[10px] font-bold uppercase tracking-wide text-sa-muted">{t("orders.date")}</span>
          <span className="text-[12px] font-semibold text-sa-primary">{formatOrderDate(order.createdAt, { locale })}</span>
        </p>
        <LocaleLink
          href={detailHref}
          className="text-[12px] font-medium text-sa-primary transition-colors hover:text-terra"
        >
          {t("orders.viewDetails")}
        </LocaleLink>
      </div>

      <div className="flex flex-wrap items-start gap-4 px-5 py-5 sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] text-sa-muted">
            {t("account.itemCount", { count: order.itemCount })}
            {shipmentNote ? <> &nbsp;·&nbsp; {shipmentNote}</> : null}
          </p>
          <p className="mt-1.5 text-[14.5px] font-bold text-sa-primary">
            {formatMoney(Number(order.total), order.currency)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <AccountStatusPill label={label} tone={tone} />
            {order.shipment?.trackingNumber ? (
              <span className="text-[12px] text-sa-muted">
                {t("orders.trackingLabel")} <span className="font-mono text-sa-primary">{order.shipment.trackingNumber}</span>
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {action === "pay" ? (
            <LocaleLink
              href={`/checkout/payment/cancel?orderId=${encodeURIComponent(order.orderId)}`}
              className={`${ACTION_CLASS} border-terra bg-terra text-white hover:bg-[#a25e48]`}
            >
              {t("orders.completePaymentArrow")}
            </LocaleLink>
          ) : action === "track" ? (
            <LocaleLink
              href={`${detailHref}#tracking`}
              className={`${ACTION_CLASS} border-sa-border text-sa-primary hover:border-terra hover:text-terra`}
            >
              {t("orders.trackOrderArrow")}
            </LocaleLink>
          ) : (
            <LocaleLink
              href={detailHref}
              className={`${ACTION_CLASS} border-sa-border text-sa-primary hover:border-terra hover:text-terra`}
            >
              {t("orders.viewOrderArrow")}
            </LocaleLink>
          )}
        </div>
      </div>
    </article>
  );
}

function EmptyOrders() {
  const t = useShopCopy();
  return (
    <div className={`${accountContainer} py-16 text-center`}>
      <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-section-soft">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-sa-muted" aria-hidden="true">
          <rect x="4" y="8" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M9 8V6a5 5 0 0110 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-[14.5px] font-semibold text-sa-primary">{t("account.noOrders")}</p>
      <p className="mt-1 text-[12px] text-sa-muted">{t("orders.emptyText")}</p>
      <LocaleLink
        href="/products"
        className="mt-5 inline-flex h-10 items-center justify-center rounded bg-terra px-6 text-[12px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#a25e48]"
      >
        {t("orders.startShopping")}
      </LocaleLink>
    </div>
  );
}

export function PurchaseHistoryPageView() {
  const { isLoading, isError, refetch, orders, active, past, totalPages, currentPage, previous, next } =
    useCustomerOrders();
  const t = useShopCopy();

  return (
    <AccountPageShell>
      <AccountPageTitle title={t("account.tab.orders")} />

      {isLoading ? (
        <PageLoading label={t("orders.loading")} />
      ) : isError ? (
        <div className={`${accountContainer} py-16 text-center`}>
          <p className="text-[13px] text-sa-primary">{t("orders.loadFailed")}</p>
          <button
            type="button"
            onClick={refetch}
            className="mt-3 text-[12px] font-semibold text-terra underline underline-offset-4"
          >
            {t("tryAgain")}
          </button>
        </div>
      ) : orders.length === 0 ? (
        <EmptyOrders />
      ) : (
        <>
          {active.length > 0 ? (
            <section className={`${accountContainer} pt-8 pb-2`}>
              <h2 className="text-[17px] font-bold text-sa-primary lg:text-[19px]">{t("orders.active")}</h2>
              <div className="mt-5 flex flex-col gap-6">
                {active.map((o) => (
                  <OrderRow key={o.orderId} order={o} />
                ))}
              </div>
            </section>
          ) : null}

          {past.length > 0 ? (
            <section className={`${accountContainer} pt-8 pb-2`}>
              <h2 className="text-[17px] font-bold text-sa-primary lg:text-[19px]">{t("orders.past")}</h2>
              <div className="mt-5 flex flex-col gap-6">
                {past.map((o) => (
                  <OrderRow key={o.orderId} order={o} />
                ))}
              </div>
            </section>
          ) : null}

          {totalPages > 1 ? (
            <div className={`${accountContainer} flex items-center justify-center gap-3 py-8`}>
              <button
                type="button"
                onClick={previous}
                disabled={currentPage === 1}
                className="flex h-9 items-center gap-1.5 rounded border border-sa-border px-4 text-[12px] font-medium text-sa-primary transition-colors hover:border-terra disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("orders.previous")}
              </button>
              <span className="text-[12px] text-sa-muted">
                {t("orders.pageOf", { page: currentPage, total: totalPages })}
              </span>
              <button
                type="button"
                onClick={next}
                disabled={currentPage === totalPages}
                className="flex h-9 items-center gap-1.5 rounded border border-sa-border px-4 text-[12px] font-medium text-sa-primary transition-colors hover:border-terra disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("orders.next")}
              </button>
            </div>
          ) : null}

          <p className={`${accountContainer} pt-6 text-[12px] text-sa-muted`}>
            {t("orders.guestPrompt")}{" "}
            <LocaleLink className="text-terra underline underline-offset-2" href="/track">
              {t("orders.guestLink")}
            </LocaleLink>
            {t("orders.guestEnd")}
          </p>
        </>
      )}

      <div className="h-10" />
    </AccountPageShell>
  );
}
