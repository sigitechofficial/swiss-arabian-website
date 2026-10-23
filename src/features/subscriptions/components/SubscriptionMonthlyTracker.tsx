"use client";

import { LocaleLink } from "@/lib/i18n/LocaleLink";
import { formatOrderDate } from "@/features/orders/utils/orderStatus";
import type { SubscriptionDetail } from "../types/subscription.types";
import {
  monthsFromAgreement,
  TRACKER_DELIVERY_LABEL,
  TRACKER_PAYMENT_LABEL,
  type SubscriptionCycleSnapshot,
  type SubscriptionMonthRow,
} from "../utils/subscriptionMonthlyTracker";

function orderLine(row: SubscriptionMonthRow): string {
  if (row.orderNumber) return row.orderNumber;
  if (row.payment === "PAID") return "Order reference is not available yet";
  return TRACKER_DELIVERY_LABEL.NOT_CREATED;
}

export function SubscriptionMonthlyTracker({
  detail,
  cycles,
}: {
  detail: Pick<
    SubscriptionDetail,
    "selectionMode" | "status" | "billingEnabled" | "nextBillingAt" | "queue" | "surpriseSchedule" | "billingCycles"
  >;
  cycles?: SubscriptionCycleSnapshot[];
}) {
  const months = monthsFromAgreement({
    ...detail,
    billingCycles: cycles ?? detail.billingCycles,
  });

  const ordered = months.filter((row) => row.payment === "PAID" || row.payment === "SKIPPED" || row.orderNumber).length;

  return (
    <section className="flex flex-col gap-5 rounded-[20px] border border-[#E6DCCB] bg-white p-6" aria-labelledby="subscription-months">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="subscription-months" className="m-0 text-[22px] font-bold text-[#2B1D17]">Your 12-month plan</h2>
          <span className="text-sm text-[#6E5A50]">{ordered} recorded · {Math.max(0, months.length - ordered)} still open</span>
        </div>
        <div className="flex flex-wrap gap-3.5 text-[13px] text-[#5A463C]">
          <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[#8E4636]" />Ordered</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full border-2 border-[#8E4636]" />Up next</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full border-2 border-dashed border-[#B9A68F]" />Not chosen</span>
        </div>
      </div>
      <ol className="m-0 grid list-none grid-cols-2 gap-3.5 p-0 sm:grid-cols-4">
        {months.map((row) => {
          const chosen = Boolean(row.fragrance);
          const upNext = !chosen && Boolean(row.billingDate);
          return (
            <li
              key={row.month}
              className={`flex flex-col gap-2.5 rounded-[14px] p-2.5 ${upNext ? "border border-[#D9B8AA] bg-white" : chosen ? "border-2 border-[#8E4636] bg-white" : "border border-[#EDE4D6] bg-white"}`}
            >
              <div className={`flex aspect-square items-center justify-center rounded-[10px] ${chosen ? "bg-[#F1E6D6]" : "border-2 border-dashed border-[#D9CBB6] bg-[#FBF8F2] text-[13px] font-semibold text-[#6E5A50]"}`}>
                {chosen ? <FragranceMark /> : "Not chosen yet"}
              </div>
              <div className="flex flex-col gap-1 px-0.5">
                <strong className="text-[15px] font-bold text-[#2B1D17]">Month {row.month}</strong>
                <span className="text-xs text-[#6E5A50]">{row.billingDate ? formatOrderDate(row.billingDate) : ""}</span>
                <span className={`text-[13px] ${chosen ? "font-semibold text-[#2B1D17]" : "text-[#6E5A50]"}`}>
                  {row.fragrance ?? "Fragrance not planned yet"} {TRACKER_PAYMENT_LABEL[row.payment]}
                </span>
                {row.payment === "SKIPPED" ? null : (
                  <span className="text-xs text-[#6E5A50]">
                    {row.orderNumber
                      ? `${row.orderNumber} · ${TRACKER_DELIVERY_LABEL[row.delivery]}`
                      : row.delivery === "ORDER_PENDING"
                        ? TRACKER_DELIVERY_LABEL.ORDER_PENDING
                        : orderLine(row)}
                    {row.trackingNumber ? ` · ${row.trackingNumber}` : ""}
                    {row.trackHref && row.orderId ? (
                      <>
                        {" · "}
                        <LocaleLink href={row.trackHref}>Track order</LocaleLink>
                      </>
                    ) : null}
                    {row.trackingUrl ? (
                      <>
                        {" · "}
                        <a href={row.trackingUrl}>Carrier tracking</a>
                      </>
                    ) : null}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function FragranceMark() {
  return (
    <svg width="62%" height="78%" viewBox="0 0 120 160" aria-hidden="true">
      <rect x="47" y="10" width="26" height="24" rx="4" fill="#C9A46A" />
      <rect x="53" y="34" width="14" height="10" fill="#A9814B" />
      <rect x="24" y="44" width="72" height="104" rx="16" fill="#8E4636" />
      <rect x="32" y="54" width="8" height="80" rx="4" fill="#FFFFFF" opacity="0.22" />
      <rect x="42" y="84" width="36" height="30" rx="3" fill="#F8F4EC" />
    </svg>
  );
}
