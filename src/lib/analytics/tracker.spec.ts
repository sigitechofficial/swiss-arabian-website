import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ enabled: true }));

vi.mock("@/lib/config/env", () => ({
  env: {
    apiBaseUrl: "http://api.test",
    tracking: {
      engagementSeconds: 10,
    },
  },
}));
vi.mock("@/lib/auth/token", () => ({ getAccessToken: () => "tok" }));
vi.mock("@/lib/api/storefrontHost", () => ({ resolveStorefrontHost: async () => "sa.test" }));
vi.mock("@/lib/storefront/context", () => ({ storefrontContextQuery: () => "zoneCode=KSA" }));

import {
  consentBannerNeeded,
  consentSettingsOffered,
  getEffectiveConsent,
  resetConsentCacheForTests,
  setConsent,
  setMarketConsentRequired,
} from "@/lib/consent/consent";
import {
  behaviorIdentityHeaders,
  requestBody,
  trackingMode,
  flushNow,
  getSessionId,
  getTrackingConsent,
  getVisitorId,
  queuedEventsForTests,
  resetTrackerForTests,
  setFirstPartyTracking,
  setTrackingConsent,
  track,
  uuidv4,
} from "./tracker";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("tracker", () => {
  beforeEach(() => {
    state.enabled = true;
    resetTrackerForTests();
    // The market's switch (admin switchboard, settings phase 11), as PlatformTracker sets it.
    setFirstPartyTracking(state.enabled);
    localStorage.clear();
    sessionStorage.clear();
    resetConsentCacheForTests();
    // Most cases describe a shopper who accepted analytics in the cookie banner.
    setTrackingConsent("granted");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-12T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("switch not known yet: events wait in memory and are sent only once it is on", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ status: 202 });
    vi.stubGlobal("fetch", fetchMock);
    resetTrackerForTests();
    expect(track("page_viewed")).toBe(true);
    await flushNow();
    expect(fetchMock).not.toHaveBeenCalled();
    setFirstPartyTracking(true);
    await flushNow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("switch turns out off (or flips off): waiting events are dropped, never sent", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ status: 202 });
    vi.stubGlobal("fetch", fetchMock);
    resetTrackerForTests();
    track("page_viewed");
    setFirstPartyTracking(false);
    expect(queuedEventsForTests()).toHaveLength(0);
    expect(track("page_viewed")).toBe(false);
    setFirstPartyTracking(true);
    track("page_viewed");
    setFirstPartyTracking(false);
    await flushNow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("analytics refused after queuing (another tab, the banner): nothing is sent", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ status: 202 });
    vi.stubGlobal("fetch", fetchMock);
    track("page_viewed");
    // Refused in another tab: the stored choice changes without this tab's tracker being told.
    setConsent({ analytics: false, marketing: false });
    await flushNow();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(queuedEventsForTests()).toHaveLength(0);
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
    setFirstPartyTracking(state.enabled);
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
    localStorage.clear();
    resetConsentCacheForTests();
    expect(getTrackingConsent()).toBe("UNKNOWN");
    setTrackingConsent("granted");
    expect(getTrackingConsent()).toBe("GRANTED");
  });

  it("before a choice: records anonymously with the tab's ids, kept in sessionStorage only", () => {
    localStorage.clear();
    sessionStorage.clear();
    resetConsentCacheForTests();
    expect(trackingMode()).toBe("ANONYMOUS");
    expect(track("page_viewed")).toBe(true);
    expect(track("catalog_product_viewed")).toBe(true);
    const [a, b] = queuedEventsForTests();
    // One visit: the same ids on every event of the tab.
    expect(a.visitorId).toMatch(UUID_V4);
    expect(b.visitorId).toBe(a.visitorId);
    expect(b.sessionId).toBe(a.sessionId);
    expect(requestBody([a], true)).toEqual({ events: [a] });
    const visitor = getVisitorId();
    expect(getVisitorId()).toBe(visitor);
    getSessionId();
    // Nothing lasting (no localStorage, no cookie); this tab only.
    expect(localStorage.getItem("sa_visitor_id")).toBeNull();
    expect(sessionStorage.getItem("sa_anon_visitor")).toBe(a.visitorId);
    expect(JSON.parse(sessionStorage.getItem("sa_session") ?? "{}").id).toBe(a.sessionId);
  });

  it("before a choice: a refresh or full page load keeps the same session and visitor", () => {
    localStorage.clear();
    sessionStorage.clear();
    resetConsentCacheForTests();
    track("page_viewed");
    const before = queuedEventsForTests()[0];
    // A full page load: the tracker module starts again, the tab's sessionStorage stays.
    resetTrackerForTests();
    setFirstPartyTracking(true);
    track("page_viewed");
    const after = queuedEventsForTests()[0];
    expect(after.sessionId).toBe(before.sessionId);
    expect(after.visitorId).toBe(before.visitorId);
  });

  it("before a choice: a new tab (empty sessionStorage) is a new anonymous visitor and session", () => {
    localStorage.clear();
    sessionStorage.clear();
    resetConsentCacheForTests();
    track("page_viewed");
    const first = queuedEventsForTests()[0];
    sessionStorage.clear();
    resetTrackerForTests();
    setFirstPartyTracking(true);
    track("page_viewed");
    const other = queuedEventsForTests()[0];
    expect(other.visitorId).not.toBe(first.visitorId);
    expect(other.sessionId).not.toBe(first.sessionId);
  });

  it("refusing analytics removes the tab's anonymous ids", () => {
    localStorage.clear();
    sessionStorage.clear();
    resetConsentCacheForTests();
    track("page_viewed");
    expect(sessionStorage.getItem("sa_anon_visitor")).not.toBeNull();
    setTrackingConsent("denied");
    expect(sessionStorage.getItem("sa_anon_visitor")).toBeNull();
    expect(sessionStorage.getItem("sa_session")).toBeNull();
    expect(localStorage.getItem("sa_visitor_id")).toBeNull();
  });

  it("allowing analytics moves the tab's anonymous visitor id to the lasting one", () => {
    localStorage.clear();
    sessionStorage.clear();
    resetConsentCacheForTests();
    track("page_viewed");
    const anon = queuedEventsForTests()[0].visitorId;
    setTrackingConsent("granted");
    expect(getVisitorId()).toBe(anon);
    expect(localStorage.getItem("sa_visitor_id")).toBe(anon);
    expect(sessionStorage.getItem("sa_anon_visitor")).toBeNull();
  });

  it("removes the stored visitor id when analytics is refused later", () => {
    getVisitorId();
    expect(localStorage.getItem("sa_visitor_id")).not.toBeNull();
    setTrackingConsent("denied");
    expect(localStorage.getItem("sa_visitor_id")).toBeNull();
  });

  it("keeps one visitor id and rotates the session after 30 idle minutes", () => {
    const visitor = getVisitorId();
    expect(getVisitorId()).toBe(visitor);
    const t0 = Date.now();
    const session = getSessionId(t0);
    expect(getSessionId(t0 + 5 * 60_000)).toBe(session);
    expect(getSessionId(t0 + 5 * 60_000 + 31 * 60_000)).not.toBe(session);
  });

  it("API calls carry the tracker's visitor and session ids with analytics consent", () => {
    const t0 = Date.now();
    const session = getSessionId(t0);
    expect(behaviorIdentityHeaders(t0 + 60_000)).toEqual({
      "x-behavior-visitor": getVisitorId(),
      "x-behavior-session": session,
      "x-behavior-consent": "GRANTED",
    });
  });

  it("an API call reads the session without keeping it alive; an expired one rotates as the next event would", () => {
    const t0 = Date.now();
    const session = getSessionId(t0);
    // Background calls 20 and 40 minutes later: the first still reads it, neither stretches it.
    expect(behaviorIdentityHeaders(t0 + 20 * 60_000)?.["x-behavior-session"]).toBe(session);
    const rotated = behaviorIdentityHeaders(t0 + 40 * 60_000)?.["x-behavior-session"];
    expect(rotated).not.toBe(session);
    expect(rotated).toMatch(UUID_V4);
    // The next event uses the rotated id: the server's observation and the page share it.
    expect(getSessionId(t0 + 41 * 60_000)).toBe(rotated);
  });

  it("API calls before a choice carry the tab's anonymous ids without consent; none after refusal or with tracking off", () => {
    localStorage.clear();
    sessionStorage.clear();
    resetConsentCacheForTests();
    track("page_viewed");
    const page = queuedEventsForTests()[0];
    expect(behaviorIdentityHeaders()).toEqual({
      "x-behavior-visitor": page.visitorId,
      "x-behavior-session": page.sessionId,
    });
    expect(localStorage.getItem("sa_visitor_id")).toBeNull();
    setTrackingConsent("denied");
    expect(behaviorIdentityHeaders()).toBeNull();
    setTrackingConsent("granted");
    setFirstPartyTracking(false);
    expect(behaviorIdentityHeaders()).toBeNull();
  });

  it("the first event after landing carries where the visit came from; later events do not", () => {
    window.history.replaceState(null, "", "/products/oud-1?utm_source=facebook&utm_medium=paid_social&utm_campaign=ramadan&fbclid=IwAR0secret");
    resetTrackerForTests();
    setFirstPartyTracking(true);
    track("page_viewed");
    // Client-side navigation drops the tags; the landing's acquisition was read before that.
    window.history.replaceState(null, "", "/cart");
    track("cart_viewed");
    const [first, second] = queuedEventsForTests();
    expect(first.acquisition).toEqual({
      source: "facebook",
      medium: "paid_social",
      campaign: "ramadan",
      landingPath: "/products/oud-1",
      fbclid: "1",
    });
    expect(second.acquisition).toBeUndefined();
    expect(JSON.stringify(queuedEventsForTests())).not.toContain("IwAR0secret");
    window.history.replaceState(null, "", "/");
  });

  it("the landing's acquisition goes with the first anonymous event and again after consent, never stored", () => {
    window.history.replaceState(null, "", "/?utm_source=snapchat&utm_medium=paid");
    localStorage.clear();
    sessionStorage.clear();
    resetConsentCacheForTests();
    resetTrackerForTests();
    setFirstPartyTracking(true);
    track("page_viewed");
    window.history.replaceState(null, "", "/collections/oud");
    track("catalog_product_list_viewed");
    setTrackingConsent("granted");
    track("page_viewed");
    track("catalog_product_viewed");
    expect(queuedEventsForTests().map((e) => e.acquisition?.source ?? null)).toEqual(["snapchat", null, "snapchat", null]);
    expect(queuedEventsForTests()[2].acquisition).toMatchObject({ source: "snapchat", medium: "paid", landingPath: "/" });
    expect(JSON.stringify({ ...localStorage })).not.toContain("snapchat");
    expect(JSON.stringify({ ...sessionStorage })).not.toContain("snapchat");
    window.history.replaceState(null, "", "/");
  });

  it("a visit with no campaign and no other site sends no acquisition (Direct)", () => {
    track("page_viewed");
    expect(queuedEventsForTests()[0].acquisition).toBeUndefined();
  });

  it("with consent, a new tab (or a typed address) is the same session and visitor, like Shopify's cookies", () => {
    track("page_viewed");
    const tab1 = queuedEventsForTests()[0];
    // A new tab: empty sessionStorage, a fresh tracker; localStorage is shared.
    sessionStorage.clear();
    resetTrackerForTests();
    setFirstPartyTracking(true);
    track("catalog_product_viewed");
    const tab2 = queuedEventsForTests()[0];
    expect(tab2.sessionId).toBe(tab1.sessionId);
    expect(tab2.visitorId).toBe(tab1.visitorId);
  });

  it("with consent, the shared session ends after 30 minutes without activity in any tab", () => {
    const t0 = Date.now();
    const s1 = getSessionId(t0);
    expect(getSessionId(t0 + 29 * 60_000)).toBe(s1);
    expect(getSessionId(t0 + 29 * 60_000 + 30 * 60_000)).not.toBe(s1);
  });

  it("a consented session kept per tab by older code goes on as the shared one", () => {
    sessionStorage.setItem("sa_session", JSON.stringify({ id: "4a1b2c3d-1111-4222-8333-444455556666", last: Date.now() }));
    localStorage.removeItem("sa_session");
    expect(getSessionId()).toBe("4a1b2c3d-1111-4222-8333-444455556666");
    expect(sessionStorage.getItem("sa_session")).toBeNull();
    expect(JSON.parse(localStorage.getItem("sa_session") ?? "{}").id).toBe("4a1b2c3d-1111-4222-8333-444455556666");
  });

  it("refusing analytics removes the shared session too", () => {
    getSessionId();
    expect(localStorage.getItem("sa_session")).not.toBeNull();
    setTrackingConsent("denied");
    expect(localStorage.getItem("sa_session")).toBeNull();
  });

  describe("a market that does not require consent (as the live Shopify stores)", () => {
    const noChoice = () => {
      localStorage.clear();
      sessionStorage.clear();
      resetConsentCacheForTests();
      setMarketConsentRequired(false);
      resetTrackerForTests();
      setFirstPartyTracking(true);
    };

    it("no banner; analytics and marketing run from the first page; Cookie settings still offered", () => {
      noChoice();
      const integrations = { analytics: null, insiderTag: null, onsiteMessages: true, firstPartyTracking: true };
      expect(consentBannerNeeded({ ...integrations, consentRequired: false })).toBe(false);
      expect(consentBannerNeeded({ ...integrations, consentRequired: true })).toBe(true);
      expect(consentSettingsOffered(integrations)).toBe(true);
      expect(getEffectiveConsent()).toEqual({ analytics: true, marketing: true });
      expect(getTrackingConsent()).toBe("NOT_REQUIRED");
      expect(trackingMode()).toBe("IDENTIFIED");
    });

    it("counts like Shopify: lasting visitor and one session shared by every tab, sent as NOT_REQUIRED", async () => {
      noChoice();
      const fetchMock = vi.fn(async () => ({ status: 202 }));
      vi.stubGlobal("fetch", fetchMock);
      track("page_viewed");
      const first = queuedEventsForTests()[0];
      expect(localStorage.getItem("sa_visitor_id")).toBe(first.visitorId);
      expect(JSON.parse(localStorage.getItem("sa_session") ?? "{}").id).toBe(first.sessionId);
      expect(behaviorIdentityHeaders()).toMatchObject({ "x-behavior-consent": "NOT_REQUIRED" });
      await flushNow();
      const body = JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body));
      expect(body.consentStatus).toBe("NOT_REQUIRED");
      // A new tab: same session and visitor.
      sessionStorage.clear();
      resetTrackerForTests();
      setFirstPartyTracking(true);
      track("catalog_product_viewed");
      expect(queuedEventsForTests()[0]).toMatchObject({ sessionId: first.sessionId, visitorId: first.visitorId });
    });

    it("a refusal from Cookie settings still stops everything and removes the ids", () => {
      noChoice();
      track("page_viewed");
      setTrackingConsent("denied");
      expect(trackingMode()).toBe("OFF");
      expect(track("page_viewed")).toBe(false);
      expect(localStorage.getItem("sa_visitor_id")).toBeNull();
      expect(localStorage.getItem("sa_session")).toBeNull();
    });
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

  it("before a choice: posts the anonymous events without any consent state", async () => {
    localStorage.clear();
    resetConsentCacheForTests();
    const fetchMock = vi.fn(async () => ({ status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    track("page_viewed");
    await flushNow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    expect(body.events).toHaveLength(1);
    expect(body).not.toHaveProperty("consentStatus");
  });

  it("allowing analytics mid-visit keeps one session and visitor; what was recorded before still goes anonymously", async () => {
    localStorage.clear();
    sessionStorage.clear();
    resetConsentCacheForTests();
    const fetchMock = vi.fn(async () => ({ status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    track("page_viewed");
    const before = queuedEventsForTests()[0];
    setTrackingConsent("granted");
    track("catalog_product_viewed");
    const after = queuedEventsForTests()[1];
    expect(after.sessionId).toBe(before.sessionId);
    expect(after.visitorId).toBe(before.visitorId);
    // Now lasting and shared by every tab.
    expect(localStorage.getItem("sa_visitor_id")).toBe(before.visitorId);
    expect(JSON.parse(localStorage.getItem("sa_session") ?? "{}").id).toBe(before.sessionId);
    expect(sessionStorage.getItem("sa_session")).toBeNull();
    await flushNow();
    const bodies = fetchMock.mock.calls.map((c) => JSON.parse(String((c as unknown as [string, RequestInit])[1].body)));
    expect(bodies.map((b) => [b.events.map((e: { eventName: string }) => e.eventName), b.consentStatus ?? null])).toEqual([
      [["page_viewed"], null],
      [["catalog_product_viewed"], "GRANTED"],
    ]);
  });

  it("refusing analytics drops what was recorded anonymously and stops recording", async () => {
    localStorage.clear();
    resetConsentCacheForTests();
    const fetchMock = vi.fn(async () => ({ status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    track("page_viewed");
    setTrackingConsent("denied");
    expect(trackingMode()).toBe("OFF");
    expect(track("page_viewed")).toBe(false);
    await flushNow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("an in-memory session rotates after 30 idle minutes, like a stored one", () => {
    localStorage.clear();
    resetConsentCacheForTests();
    const t0 = Date.now();
    const first = getSessionId(t0);
    expect(getSessionId(t0 + 10 * 60_000)).toBe(first);
    expect(getSessionId(t0 + 10 * 60_000 + 31 * 60_000)).not.toBe(first);
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
