import type { CustomerOrderDetailResponse } from "@/features/account/api/customerOrders.service";
import type { OrderTrackingSummary } from "@/features/tracking/api/orderTracking.service";

/**
 * Build a tracking summary from the account order detail, for when the richer
 * tracking endpoint is unavailable. It lacks carrier names and delivery
 * estimates, but the progress, shipments and timeline still render.
 */
export function trackingSummaryFromDetail(
  detail: CustomerOrderDetailResponse,
): OrderTrackingSummary {
  const { order, cancellationWindow } = detail;
  const shipments = order.shipments ?? [];
  // Account detail lists shipment events newest first.
  const latest = shipments[0]?.events?.[0] ?? null;

  return {
    orderId: order.orderId,
    orderNumber: order.orderNumber ?? "",
    status: order.status,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    createdAt: order.createdAt,
    currency: order.currency,
    total: order.totals.total,
    itemCount: order.lines.length,
    isGuestOrder: order.customer.isGuest,
    shipments: shipments.map((shipment) => ({
      shipmentId: shipment.shipmentId,
      shipmentNumber: "",
      status: shipment.status,
      deliveryMethod: {
        methodCode: order.selectedDeliveryMethod?.methodCode ?? "",
        displayName: null,
        estimatedMinDays: null,
        estimatedMaxDays: null,
      },
      shippingPartner: {
        partnerCode: order.selectedDeliveryMethod?.partnerCode ?? "",
        displayName: null,
      },
      trackingNumber: shipment.trackingNumber,
      trackingUrl: shipment.trackingUrl,
      shippedAt: null,
      estimatedDeliveryAt: null,
      deliveredAt: shipment.deliveredAt,
      itemCount: 0,
      items: [],
      latestTrackingEvent: shipment.events?.[0]
        ? {
            eventStatus: shipment.events[0].status,
            eventTime: shipment.events[0].occurredAt,
            title: null,
            description: shipment.events[0].description,
            location: null,
            countryCode: null,
            partnerCode: order.selectedDeliveryMethod?.partnerCode ?? "",
            trackingNumber: shipment.trackingNumber,
          }
        : null,
    })),
    latestTrackingStatus: latest?.status ?? null,
    latestTrackingEventTime: latest?.occurredAt ?? null,
    estimatedDeliveryAt: null,
    deliveredAt: shipments.find((s) => s.deliveredAt)?.deliveredAt ?? null,
    cancellationWindow,
    timeline: (order.timeline ?? []).map((event) => ({ ...event, description: null })),
  };
}
