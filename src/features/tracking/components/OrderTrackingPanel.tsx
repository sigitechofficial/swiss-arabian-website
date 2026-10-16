"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import {
  ORDER_PROGRESS_STEPS,
  customerOrderTimeline,
  formatOrderDate,
  orderProgressStep,
  shipmentStatusLabel,
  stoppedOrderMessage,
  trackingHistory,
} from "@/features/orders/utils/orderStatus";
import {
  accountPanel,
  accountPanelBody,
  accountPanelHead,
  accountPanelTitle,
  orderEvent,
  orderEventDot,
  orderEventLine,
  orderEventRail,
  orderEventTime,
  orderEventTitle,
  orderEvents,
  orderFact,
  orderFactLabel,
  orderFactNote,
  orderFactValue,
  orderFacts,
  orderLineMeta,
  orderLineName,
  orderShipment,
  orderShipmentCta,
  orderStep,
  orderStepDot,
  orderStepLabel,
  orderStepLine,
  orderStepRail,
  orderSteps,
} from "@/styles/accountChrome";
import type {
  OrderTrackingSummary,
  OrderTrackingTimeline,
  TrackingEvent,
} from "../api/orderTracking.service";

function TrackingCard({
  title,
  flush = false,
  children,
}: {
  title: string;
  /** The body brings its own padding (stepper, shipment rows). */
  flush?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={accountPanel}>
      <header className={accountPanelHead}>
        <h2 className={accountPanelTitle}>{title}</h2>
      </header>
      {flush ? children : <div className={accountPanelBody}>{children}</div>}
    </section>
  );
}

