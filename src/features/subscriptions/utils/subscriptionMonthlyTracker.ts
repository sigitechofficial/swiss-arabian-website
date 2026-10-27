import type {
  SubscriptionDetail,
  SubscriptionQueueItem,
  SubscriptionSelectionMode,
} from "../types/subscription.types";
import { queueRows } from "./subscriptionRules";

export type TrackerPaymentStatus =
  | "UPCOMING"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "ACTION_REQUIRED"
  | "RECONCILIATION_REQUIRED"
  | "SKIPPED";

export type TrackerDeliveryStatus =
  | "NOT_CREATED"
  | "ORDER_PENDING"
  | "MANUAL_REVIEW"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED";

export type SubscriptionCycleSnapshot = {
  cycleNumber: number;
  status: string;
  sku?: string | null;
  orderId?: string | null;
  orderNumber?: string | null;
  orderStatus?: string | null;
  fulfillmentStatus?: string | null;
  shipmentStatus?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
};

export type SubscriptionMonthRow = {
  month: number;
  fragrance: string | null;
  imageUrl: string | null;
  billingDate: string | null;
  payment: TrackerPaymentStatus;
  orderNumber: string | null;
  orderId: string | null;
  delivery: TrackerDeliveryStatus;
  trackHref: string | null;
  shipmentStatus: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
};

export const TRACKER_PAYMENT_LABEL: Record<TrackerPaymentStatus, string> = {
  UPCOMING: "Upcoming",
  PROCESSING: "Processing",
  PAID: "Paid",
  FAILED: "Payment failed",
  ACTION_REQUIRED: "Action required",
  RECONCILIATION_REQUIRED: "Needs review",
  SKIPPED: "Skipped",
};

export const TRACKER_DELIVERY_LABEL: Record<TrackerDeliveryStatus, string> = {
  NOT_CREATED: "Order not created yet",
  ORDER_PENDING: "Order pending",
  MANUAL_REVIEW: "Under review",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
};

const PAYMENT_FROM_CYCLE: Record<string, TrackerPaymentStatus> = {
  PAID: "PAID",
  FAILED: "FAILED",
  ACTION_REQUIRED: "ACTION_REQUIRED",
  RECONCILIATION_REQUIRED: "RECONCILIATION_REQUIRED",
  PROCESSING: "PROCESSING",
  PENDING: "PROCESSING",
  SKIPPED: "SKIPPED",
};

export function subscriptionOrderTrackHref(input: {
  orderId?: string | null;
}): string | null {
  const orderId = input.orderId?.trim();
  if (!orderId) return null;
  return `/account/orders/${encodeURIComponent(orderId)}#tracking`;
}

export function subscriptionCheckoutOrderPresentation(input: {
  orderState?: "CONFIRMED" | "PENDING" | "NONE" | null;
  orderId?: string | null;
  orderNumber?: string | null;
  orderStatus?: string | null;
  fulfillmentStatus?: string | null;
  shipmentStatus?: string | null;
}): { orderLabel: string; fulfillmentLabel: string | null; trackHref: string | null } {
  const state = input.orderState ?? "NONE";
  if (state === "PENDING") {
    return { orderLabel: "Payment successful — Order processing", fulfillmentLabel: null, trackHref: null };
  }
  const orderNumber = input.orderNumber?.trim() || "";
  const orderId = input.orderId?.trim() || "";
  if (state !== "CONFIRMED" || !orderNumber) {
    return { orderLabel: "Not confirmed on this page", fulfillmentLabel: null, trackHref: null };
  }
  const delivery = deliveryFromCycle({
    cycleNumber: 1,
    status: "PAID",
    orderId,
    orderNumber,
    orderStatus: input.orderStatus,
    fulfillmentStatus: input.fulfillmentStatus,
    shipmentStatus: input.shipmentStatus,
  });
  return {
    orderLabel: orderNumber,
    fulfillmentLabel: TRACKER_DELIVERY_LABEL[delivery],
    trackHref: orderId ? subscriptionOrderTrackHref({ orderId }) : null,
  };
}

export function subscriptionCheckoutShowsPaymentForm(view: {
  paymentState: string;
  status: string;
}): boolean {
  return !(view.paymentState === "SUCCESS" && view.status === "ACTIVE");
}

function fragranceName(item: SubscriptionQueueItem | undefined): string | null {
  if (!item) return null;
  return item.name?.trim() || item.sku;
}

function plannedMonth(
  mode: SubscriptionSelectionMode,
  queue: SubscriptionQueueItem[],
  schedule: SubscriptionDetail["surpriseSchedule"],
  month: number,
): { fragrance: string | null; imageUrl: string | null } {
  if (mode === "REPLENISHMENT") {
    return { fragrance: fragranceName(queue[0]), imageUrl: queue[0]?.imageUrl?.trim() || null };
  }
  if (mode === "QUEUE") {
    const item = queue.find((row) => row.position === month);
    return { fragrance: fragranceName(item), imageUrl: item?.imageUrl?.trim() || null };
  }
  const pinned = schedule?.months.find((row) => row.position === month);
  return { fragrance: pinned?.name?.trim() || pinned?.sku || null, imageUrl: pinned?.imageUrl?.trim() || null };
}

