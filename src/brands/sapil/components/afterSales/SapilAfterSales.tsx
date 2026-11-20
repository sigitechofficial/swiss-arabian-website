"use client";

import { useId, useState, type ReactNode } from "react";
import { useReturnsPolicy, type ReturnsPolicySource } from "@/features/afterSales/hooks/useAfterSales";
import type { OrderAfterSalesState } from "@/features/afterSales/components/OrderAfterSalesPanels";
import { afterSalesCopyText } from "@/features/afterSales/utils/afterSalesCopy";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { Button, cx } from "../../ui";
import { useSapilDate } from "../commerce/shared";
import { SapilLink } from "../shared/SapilLink";
import { SapilExchangeCard, SapilGuestExchangeCard, SapilGuestReturnCard, SapilReturnCard } from "./SapilAfterSalesCards";
const GROUP = "text-[12px] font-[700] tracking-[.14em] uppercase text-sapil-muted";

/**
 * The order's return terms (for an order: the rules frozen when it was placed),
 * generated from the after-sales settings so they match what a refund charges.
 * Collapsed until opened; loads then.
 */
function SapilReturnTerms({ source }: { source: ReturnsPolicySource }) {
  const t = useShopCopy();
  const locale = useShopLocale();
  const [open, setOpen] = useState(false);
  const policy = useReturnsPolicy(source, open);
  const panelId = useId();
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-[44px] items-center text-[14px] font-[600] text-sapil-accent underline underline-offset-[3px]"
      >
        {open ? t("returnsPolicy.hide") : t("returnsPolicy.show")}
      </button>
      {open ? (
        <div id={panelId} className="mt-[6px] rounded-[16px] bg-sapil-paper p-[16px]" aria-busy={policy.isLoading}>
          <p className={cx(GROUP, "mb-[8px]")}>{t("returnsPolicy.title")}</p>
          {policy.data ? (
            <ul className="list-none p-0 m-0 grid gap-[8px]">
              {policy.data.items.map((item) => (
                <li key={`${item.key}.${item.variant}`} className="flex gap-[10px] text-[14px] leading-[1.55]">
                  <i aria-hidden="true" className="mt-[8px] w-[5px] h-[5px] shrink-0 rounded-full bg-sapil-accent" />
                  <span>{afterSalesCopyText(item, t, locale)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[14px] text-sapil-ink-2">{policy.isError ? t("returnsPolicy.loadFailed") : t("returnsPolicy.loading")}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function Section({ children, action }: { children: ReactNode; action?: ReactNode }) {
  const t = useShopCopy();
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} data-sapil="after-sales" className="bg-sapil-white rounded-[24px] p-[24px] max-900:p-[20px] flex flex-col gap-[16px]">
      <div className="flex flex-wrap items-center justify-between gap-[10px]">
        <h2 id={headingId} className="font-sapil-sans font-[700] text-[20px] leading-[1.2] tracking-[-.02em]">
          {t("afterSales.title")}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Notes({ notes }: { notes: string[] }) {
  return notes.length ? (
    <div className="grid gap-[6px]">
      {notes.map((note) => (
        <p key={note} className="text-[14px] leading-[1.55] text-sapil-ink-2">
          {note}
        </p>
      ))}
    </div>
  ) : null;
}

/**
 * The way into the guided return / exchange, at the top of the order (v9
 * notice card): one button and the last day to ask. Nothing when the order
 * can't be returned or exchanged.
 */
export function SapilAfterSalesStart({ state }: { state: OrderAfterSalesState }) {
  const t = useShopCopy();
  const date = useSapilDate();
  if (!state.canStart) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-[14px] bg-sapil-white rounded-[20px] py-[16px] px-[20px] mb-[20px]">
      <p className="text-[15px] leading-[1.45]">
        <b className="font-[600]">{t("afterSales.flow.entry.title")}</b>
        {state.eligibleUntil ? (
          <span className="block text-[14px] text-sapil-ink-2">{t("afterSales.flow.entry.until", { date: date(state.eligibleUntil) })}</span>
        ) : null}
      </p>
      <Button href={state.flowHref} LinkComponent={SapilLink} className="!h-[44px] !px-[20px] !text-[14px]">
        {t("afterSales.flow.entry.button")}
      </Button>
    </div>
  );
}

/**
 * The order's returns and exchanges so far, why a new one can't be asked (if
 * so) and the order's return terms. Shown when there is something to say.
 */
export function SapilAfterSalesRequests({ state, source }: { state: OrderAfterSalesState; source: ReturnsPolicySource }) {
  const t = useShopCopy();
  const hasRequests = state.returnItems.length + state.exchangeItems.length > 0;
  if (!state.eligible && !hasRequests && state.notes.length === 0) return null;
  const guest = source.mode === "guest" ? { orderNumber: source.orderNumber, orderAccessToken: source.orderAccessToken } : null;
  return (
    <Section
      action={
        source.mode === "customer" ? (
          <SapilLink href="/account/returns" className="inline-flex min-h-[44px] items-center text-[14px] font-[600] text-sapil-accent underline underline-offset-[3px]">
            {t("afterSales.viewAll")}
          </SapilLink>
        ) : null
      }
    >
      <Notes notes={state.notes} />
      {hasRequests ? (
        <div className="grid gap-[10px]">
          <p className={GROUP}>{t("afterSales.flow.entry.requests")}</p>
          {state.returnItems.map((item) =>
            guest ? <SapilGuestReturnCard key={item.returnRequestId} item={item} /> : <SapilReturnCard key={item.returnRequestId} item={item} showOrder={false} />,
          )}
          {state.exchangeItems.map((item) =>
            guest ? (
              <SapilGuestExchangeCard key={item.exchangeRequestId} item={item} guest={guest} />
            ) : (
              <SapilExchangeCard key={item.exchangeRequestId} item={item} showOrder={false} />
            ),
          )}
        </div>
      ) : null}
      {state.eligible ? <SapilReturnTerms source={source} /> : null}
    </Section>
  );
}
