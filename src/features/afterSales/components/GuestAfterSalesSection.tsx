"use client";

import { useState } from "react";
import { accountBtnGhost } from "@/features/account/constants/accountForm";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { getStoredGuestOrderLines } from "@/features/checkout/utils/checkoutSession";
import {
  useGuestAfterSalesOptions,
  useGuestExchanges,
  useGuestReturns,
} from "../hooks/useAfterSales";
import type { AfterSalesOrderLine } from "../types/afterSales";
import { resolveAfterSalesActions } from "../utils/afterSalesOptions";
import { isOrderEligibleForAfterSales } from "../utils/eligibility";
import {
  GuestExchangeRequestCard,
  GuestReturnRequestCard,
} from "./AfterSalesRequestCards";
import { ExchangeRequestForm } from "./ExchangeRequestForm";
import { ReturnRequestForm } from "./ReturnRequestForm";

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
  const [form, setForm] = useState<"return" | "exchange" | null>(null);
  const eligible = isOrderEligibleForAfterSales(status, fulfillmentStatus);
  const returns = useGuestReturns(orderNumber, orderAccessToken);
  const exchanges = useGuestExchanges(orderNumber, orderAccessToken);
  const creatableLines =
    lines.length > 0 ? lines : getStoredGuestOrderLines(orderNumber);
  const options = useGuestAfterSalesOptions(orderNumber, orderAccessToken);
  const actions = resolveAfterSalesActions(options.data, eligible, t);
  const hasLines = creatableLines.length > 0;
  const canReturn = actions.canReturn && hasLines;
  const canExchange = actions.canExchange && hasLines;
  const returnItems = returns.data?.items ?? [];
  const exchangeItems = exchanges.data?.items ?? [];

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
        {(actions.canReturn || actions.canExchange) && !hasLines ? (
          <p className="text-[13px] leading-relaxed text-sa-muted">
            {t("afterSales.guestNoLines")}
          </p>
        ) : null}
        {actions.notes.map((note) => (
          <p key={note} className="text-[13px] leading-relaxed text-sa-muted">
            {note}
          </p>
        ))}

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