function ProgressStepper({ step }: { step: number }) {
  const last = ORDER_PROGRESS_STEPS.length - 1;
  return (
    <ol className={orderSteps} aria-label="Delivery progress">
      {ORDER_PROGRESS_STEPS.map((label, idx) => {
        const state = idx < step ? "done" : idx === step ? "current" : "next";
        return (
          <li key={label} className={orderStep} aria-current={state === "current" ? "step" : undefined}>
            <div className={orderStepRail} aria-hidden="true">
              <span className={orderStepLine} data-on={idx <= step} data-edge={idx === 0} />
              <span className={orderStepDot} data-state={state}>
                {state === "done" ? <Check size={14} strokeWidth={2.2} /> : idx + 1}
              </span>
              <span className={orderStepLine} data-on={idx < step} data-edge={idx === last} />
            </div>
            <span className={orderStepLabel} data-state={state}>
              {label}
              <span className="sr-only">
                {state === "current" ? " (current step)" : state === "done" ? " (completed)" : " (upcoming)"}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function DeliveryEstimate({ summary }: { summary: OrderTrackingSummary }) {
  if (summary.deliveredAt) {
    return <p className={orderFactValue}>{formatOrderDate(summary.deliveredAt, { long: true })}</p>;
  }
  if (summary.estimatedDeliveryAt) {
    return <p className={orderFactValue}>By {formatOrderDate(summary.estimatedDeliveryAt, { long: true })}</p>;
  }
  return <p className={orderFactNote}>We’ll share a date once your order ships.</p>;
}

export function OrderTrackingPanel({
  summary,
  timeline,
  children,
}: {
  summary: OrderTrackingSummary;
  /** Full per-shipment event history; without it each shipment shows its latest event. */
  timeline?: OrderTrackingTimeline | null;
  /** Shown between the progress card and the shipment history (the account page puts the items here). */
  children?: ReactNode;
}) {
  const step = orderProgressStep(summary.status);
  const eventsByShipment = new Map<string, TrackingEvent[]>(
    (timeline?.shipments ?? []).map((s) => [s.shipmentId, s.events]),
  );
  const orderEventsList = customerOrderTimeline(summary.timeline ?? []);

  return (
    <div id="tracking" className="flex min-w-0 scroll-mt-40 flex-col gap-[clamp(20px,3vw,28px)]">
      <TrackingCard title="Delivery progress" flush={step >= 0}>
        {step >= 0 ? (
          <>
            <ProgressStepper step={step} />
            {/* Delivery date and the carrier's latest word share the card, so neither sits in a near-empty box. */}
            <div className={orderFacts}>
              <div className={orderFact}>
                <p className={orderFactLabel}>{summary.deliveredAt ? "Delivered on" : "Estimated delivery"}</p>
                <DeliveryEstimate summary={summary} />
              </div>
              <div className={orderFact}>
                <p className={orderFactLabel}>Latest update</p>
                {summary.latestTrackingStatus ? (
                  <>
                    <p className={orderFactValue}>{shipmentStatusLabel(summary.latestTrackingStatus)}</p>
                    {summary.latestTrackingEventTime ? (
                      <p className={orderFactNote}>
                        {formatOrderDate(summary.latestTrackingEventTime, { time: true })}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className={orderFactNote}>No shipment updates yet. They’ll appear here once it leaves our warehouse.</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <p className={`${orderFactNote} mt-0!`}>{stoppedOrderMessage(summary.status)}</p>
        )}
      </TrackingCard>

      {children}

      {summary.shipments.length > 0 ? (
        <TrackingCard title={`Shipments (${summary.shipments.length})`} flush>
          {summary.shipments.map((shipment) => {
            const events =
              eventsByShipment.get(shipment.shipmentId) ??
              (shipment.latestTrackingEvent ? [shipment.latestTrackingEvent] : []);
            const history = trackingHistory(events).reverse();
            const carrierLine = [
              shipment.shippingPartner?.displayName,
              shipment.deliveryMethod?.displayName,
            ]
              .filter(Boolean)
              .join(" · ");

            return (
              <article key={shipment.shipmentId} className={orderShipment}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={orderLineName}>{shipmentStatusLabel(shipment.status)}</p>
                    {carrierLine ? <p className={orderLineMeta}>{carrierLine}</p> : null}
                    {shipment.trackingNumber ? (
                      <p className={orderLineMeta}>
                        Tracking number <b className="font-semibold text-[var(--ink,#241f1b)]">{shipment.trackingNumber}</b>
                      </p>
                    ) : null}
                    {shipment.shipmentNumber ? (
                      <p className={orderLineMeta}>
                        Shipment <b className="font-semibold text-[var(--ink,#241f1b)]">{shipment.shipmentNumber}</b>
                      </p>
                    ) : null}
                    {shipment.estimatedDeliveryAt && !shipment.deliveredAt ? (
                      <p className={orderLineMeta}>
                        Arriving by {formatOrderDate(shipment.estimatedDeliveryAt, { long: true })}
                      </p>
                    ) : null}
                  </div>
                  {shipment.trackingUrl ? (
                    <a
                      href={shipment.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={orderShipmentCta}
                    >
                      Carrier tracking ↗
                    </a>
                  ) : null}
                </div>

                {shipment.items?.length ? (
                  <ul className={`${orderLineMeta} mt-3! flex list-none flex-col gap-0.5 p-0`}>
                    {shipment.items.map((item) => (
                      <li key={`${shipment.shipmentId}-${item.sku}`}>
                        {Number.parseInt(item.quantity, 10) || 1} × {item.productName ?? item.sku}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {history.length ? (
                  <ol className={`${orderEvents} mt-4 border-t border-[var(--line)] pt-4`}>
                    {history.map((entry, idx, list) => (
                      <li key={entry.key} className={orderEvent}>
                        <div className={orderEventRail} aria-hidden="true">
                          <span className={orderEventDot} data-latest={idx === 0} />
                          {idx < list.length - 1 ? <span className={orderEventLine} /> : null}
                        </div>
                        <div className="min-w-0">
                          <p className={orderEventTitle}>
                            {entry.label}
                            {entry.detail ? <span> · {entry.detail}</span> : null}
                          </p>
                          <p className={orderEventTime}>
                            {[formatOrderDate(entry.occurredAt, { time: true }), entry.location]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : null}
              </article>
            );
          })}
        </TrackingCard>
      ) : null}

      {orderEventsList.length > 0 ? (
        <TrackingCard title="Order timeline">
          <ol className={orderEvents}>
            {[...orderEventsList].reverse().map((event, idx, list) => (
              <li key={event.key} className={orderEvent}>
                <div className={orderEventRail} aria-hidden="true">
                  <span className={orderEventDot} data-latest={idx === 0} />
                  {idx < list.length - 1 ? <span className={orderEventLine} /> : null}
                </div>
                <div className="min-w-0">
                  <p className={orderEventTitle}>{event.label}</p>
                  <p className={orderEventTime}>{formatOrderDate(event.occurredAt, { time: true })}</p>
                </div>
              </li>
            ))}
          </ol>
        </TrackingCard>
      ) : null}
    </div>
  );
}
