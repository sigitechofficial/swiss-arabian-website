import type { AccountStatusTone } from "@/features/account/components/AccountStatus";
import { currentMarketTimeZone } from "@/lib/storefront/marketTimeZone";

/** Shared order vocabulary for Purchase History, order detail and tracking. */

type StatusDisplay = { label: string; tone: AccountStatusTone };

const ORDER_STATUS: Record<string, StatusDisplay> = {
  DRAFT: { label: "Draft", tone: "muted" },
  PAYMENT_PENDING: { label: "Awaiting Payment", tone: "warning" },
  PAYMENT_AUTHORIZED: { label: "Authorized", tone: "accent" },
  PAID: { label: "Paid", tone: "success" },
  CANCELLATION_WINDOW: { label: "Processing", tone: "accent" },
  READY_FOR_FULFILLMENT: { label: "Confirmed", tone: "accent" },
  FULFILLMENT_QUEUED: { label: "Preparing", tone: "accent" },
  SHIPMENT_CREATED: { label: "Shipped", tone: "accent" },
  IN_TRANSIT: { label: "On the Way", tone: "accent" },
  DELIVERED: { label: "Delivered", tone: "success" },
  CANCELLED: { label: "Cancelled", tone: "danger" },
  REFUND_PENDING: { label: "Refund Pending", tone: "warning" },
  REFUNDED: { label: "Refunded", tone: "muted" },
  MANUAL_REVIEW: { label: "Under Review", tone: "warning" },
  FAILED: { label: "Failed", tone: "danger" },
};

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function sentenceCase(value: string): string {
  const cleaned = value.replace(/_/g, " ").trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function orderStatusDisplay(status: string): StatusDisplay {
  return ORDER_STATUS[status] ?? { label: titleCase(status), tone: "muted" };
}

const ACTIVE_STATUSES = new Set([
  "PAYMENT_PENDING",
  "PAYMENT_AUTHORIZED",
  "PAID",
  "CANCELLATION_WINDOW",
  "READY_FOR_FULFILLMENT",
  "FULFILLMENT_QUEUED",
  "SHIPMENT_CREATED",
  "IN_TRANSIT",
]);

export function isActiveOrder(status: string): boolean {
  return ACTIVE_STATUSES.has(status);
}

/** Placed but not paid — offer to complete payment. */
export function needsPayment(status: string, paymentStatus?: string | null): boolean {
  const pay = paymentStatus?.toUpperCase();
  const settled = pay === "PAID" || pay === "AUTHORIZED" || pay === "PARTIALLY_REFUNDED" || pay === "REFUNDED";
  return status === "PAYMENT_PENDING" && !settled;
}

export type OrderPrimaryAction = "pay" | "track" | "view";

/** Guide's status → button map: Pay Now while unpaid, Track Order once shipped. */
export function orderPrimaryAction(
  status: string,
  paymentStatus?: string | null,
): OrderPrimaryAction {
  if (needsPayment(status, paymentStatus)) return "pay";
  if (status === "SHIPMENT_CREATED" || status === "IN_TRANSIT") return "track";
  return "view";
}

// ─── Delivery progress ───────────────────────────────────────────────────────

export const ORDER_PROGRESS_STEPS = [
  "Placed",
  "Confirmed",
  "Preparing",
  "Shipped",
  "Delivered",
] as const;

const PROGRESS_STEP: Record<string, number> = {
  DRAFT: 0,
  PAYMENT_PENDING: 0,
  PAYMENT_AUTHORIZED: 1,
  PAID: 1,
  CANCELLATION_WINDOW: 1,
  READY_FOR_FULFILLMENT: 1,
  FULFILLMENT_QUEUED: 2,
  SHIPMENT_CREATED: 3,
  IN_TRANSIT: 3,
  DELIVERED: 4,
};

/** `-1` once an order has left the delivery path (cancelled, refunded, review…). */
export function orderProgressStep(status: string): number {
  return PROGRESS_STEP[status] ?? -1;
}

/** Why an order left the delivery path, as a kind each brand words in its own language. */
export type StoppedOrderKind = "cancelled" | "refundPending" | "refunded" | "review" | "failed" | "other";

export function stoppedOrderKind(status: string): StoppedOrderKind {
  switch (status) {
    case "CANCELLED":
      return "cancelled";
    case "REFUND_PENDING":
      return "refundPending";
    case "REFUNDED":
      return "refunded";
    case "MANUAL_REVIEW":
      return "review";
    case "FAILED":
      return "failed";
    default:
      return "other";
  }
}

const STOPPED_MESSAGE: Record<StoppedOrderKind, string> = {
  cancelled: "This order was cancelled.",
  refundPending: "This order is being refunded to your original payment method.",
  refunded: "This order was refunded to your original payment method.",
  // Calm: a review is usually a routine check, not a problem with the order.
  review: "We’re checking a detail on your order. We’ll update you soon.",
  failed: "This order couldn’t be completed. Please contact our customer care team.",
  other: "There’s no delivery progress to show for this order.",
};

export function stoppedOrderMessage(status: string): string {
  return STOPPED_MESSAGE[stoppedOrderKind(status)];
}

/**
 * The delivery date to show: "Delivered on" once delivered, else the estimate.
 * Never an estimate for an order that has already arrived.
 */
export function deliveryDateFact(summary: {
  status: string;
  deliveredAt: string | null;
  estimatedDeliveryAt: string | null;
}): { kind: "delivered"; at: string } | { kind: "estimate"; at: string } | null {
  if (summary.deliveredAt) return { kind: "delivered", at: summary.deliveredAt };
  if (summary.status === "DELIVERED") return null;
  if (summary.estimatedDeliveryAt) return { kind: "estimate", at: summary.estimatedDeliveryAt };
  return null;
}

/**
 * Bottles in an order (sum of quantities), as the emails count them. The
 * tracking API's `itemCount` counts order lines, so units come from the
 * shipments' items when there are any.
 */
export function trackingUnitCount(summary: {
  itemCount: number;
  shipments: Array<{ items?: Array<{ quantity: string }> | null }>;
}): number {
  const units = summary.shipments
    .flatMap((shipment) => shipment.items ?? [])
    .reduce((sum, item) => sum + (Number.parseInt(item.quantity, 10) || 1), 0);
  return Math.max(units, summary.itemCount);
}

// ─── Dates ───────────────────────────────────────────────────────────────────

export function formatOrderDate(
  iso: string | null | undefined,
  {
    time = false,
    long = false,
    timeZone = currentMarketTimeZone(),
  }: { time?: boolean; long?: boolean; timeZone?: string } = {},
): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  // The market's time zone, so server, browser and the emails agree.
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: long ? "long" : "short",
    day: "numeric",
    timeZone,
  };
  return time
    ? date.toLocaleString("en-AE", { ...options, hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("en-AE", options);
}

// ─── Order timeline ──────────────────────────────────────────────────────────

/**
 * Backend order events are written for operators ("Payment webhook reconciled
 * SESSION_CREATED -> PAID", "Shipment created locally", a repeated "Payment
 * confirmed"). Map each to shopper wording, or drop it when it isn't news.
 */
function orderEventLabel(eventType: string, title: string | null): string | null {
  const t = (title ?? "").toLowerCase();
  switch (eventType) {
    case "ORDER_CREATED":
      return "Order placed";
    case "PAYMENT_STATUS_CHANGED":
      if (t.includes("provider execution")) return null;
      if (t.includes("refund")) return "Refund update";
      if (t.includes("fail") || t.includes("declin")) return "Payment failed";
      if (t.includes("confirm") || t.includes("paid") || t.includes("captur")) return "Payment confirmed";
      if (t.includes("authoriz")) return "Payment authorized";
      if (t.includes("initiat")) return "Payment started";
      if (t.includes("pending")) return null;
      return "Payment updated";
    case "CANCELLATION_WINDOW_STARTED":
      return "Order being processed";
    case "CANCELLATION_WINDOW_ENDED":
      return "Order confirmed";
    case "FULFILLMENT_STATUS_CHANGED":
      if (t.includes("deliver")) return "Delivered";
      if (t.includes("ship")) return "Shipped";
      return "Preparing your order";
    case "SHIPMENT_UPDATED":
      if (t.includes("deliver")) return "Delivered";
      if (t.includes("out for delivery")) return "Out for delivery";
      if (t.includes("transit")) return "On the way";
      return "Shipment created";
    case "STATUS_CHANGED":
      return title ? sentenceCase(title) : null;
    case "CANCELLED":
      return "Order cancelled";
    case "REFUND_REQUESTED":
      return "Refund requested";
    case "REFUND_UPDATED":
      return "Refund updated";
    default:
      return title ? sentenceCase(title) : null;
  }
}

export type OrderTimelineEntry = { key: string; label: string; occurredAt: string };

/** Oldest first, one entry per milestone. */
export function customerOrderTimeline(
  events: Array<{ eventType: string; title: string | null; occurredAt: string }>,
): OrderTimelineEntry[] {
  const sorted = [...events].sort(
    (a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt),
  );
  const seen = new Set<string>();
  const entries: OrderTimelineEntry[] = [];
  for (const event of sorted) {
    const label = orderEventLabel(event.eventType, event.title);
    if (!label || seen.has(label)) continue;
    seen.add(label);
    entries.push({ key: `${event.eventType}-${event.occurredAt}`, label, occurredAt: event.occurredAt });
  }
  return entries;
}

// ─── Shipment tracking ───────────────────────────────────────────────────────

/**
 * What a shipment or carrier status means to a shopper. Shipment statuses
 * (CREATE_QUEUED, LABEL_CREATED …) and carrier event statuses (INFO_RECEIVED,
 * ARRIVED_AT_HUB …) both map here; each brand words the keys in its languages.
 */
export const TRACKING_STATUS_KEYS = [
  "preparing",
  "created",
  "awaitingPickup",
  "pickedUp",
  "inTransit",
  "outForDelivery",
  "delivered",
  "failedAttempt",
  "delayed",
  "returning",
  "returned",
  "cancelled",
  "update",
] as const;

export type TrackingStatusKey = (typeof TRACKING_STATUS_KEYS)[number];

const TRACKING_STATUS: Record<string, TrackingStatusKey> = {
  // The shipment before the courier has it.
  DRAFT: "preparing",
  PENDING_CANCELLATION_WINDOW: "preparing",
  READY_TO_CREATE: "preparing",
  CREATE_QUEUED: "preparing",
  CREATING: "preparing",
  CREATED: "created",
  LABEL_CREATED: "created",
  INFO_RECEIVED: "created",
  PENDING: "awaitingPickup",
  PICKUP_SCHEDULED: "awaitingPickup",
  PICKED_UP: "pickedUp",
  IN_TRANSIT: "inTransit",
  ARRIVED_AT_HUB: "inTransit",
  OUT_FOR_DELIVERY: "outForDelivery",
  DELIVERED: "delivered",
  FAILED_DELIVERY: "failedAttempt",
  FAILED_ATTEMPT: "failedAttempt",
  EXCEPTION: "delayed",
  MANUAL_REVIEW: "delayed",
  LOST: "delayed",
  DAMAGED: "delayed",
  FAILED: "delayed",
  RTO_INITIATED: "returning",
  RTO_IN_TRANSIT: "returning",
  RETURN_TO_SENDER: "returning",
  RTO_COMPLETED: "returned",
  RETURNED: "returned",
  CANCEL_REQUESTED: "cancelled",
  CANCELLED: "cancelled",
};

/** Never a raw code: an unknown status is a plain "shipment update". */
export function trackingStatusKey(status?: string | null): TrackingStatusKey {
  return TRACKING_STATUS[status?.trim().toUpperCase() ?? ""] ?? "update";
}

const TRACKING_STATUS_LABEL: Record<TrackingStatusKey, string> = {
  preparing: "Preparing your shipment",
  created: "Shipment created",
  awaitingPickup: "Awaiting pickup",
  pickedUp: "Picked up",
  inTransit: "In transit",
  outForDelivery: "Out for delivery",
  delivered: "Delivered",
  failedAttempt: "Delivery attempt failed",
  delayed: "Delayed, we’re looking into it",
  returning: "Returning to sender",
  returned: "Returned to sender",
  cancelled: "Shipment cancelled",
  update: "Shipment update",
};

export function shipmentStatusLabel(status?: string | null): string {
  if (!status) return "";
  return TRACKING_STATUS_LABEL[trackingStatusKey(status)];
}

/** Operator notes and system codes that shouldn't reach shoppers. */
const INTERNAL_TEXT = [
  /webhook/i,
  /->/,
  /reconcil/i,
  /session_created/i,
  /locally/i,
  /provider/i,
  /worker/i,
  /queued/i,
  /platform/i,
  /simulat/i,
  /synthetic/i,
  /smoke/i,
  /dev[- ]?only/i,
  /dummy/i,
  // A bare system code (LOCAL_SIMULATION, SMOKE_CREATED, DELIVERED).
  /^[A-Z0-9]+(?:_[A-Z0-9]+)*$/,
];

function isCustomerFacing(text?: string | null): text is string {
  const value = text?.trim();
  return Boolean(
    value &&
      // A carrier's numeric status ("100") is not a note.
      /\p{L}/u.test(value) &&
      !INTERNAL_TEXT.some((pattern) => pattern.test(value)),
  );
}

/**
 * Events staff record in the admin ("Ops-entered tracking", "Ops-marked
 * delivered") carry the staff member's reason as their description. The API
 * has no customer-visible flag, so that text never reaches the shopper.
 */
function isStaffEvent(title?: string | null): boolean {
  return /^ops[- ]/i.test(title?.trim() ?? "");
}

export type TrackingHistoryEntry = {
  key: string;
  /** What happened, for the brand to word in the shopper's language. */
  status: TrackingStatusKey;
  /** English wording of `status`. */
  label: string;
  /** The carrier's own note, when it is meant for shoppers. */
  detail: string | null;
  location: string | null;
  occurredAt: string;
};

function eventTime(value: string): number {
  const time = Date.parse(value);
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
}

/** Carrier events for one shipment: newest first, noise and repeats removed. */
export function trackingHistory(
  events: Array<{
    eventStatus: string;
    eventTime: string;
    title: string | null;
    description: string | null;
    location: string | null;
  }>,
): TrackingHistoryEntry[] {
  // Oldest first (stable), so a repeated status keeps its first occurrence.
  const sorted = events
    .map((event, index) => ({ event, index }))
    .sort((a, b) => eventTime(a.event.eventTime) - eventTime(b.event.eventTime) || a.index - b.index)
    .map(({ event }) => event);
  const seen = new Set<string>();
  const entries: TrackingHistoryEntry[] = [];
  for (const event of sorted) {
    const status = trackingStatusKey(event.eventStatus);
    const staff = isStaffEvent(event.title);
    // Carriers often send "STATUS: note" as the title; keep just the note.
    const carrierNote =
      !staff && event.title?.includes(":") ? event.title.split(":").slice(1).join(":").trim() : null;
    const detail = staff
      ? null
      : isCustomerFacing(carrierNote)
        ? carrierNote
        : isCustomerFacing(event.description)
          ? event.description.trim()
          : null;
    const dedupeKey = `${status}|${detail ?? ""}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    entries.push({
      key: `${event.eventStatus}-${event.eventTime}-${entries.length}`,
      status,
      label: TRACKING_STATUS_LABEL[status],
      detail,
      location: isCustomerFacing(event.location) ? event.location.trim() : null,
      occurredAt: event.eventTime,
    });
  }
  return entries.reverse();
}
