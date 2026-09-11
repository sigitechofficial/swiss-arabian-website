import { apiGet } from "@/lib/api/apiClient";

/**
 * `/storefront/order-tracking/:orderNumber` — shapes verified against the live
 * API. Proof is either the one-time `orderAccessToken` (guests) or the
 * customer's JWT for their own order; the order number alone is refused (422).
 */

export interface TrackingEvent {
  eventStatus: string;
  eventTime: string;
  title: string | null;
  description: string | null;
  location: string | null;
  countryCode: string | null;
  partnerCode: string;
  trackingNumber: string | null;
}

export interface TrackingDeliveryMethod {
  methodCode: string;
  displayName: string | null;
  methodType?: string | null;
  estimatedMinDays: number | null;
  estimatedMaxDays: number | null;
}

export interface TrackingShipment {
  shipmentId: string;
  shipmentNumber: string;
  status: string;
  deliveryMethod: TrackingDeliveryMethod;
  shippingPartner: { partnerCode: string; displayName: string | null };
  trackingNumber: string | null;
  /** Third-party carrier page — open in a new tab, never route to it. */
  trackingUrl: string | null;
  shippedAt: string | null;
  estimatedDeliveryAt: string | null;
  deliveredAt: string | null;
  itemCount: number;
  items: { sku: string; productName: string | null; quantity: string }[];
  latestTrackingEvent: TrackingEvent | null;
}

export interface TrackingCancellationWindow {
  isInsideWindow: boolean;
  canCancel: boolean;
  remainingSeconds: number | null;
  endsAt: string | null;
}

export interface OrderTrackingSummary {
  orderId: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  createdAt: string;
  currency: string;
  total: string;
  itemCount: number;
  isGuestOrder: boolean;
  shipments: TrackingShipment[];
  latestTrackingStatus: string | null;
  latestTrackingEventTime: string | null;
  estimatedDeliveryAt: string | null;
  deliveredAt: string | null;
  cancellationWindow: TrackingCancellationWindow | null;
  timeline: {
    eventType: string;
    title: string | null;
    description: string | null;
    occurredAt: string;
  }[];
}

export interface OrderTrackingTimeline {
  orderNumber: string;
  latestStatus: string | null;
  latestEventTime: string | null;
  shipments: {
    shipmentId: string;
    shipmentNumber: string;
    status: string;
    trackingNumber: string | null;
    trackingUrl: string | null;
    carrier: { partnerCode: string; displayName: string | null };
    deliveryMethod: TrackingDeliveryMethod;
    latestEvent: TrackingEvent | null;
    events: TrackingEvent[];
  }[];
  timeline: (TrackingEvent & { shipmentId: string })[];
}

/** With a token → public guest proof (no Bearer). Without → the signed-in customer's JWT. */
function trackingRequest(path: string, orderAccessToken?: string | null) {
  if (orderAccessToken) {
    const qs = new URLSearchParams({ orderAccessToken });
    return { url: `${path}?${qs.toString()}`, options: { skipAuth: true } };
  }
  return { url: path, options: {} };
}

export async function getOrderTracking(
  orderNumber: string,
  orderAccessToken?: string | null,
): Promise<OrderTrackingSummary> {
  const { url, options } = trackingRequest(
    `/storefront/order-tracking/${encodeURIComponent(orderNumber)}`,
    orderAccessToken,
  );
  return apiGet<OrderTrackingSummary>(url, options);
}

export async function getOrderTrackingTimeline(
  orderNumber: string,
  orderAccessToken?: string | null,
): Promise<OrderTrackingTimeline> {
  const { url, options } = trackingRequest(
    `/storefront/order-tracking/${encodeURIComponent(orderNumber)}/tracking`,
    orderAccessToken,
  );
  return apiGet<OrderTrackingTimeline>(url, options);
}
