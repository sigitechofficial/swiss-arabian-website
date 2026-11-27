import { getAccessToken } from "@/lib/auth/token";
import { withoutMarketSegment } from "@/lib/site/marketLink";
import { resolveStorefrontHost } from "@/lib/api/storefrontHost";
import { env } from "@/lib/config/env";
import { storefrontContextQuery } from "@/lib/storefront/context";
import { getConsent, hasConsent, setConsent } from "@/lib/consent/consent";
import { readAcquisition, type AcquisitionContext } from "./acquisition";

/**
 * First-party behavior tracker. Sends browser events to our own backend
 * (POST /storefront/analytics/events, contract behavior_event_v1) so our history never depends on a
 * third-party SDK. Off unless "First-party tracking" is on for the market in the admin switchboard (settings
 * phase 11; was NEXT_PUBLIC_TRACKING_ENABLED); the backend applies its own
 * enable flag and consent policy on top.
 *
 * Privacy: only the pathname is sent (never the query string or full URL), no e-mail/phone/name, and
 * a client-side DENIED consent drops every event before it is queued.
 *
 * Consent (REPORTING_PIPELINE_DESIGN.md §5.12 / §5.13 G4), see `trackingMode()`:
 * - analytics allowed: events with the stored visitor and session ids (a returning visitor is known);
 * - no choice made yet: events are still sent, anonymously: per-page ids that live in memory only and are
 *   never stored, and no consent state, so the backend applies the market's policy (by default it counts
 *   the visit with a visitor id that lasts one store day, never linked to a customer, no plain search
 *   words; or drops it when the market says so);
 * - analytics refused: nothing is sent, and what was waiting is dropped.
 */
export type TrackingConsent = "GRANTED" | "DENIED" | "UNKNOWN";
export type TrackProperties = Record<string, string | number | boolean | null | undefined>;

export type BehaviorEventV1 = {
  contractVersion: "behavior_event_v1";
  eventId: string;
  eventName: string;
  occurredAt: string;
  visitorId: string;
  sessionId: string;
  sequence: number;
  properties: Record<string, string | number | boolean>;
  /** Where the visit came from: only on the first event after landing (see ./acquisition). */
  acquisition?: AcquisitionContext;
};

const VISITOR_KEY = "sa_visitor_id";
const SESSION_KEY = "sa_session";
const SESSION_IDLE_MS = 30 * 60_000;
const FLUSH_DELAY_MS = 2_000;
const BATCH_SIZE = 20;
const MAX_QUEUE = 200;
const DEDUPE_WINDOW_MS = 3_000;
const MAX_PROPERTIES = 20;

let queue: BehaviorEventV1[] = [];
let sequence = 0;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let listenersBound = false;
const recentSignatures = new Map<string, number>();
/**
 * Events recorded before the shopper chose (anonymous). They are sent without a consent state even if
 * the shopper allows analytics before they leave: consent is not given backwards.
 */
const anonymousEvents = new WeakSet<BehaviorEventV1>();

/**
 * The landing address's acquisition, read when the page loads (the address still has its campaign
 * tags; client-side navigation drops them) and kept in memory for the page, never stored. It goes
 * with the first anonymous event and again with the first event after the shopper allows analytics
 * (a market may drop visits without consent; the session then still knows where it came from; when
 * both arrive, the session takes the first, same values). `undefined`: not read yet; `null`: none.
 */
let landingAcquisition: AcquisitionContext | null | undefined;
const acquisitionSentAs = new Set<TrackingMode>();

function captureLandingAcquisition(): void {
  if (landingAcquisition !== undefined || typeof window === "undefined") return;
  try {
    landingAcquisition = readAcquisition(window.location, document.referrer);
  } catch {
    landingAcquisition = null;
  }
}

// Read at the start of the page, before the router changes the address.
captureLandingAcquisition();