function paymentFromCycle(status: string | undefined): TrackerPaymentStatus {
  if (!status) return "UPCOMING";
  return PAYMENT_FROM_CYCLE[status.toUpperCase()] ?? "UPCOMING";
}

function deliveryFromCycle(cycle: SubscriptionCycleSnapshot | undefined): TrackerDeliveryStatus {
  if (cycle?.status?.toUpperCase() === "SKIPPED") return "NOT_CREATED";
  const orderId = cycle?.orderId?.trim() || "";
  const orderNumber = cycle?.orderNumber?.trim() || "";
  if (!orderId && !orderNumber) {
    if (cycle?.status?.toUpperCase() === "SKIPPED") return "NOT_CREATED";
    const payment = paymentFromCycle(cycle?.status);
    return cycle && payment !== "UPCOMING" ? "ORDER_PENDING" : "NOT_CREATED";
  }
  const order = cycle?.orderStatus?.toUpperCase() ?? "";
  const fulfillment = cycle?.fulfillmentStatus?.toUpperCase() ?? "";
  const shipment = cycle?.shipmentStatus?.toUpperCase() ?? "";
  if (order === "MANUAL_REVIEW") return "MANUAL_REVIEW";
  if (order === "DELIVERED" || fulfillment === "FULFILLED" || shipment === "DELIVERED") return "DELIVERED";
  if (
    order === "SHIPMENT_CREATED" ||
    order === "IN_TRANSIT" ||
    shipment === "IN_TRANSIT" ||
    shipment === "SHIPPED" ||
    shipment === "OUT_FOR_DELIVERY" ||
    shipment === "PICKED_UP"
  ) {
    return "SHIPPED";
  }
  return "PROCESSING";
}

export function buildSubscriptionMonths(input: {
  mode: SubscriptionSelectionMode;
  status: string;
  billingEnabled: boolean;
  nextBillingAt: string | null;
  queue: SubscriptionQueueItem[];
  surpriseSchedule?: SubscriptionDetail["surpriseSchedule"];
  cycles?: SubscriptionCycleSnapshot[];
}): SubscriptionMonthRow[] {
  const cycles = new Map((input.cycles ?? []).map((cycle) => [cycle.cycleNumber, cycle]));
  let nextOpenMonth = 0;
  for (let month = 1; month <= 12; month += 1) {
    const payment = cycles.has(month) ? paymentFromCycle(cycles.get(month)?.status) : "UPCOMING";
    if (payment !== "PAID" && payment !== "SKIPPED" && nextOpenMonth === 0) nextOpenMonth = month;
  }

  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const cycle = cycles.get(month);
    const payment = cycle ? paymentFromCycle(cycle.status) : "UPCOMING";
    const skipped = payment === "SKIPPED";
    const orderId = skipped ? null : cycle?.orderId?.trim() || null;
    const orderNumber = skipped ? null : cycle?.orderNumber?.trim() || null;
    const trackingUrl = cycle?.trackingUrl?.trim() || null;
    const planned = plannedMonth(input.mode, input.queue, input.surpriseSchedule, month);
    return {
      month,
      fragrance: planned.fragrance || cycle?.sku?.trim() || null,
      imageUrl: planned.imageUrl,
      billingDate: !skipped && payment !== "PAID" && month === nextOpenMonth ? input.nextBillingAt : null,
      payment,
      orderNumber,
      orderId,
      delivery: deliveryFromCycle(cycle),
      trackHref: skipped || !orderId ? null : subscriptionOrderTrackHref({ orderId }),
      shipmentStatus: skipped ? null : cycle?.shipmentStatus?.trim() || null,
      trackingNumber: skipped ? null : cycle?.trackingNumber?.trim() || null,
      trackingUrl: skipped || !trackingUrl || !/^https?:\/\//i.test(trackingUrl) ? null : trackingUrl,
    };
  });
}

export function monthsFromAgreement(
  detail: Pick<
    SubscriptionDetail,
    "selectionMode" | "status" | "billingEnabled" | "nextBillingAt" | "queue" | "surpriseSchedule" | "billingCycles"
  >,
): SubscriptionMonthRow[] {
  return buildSubscriptionMonths({
    mode: detail.selectionMode,
    status: detail.status,
    billingEnabled: detail.billingEnabled,
    nextBillingAt: detail.nextBillingAt,
    queue: queueRows(detail.queue),
    surpriseSchedule: detail.surpriseSchedule,
    cycles: detail.billingCycles,
  });
}
