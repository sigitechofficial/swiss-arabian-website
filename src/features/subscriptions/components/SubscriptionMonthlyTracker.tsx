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

function monthStatusChip(row: SubscriptionMonthRow): { label: string; className: string } {
  if (row.payment === "SKIPPED") return { label: "Skipped", className: "bg-[#F3EEE6] text-[#6E5A50]" };
  if (row.delivery === "DELIVERED") return { label: "Delivered", className: "bg-[#E3F1E6] text-[#1F5B30]" };
  if (row.delivery === "SHIPPED") return { label: "Shipped", className: "bg-[#F6E7D4] text-[#7A4B0B]" };
  if (row.orderNumber) return { label: "Not delivered", className: "bg-[#F6E7D4] text-[#7A4B0B]" };
  if (row.payment !== "UPCOMING") return { label: TRACKER_PAYMENT_LABEL[row.payment], className: "bg-[#F6E7D4] text-[#7A4B0B]" };
  return { label: "Upcoming", className: "bg-[#FBF8F2] text-[#6E5A50]" };
}

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
    "selectionMode" | "status" | "billingEnabled" | "nextBillingAt" | "registeredAt" | "queue" | "surpriseSchedule" | "billingCycles"
  >;
  cycles?: SubscriptionCycleSnapshot[];
}) {
  const months = monthsFromAgreement({
    ...detail,
    billingCycles: cycles ?? detail.billingCycles,
  });

  const ordered = months.filter((row) => row.payment === "PAID" || row.payment === "SKIPPED" || row.orderNumber).length;
  const delivered = months.filter((row) => row.delivery === "DELIVERED");
  const notDelivered = months.filter((row) => Boolean(row.orderNumber) && row.delivery !== "DELIVERED" && row.delivery !== "SHIPPED");

  return (
    <section className="flex flex-col gap-5 rounded-[20px] border border-[#E6DCCB] bg-white p-6" aria-labelledby="subscription-months">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="subscription-months" className="m-0 text-[22px] font-bold text-[#2B1D17]">Your 12-month plan</h2>
          <span className="text-sm text-[#6E5A50]">{ordered} recorded · {Math.max(0, months.length - ordered)} still open</span>
          <span className="text-sm font-medium text-[#2B1D17]">
            {delivered.length ? `Delivered: ${delivered.map((row) => row.label).join(", ")}` : "None delivered yet"}
            {notDelivered.length ? ` · Not delivered: ${notDelivered.map((row) => row.label).join(", ")}` : ""}
          </span>
        </div>
        <div className="flex flex-wrap gap-3.5 text-[13px] text-[#5A463C]">
          <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[#2E7D45]" />Delivered</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[#C9842A]" />Not delivered</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full border-2 border-dashed border-[#B9A68F]" />Upcoming</span>
        </div>
      </div>
      <ol className="m-0 grid list-none grid-cols-2 gap-3.5 p-0 sm:grid-cols-4">
        {months.map((row) => {
          const chosen = Boolean(row.fragrance);
          const upNext = !chosen && Boolean(row.billingDate);
          const chip = monthStatusChip(row);
          const border = row.delivery === "DELIVERED"
            ? "border-2 border-[#2E7D45]"
            : row.orderNumber
              ? "border-2 border-[#C9842A]"
              : upNext
                ? "border border-[#D9B8AA]"
                : chosen
                  ? "border border-[#E6DCCB]"
                  : "border border-[#EDE4D6]";
          return (
            <li
              key={row.month}
              className={`flex min-w-0 flex-col gap-2.5 rounded-[14px] bg-white p-2.5 ${border}`}
            >
              <div className={`flex aspect-square items-center justify-center overflow-hidden rounded-[10px] ${chosen ? "bg-[#F1E6D6]" : "border-2 border-dashed border-[#D9CBB6] bg-[#FBF8F2] text-[13px] font-semibold text-[#6E5A50]"}`}>
                {chosen ? (row.imageUrl ? <img src={row.imageUrl} alt="" className="h-full w-full object-contain p-2" /> : <FragranceMark />) : "Not chosen yet"}
              </div>
              <div className="flex flex-col gap-1 px-0.5">
                <strong className="text-[15px] font-bold text-[#2B1D17]">{row.label}</strong>
                <span className={`w-fit rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${chip.className}`}>{chip.label}</span>
                <span className="text-xs text-[#6E5A50]">{row.billingDate ? formatOrderDate(row.billingDate) : ""}</span>
                <span className={`flex min-w-0 items-baseline gap-1 text-[13px] ${chosen ? "font-semibold text-[#2B1D17]" : "text-[#6E5A50]"}`}>
                  <span className="min-w-0 truncate" title={row.fragrance ?? undefined}>
                    {row.fragrance ?? "Fragrance not planned yet"}
                  </span>
                  {row.payment !== "UPCOMING" ? <span className="shrink-0 font-semibold">{TRACKER_PAYMENT_LABEL[row.payment]}</span> : null}
                </span>
                {row.payment === "SKIPPED" ? null : (
                  <span className="text-xs text-[#6E5A50]">
                    {row.orderNumber ? row.orderNumber : row.delivery === "ORDER_PENDING" ? TRACKER_DELIVERY_LABEL.ORDER_PENDING : orderLine(row)}
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