export function uuidv4(): string {
  const c = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (c?.randomUUID) return c.randomUUID();
  const bytes = new Uint8Array(16);
  if (c?.getRandomValues) c.getRandomValues(bytes);
  else for (let i = 0; i < 16; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * How the tracker may record this shopper (§5.13 G4): IDENTIFIED with analytics consent, ANONYMOUS
 * before any choice (per-page ids, nothing stored), OFF once analytics was refused.
 */
export type TrackingMode = "IDENTIFIED" | "ANONYMOUS" | "OFF";

export function trackingMode(): TrackingMode {
  const consent = getTrackingConsent();
  return consent === "GRANTED" ? "IDENTIFIED" : consent === "UNKNOWN" ? "ANONYMOUS" : "OFF";
}

/** The shopper's analytics choice from the cookie banner (`@/lib/consent`). */
export function getTrackingConsent(): TrackingConsent {
  const choices = getConsent();
  if (!choices) return "UNKNOWN";
  return choices.analytics ? "GRANTED" : "DENIED";
}

/** Sets only the analytics choice, keeping marketing as it was. Denying also clears anything not yet sent. */
export function setTrackingConsent(value: "granted" | "denied"): void {
  if (typeof window === "undefined") return;
  setConsent({
    analytics: value === "granted",
    marketing: getConsent()?.marketing === true,
  });
  if (value === "denied") queue = [];
}

/** Drops events waiting to be sent (analytics was refused). */
export function clearTrackingQueue(): void {
  queue = [];
}

/** Used only until the shopper allows analytics or marketing: lives in memory, never stored. */
let pageVisitorId: string | null = null;

/**
 * The browser's visitor id. Stored only once the shopper allowed analytics or marketing (on-site
 * messages need it for "once per visit / per day"); before that, a per-page id that is never saved.
 */
export function getVisitorId(): string {
  if (typeof window === "undefined") return uuidv4();
  if (!hasConsent("analytics") && !hasConsent("marketing")) {
    pageVisitorId ??= uuidv4();
    return pageVisitorId;
  }
  try {
    const existing = window.localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    // Consent given during the visit: keep the id the anonymous part of the visit used.
    const created = pageVisitorId ?? uuidv4();
    pageVisitorId = null;
    window.localStorage.setItem(VISITOR_KEY, created);
    return created;
  } catch {
    return uuidv4();
  }
}

/** One session id per tab, rotated after 30 minutes without an event. */
let pageSessionId: string | null = null;
/** Last event of the in-memory session (before consent): the same 30-minute rule as a stored one. */
let pageSessionLast = 0;

export function getSessionId(now = Date.now()): string {
  return sessionIdAt(now, true);
}

/**
 * The tab's session id. `touch`: an event of the shopper (the tracker) keeps the session alive; an
 * API call only reads it (rotating it, as the next event would, when it has expired), so background
 * requests never stretch a session the shopper left.
 */
function sessionIdAt(now: number, touch: boolean): string {
  if (typeof window === "undefined") return uuidv4();
  // Same rule as the visitor id: nothing stored before the shopper allowed analytics or marketing.
  if (!hasConsent("analytics") && !hasConsent("marketing")) {
    // In memory, rotated after the same 30 idle minutes as a stored one.
    if (pageSessionId === null || now - pageSessionLast >= SESSION_IDLE_MS) pageSessionId = uuidv4();
    if (touch || pageSessionLast === 0) pageSessionLast = now;
    return pageSessionId;
  }
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as { id: string; last: number };
      if (saved.id && now - saved.last < SESSION_IDLE_MS) {
        if (touch) window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: saved.id, last: now }));
        return saved.id;
      }
    }
    // Consent given during the visit: the session goes on with the id it started with (one
    // session, not two), unless that id is idle too long already.
    const carried = pageSessionId !== null && now - pageSessionLast < SESSION_IDLE_MS ? pageSessionId : null;
    pageSessionId = null;
    const id = carried ?? uuidv4();
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id, last: now }));
    return id;
  } catch {
    return uuidv4();
  }
}

/** Headers carrying the shopper's behaviour ids on storefront API calls (backend behavior-request-identity). */
export const BEHAVIOR_VISITOR_HEADER = "x-behavior-visitor";
export const BEHAVIOR_SESSION_HEADER = "x-behavior-session";
export const BEHAVIOR_CONSENT_HEADER = "x-behavior-consent";

