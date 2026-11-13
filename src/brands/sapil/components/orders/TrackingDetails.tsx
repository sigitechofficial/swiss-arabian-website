"use client";

import {
  deliveryDateFact,
  orderProgressStep,
  stoppedOrderKind,
  trackingHistory,
  trackingStatusKey,
  type StoppedOrderKind,
  type TrackingStatusKey,
} from "@/features/orders/utils/orderStatus";
import type { OrderTrackingSummary, OrderTrackingTimeline } from "@/features/tracking/api/orderTracking.service";
import { useSapilCopy, type SapilTranslator } from "../../i18n/SapilCopy";
import type { SapilCopyKey } from "../../i18n/catalog";
import { useSapilDate } from "../commerce/shared";

/** The tracker position for a tracking summary (delivered / shipped wins over the order status). */
export function trackingStep(summary: Pick<OrderTrackingSummary, "status" | "deliveredAt" | "shipments">): number {
  if (summary.deliveredAt) return 4;
  const step = orderProgressStep(summary.status);
  if (step >= 0 && summary.shipments.length && step < 3) return 3;
  return step;
}

const SHIP_KEY: Record<TrackingStatusKey, SapilCopyKey> = {
  preparing: "account.shipPreparing",
  created: "account.shipCreated",
  awaitingPickup: "account.shipAwaitingPickup",
  pickedUp: "account.shipPickedUp",
  inTransit: "account.shipInTransit",
  outForDelivery: "account.shipOutForDelivery",
  delivered: "account.shipDelivered",
  failedAttempt: "account.shipFailedAttempt",
  delayed: "account.shipDelayed",
  returning: "account.shipReturning",
  returned: "account.shipReturned",
  cancelled: "account.shipCancelled",
  update: "account.shipUpdate",
};

/** A shipment or carrier status in the shopper's words (never the raw code). */
export function shipmentStatusText(t: SapilTranslator, status: string | null | undefined): string {
  return t(SHIP_KEY[trackingStatusKey(status)]);
}

const STOPPED_KEY: Record<StoppedOrderKind, SapilCopyKey> = {
  cancelled: "account.stoppedCancelled",
  refundPending: "account.stoppedRefundPending",
  refunded: "account.stoppedRefunded",
  review: "account.stoppedReview",
  failed: "account.stoppedFailed",
  other: "account.stoppedOther",
};

/** Why an order has no delivery progress, calmly. */
export function stoppedText(t: SapilTranslator, status: string): string {
  return t(STOPPED_KEY[stoppedOrderKind(status)]);
}

/** "Delivered on …" once delivered, else the estimated date; none once delivered without a date. */
export function useDeliveryHighlight() {
  const t = useSapilCopy();
  const date = useSapilDate();
  return (summary: Pick<OrderTrackingSummary, "status" | "deliveredAt" | "estimatedDeliveryAt"> | null) => {
    const fact = summary ? deliveryDateFact(summary) : null;
    if (!fact) return null;
    return {
      label: t(fact.kind === "delivered" ? "account.odDeliveredLabel" : "account.odEtaLabel"),
      value: date(fact.at, { weekday: "short", day: "numeric", month: "short" }),
    };
  };
}

/** Shipments (carrier link, tracking number) and the carrier's event history, newest first. */
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
              {shipment.shippingPartner.displayName ? `${shipment.shippingPartner.displayName} · ` : null}
              {shipmentStatusText(t, shipment.status)}
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
          {events.map((entry) => (
            <li key={entry.key} className="grid grid-cols-[140px_1fr] gap-[12px] py-[8px] text-[14px] max-900:grid-cols-[1fr] max-900:gap-[2px]">
              <span className="text-sapil-muted">{date(entry.occurredAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>
              <span>
                <b className="font-[600]">{t(SHIP_KEY[entry.status])}</b>
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
