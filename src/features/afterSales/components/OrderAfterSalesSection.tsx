"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { accountBtnGhost } from "@/features/account/constants/accountForm";
import {
  useCustomerExchangesFeed,
  useCustomerReturnsFeed,
} from "../hooks/useAfterSales";
import type { AfterSalesOrderLine } from "../types/afterSales";
import { isOrderEligibleForAfterSales } from "../utils/eligibility";
import {
  ExchangeRequestCard,
  ReturnRequestCard,
} from "./AfterSalesRequestCards";
import { ExchangeRequestForm } from "./ExchangeRequestForm";
import { ReturnRequestForm } from "./ReturnRequestForm";

type OrderAfterSalesSectionProps = {
  orderId: string;
  status: string;
  fulfillmentStatus?: string | null;
  lines: AfterSalesOrderLine[];
};

export function OrderAfterSalesSection({
  orderId,
  status,
  fulfillmentStatus,
  lines,
}: OrderAfterSalesSectionProps) {
  const [form, setForm] = useState<"return" | "exchange" | null>(null);
  const eligible = isOrderEligibleForAfterSales(status, fulfillmentStatus);
  const returns = useCustomerReturnsFeed(null, orderId);
  const exchanges = useCustomerExchangesFeed(null, orderId);

  const returnItems = useMemo(
    () => returns.data?.pages.flatMap((page) => page.items) ?? [],
    [returns.data],
  );
  const exchangeItems = useMemo(
    () => exchanges.data?.pages.flatMap((page) => page.items) ?? [],
    [exchanges.data],
  );

  const canCreate = eligible && lines.length > 0;

  return (
    <section className="overflow-hidden border border-sa-border">
      <div className="border-b border-sa-border bg-section-soft px-5 py-3">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-sa-muted">
          Returns & exchanges
        </h2>
      </div>
      <div className="flex flex-col gap-4 bg-page px-5 py-4">
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
            <Link
              href="/account/returns"
              className="inline-flex h-11 items-center text-[13px] font-semibold text-terra hover:underline"
            >
              View all requests
            </Link>
          </div>
        ) : (
          <p className="text-[13px] leading-relaxed text-sa-muted">
            Return and exchange requests are available after this order ships.
            You can still view existing requests in{" "}
            <Link href="/account/returns" className="font-semibold text-terra hover:underline">
              Returns
            </Link>
            .
          </p>
        )}

        {form === "return" ? (
          <ReturnRequestForm
            mode="customer"
            orderId={orderId}
            lines={lines}
            onCancel={() => setForm(null)}
            onSubmitted={() => setForm(null)}
          />
        ) : null}
        {form === "exchange" ? (
          <ExchangeRequestForm
            mode="customer"
            orderId={orderId}
            lines={lines}
            onCancel={() => setForm(null)}
            onSubmitted={() => setForm(null)}
          />
        ) : null}

        {returnItems.length > 0 ? (
          <div className="flex flex-col gap-3">
            <p className="text-[12px] font-semibold uppercase tracking-widest text-sa-muted">
              Return requests
            </p>
            {returnItems.map((item) => (
              <ReturnRequestCard key={item.returnRequestId} item={item} />
            ))}
          </div>
        ) : null}
        {exchangeItems.length > 0 ? (
          <div className="flex flex-col gap-3">
            <p className="text-[12px] font-semibold uppercase tracking-widest text-sa-muted">
              Exchange requests
            </p>
            {exchangeItems.map((item) => (
              <ExchangeRequestCard key={item.exchangeRequestId} item={item} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