/**
 * The tracker's current visitor and session ids for a storefront API call, so what the server
 * observes while answering it (a search, an add to bag, a payment request) belongs to the shopper's
 * own session in the reports instead of getting random ids of its own.
 *
 * Exactly the tracker's consent rule (`trackingMode()`): with analytics consent the stored ids and
 * GRANTED; before any choice the tracker's per-page ids and no consent state, so the server counts
 * the call anonymously in the same anonymous session as the page's own events; after a refusal (or
 * with first-party tracking off) nothing. Nothing is ever stored for this. Server-side rendering has
 * no shopper ids and sends none.
 */
export function behaviorIdentityHeaders(now = Date.now()): Record<string, string> | null {
  if (typeof window === "undefined" || !trackingEnabled()) return null;
  const mode = trackingMode();
  if (mode === "OFF") return null;
  return {
    [BEHAVIOR_VISITOR_HEADER]: getVisitorId(),
    [BEHAVIOR_SESSION_HEADER]: sessionIdAt(now, false),
    ...(mode === "IDENTIFIED" ? { [BEHAVIOR_CONSENT_HEADER]: "GRANTED" } : {}),
  };
}

function cleanProperties(input: TrackProperties): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(input)) {
    if (Object.keys(out).length >= MAX_PROPERTIES) break;
    if (value === null || value === undefined) continue;
    if (typeof value === "number" && !Number.isFinite(value)) continue;
    if (typeof value === "string" && value.length > 200) continue;
    out[key] = value;
  }
  return out;
}

/**
 * First-party tracking for this website's market, from the admin switchboard (settings phase 11;
 * was NEXT_PUBLIC_TRACKING_ENABLED). Set by PlatformTracker from the site integrations.
 * - null: not known yet (the first render). Events of an analytics-consented shopper wait in
 *   memory and are NOT sent; they go out once the switch is known to be on, and are dropped if it
 *   is off.
 * - false: off (also whenever the backend cannot say: fail-closed). Nothing is queued or sent.
 */
let firstPartyTracking: boolean | null = null;

export function setFirstPartyTracking(on: boolean): void {
  firstPartyTracking = on === true;
  if (!firstPartyTracking) {
    // Switched off (or unknown → off): what was waiting is dropped, never sent.
    queue = [];
    return;
  }
  if (queue.length > 0) scheduleFlush();
}

/** Tracking must never break a page, so anything unknown simply means "off". */
function trackingEnabled(): boolean {
  return firstPartyTracking !== false;
}

export type TrackOptions = {
  /** Identical name + key inside 3 s is sent once (React re-renders, Strict Mode). */
  dedupeKey?: string;
};

/** Queue one event. Never throws and never blocks the page. Returns whether it was queued. */
export function track(
  eventName: string,
  properties: TrackProperties = {},
  options: TrackOptions = {},
): boolean {
  if (typeof window === "undefined") return false;
  // Reading the address stores nothing; it must happen before the router drops the campaign tags.
  captureLandingAcquisition();
  if (!trackingEnabled()) return false;
  // Refused analytics: nothing. Before a choice: anonymous (per-page ids, nothing stored).
  if (trackingMode() === "OFF") return false;

  const now = Date.now();
  const signature = `${eventName}|${options.dedupeKey ?? ""}`;
  const last = recentSignatures.get(signature);
  if (options.dedupeKey !== undefined && last !== undefined && now - last < DEDUPE_WINDOW_MS) {
    return false;
  }
  recentSignatures.set(signature, now);
  if (recentSignatures.size > 200) {
    for (const [key, at] of recentSignatures) {
      if (now - at > DEDUPE_WINDOW_MS) recentSignatures.delete(key);
    }
  }

  sequence += 1;
  const mode = trackingMode();
  const acquisition = acquisitionSentAs.has(mode) ? undefined : (landingAcquisition ?? undefined);
  acquisitionSentAs.add(mode);
  const event: BehaviorEventV1 = {
    contractVersion: "behavior_event_v1",
    eventId: uuidv4(),
    eventName,
    occurredAt: new Date(now).toISOString(),
    visitorId: getVisitorId(),
    sessionId: getSessionId(now),
    sequence,
    properties: cleanProperties({
      // A market on the shared address (`/~KWT/x`) reports `/x`: the market is its own field.
      pagePath: withoutMarketSegment(window.location.pathname),
      captureSource: "browser",
      ...properties,
    }),
    ...(acquisition ? { acquisition } : {}),
  };
  if (mode === "ANONYMOUS") anonymousEvents.add(event);
  queue.push(event);
  if (queue.length > MAX_QUEUE) queue = queue.slice(queue.length - MAX_QUEUE);
  bindListeners();
  scheduleFlush();
  return true;
}

