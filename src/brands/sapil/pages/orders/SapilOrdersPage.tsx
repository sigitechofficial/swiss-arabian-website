"use client";

import type { OrderSummaryApi } from "@/features/account/api/customerOrders.service";
import { useCustomerOrders } from "@/features/orders/hooks/useCustomerOrders";
import { needsPayment } from "@/features/orders/utils/orderStatus";
import { Button } from "../../ui";
import { buttonClass } from "../../ui/Button";
import { cx } from "../../ui/shared";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { SapilLink, SapilSkeleton, richText, useSapilDate, useSapilMoney } from "../../components/commerce/shared";
import { AccountPage, LoadError, StatusPill, statusText } from "../../components/account/AccountChrome";
import { CheckoutEmptyCard } from "../../components/checkout/CheckoutParts";

function OrderList({ title, orders }: { title: string; orders: OrderSummaryApi[] }) {
  const t = useSapilCopy();
  const money = useSapilMoney();
  const date = useSapilDate();
  return (
    <section className="mt-[28px] first:mt-0" aria-label={title}>
      <h2 className="font-sapil-sans font-[700] text-[24px] leading-[normal] tracking-[-.02em] mb-[14px]">{title}</h2>
      <ul className="list-none bg-sapil-white rounded-[24px] py-[6px] px-[20px]">
        {orders.map((order) => {
          const number = order.orderNumber ?? order.orderId.slice(0, 8).toUpperCase();
          return (
            <li key={order.orderId} className="border-b border-sapil-line last:border-b-0">
              <div className="grid grid-cols-[1.2fr_1fr_1fr_auto] gap-[16px] items-center py-[14px] text-[15px] max-900:grid-cols-[1fr_1fr] max-900:gap-y-[6px] max-900:gap-x-[12px]">
                <SapilLink
                  href={`/account/orders/${encodeURIComponent(order.orderId)}`}
                  className="font-[700] hover:underline"
                  aria-label={t("account.ordersOpen", { number })}
                >
                  <span dir="ltr">{number}</span>
                </SapilLink>
                <span className="text-sapil-ink-2">{date(order.createdAt, { day: "numeric", month: "short", year: "numeric" })}</span>
                <span className="flex items-center gap-[8px] flex-wrap">
                  <span className="text-sapil-ink-2">{t("account.ordersItems", { count: order.itemCount })}</span>
                  <StatusPill status={order.status} label={statusText(t, order.status)} />
                </span>
                <span className="text-end font-[600] tabular-nums">
                  {money(Number(order.total), order.currency)}
                  {needsPayment(order.status, order.paymentStatus) ? (
                    <SapilLink
                      href={`/checkout/payment/cancel?orderId=${encodeURIComponent(order.orderId)}`}
                      className={cx(buttonClass("link"), "block ms-auto mt-[4px] !text-[13px] w-fit")}
                    >
                      {t("account.ordersPay")}
                    </SapilLink>
                  ) : null}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** `/account/orders`: the v9 "Your orders" list from the customer orders API. */
export function SapilOrdersPage() {
  const t = useSapilCopy();
  const { isLoading, isError, refetch, orders, active, past, totalPages, currentPage, previous, next } = useCustomerOrders();

  return (
    <AccountPage title={t("account.ordersTitle")} crumb={t("account.ordersTitle")}>
      {isLoading ? (
        <div aria-busy="true">
          <SapilSkeleton className="h-[28px] w-[160px] mb-[14px]" />
          <SapilSkeleton className="h-[220px] !rounded-[24px]" />
        </div>
      ) : isError ? (
        <LoadError onRetry={refetch} />
      ) : orders.length === 0 ? (
        <CheckoutEmptyCard
          title={t("account.ordersEmptyTitle")}
          body={t("account.ordersEmptyBody")}
          actions={
            <Button href="/products" LinkComponent={SapilLink}>
              {t("account.ordersEmptyCta")}
            </Button>
          }
        />
      ) : (
        <>
          {active.length ? <OrderList title={t("account.ordersActive")} orders={active} /> : null}
          {past.length ? <OrderList title={t("account.ordersPast")} orders={past} /> : null}
          {totalPages > 1 ? (
            <nav className="flex items-center justify-center gap-[12px] mt-[28px]" aria-label={t("account.ordersTitle")}>
              <Button variant="line" onClick={previous} disabled={currentPage === 1}>
                {t("account.ordersPrev")}
              </Button>
              <span className="text-[14px] text-sapil-muted">{t("account.ordersPage", { page: currentPage, pages: totalPages })}</span>
              <Button variant="line" onClick={next} disabled={currentPage === totalPages}>
                {t("account.ordersNext")}
              </Button>
            </nav>
          ) : null}
        </>
      )}
      <p className="mt-[24px] text-[14px] text-sapil-ink-2">
        {richText(t("account.ordersGuest"), {
          link: (
            <SapilLink href="/track" className="underline">
              {t("account.ordersGuestLink")}
            </SapilLink>
          ),
        })}
      </p>
    </AccountPage>
  );
}
