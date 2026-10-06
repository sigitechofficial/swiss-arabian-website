"use client";

import type { ReactNode } from "react";
import {
  ORDER_PROGRESS_STEPS,
  customerOrderTimeline,
  formatOrderDate,
  orderProgressStep,
  shipmentStatusLabel,
  stoppedOrderMessage,
  trackingHistory,
} from "@/features/orders/utils/orderStatus";
import type {
  OrderTrackingSummary,
  OrderTrackingTimeline,
  TrackingEvent,
} from "../api/orderTracking.service";

function TrackingCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-sa-border">
      <div className="border-b border-sa-border bg-section-soft px-5 py-3">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-sa-muted">{title}</h2>
      </div>
      <div className="bg-page px-5 py-4">{children}</div>
    </section>
  );
}

function ProgressStepper({ step }: { step: number }) {
  const last = ORDER_PROGRESS_STEPS.length - 1;
  return (
    <ol className="flex items-start" aria-label="Delivery progress">
      {ORDER_PROGRESS_STEPS.map((label, idx) => {
        const done = idx < step;
        const current = idx === step;
        return (
          <li key={label} className="flex flex-1" aria-current={current ? "step" : undefined}>
            <div className="flex w-full flex-col items-center gap-2 text-center">
              <div className="flex w-full items-center">
                <span
                  aria-hidden="true"
                  className={`h-px flex-1 ${idx === 0 ? "opacity-0" : idx <= step ? "bg-terra" : "bg-sa-border"}`}
                />
                <span
                  aria-hidden="true"
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${
                    current
                      ? "border-terra bg-terra text-white"
                      : done
                        ? "border-terra bg-page text-terra"
                        : "border-sa-border bg-page text-sa-secondary"
                  }`}
                >
                  {done ? "✓" : idx + 1}
                </span>
                <span
                  aria-hidden="true"
                  className={`h-px flex-1 ${idx === last ? "opacity-0" : idx < step ? "bg-terra" : "bg-sa-border"}`}
                />
              </div>
              <span
                className={`text-[11px] leading-tight ${
                  current ? "font-semibold text-terra" : done ? "text-sa-primary" : "text-sa-secondary"
                }`}
              >
                {label}
                <span className="sr-only">
                  {current ? " (current step)" : done ? " (completed)" : " (upcoming)"}
                </span>
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function DeliveryEstimate({ summary }: { summary: OrderTrackingSummary }) {
  if (summary.deliveredAt) {
    return (
      <p className="text-[14.5px] font-semibold text-sa-primary">
        {formatOrderDate(summary.deliveredAt, { long: true })}
      </p>
    );
  }
  if (summary.estimatedDeliveryAt) {
    return (
      <p className="text-[14.5px] font-semibold text-sa-primary">
        By {formatOrderDate(summary.estimatedDeliveryAt, { long: true })}
      </p>
    );
  }
  return (
    <p className="text-[12.5px] leading-relaxed text-sa-secondary">
      We’ll share an estimated delivery date once your order ships.
    </p>
  );
}

export function OrderTrackingPanel({
  summary,
  timeline,
}: {
  summary: OrderTrackingSummary;
  /** Full per-shipment event history; without it each shipment shows its latest event. */
  timeline?: OrderTrackingTimeline | null;
}) {
  const step = orderProgressStep(summary.status);
  const eventsByShipment = new Map<string, TrackingEvent[]>(
    (timeline?.shipments ?? []).map((s) => [s.shipmentId, s.events]),
  );
  const orderEvents = customerOrderTimeline(summary.timeline ?? []);

  return (
    <div id="tracking" className="flex scroll-mt-40 flex-col gap-5">
      <TrackingCard title="Delivery progress">
        {step >= 0 ? (
          <ProgressStepper step={step} />
        ) : (
          <p className="text-[12.5px] leading-relaxed text-sa-secondary">{stoppedOrderMessage(summary.status)}</p>
        )}
      </TrackingCard>

      {step >= 0 ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <TrackingCard title={summary.deliveredAt ? "Delivered on" : "Estimated delivery"}>
            <DeliveryEstimate summary={summary} />
          </TrackingCard>
          <TrackingCard title="Latest update">
            {summary.latestTrackingStatus ? (
              <>
                <p className="text-[13.5px] font-semibold text-sa-primary">
                  {shipmentStatusLabel(summary.latestTrackingStatus)}
                </p>
                {summary.latestTrackingEventTime ? (
                  <p className="mt-1 text-[12px] text-sa-secondary">
                    {formatOrderDate(summary.latestTrackingEventTime, { time: true })}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-[12.5px] leading-relaxed text-sa-secondary">
                No shipment updates yet — we’ll post them here as soon as your order leaves our warehouse.
              </p>
            )}
          </TrackingCard>
        </div>
      ) : null}

      {summary.shipments.length > 0 ? (
        <TrackingCard title={`Shipments (${summary.shipments.length})`}>
          <div className="flex flex-col gap-4">
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
                <article key={shipment.shipmentId} className="rounded-lg border border-sa-border bg-page p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-semibold text-sa-primary">
                        {shipmentStatusLabel(shipment.status)}
                      </p>
                      {carrierLine ? <p className="mt-0.5 text-[12px] text-sa-secondary">{carrierLine}</p> : null}
                      {shipment.trackingNumber ? (
                        <p className="mt-1 text-[12px] text-sa-secondary">
                          Tracking number{" "}
                          <span className="font-mono text-sa-primary">{shipment.trackingNumber}</span>
                        </p>
                      ) : null}
                      {shipment.shipmentNumber ? (
                        <p className="mt-0.5 text-[12px] text-sa-secondary">
                          Shipment <span className="font-mono text-sa-primary">{shipment.shipmentNumber}</span>
                        </p>
                      ) : null}
                      {shipment.estimatedDeliveryAt && !shipment.deliveredAt ? (
                        <p className="mt-0.5 text-[12px] text-sa-secondary">
                          Arriving by {formatOrderDate(shipment.estimatedDeliveryAt, { long: true })}
                        </p>
                      ) : null}
                    </div>
                    {shipment.trackingUrl ? (
                      <a
                        href={shipment.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-8 shrink-0 items-center rounded-md border border-sa-border px-3 text-[11px] font-semibold text-sa-primary transition-colors hover:border-terra hover:text-terra"
                      >
                        Carrier tracking ↗
                      </a>
                    ) : null}
                  </div>

                  {shipment.items?.length ? (
                    <ul className="mt-3 flex flex-col gap-0.5 text-[12px] text-sa-secondary">
                      {shipment.items.map((item) => (
                        <li key={`${shipment.shipmentId}-${item.sku}`}>
                          {Number.parseInt(item.quantity, 10) || 1} × {item.productName ?? item.sku}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {history.length ? (
                    <ol className="mt-3 flex flex-col gap-3 border-t border-sa-border pt-3">
                      {history.map((entry, idx) => (
                        <li key={entry.key} className="flex gap-3">
                          <span
                            aria-hidden="true"
                            className={`mt-1.5 size-1.5 shrink-0 rounded-full ${idx === 0 ? "bg-terra" : "bg-sa-border"}`}
                          />
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold text-sa-primary">
                              {entry.label}
                              {entry.detail ? (
                                <span className="font-normal text-sa-secondary"> · {entry.detail}</span>
                              ) : null}
                            </p>
                            <p className="text-[11px] text-sa-secondary">
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
          </div>
        </TrackingCard>
      ) : null}

      {orderEvents.length > 0 ? (
        <TrackingCard title="Order timeline">
          <ol className="flex flex-col">
            {[...orderEvents].reverse().map((event, idx, list) => (
              <li key={event.key} className="flex gap-4 pb-4 last:pb-0">
                <div className="flex w-3 shrink-0 flex-col items-center" aria-hidden="true">
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${idx === 0 ? "bg-terra" : "bg-sa-border"}`} />
                  {idx < list.length - 1 ? <span className="mt-1 w-px flex-1 bg-sa-border" /> : null}
                </div>
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-sa-primary">{event.label}</p>
                  <p className="text-[11px] text-sa-secondary">{formatOrderDate(event.occurredAt, { time: true })}</p>
                </div>
              </li>
            ))}
          </ol>
        </TrackingCard>
      ) : null}
    </div>
  );
}
