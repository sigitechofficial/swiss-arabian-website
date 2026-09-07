import { apiGet } from "@/lib/api/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

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

export interface GuestShipmentSummary {
  shipmentId: string;
  shipmentNumber: string;
  status: string;
  deliveryMethod: {
    methodCode: string;
    displayName: string | null;
    estimatedMinDays: number | null;
    estimatedMaxDays: number | null;
  };
  shippingPartner: { partnerCode: string; displayName: string | null };
  trackingNumber: string | null;
  trackingUrl: string | null;
  shippedAt: string | null;
  estimatedDeliveryAt: string | null;
  deliveredAt: string | null;
  itemCount: number;
  items: {
    sku: string;
    productName: string | null;
    quantity: string;
    orderLineId?: string | null;
    variantName?: string | null;
  }[];
  latestTrackingEvent: TrackingEvent | null;
}

export interface GuestOrderTrackingSummaryResponse {
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
  shipments: GuestShipmentSummary[];
  latestTrackingStatus: string | null;
  latestTrackingEventTime: string | null;
  estimatedDeliveryAt: string | null;
  deliveredAt: string | null;
  cancellationWindow: {
    isInsideWindow: boolean;
    canCancel: boolean;
    remainingSeconds: number | null;
    endsAt: string | null;
  } | null;
  timeline: {
    eventType: string;
    title: string | null;
    description: string | null;
    occurredAt: string;
  }[];
  lines?: {
    orderLineId: string;
    sku: string;
    productName: string | null;
    variantName?: string | null;
    quantity: string;
  }[];
}

export interface GuestOrderTrackingTimelineResponse {
  orderNumber: string;
  latestStatus: string | null;
  latestEventTime: string | null;
  shipments: {
    shipmentId: string;
    shipmentNumber: string;
    status: string;
    trackingNumber: string | null;
    trackingUrl: string | null;
    latestEvent: TrackingEvent | null;
    events: TrackingEvent[];
  }[];
  timeline: (TrackingEvent & { shipmentId: string })[];
}

// ─── Service functions ────────────────────────────────────────────────────────

function buildTokenParam(orderAccessToken: string): URLSearchParams {
  return new URLSearchParams({ orderAccessToken });
}

/**
 * GET /storefront/order-tracking/:orderNumber
 * Public — proof-protected by orderAccessToken. No login required.
 */
export async function getGuestOrderTracking(
  orderNumber: string,
  orderAccessToken: string,
): Promise<GuestOrderTrackingSummaryResponse> {
  const q = buildTokenParam(orderAccessToken);
  return apiGet<GuestOrderTrackingSummaryResponse>(
    `/storefront/order-tracking/${orderNumber}?${q}`,
    { skipAuth: true },
  );
}

/**
 * GET /storefront/order-tracking/:orderNumber/tracking
 * Public — full tracking event timeline for all shipments.
 */
export async function getGuestOrderTrackingTimeline(
  orderNumber: string,
  orderAccessToken: string,
): Promise<GuestOrderTrackingTimelineResponse> {
  const q = buildTokenParam(orderAccessToken);
  return apiGet<GuestOrderTrackingTimelineResponse>(
    `/storefront/order-tracking/${orderNumber}/tracking?${q}`,
    { skipAuth: true },
  );
}
