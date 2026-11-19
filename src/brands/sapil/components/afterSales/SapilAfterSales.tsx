"use client";

import { useId, useState, type ReactNode } from "react";
import { useReturnsPolicy, type ReturnsPolicySource } from "@/features/afterSales/hooks/useAfterSales";
import { useGuestOrderAfterSales, useOrderAfterSales } from "@/features/afterSales/hooks/useOrderAfterSales";
import type { AfterSalesOrderLine } from "@/features/afterSales/types/afterSales";
import { afterSalesCopyText } from "@/features/afterSales/utils/afterSalesCopy";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { Button, cx } from "../../ui";
import { SapilLink } from "../shared/SapilLink";
import { SapilExchangeCard, SapilGuestExchangeCard, SapilGuestReturnCard, SapilReturnCard } from "./SapilAfterSalesCards";
import { SapilExchangeForm, SapilReturnForm } from "./SapilAfterSalesForms";

const ACTION = "!h-[44px] !px-[18px] !text-[14px]";
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

function Section({ children }: { children: ReactNode }) {
  const t = useShopCopy();
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} data-sapil="after-sales" className="bg-sapil-white rounded-[24px] p-[24px] max-900:p-[20px] flex flex-col gap-[16px]">
      <h2 id={headingId} className="font-sapil-sans font-[700] text-[20px] leading-[1.2] tracking-[-.02em]">
        {t("afterSales.title")}
      </h2>
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
 * The Sapil order page's returns and exchanges (signed-in customer): start a
 * return or exchange the market allows, the order's return terms, and this
 * order's requests. Same rules as Swiss Arabian (useOrderAfterSales).
 */
export function SapilOrderAfterSales({
  orderId,
  status,
  fulfillmentStatus,
  lines,
}: {
  orderId: string;
  status: string;
  fulfillmentStatus?: string | null;
  lines: AfterSalesOrderLine[];
}) {
  const t = useShopCopy();
  const a = useOrderAfterSales({ orderId, status, fulfillmentStatus, lines });
  const formProps = { mode: "customer" as const, orderId, lines, onCancel: () => a.setForm(null), onSubmitted: () => a.setForm(null) };
  return (
    <Section>
      <div className="flex flex-wrap items-center gap-[10px]">
        {a.canReturn ? (
          <Button variant={a.form === "return" ? "dark" : "line"} aria-pressed={a.form === "return"} className={ACTION} onClick={() => a.setForm("return")}>
            {t("afterSales.requestReturn")}
          </Button>
        ) : null}
        {a.canExchange ? (
          <Button variant={a.form === "exchange" ? "dark" : "line"} aria-pressed={a.form === "exchange"} className={ACTION} onClick={() => a.setForm("exchange")}>
            {t("afterSales.requestExchange")}
          </Button>
        ) : null}
        <SapilLink href="/account/returns" className="inline-flex min-h-[44px] items-center text-[14px] font-[600] text-sapil-accent underline underline-offset-[3px]">
          {t("afterSales.viewAll")}
        </SapilLink>
      </div>
      <Notes notes={a.notes} />
      {a.eligible ? <SapilReturnTerms source={{ mode: "customer", orderId }} /> : null}
      {a.form === "return" ? <SapilReturnForm {...formProps} /> : null}
      {a.form === "exchange" ? <SapilExchangeForm {...formProps} /> : null}
      {a.returnItems.length ? (
        <div className="grid gap-[10px]">
          <p className={GROUP}>{t("afterSales.returnRequests")}</p>
          {a.returnItems.map((item) => (
            <SapilReturnCard key={item.returnRequestId} item={item} showOrder={false} />
          ))}
        </div>
      ) : null}
      {a.exchangeItems.length ? (
        <div className="grid gap-[10px]">
          <p className={GROUP}>{t("afterSales.exchangeRequests")}</p>
          {a.exchangeItems.map((item) => (
            <SapilExchangeCard key={item.exchangeRequestId} item={item} showOrder={false} />
          ))}
        </div>
      ) : null}
    </Section>
  );
}

/** The same on the tracking page for a guest (order number + access token). */
export function SapilGuestAfterSales({
  orderNumber,
  orderAccessToken,
  status,
  fulfillmentStatus,
  lines,
}: {
  orderNumber: string;
  orderAccessToken: string;
  status: string;
  fulfillmentStatus?: string | null;
  lines: AfterSalesOrderLine[];
}) {
  const t = useShopCopy();
  const a = useGuestOrderAfterSales({ orderNumber, orderAccessToken, status, fulfillmentStatus, lines });
  const guest = { orderNumber, orderAccessToken };
  const formProps = { mode: "guest" as const, ...guest, lines: a.lines, onCancel: () => a.setForm(null), onSubmitted: () => a.setForm(null) };
  return (
    <Section>
      {a.canReturn || a.canExchange ? (
        <div className="flex flex-wrap items-center gap-[10px]">
          {a.canReturn ? (
            <Button variant={a.form === "return" ? "dark" : "line"} aria-pressed={a.form === "return"} className={ACTION} onClick={() => a.setForm("return")}>
              {t("afterSales.requestReturn")}
            </Button>
          ) : null}
          {a.canExchange ? (
            <Button variant={a.form === "exchange" ? "dark" : "line"} aria-pressed={a.form === "exchange"} className={ACTION} onClick={() => a.setForm("exchange")}>
              {t("afterSales.requestExchange")}
            </Button>
          ) : null}
        </div>
      ) : null}
      {a.noLines ? <p className="text-[14px] leading-[1.55] text-sapil-ink-2">{t("afterSales.guestNoLines")}</p> : null}
      <Notes notes={a.notes} />
      {a.eligible ? <SapilReturnTerms source={{ mode: "guest", orderNumber, orderAccessToken }} /> : null}
      {a.form === "return" ? <SapilReturnForm {...formProps} /> : null}
      {a.form === "exchange" ? <SapilExchangeForm {...formProps} /> : null}
      {a.returnItems.length || a.exchangeItems.length ? (
        <div className="grid gap-[10px]">
          {a.returnItems.map((item) => (
            <SapilGuestReturnCard key={item.returnRequestId} item={item} />
          ))}
          {a.exchangeItems.map((item) => (
            <SapilGuestExchangeCard key={item.exchangeRequestId} item={item} guest={guest} />
          ))}
        </div>
      ) : null}
    </Section>
  );
}
