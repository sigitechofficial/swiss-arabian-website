"use client";

import { useState } from "react";
import { accountBtnGhost } from "@/features/account/constants/accountForm";
import { getStoredGuestOrderLines } from "@/features/checkout/utils/checkoutSession";
import { useGuestExchanges, useGuestReturns } from "../hooks/useAfterSales";
import type { AfterSalesOrderLine } from "../types/afterSales";
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
  const [form, setForm] = useState<"return" | "exchange" | null>(null);
  const eligible = isOrderEligibleForAfterSales(status, fulfillmentStatus);
  const returns = useGuestReturns(orderNumber, orderAccessToken);
  const exchanges = useGuestExchanges(orderNumber, orderAccessToken);
  const creatableLines =
    lines.length > 0 ? lines : getStoredGuestOrderLines(orderNumber);
  const canCreate = eligible && creatableLines.length > 0;
  const returnItems = returns.data?.items ?? [];
  const exchangeItems = exchanges.data?.items ?? [];

  return (
    <section className="overflow-hidden border border-sa-border bg-page">
      <div className="border-b border-sa-border bg-section-soft px-5 py-3">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-sa-muted">
          Returns & exchanges
        </h2>
      </div>
      <div className="flex flex-col gap-4 px-5 py-5">
        {canCreate ? (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={accountBtnGhost}
              onClick={() => setForm("return")}
            >
              Request return
            </button>
            <button
              type="button"
              className={accountBtnGhost}
              onClick={() => setForm("exchange")}
            >
              Request exchange
            </button>
          </div>
        ) : eligible && creatableLines.length === 0 ? (
          <p className="text-[13px] leading-relaxed text-sa-muted">
            Existing requests for this order are listed below. New requests need
            the original order line details.
          </p>
        ) : (
          <p className="text-[13px] leading-relaxed text-sa-muted">
            Return and exchange requests are available after this order ships.
          </p>
        )}

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
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
