"use client";

import { orderProgressStep, trackingHistory } from "@/features/orders/utils/orderStatus";
import type { OrderTrackingSummary, OrderTrackingTimeline } from "@/features/tracking/api/orderTracking.service";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { useSapilDate } from "../commerce/shared";
import { statusText } from "../account/AccountChrome";

/** The tracker position for a tracking summary (delivered / shipped wins over the order status). */
export function trackingStep(summary: Pick<OrderTrackingSummary, "status" | "deliveredAt" | "shipments">): number {
  if (summary.deliveredAt) return 4;
  const step = orderProgressStep(summary.status);
  if (step >= 0 && summary.shipments.length && step < 3) return 3;
  return step;
}

/** Shipments (carrier link, tracking number) and the carrier's event history. */
export function TrackingDetails({
  summary,
  timeline,
}: {
  summary: OrderTrackingSummary;
  timeline?: OrderTrackingTimeline | null;
}) {
  const t = useSapilCopy();
  const date = useSapilDate();
  const events = timeline?.timeline?.length ? trackingHistory(timeline.timeline) : [];
  if (!summary.shipments.length && !events.length) return null;
  return (
    <section id="tracking" className="bg-sapil-white rounded-[24px] py-[24px] px-[26px] mb-[20px] max-900:p-[20px]" aria-labelledby="od-tracking">
      <h2 id="od-tracking" className="font-sapil-sans font-[700] text-[20px] leading-[normal] tracking-[-.02em] mb-[10px]">
        {t("account.odHistory")}
      </h2>
      {summary.shipments.map((shipment) => (
        <div key={shipment.shipmentId} className="flex items-center justify-between gap-[12px] flex-wrap py-[10px] border-b border-sapil-line text-[15px]">
          <span>
            <b className="font-[600]">{t("account.odShipment", { number: shipment.shipmentNumber })}</b>
            <span className="text-sapil-ink-2">
              {" · "}
              {shipment.shippingPartner.displayName ?? shipment.shippingPartner.partnerCode} · {statusText(t, shipment.status)}
            </span>
            {shipment.trackingNumber ? (
              <small className="block text-[13px] text-sapil-muted">
                {t("account.odTrackingNumber", { number: shipment.trackingNumber })}
              </small>
            ) : null}
          </span>
          {shipment.trackingUrl ? (
            <a
              href={shipment.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-[600] text-[14px] border-b border-current pb-[2px] hover:text-sapil-accent"
            >
              {t("account.odCarrierLink")}
            </a>
          ) : null}
        </div>
      ))}
      {events.length ? (
        <ol className="list-none mt-[12px]">
          {events
            .slice()
            .reverse()
            .map((entry) => (
              <li key={entry.key} className="grid grid-cols-[140px_1fr] gap-[12px] py-[8px] text-[14px] max-900:grid-cols-[1fr] max-900:gap-[2px]">
                <span className="text-sapil-muted">{date(entry.occurredAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>
                <span>
                  <b className="font-[600]">{entry.label}</b>
                  {entry.detail ? <span className="text-sapil-ink-2"> · {entry.detail}</span> : null}
                  {entry.location ? <small className="block text-[12px] text-sapil-muted">{entry.location}</small> : null}
                </span>
              </li>
            ))}
        </ol>
      ) : null}
    </section>
  );
}