function scheduleFlush(): void {
  if (flushTimer !== null) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushNow();
  }, FLUSH_DELAY_MS);
}

function bindListeners(): void {
  if (listenersBound || typeof document === "undefined") return;
  listenersBound = true;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void flushNow();
  });
  window.addEventListener("pagehide", () => {
    void flushNow();
  });
}

/** Send everything queued, in batches. Failed batches are put back (bounded) and retried later. */
export async function flushNow(): Promise<void> {
  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  // Checked again at send time: the switch may be unknown or off by now, or analytics refused
  // since the events were queued (the banner, another tab). Nothing leaves unless the switch is on
  // and analytics was not refused.
  if (firstPartyTracking !== true) {
    if (firstPartyTracking === false) queue = [];
    return;
  }
  if (trackingMode() === "OFF") {
    queue = [];
    return;
  }
  while (queue.length > 0) {
    // A batch holds events of one kind: anonymous (recorded before a choice) or with consent.
    const anonymous = anonymousEvents.has(queue[0]);
    let size = 0;
    while (size < queue.length && size < BATCH_SIZE && anonymousEvents.has(queue[size]) === anonymous) size += 1;
    const batch = queue.splice(0, size);
    const outcome = await sendBatch(batch, anonymous);
    if (outcome === "retry") {
      queue = [...batch, ...queue].slice(-MAX_QUEUE);
      scheduleFlush();
      return;
    }
  }
}

/**
 * The consent field is sent only when the shopper made a choice, and never for events recorded before
 * it (`anonymous`). Omitting it lets the backend apply the market's policy: stored when consent is not
 * required; otherwise counted anonymously (visitor id for one store day, no customer) or dropped, as
 * the market's "without consent" setting says.
 */
export function requestBody(
  events: BehaviorEventV1[],
  anonymous = false,
): {
  events: BehaviorEventV1[];
  consentStatus?: TrackingConsent;
} {
  const consent = getTrackingConsent();
  return anonymous || consent === "UNKNOWN" ? { events } : { events, consentStatus: consent };
}

async function sendBatch(events: BehaviorEventV1[], anonymous: boolean): Promise<"sent" | "retry"> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const host = await resolveStorefrontHost();
    if (host) headers["x-storefront-host"] = host;
    const query = storefrontContextQuery();
    const response = await fetch(
      `${env.apiBaseUrl}/storefront/analytics/events${query ? `?${query}` : ""}`,
      {
        method: "POST",
        headers,
        keepalive: true,
        body: JSON.stringify(requestBody(events, anonymous)),
      },
    );
    // 4xx means the batch is invalid or refused; retrying cannot help.
    if (response.status >= 500) return "retry";
    return "sent";
  } catch {
    return "retry";
  }
}

export function resetTrackerForTests(): void {
  firstPartyTracking = null;
  pageVisitorId = null;
  pageSessionId = null;
  pageSessionLast = 0;
  // A fresh page: read the test's address again.
  landingAcquisition = undefined;
  acquisitionSentAs.clear();
  captureLandingAcquisition();
  queue = [];
  sequence = 0;
  recentSignatures.clear();
  if (flushTimer !== null) clearTimeout(flushTimer);
  flushTimer = null;
}

export function queuedEventsForTests(): readonly BehaviorEventV1[] {
  return queue;
}
