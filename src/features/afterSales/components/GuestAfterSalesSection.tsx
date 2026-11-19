"use client";

import { accountBtnGhost } from "@/features/account/constants/accountForm";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { useGuestOrderAfterSales } from "../hooks/useOrderAfterSales";
import type { AfterSalesOrderLine } from "../types/afterSales";
import {
  GuestExchangeRequestCard,
  GuestReturnRequestCard,
} from "./AfterSalesRequestCards";
import { ExchangeRequestForm } from "./ExchangeRequestForm";
import { ReturnRequestForm } from "./ReturnRequestForm";
import { ReturnsPolicySummary } from "./ReturnsPolicySummary";

type GuestAfterSalesSectionProps = {
  orderNumber: string;
  orderAccessToken: string;
  status: string;
  fulfillmentStatus?: string | null;
  lines: AfterSalesOrderLine[];
};

export function GuestAfterSalesSection({
  orderNumber,
  orderAccessToken,
  status,
  fulfillmentStatus,
  lines,
}: GuestAfterSalesSectionProps) {
  const t = useShopCopy();
  const {
    form,
    setForm,
    eligible,
    lines: creatableLines,
    canReturn,
    canExchange,
    noLines,
    notes,
    returnItems,
    exchangeItems,
  } = useGuestOrderAfterSales({ orderNumber, orderAccessToken, status, fulfillmentStatus, lines });

  return (
    <section className="overflow-hidden border border-sa-border bg-page">
      <div className="border-b border-sa-border bg-section-soft px-5 py-3">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-sa-muted">
          {t("afterSales.title")}
        </h2>
      </div>
      <div className="flex flex-col gap-4 px-5 py-5">
        {canReturn || canExchange ? (
          <div className="flex flex-wrap gap-3">
            {canReturn ? (
              <button
                type="button"
                className={accountBtnGhost}
                onClick={() => setForm("return")}
              >
                {t("afterSales.requestReturn")}
              </button>
            ) : null}
            {canExchange ? (
              <button
                type="button"
                className={accountBtnGhost}
                onClick={() => setForm("exchange")}
              >
                {t("afterSales.requestExchange")}
              </button>
            ) : null}
          </div>
        ) : null}
        {noLines ? (
          <p className="text-[13px] leading-relaxed text-sa-muted">
            {t("afterSales.guestNoLines")}
          </p>
        ) : null}
        {notes.map((note) => (
          <p key={note} className="text-[13px] leading-relaxed text-sa-muted">
            {note}
          </p>
        ))}
        {eligible ? (
          <ReturnsPolicySummary
            source={{ mode: "guest", orderNumber, orderAccessToken }}
          />
        ) : null}

        {form === "return" ? (
          <ReturnRequestForm
            mode="guest"
            orderNumber={orderNumber}
            orderAccessToken={orderAccessToken}
            lines={creatableLines}
            onCancel={() => setForm(null)}
            onSubmitted={() => setForm(null)}
          />
        ) : null}
        {form === "exchange" ? (
          <ExchangeRequestForm
            mode="guest"
            orderNumber={orderNumber}
            orderAccessToken={orderAccessToken}
            lines={creatableLines}
            onCancel={() => setForm(null)}
            onSubmitted={() => setForm(null)}
          />
        ) : null}

        {returnItems.length > 0 ? (
          <div className="flex flex-col gap-3">
            {returnItems.map((item) => (
              <GuestReturnRequestCard key={item.returnRequestId} item={item} />
            ))}
          </div>
        ) : null}
        {exchangeItems.length > 0 ? (
          <div className="flex flex-col gap-3">
            {exchangeItems.map((item) => (
              <GuestExchangeRequestCard
                key={item.exchangeRequestId}
                item={item}
                orderNumber={orderNumber}
                orderAccessToken={orderAccessToken}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
