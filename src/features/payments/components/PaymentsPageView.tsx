"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import type { MessageKey } from "@/lib/i18n/messages";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { PageLoading } from "@/components/ui/PageLoading";
import { orderNeedsPaying, usePaymentHistory, type PaymentFilter } from "../hooks/usePaymentHistory";
import { AccountPageShell } from "@/features/account/components/AccountPageShell";
import { AccountPageTitle } from "@/features/account/components/AccountPageTitle";
import { AccountStatusLabel, type AccountStatusTone } from "@/features/account/components/AccountStatus";
import { accountContainer } from "@/features/account/constants/accountLayout";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { formatOrderDate } from "@/features/orders/utils/orderStatus";


const FILTERS: { value: PaymentFilter; label: MessageKey }[] = [
  { value: "all", label: "payments.filter.all" },
  { value: "paid", label: "payments.filter.paid" },
  { value: "pending", label: "payments.filter.pending" },
  { value: "refunded", label: "payments.filter.refunded" },
];

function paymentDisplay(status: string): { label: MessageKey | null; tone: AccountStatusTone; kind: PaymentFilter } {
  switch (status.toUpperCase()) {
    case "PAID":
    case "AUTHORIZED":
      return { label: "payments.status.paid", tone: "success", kind: "paid" };
    case "PENDING":
      return { label: "payments.status.pending", tone: "warning", kind: "pending" };
    case "FAILED":
      return { label: "payments.status.failed", tone: "danger", kind: "pending" };
    case "REFUNDED":
      return { label: "payments.status.refunded", tone: "muted", kind: "refunded" };
    case "PARTIALLY_REFUNDED":
      return { label: "payments.status.partlyRefunded", tone: "muted", kind: "refunded" };
    case "NOT_REQUIRED":
      return { label: "payments.status.notRequired", tone: "muted", kind: "paid" };
    default:
      return { label: null, tone: "muted", kind: "all" };
  }
}

const needsPaying = orderNeedsPaying;

