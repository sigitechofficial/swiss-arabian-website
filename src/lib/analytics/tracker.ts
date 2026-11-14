import { getAccessToken } from "@/lib/auth/token";
import { resolveStorefrontHost } from "@/lib/api/storefrontHost";
import { env } from "@/lib/config/env";
import { storefrontContextQuery } from "@/lib/storefront/context";

/**
 * First-party behavior tracker. Sends browser events to our own backend
 * (POST /storefront/analytics/events, contract behavior_event_v1) so our history never depends on a
 * third-party SDK. Off unless NEXT_PUBLIC_TRACKING_ENABLED=true; the backend applies its own
 * enable flag and consent policy on top.
 *
 * Privacy: only the pathname is sent (never the query string or full URL), no e-mail/phone/name, and
 * a client-side DENIED consent drops every event before it is queued.
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
};

const CONSENT_KEY = "sa_tracking_consent";
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

export function getTrackingConsent(): TrackingConsent {
  if (typeof window === "undefined") return "UNKNOWN";
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    if (value === "granted") return "GRANTED";
    if (value === "denied") return "DENIED";
  } catch {
    // storage blocked: treated as unknown
  }
  return "UNKNOWN";
}

/** Called by a future consent banner. Denying also clears anything not yet sent. */
export function setTrackingConsent(value: "granted" | "denied"): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // ignore
  }
  if (value === "denied") queue = [];
}

export function getVisitorId(): string {
  if (typeof window === "undefined") return uuidv4();
  try {
    const existing = window.localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    const created = uuidv4();
    window.localStorage.setItem(VISITOR_KEY, created);
    return created;
  } catch {
    return uuidv4();
  }
}

/** One session id per tab, rotated after 30 minutes without an event. */
export function getSessionId(now = Date.now()): string {
  if (typeof window === "undefined") return uuidv4();
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as { id: string; last: number };
      if (saved.id && now - saved.last < SESSION_IDLE_MS) {
        window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: saved.id, last: now }));
        return saved.id;
      }
    }
    const id = uuidv4();
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id, last: now }));
    return id;
  } catch {
    return uuidv4();
  }
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

/** Tracking must never break a page, so a missing or broken config simply means "off". */
function trackingEnabled(): boolean {
  try {
    return env.tracking.enabled === true;
  } catch {
    return false;
  }
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
  if (typeof window === "undefined" || !trackingEnabled()) return false;
  if (getTrackingConsent() === "DENIED") return false;

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
  const event: BehaviorEventV1 = {
    contractVersion: "behavior_event_v1",
    eventId: uuidv4(),
    eventName,
    occurredAt: new Date(now).toISOString(),
    visitorId: getVisitorId(),
    sessionId: getSessionId(now),
    sequence,
    properties: cleanProperties({
      pagePath: window.location.pathname,
      captureSource: "browser",
      ...properties,
    }),
  };
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
  while (queue.length > 0) {
    const batch = queue.splice(0, BATCH_SIZE);
    const outcome = await sendBatch(batch);
    if (outcome === "retry") {
      queue = [...batch, ...queue].slice(-MAX_QUEUE);
      scheduleFlush();
      return;
    }
  }
}

/**
 * The consent field is sent only when the shopper made a choice. An explicit UNKNOWN would make the
 * backend discard the batch even where its policy needs no consent; omitting it lets the backend
 * apply its own policy (stored when consent is not required, refused when it is).
 */
export function requestBody(events: BehaviorEventV1[]): {
  events: BehaviorEventV1[];
  consentStatus?: TrackingConsent;
} {
  const consent = getTrackingConsent();
  return consent === "UNKNOWN" ? { events } : { events, consentStatus: consent };
}

async function sendBatch(events: BehaviorEventV1[]): Promise<"sent" | "retry"> {
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
        body: JSON.stringify(requestBody(events)),
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
  queue = [];
  sequence = 0;
  recentSignatures.clear();
  if (flushTimer !== null) clearTimeout(flushTimer);
  flushTimer = null;
}

export function queuedEventsForTests(): readonly BehaviorEventV1[] {
  return queue;
}
