import { describe, expect, it, vi } from "vitest";
import { deliverJourneyEvents, toInsiderJourneyEvent } from "./deliverJourneyEvents";
import type { JourneyEvent } from "../types";

function event(overrides: Partial<JourneyEvent> = {}): JourneyEvent {
  return {
    eventId: "evt-1",
    name: "checkout_abandonment_eligible",
    journeyCode: "WF-01",
    step: 1,
    occurredAt: "2026-11-12T11:00:00.000Z",
    owner: "PLATFORM",
    brandCode: "SAPIL",
    zoneCode: "UAE",
    entity: { type: "checkout", id: "chk-1" },
    currency: "AED",
    subtotal: "200",
    total: "210.50",
    lines: [
      { productId: "p1", variantId: "v1", sku: "A", name: "Oud", quantity: 2, unitPrice: "100", currency: "AED", imageUrl: null },
      { productId: "p2", variantId: "v2", sku: "B", name: "Musk", quantity: 1, unitPrice: "10.5", currency: "AED", imageUrl: null },
    ],
    ...overrides,
  };
}

function deps(events: JourneyEvent[], fireResult = true) {
  return {
    fetchEvents: vi.fn(async () => ({ events, suppressed: 0 })),
    acknowledge: vi.fn(async (ids: string[]) => ({ acknowledged: ids.length, ignored: 0 })),
    fire: vi.fn(() => fireResult),
    seen: new Set<string>(),
  };
}

describe("toInsiderJourneyEvent", () => {
  it("maps to typed custom parameters without personal data", () => {
    const mapped = toInsiderJourneyEvent(event());
    expect(mapped.name).toBe("checkout_abandonment_eligible");
    expect(mapped.custom).toEqual({
      journey_code: "WF-01",
      step: 1,
      entity_type: "checkout",
      entity_id: "chk-1",
      event_id: "evt-1",
      total: 210.5,
      currency: "AED",
      item_count: 3,
    });
  });

  it("sends a number even when the total is not numeric", () => {
    expect(toInsiderJourneyEvent(event({ total: "n/a" })).custom.total).toBe(0);
  });
});

describe("deliverJourneyEvents", () => {
  it("fires each event once and acknowledges it", async () => {
    const d = deps([event(), event({ eventId: "evt-2", step: 2 })]);
    const result = await deliverJourneyEvents(d);
    expect(d.fire).toHaveBeenCalledTimes(2);
    expect(d.acknowledge).toHaveBeenCalledWith(["evt-1", "evt-2"]);
    expect(result).toEqual({ fired: 2, acknowledged: 2, skippedSeen: 0 });
  });

  it("does not acknowledge an event the SDK could not accept", async () => {
    const d = deps([event()], false);
    const result = await deliverJourneyEvents(d);
    expect(result.fired).toBe(0);
    expect(d.acknowledge).not.toHaveBeenCalled();
    expect(d.seen.has("evt-1")).toBe(false);
  });

  it("does not fire again after the acknowledgement call failed, but retries the ack", async () => {
    const d = deps([event()]);
    d.acknowledge.mockRejectedValueOnce(new Error("network"));
    await expect(deliverJourneyEvents(d)).rejects.toThrow("network");
    expect(d.fire).toHaveBeenCalledTimes(1);
    expect(d.seen.has("evt-1")).toBe(true);

    const second = await deliverJourneyEvents(d);
    expect(d.fire).toHaveBeenCalledTimes(1);
    expect(second.skippedSeen).toBe(1);
    expect(d.acknowledge).toHaveBeenLastCalledWith(["evt-1"]);
  });

  it("treats an SDK exception as not delivered", async () => {
    const d = deps([event()]);
    d.fire.mockImplementation(() => {
      throw new Error("sdk");
    });
    const result = await deliverJourneyEvents(d);
    expect(result.fired).toBe(0);
    expect(d.acknowledge).not.toHaveBeenCalled();
  });

  it("does nothing when there are no events", async () => {
    const d = deps([]);
    expect(await deliverJourneyEvents(d)).toEqual({ fired: 0, acknowledged: 0, skippedSeen: 0 });
    expect(d.acknowledge).not.toHaveBeenCalled();
  });
});
