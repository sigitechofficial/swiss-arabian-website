import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ enabled: true }));

vi.mock("@/lib/config/env", () => ({
  env: {
    apiBaseUrl: "http://api.test",
    tracking: {
      get enabled() {
        return state.enabled;
      },
      engagementSeconds: 10,
    },
  },
}));
vi.mock("@/lib/auth/token", () => ({ getAccessToken: () => "tok" }));
vi.mock("@/lib/api/storefrontHost", () => ({ resolveStorefrontHost: async () => "sa.test" }));
vi.mock("@/lib/storefront/context", () => ({ storefrontContextQuery: () => "zoneCode=KSA" }));

import {
  flushNow,
  getSessionId,
  getTrackingConsent,
  getVisitorId,
  queuedEventsForTests,
  resetTrackerForTests,
  setTrackingConsent,
  track,
  uuidv4,
} from "./tracker";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("tracker", () => {
  beforeEach(() => {
    state.enabled = true;
    resetTrackerForTests();
    localStorage.clear();
    sessionStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-12T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("generates RFC 4122 v4 ids the backend accepts", () => {
    expect(uuidv4()).toMatch(UUID_V4);
    expect(uuidv4()).not.toBe(uuidv4());
  });

  it("builds a behavior_event_v1 event with path-only context", () => {
    window.history.pushState({}, "", "/products/oud?utm_source=x&email=a@b.c");
    expect(track("catalog_product_viewed", { productId: "p1", sku: "S1" })).toBe(true);
    const [event] = queuedEventsForTests();
    expect(event).toMatchObject({
      contractVersion: "behavior_event_v1",
      eventName: "catalog_product_viewed",
      occurredAt: "2026-11-12T10:00:00.000Z",
      sequence: 1,
    });
    expect(event.eventId).toMatch(UUID_V4);
    expect(event.visitorId).toMatch(UUID_V4);
    expect(event.sessionId).toMatch(UUID_V4);
    expect(event.properties).toMatchObject({
      pagePath: "/products/oud",
      captureSource: "browser",
      productId: "p1",
      sku: "S1",
    });
    expect(JSON.stringify(event)).not.toContain("utm_source");
    expect(JSON.stringify(event)).not.toContain("a@b.c");
  });

  it("does nothing when tracking is switched off", () => {
    state.enabled = false;
    expect(track("page_viewed")).toBe(false);
    expect(queuedEventsForTests()).toHaveLength(0);
  });

  it("drops events when the shopper denied tracking, and clears the queue", () => {
    track("page_viewed");
    expect(queuedEventsForTests()).toHaveLength(1);
    setTrackingConsent("denied");
    expect(queuedEventsForTests()).toHaveLength(0);
    expect(track("page_viewed")).toBe(false);
    expect(getTrackingConsent()).toBe("DENIED");
  });

  it("treats a missing consent choice as unknown", () => {
    expect(getTrackingConsent()).toBe("UNKNOWN");
    setTrackingConsent("granted");
    expect(getTrackingConsent()).toBe("GRANTED");
  });

  it("keeps one visitor id and rotates the session after 30 idle minutes", () => {
    const visitor = getVisitorId();
    expect(getVisitorId()).toBe(visitor);
    const t0 = Date.now();
    const session = getSessionId(t0);
    expect(getSessionId(t0 + 5 * 60_000)).toBe(session);
    expect(getSessionId(t0 + 5 * 60_000 + 31 * 60_000)).not.toBe(session);
  });

  it("sends an identical keyed event once inside the dedupe window", () => {
    expect(track("catalog_product_viewed", {}, { dedupeKey: "p1" })).toBe(true);
    expect(track("catalog_product_viewed", {}, { dedupeKey: "p1" })).toBe(false);
    expect(track("catalog_product_viewed", {}, { dedupeKey: "p2" })).toBe(true);
    vi.advanceTimersByTime(3_500);
    expect(track("catalog_product_viewed", {}, { dedupeKey: "p1" })).toBe(true);
  });

  it("drops null, non-finite and oversized property values", () => {
    track("scroll_depth_reached", { a: null, b: undefined, c: Number.NaN, d: "x".repeat(201), ok: 50 });
    const props = queuedEventsForTests()[0].properties;
    expect(props).toMatchObject({ ok: 50 });
    expect(props).not.toHaveProperty("a");
    expect(props).not.toHaveProperty("c");
    expect(props).not.toHaveProperty("d");
  });

  it("posts a batch with host, token, context and the consent state", async () => {
    setTrackingConsent("granted");
    const fetchMock = vi.fn(async () => ({ status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    track("page_viewed");
    track("homepage_viewed", {}, { dedupeKey: "home" });
    await flushNow();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://api.test/storefront/analytics/events?zoneCode=KSA");
    expect(init.method).toBe("POST");
    expect(init.keepalive).toBe(true);
    expect(init.headers).toMatchObject({ "x-storefront-host": "sa.test", Authorization: "Bearer tok" });
    const body = JSON.parse(String(init.body));
    expect(body.consentStatus).toBe("GRANTED");
    expect(body.events).toHaveLength(2);
    expect(queuedEventsForTests()).toHaveLength(0);
  });

  it("omits the consent field when the shopper has not chosen, so the backend policy decides", async () => {
    const fetchMock = vi.fn(async () => ({ status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    track("page_viewed");
    await flushNow();
    const body = JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    expect(body).not.toHaveProperty("consentStatus");
    expect(body.events).toHaveLength(1);
  });

  it("splits large queues into batches of 20", async () => {
    const fetchMock = vi.fn(async () => ({ status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    for (let i = 0; i < 45; i += 1) track("scroll_depth_reached", { n: i });
    await flushNow();
    const sizes = fetchMock.mock.calls.map(
      (call) => JSON.parse(String((call as unknown as [string, RequestInit])[1].body)).events.length,
    );
    expect(sizes).toEqual([20, 20, 5]);
  });

  it("puts a batch back after a server error and retries later", async () => {
    const fetchMock = vi.fn(async () => ({ status: 503 }));
    vi.stubGlobal("fetch", fetchMock);
    track("page_viewed");
    await flushNow();
    expect(queuedEventsForTests()).toHaveLength(1);

    fetchMock.mockImplementation(async () => ({ status: 202 }));
    await vi.advanceTimersByTimeAsync(2_500);
    expect(queuedEventsForTests()).toHaveLength(0);
  });

  it("drops a batch the server refused instead of retrying forever", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ status: 400 })));
    track("page_viewed");
    await flushNow();
    expect(queuedEventsForTests()).toHaveLength(0);
  });

  it("keeps the batch when the network is down", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("offline");
    }));
    track("page_viewed");
    await flushNow();
    expect(queuedEventsForTests()).toHaveLength(1);
  });
});
