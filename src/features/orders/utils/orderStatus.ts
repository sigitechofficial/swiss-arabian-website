import type { AccountStatusTone } from "@/features/account/components/AccountStatus";

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
  return status === "PAYMENT_PENDING" && pay !== "PAID" && pay !== "AUTHORIZED";
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

export function stoppedOrderMessage(status: string): string {
  switch (status) {
    case "CANCELLED":
      return "This order was cancelled.";
    case "REFUND_PENDING":
      return "This order is being refunded to your original payment method.";
    case "REFUNDED":
      return "This order was refunded to your original payment method.";
    case "MANUAL_REVIEW":
      return "This order is being reviewed by our team. We’ll contact you if we need anything.";
    case "FAILED":
      return "This order couldn’t be completed. Please contact our customer care team.";
    default:
      return "There’s no delivery progress to show for this order.";
  }
}

// ─── Dates ───────────────────────────────────────────────────────────────────

export function formatOrderDate(
  iso: string | null | undefined,
  { time = false, long = false }: { time?: boolean; long?: boolean } = {},
): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: long ? "long" : "short",
    day: "numeric",
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

const TRACKING_STATUS_LABEL: Record<string, string> = {
  CREATED: "Shipment created",
  INFO_RECEIVED: "Shipment details received",
  PENDING: "Awaiting pickup",
  PICKED_UP: "Picked up",
  IN_TRANSIT: "In transit",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  FAILED_ATTEMPT: "Delivery attempt failed",
  EXCEPTION: "Delivery exception",
  RETURNED: "Returned to sender",
  CANCELLED: "Shipment cancelled",
};

export function shipmentStatusLabel(status?: string | null): string {
  if (!status) return "";
  return TRACKING_STATUS_LABEL[status.toUpperCase()] ?? titleCase(status);
}

/** Operator notes that shouldn't reach shoppers. */
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
];

function isCustomerFacing(text?: string | null): text is string {
  return Boolean(text && text.trim() && !INTERNAL_TEXT.some((pattern) => pattern.test(text)));
}

export type TrackingHistoryEntry = {
  key: string;
  label: string;
  detail: string | null;
  location: string | null;
  occurredAt: string;
};

/** Carrier events for one shipment — oldest first, noise and repeats removed. */
export function trackingHistory(
  events: Array<{
    eventStatus: string;
    eventTime: string;
    title: string | null;
    description: string | null;
    location: string | null;
  }>,
): TrackingHistoryEntry[] {
  const sorted = [...events].sort((a, b) => Date.parse(a.eventTime) - Date.parse(b.eventTime));
  const seen = new Set<string>();
  const entries: TrackingHistoryEntry[] = [];
  for (const event of sorted) {
    const label = shipmentStatusLabel(event.eventStatus);
    // Carriers often send "STATUS: note" as the title — keep just the note.
    const carrierNote = event.title?.includes(":")
      ? event.title.split(":").slice(1).join(":").trim()
      : null;
    const detail = isCustomerFacing(carrierNote)
      ? carrierNote
      : isCustomerFacing(event.description)
        ? event.description
        : null;
    const dedupeKey = `${label}|${detail ?? ""}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    entries.push({
      key: `${event.eventStatus}-${event.eventTime}`,
      label,
      detail,
      location: event.location || null,
      occurredAt: event.eventTime,
    });
  }
  return entries;
}
