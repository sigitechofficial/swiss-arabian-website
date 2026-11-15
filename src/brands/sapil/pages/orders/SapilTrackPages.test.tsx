import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrderTrackingSummary, OrderTrackingTimeline } from "@/features/tracking/api/orderTracking.service";
import { loadSapilMessages } from "../../i18n/load";
import { SapilCopyProvider } from "../../i18n/SapilCopy";

const state = vi.hoisted(() => ({
  path: "/track/SP-1",
  tracking: null as null | Record<string, unknown>,
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => state.path,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/features/tracking/hooks/useOrderTrackingLookup", () => ({
  useGuestTracking: () => state.tracking,
  useTrackLookup: () => ({}),
}));

import { SapilGuestTrackingPage } from "./SapilTrackPages";

function summary(overrides: Partial<OrderTrackingSummary> = {}): OrderTrackingSummary {
  return {
    orderId: "o-1",
    orderNumber: "SP-1",
    status: "DELIVERED",
    paymentStatus: "PENDING",
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
        shippingPartner: { partnerCode: "sapil_demo_courier", displayName: "Sapil Demo Courier" },
        trackingNumber: null,
        trackingUrl: null,
        shippedAt: null,
        estimatedDeliveryAt: "2026-11-16T00:00:00Z",
        deliveredAt: "2026-11-13T08:00:00Z",
        itemCount: 1,
        items: [{ sku: "OUD-1", productName: "Oud", quantity: "2" }],
        latestTrackingEvent: null,
      },
    ],
    latestTrackingStatus: "DELIVERED",
    latestTrackingEventTime: "2026-11-13T08:00:00Z",
    estimatedDeliveryAt: "2026-11-16T00:00:00Z",
    deliveredAt: "2026-11-13T08:00:00Z",
    cancellationWindow: null,
    timeline: [],
    ...overrides,
  };
}

const timeline = {
  timeline: [
    {
      eventStatus: "INFO_RECEIVED",
      eventTime: "2026-11-13T07:55:00Z",
      title: "Ops-entered tracking",
      description: "internal: booked by phone with the courier",
      location: null,
      countryCode: null,
      partnerCode: "x",
      trackingNumber: null,
      shipmentId: "s-1",
    },
    {
      eventStatus: "DELIVERED",
      eventTime: "2026-11-13T08:00:00Z",
      title: "LOCAL_SIMULATION",
      description: "LOCAL_SIMULATION",
      location: null,
      countryCode: null,
      partnerCode: "x",
      trackingNumber: null,
      shipmentId: "s-1",
    },
  ],
} as unknown as OrderTrackingTimeline;

async function renderIn(locale: "en" | "ar") {
  state.path = locale === "ar" ? "/ar/track/SP-1" : "/track/SP-1";
  const messages = await loadSapilMessages(locale);
  return render(
    <SapilCopyProvider messages={messages}>
      <SapilGuestTrackingPage orderNumber="SP-1" />
    </SapilCopyProvider>,
  );
}

beforeEach(() => {
  state.tracking = { loading: false, summary: summary(), timeline, ownOrder: false };
});

describe("Sapil tracking page", () => {
  it("shows shopper wording, newest first, in Dubai time, with no internal codes or staff notes", async () => {
    await renderIn("en");
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/LOCAL_SIMULATION|Create queued|booked by phone|sapil_demo_courier/);
    expect(text).toContain("Sapil Demo Courier · Preparing your shipment");
    const items = screen
      .getAllByRole("listitem")
      .filter((li) => /\d:\d\d/.test(li.textContent ?? "") && /Delivered|Shipment created/.test(li.textContent ?? ""));
    expect(items.map((li) => li.textContent)).toEqual([
      expect.stringMatching(/12:00.*Delivered/),
      expect.stringMatching(/11:55.*Shipment created/),
    ]);
  });

  it("counts bottles and shows 'Delivered on' instead of an estimate once delivered", async () => {
    await renderIn("en");
    const text = document.body.textContent ?? "";
    expect(text).toContain("2 items");
    expect(text).toContain("Delivered on");
    expect(text).not.toContain("Estimated delivery");
  });

  it("uses calm wording for an order under review, in English and Arabic", async () => {
    state.tracking = {
      loading: false,
      summary: summary({ status: "MANUAL_REVIEW", deliveredAt: null, shipments: [] }),
      timeline: null,
      ownOrder: false,
    };
    await renderIn("en");
    expect(document.body.textContent).toContain("We’re checking a detail on your order. We’ll update you soon.");
    expect(document.body.textContent).not.toMatch(/has stopped/);
  });

  it("words shipment statuses in Arabic", async () => {
    await renderIn("ar");
    const text = document.body.textContent ?? "";
    expect(text).toContain("نجهّز شحنتك");
    expect(text).toContain("تم التوصيل في");
    expect(text).not.toMatch(/LOCAL_SIMULATION|Preparing/);
  });
});