function PaymentHistory() {
  const { query, filter, setFilter, rows } = usePaymentHistory();
  const t = useShopCopy();
  const locale = useShopLocale();

  if (query.isPending) return <PageLoading label={t("payments.loading")} />;

  if (query.isError) {
    return (
      <div className="rounded-lg border border-sa-border bg-section-soft px-6 py-10 text-center">
        <p className="text-[14px] text-sa-primary">{t("payments.loadFailed")}</p>
        <button
          type="button"
          onClick={() => void query.refetch()}
          className="mt-3 text-[12.5px] font-semibold text-terra hover:underline"
        >
          {t("tryAgain")}
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-sa-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-sa-border bg-section-soft px-4 py-3">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${
              filter === f.value
                ? "bg-terra text-white"
                : "text-sa-secondary hover:bg-surface hover:text-sa-primary"
            }`}
          >
            {t(f.label)}
          </button>
        ))}
      </div>

      <div className="hidden grid-cols-[120px_minmax(0,1fr)_130px_150px_120px] items-center gap-4 border-b border-sa-border px-5 py-3 text-[10.5px] font-semibold uppercase tracking-wide text-sa-muted lg:grid">
        <span>{t("orders.date")}</span>
        <span>{t("account.orderLabel")}</span>
        <span>{t("payments.amount")}</span>
        <span>{t("payments.statusCol")}</span>
        <span className="text-end">{t("payments.action")}</span>
      </div>

      {rows.length === 0 ? (
        <p className="px-5 py-12 text-center text-[13.5px] text-sa-secondary">
          {query.data?.items.length ? t("payments.noneInView") : t("payments.none")}
        </p>
      ) : (
        rows.map((order) => {
          const { label: labelKey, tone, kind } = paymentDisplay(order.paymentStatus);
          const label = labelKey ? t(labelKey) : order.paymentStatus;
          const detailHref = `/account/orders/${order.orderId}`;
          return (
            <div
              key={order.orderId}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 border-b border-sa-border px-5 py-4 last:border-b-0 lg:grid-cols-[120px_minmax(0,1fr)_130px_150px_120px]"
            >
              <span className="order-3 text-[12px] text-sa-secondary lg:order-none lg:text-[13px]">
                {formatOrderDate(order.createdAt, { locale })}
              </span>
              <div className="order-1 min-w-0 lg:order-none">
                <LocaleLink href={detailHref} className="font-mono text-[12.5px] font-semibold text-sa-primary hover:text-terra">
                  {order.orderNumber ?? order.orderId.slice(0, 8).toUpperCase()}
                </LocaleLink>
                <p className="text-[12px] text-sa-secondary">
                  {t("account.itemCount", { count: order.itemCount })}
                </p>
              </div>
              <span
                className={`order-2 justify-self-end text-[13.5px] font-semibold lg:order-none lg:justify-self-start ${
                  kind === "refunded" ? "text-[#b4483f]" : "text-sa-primary"
                }`}
              >
                {formatMoney(Number(order.total), order.currency)}
              </span>
              <span className="order-4 justify-self-end lg:order-none lg:justify-self-start">
                <AccountStatusLabel label={label} tone={tone} />
              </span>
              <span className="order-5 col-span-2 lg:order-none lg:col-span-1 lg:text-end">
                {needsPaying(order) ? (
                  <LocaleLink
                    href={`/checkout/payment/cancel?orderId=${encodeURIComponent(order.orderId)}`}
                    className="text-[12px] font-semibold text-terra hover:underline"
                  >
                    {t("payments.payNow")}
                  </LocaleLink>
                ) : (
                  <LocaleLink href={detailHref} className="text-[12px] font-semibold text-sa-secondary hover:text-terra">
                    {t("orders.viewOrderArrow")}
                  </LocaleLink>
                )}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}

/**
 * Payments. The storefront has no saved-card (vault) API yet — the reference
 * only renders mock cards — so this shows no invented cards, just how paying
 * works today plus the shopper's real payment history from their orders.
 */
export function PaymentsPageView() {
  const t = useShopCopy();
  return (
    <AccountPageShell>
      <AccountPageTitle title={t("account.tab.payments")} subtitle={t("payments.subtitle")} />

      <section className={`${accountContainer} pt-2`}>
        <h2 className="text-[17px] font-bold text-sa-primary lg:text-[19px]">{t("account.paymentMethods")}</h2>
        <p className="mt-1 text-[13px] text-sa-secondary">{t("payments.methodsText")}</p>

        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col rounded-lg border border-dashed border-sa-border bg-surface p-6">
            <span className="flex size-11 items-center justify-center rounded-full bg-section-soft text-terra" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2.5" y="5" width="19" height="14" rx="2" />
                <path d="M2.5 9.5h19M6 15h4" />
              </svg>
            </span>
            <p className="mt-4 text-[14.5px] font-semibold text-sa-primary">{t("payments.noCards")}</p>
            <p className="mt-1 flex-1 text-[12.5px] leading-relaxed text-sa-secondary">
              {t("payments.noCardsText")}
            </p>
            <span className="mt-4 inline-flex w-fit cursor-not-allowed items-center rounded-md border border-sa-border px-3.5 py-2 text-[12px] font-semibold text-sa-muted">
              {t("payments.addCardSoon")}
            </span>
          </div>

          <div className="flex flex-col rounded-lg border border-sa-border bg-surface p-6 lg:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-sa-muted">{t("payments.accepted")}</p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-3">
              {(
                [
                  { title: "payments.cards", body: "payments.cardsText" },
                  { title: "payments.cod", body: "payments.codText" },
                  { title: "payments.tabby", body: "payments.tabbyText" },
                ] as const
              ).map((m) => (
                <li key={m.title} className="rounded-md bg-section-soft px-4 py-3">
                  <p className="text-[13px] font-semibold text-sa-primary">{t(m.title)}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-sa-secondary">{t(m.body)}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 flex items-start gap-2 text-[12.5px] leading-relaxed text-sa-secondary">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="mt-[3px] shrink-0 text-[#2f7d4a]" aria-hidden="true">
                <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              {t("payments.secureNote")}
            </p>
          </div>
        </div>
      </section>

      <section className={`${accountContainer} pb-16 pt-10`}>
        <h2 className="text-[17px] font-bold text-sa-primary lg:text-[19px]">{t("payments.history")}</h2>
        <p className="mt-1 text-[13px] text-sa-secondary">{t("payments.historyText")}</p>
        <div className="mt-5">
          <PaymentHistory />
        </div>
      </section>
    </AccountPageShell>
  );
}
