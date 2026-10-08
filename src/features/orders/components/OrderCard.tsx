import Image from "next/image";
import { LocaleLink } from "@/lib/i18n/LocaleLink";

import { AccountStatusLabel } from "@/features/account/components/AccountStatus";

import type { OrderSummaryView } from "../types/order";

type OrderCardProps = {
  order: OrderSummaryView;
};

export function OrderCard({ order }: OrderCardProps) {
  return (
    <article className="overflow-hidden rounded-lg border border-sa-border bg-page">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-sa-border bg-section-soft px-5 py-3 sm:px-6">
        <p className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wide text-sa-secondary">
            Order ID
          </span>
          <span className="font-mono text-[12px] font-semibold text-sa-primary">
            {order.reference}
          </span>
        </p>
        <p className="flex items-center gap-1.5 sm:ml-auto">
          <span className="text-[10px] font-bold uppercase tracking-wide text-sa-secondary">
            Date
          </span>
          <span className="text-[12px] font-semibold text-sa-primary">
            {order.dateLabel}
          </span>
        </p>
        <LocaleLink
          href={`/account/orders/${order.id}`}
          className="text-[12px] font-medium text-sa-primary hover:text-terra"
        >
          View Details &nbsp;→
        </LocaleLink>
      </div>

      <div className="flex items-start gap-4 px-5 py-6 sm:px-6 sm:py-7">
        <div className="order-2 min-w-0 flex-1 lg:order-1">
          <p className="text-[12px] text-sa-secondary">
            {order.fulfilmentLabel} &nbsp;|&nbsp; {order.itemCount}{" "}
            {order.itemCount === 1 ? "item" : "items"}
          </p>
          <p className="mt-1.5 text-[14.5px] font-bold text-sa-primary sm:text-[16px]">
            {order.headline}
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-[12px]">
            <span className="text-sa-secondary">Status:</span>
            <AccountStatusLabel
              label={order.statusLabel}
              tone={order.statusTone}
            />
          </p>
        </div>

        <div className="relative order-1 h-20 w-20 shrink-0 overflow-hidden bg-section-soft sm:h-24 sm:w-24 lg:order-2 lg:h-[120px] lg:w-[120px]">
          {order.thumbnail ? (
            <Image
              src={order.thumbnail}
              alt=""
              fill
              className="object-cover"
              sizes="120px"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-full w-full items-center justify-center text-[11px] font-semibold uppercase tracking-[0.2em] text-sa-muted"
            >
              SA
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
