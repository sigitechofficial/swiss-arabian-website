"use client";

import { formatOrderDate } from "@/features/orders/utils/orderStatus";
import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { useMarketTimeZone } from "@/lib/storefront/MarketTimeZoneProvider";
import {
  accountOrderCta,
  accountPanel,
  accountPanelBody,
  accountPanelHead,
  accountPanelLink,
  accountPanelTitle,
} from "@/styles/accountChrome";
import type { ReturnsPolicySource } from "../hooks/useAfterSales";
import type { useOrderAfterSales } from "../hooks/useOrderAfterSales";
import type { StorefrontExchangeSummaryView, StorefrontReturnSummaryView } from "../types/afterSales";
import {
  ExchangeRequestCard,
  GuestExchangeRequestCard,
  GuestReturnRequestCard,
  ReturnRequestCard,
} from "./AfterSalesRequestCards";
import { ReturnsPolicySummary } from "./ReturnsPolicySummary";

/** What the order pages know about returns and exchanges (signed-in or guest). */
export type OrderAfterSalesState = Pick<
  ReturnType<typeof useOrderAfterSales>,
  "eligible" | "canStart" | "eligibleUntil" | "flowHref" | "notes"
> & {
  returnItems: StorefrontReturnSummaryView[];
  exchangeItems: StorefrontExchangeSummaryView[];
};

/**
 * The way into the guided return / exchange, near the top of the order: one
 * button and the last day to ask. Nothing when the order can't be returned.
 */
export function AfterSalesStart({ state, align = "end" }: { state: OrderAfterSalesState; align?: "end" | "center" }) {
  const t = useShopCopy();
  const locale = useShopLocale();
  const timeZone = useMarketTimeZone();
  if (!state.canStart) return null;
  return (
    <div className={`flex flex-col gap-1.5 ${align === "center" ? "items-center text-center" : "items-end text-end max-[599px]:items-start max-[599px]:text-start"}`}>
      <LocaleLink href={state.flowHref} className={accountOrderCta}>
        {t("afterSales.flow.entry.button")}
      </LocaleLink>
      {state.eligibleUntil ? (
        <span className="text-[0.74rem] text-[var(--ink-2,#5b5148)]">
          {t("afterSales.flow.entry.until", { date: formatOrderDate(state.eligibleUntil, { long: true, locale, timeZone }) })}
        </span>
      ) : null}
    </div>
  );
}

/**
 * The order's returns and exchanges so far, why a new one can't be asked (if
 * so), and the return terms. Shown when there is something to say.
 */
export function AfterSalesRequestsPanel({
  state,
  source,
}: {
  state: OrderAfterSalesState;
  source: ReturnsPolicySource;
}) {
  const t = useShopCopy();
  const hasRequests = state.returnItems.length + state.exchangeItems.length > 0;
  if (!state.eligible && !hasRequests && state.notes.length === 0) return null;
  const guest = source.mode === "guest" ? source : null;
  return (
    <section className={accountPanel}>
      <header className={accountPanelHead}>
        <h2 className={accountPanelTitle}>{t("afterSales.title")}</h2>
        {source.mode === "customer" ? (
          <LocaleLink href="/account/returns" className={accountPanelLink}>
            {t("afterSales.viewAll")}
          </LocaleLink>
        ) : null}
      </header>
      <div className={`${accountPanelBody} flex flex-col gap-4`}>
        {state.notes.map((note) => (
          <p key={note} className="m-0 text-[0.8rem] leading-relaxed text-[var(--ink-2,#5b5148)]">
            {note}
          </p>
        ))}
        {hasRequests ? (
          <div className="flex flex-col gap-3">
            <p className="m-0 text-[0.7rem] font-semibold tracking-[0.1em] text-[var(--ink-2,#5b5148)] uppercase">
              {t("afterSales.flow.entry.requests")}
            </p>
            {state.returnItems.map((item) =>
              guest ? <GuestReturnRequestCard key={item.returnRequestId} item={item} /> : <ReturnRequestCard key={item.returnRequestId} item={item} />,
            )}
            {state.exchangeItems.map((item) =>
              guest ? (
                <GuestExchangeRequestCard
                  key={item.exchangeRequestId}
                  item={item}
                  orderNumber={guest.orderNumber}
                  orderAccessToken={guest.orderAccessToken}
                />
              ) : (
                <ExchangeRequestCard key={item.exchangeRequestId} item={item} />
              ),
            )}
          </div>
        ) : null}
        {state.eligible ? <ReturnsPolicySummary source={source} /> : null}
      </div>
    </section>
  );
}
