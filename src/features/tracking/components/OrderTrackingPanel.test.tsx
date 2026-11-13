import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { OrderTrackingSummary, OrderTrackingTimeline } from "../api/orderTracking.service";
import { OrderTrackingPanel } from "./OrderTrackingPanel";

const delivered: OrderTrackingSummary = {
  orderId: "o-1",
  orderNumber: "SA-1",
  status: "DELIVERED",
  paymentStatus: "PAID",
  fulfillmentStatus: "FULFILLED",
  createdAt: "2026-11-13T07:50:00Z",
  currency: "AED",
  total: "114",
  itemCount: 1,
  isGuestOrder: true,
  shipments: [
    {
      shipmentId: "s-1",
      shipmentNumber: "SHP-1",
      status: "CREATE_QUEUED",
      deliveryMethod: { methodCode: "std", displayName: "Standard", estimatedMinDays: 1, estimatedMaxDays: 3 },
      shippingPartner: { partnerCode: "demo", displayName: "Demo Courier" },
      trackingNumber: null,
      trackingUrl: null,
      shippedAt: null,
      estimatedDeliveryAt: "2026-11-16T00:00:00Z",
      deliveredAt: null,
      itemCount: 1,
      items: [{ sku: "OUD-1", productName: "Oud", quantity: "2" }],
      latestTrackingEvent: null,
    },
  ],
  latestTrackingStatus: "DELIVERED",
  latestTrackingEventTime: "2026-11-13T08:00:00Z",
  estimatedDeliveryAt: "2026-11-16T00:00:00Z",
  deliveredAt: null,
  cancellationWindow: null,
  timeline: [],
};

const timeline = {
  shipments: [
    {
      shipmentId: "s-1",
      events: [
        { eventStatus: "DELIVERED", eventTime: "2026-11-13T08:00:00Z", title: "LOCAL_SIMULATION", description: "LOCAL_SIMULATION", location: null },
        { eventStatus: "INFO_RECEIVED", eventTime: "2026-11-13T07:55:00Z", title: null, description: null, location: null },
      ],
    },
  ],
} as unknown as OrderTrackingTimeline;

describe("OrderTrackingPanel (Swiss Arabian)", () => {
  it("never shows an estimate for a delivered order, nor raw codes", () => {
    const { container } = render(<OrderTrackingPanel summary={delivered} timeline={timeline} />);
    const text = container.textContent ?? "";
    expect(text).not.toContain("Estimated delivery");
    expect(text).not.toContain("Arriving by");
    expect(text).not.toMatch(/LOCAL_SIMULATION|Create Queued/);
    expect(text).toContain("Preparing your shipment");
    // Newest first, in Dubai time.
    expect(text.indexOf("12:00")).toBeLessThan(text.indexOf("11:55"));
  });

  it("uses calm wording for an order under review", () => {
    const { container } = render(
      <OrderTrackingPanel summary={{ ...delivered, status: "MANUAL_REVIEW", shipments: [] }} timeline={null} />,
    );
    expect(container.textContent).toContain("We’re checking a detail on your order. We’ll update you soon.");
  });
});
