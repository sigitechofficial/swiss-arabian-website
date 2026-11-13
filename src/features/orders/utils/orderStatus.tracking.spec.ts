import { describe, expect, it } from "vitest";
import {
  deliveryDateFact,
  formatOrderDate,
  shipmentStatusLabel,
  stoppedOrderMessage,
  trackingHistory,
  trackingStatusKey,
  trackingUnitCount,
} from "./orderStatus";

function event(
  eventStatus: string,
  eventTime: string,
  extra: Partial<{ title: string | null; description: string | null; location: string | null }> = {},
) {
  return { eventStatus, eventTime, title: null, description: null, location: null, ...extra };
}

describe("tracking status wording", () => {
  it("maps shipment and carrier codes to shopper keys, never a raw code", () => {
    expect(trackingStatusKey("CREATE_QUEUED")).toBe("preparing");
    expect(trackingStatusKey("CREATED")).toBe("created");
    expect(trackingStatusKey("INFO_RECEIVED")).toBe("created");
    expect(trackingStatusKey("ARRIVED_AT_HUB")).toBe("inTransit");
    expect(trackingStatusKey("RTO_COMPLETED")).toBe("returned");
    expect(trackingStatusKey("SOMETHING_NEW")).toBe("update");
    expect(trackingStatusKey(null)).toBe("update");
    expect(shipmentStatusLabel("CREATE_QUEUED")).toBe("Preparing your shipment");
    expect(shipmentStatusLabel("CREATED")).toBe("Shipment created");
    expect(shipmentStatusLabel("SOMETHING_NEW")).toBe("Shipment update");
  });
});

describe("trackingHistory", () => {
  it("lists newest first by timestamp, whatever order the API sends", () => {
    const history = trackingHistory([
      event("DELIVERED", "2026-11-13T08:00:00.000Z"),
      event("INFO_RECEIVED", "2026-11-13T07:59:00.000Z"),
      event("OUT_FOR_DELIVERY", "2026-11-13T07:59:30.000Z"),
    ]);
    expect(history.map((entry) => entry.status)).toEqual(["delivered", "outForDelivery", "created"]);
    expect(history[0].label).toBe("Delivered");
  });

  it("hides simulation, synthetic and code-only notes", () => {
    const history = trackingHistory([
      event("IN_TRANSIT", "2026-11-13T08:00:00Z", { title: "LOCAL_SIMULATION", description: "LOCAL_SIMULATION" }),
      event("INFO_RECEIVED", "2026-11-13T07:00:00Z", {
        title: "Smoke partner accepted (synthetic)",
        description: "Dev-only smoke shipping — no webhook. Dummy tracking assigned immediately.",
      }),
      event("DELIVERED", "2026-11-13T09:00:00Z", { title: "DELIVERED: 100" }),
    ]);
    expect(history.map((entry) => entry.detail)).toEqual([null, null, null]);
  });

  it("never shows the reason staff typed when entering tracking in the admin", () => {
    const [entry] = trackingHistory([
      event("INFO_RECEIVED", "2026-11-13T08:00:00Z", {
        title: "Ops-entered tracking",
        description: "Customer called, courier booked by phone",
        location: "Aramex",
      }),
    ]);
    expect(entry.detail).toBeNull();
    expect(entry.location).toBe("Aramex");
  });

  it("keeps a carrier's own note", () => {
    const [entry] = trackingHistory([
      event("FAILED_DELIVERY", "2026-11-13T08:00:00Z", { title: "FAILED_DELIVERY: Customer not available" }),
    ]);
    expect(entry.label).toBe("Delivery attempt failed");
    expect(entry.detail).toBe("Customer not available");
  });

  it("drops repeats of the same status and note", () => {
    const history = trackingHistory([
      event("IN_TRANSIT", "2026-11-13T08:00:00Z"),
      event("IN_TRANSIT", "2026-11-13T09:00:00Z"),
    ]);
    expect(history).toHaveLength(1);
    expect(history[0].occurredAt).toBe("2026-11-13T08:00:00Z");
  });
});

describe("delivery date", () => {
  it("shows the delivery date once delivered, never the estimate", () => {
    expect(
      deliveryDateFact({ status: "DELIVERED", deliveredAt: "2026-11-13T08:00:00Z", estimatedDeliveryAt: "2026-11-15T00:00:00Z" }),
    ).toEqual({ kind: "delivered", at: "2026-11-13T08:00:00Z" });
    expect(deliveryDateFact({ status: "DELIVERED", deliveredAt: null, estimatedDeliveryAt: "2026-11-15T00:00:00Z" })).toBeNull();
    expect(deliveryDateFact({ status: "IN_TRANSIT", deliveredAt: null, estimatedDeliveryAt: "2026-11-15T00:00:00Z" })).toEqual({
      kind: "estimate",
      at: "2026-11-15T00:00:00Z",
    });
  });
});

describe("trackingUnitCount", () => {
  it("counts bottles, not order lines", () => {
    expect(trackingUnitCount({ itemCount: 1, shipments: [{ items: [{ quantity: "2" }] }] })).toBe(2);
    expect(trackingUnitCount({ itemCount: 2, shipments: [] })).toBe(2);
  });
});

describe("stopped order wording", () => {
  it("is calm for an order under review", () => {
    expect(stoppedOrderMessage("MANUAL_REVIEW")).toBe("We’re checking a detail on your order. We’ll update you soon.");
  });
});

describe("formatOrderDate", () => {
  it("formats in the market's time zone (Dubai by default)", () => {
    expect(formatOrderDate("2026-11-13T08:00:00Z", { time: true })).toMatch(/12:00/);
    expect(formatOrderDate("2026-11-13T21:00:00Z")).toMatch(/14/);
    expect(formatOrderDate("2026-11-13T08:00:00Z", { time: true, timeZone: "Asia/Riyadh" })).toMatch(/11:00/);
  });
});
