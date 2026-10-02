import { apiGet, apiPost } from "@/lib/api/apiClient";
import { resolveStorefrontContext } from "@/lib/storefront/context";
import type { OrderLinePromotionSnapshot } from "@/features/orders/utils/historicalLineDiscount";
import type { OrderTrackingTimeline } from "@/features/tracking/api/orderTracking.service";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "DRAFT" | "PAYMENT_PENDING" | "PAYMENT_AUTHORIZED" | "PAID"
  | "CANCELLATION_WINDOW" | "READY_FOR_FULFILLMENT" | "FULFILLMENT_QUEUED"
  | "SHIPMENT_CREATED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED"
  | "REFUND_PENDING" | "REFUNDED" | "MANUAL_REVIEW" | "FAILED";

export type OrderPaymentStatus =
  | "PENDING" | "AUTHORIZED" | "PAID" | "FAILED"
  | "REFUNDED" | "PARTIALLY_REFUNDED" | "NOT_REQUIRED";

export type OrderFulfillmentStatus =
  | "NOT_READY" | "READY" | "QUEUED"
  | "PARTIALLY_FULFILLED" | "FULFILLED" | "CANCELLED";

export interface OrderSummaryApi {
  orderId: string;
  orderNumber: string | null;
  createdAt: string;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
  total: string;
  currency: string;
  itemCount: number;
  shipment: {
    status: string;
    trackingNumber: string | null;
    trackingUrl: string | null;
  } | null;
}

export interface PaginatedOrdersResponse {
  items: OrderSummaryApi[];
  total: number;
  limit: number;
  offset: number;
}

/** Shipment event as embedded in the account order detail (newest first). */
export interface ShipmentDetailEvent {
  status: string;
  description: string | null;
  occurredAt: string;
}

export interface ShipmentDetail {
  shipmentId: string;
  status: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  deliveredAt: string | null;
  events: ShipmentDetailEvent[];
}

export interface CancellationWindow {
  isInsideWindow: boolean;
  canCancel: boolean;
  remainingSeconds: number | null;
  endsAt: string | null;
}

export interface CustomerOrderDetailResponse {
  order: {
    orderId: string;
    orderNumber: string | null;
    status: OrderStatus;
    paymentStatus: OrderPaymentStatus;
    fulfillmentStatus: OrderFulfillmentStatus;
    currency: string;
    createdAt: string;
    customer: { customerId: string | null; email: string | null; fullName: string | null; isGuest: boolean };
    lines: {
      orderLineId: string;
      lineNumber: number;
      sku: string;
      productName: string | null;
      variantName: string | null;
      quantity: string;
      unitPrice: string;
      lineTotal: string;
      currencyCode: string;
      imageUrl?: string | null;
      /** Frozen at purchase. Null on orders placed before line snapshots. */
      promotionSnapshot?: OrderLinePromotionSnapshot | null;
    }[];
    addresses: {
      addressType: string;
      fullName: string | null;
      address1: string | null;
      city: string | null;
      countryCode: string | null;
      postalCode: string | null;
    }[];
    totals: { subtotal: string; discount: string; shipping: string; tax: string; total: string };
    /** Frozen header snapshot when the order was placed. Not used to recompute totals. */
    promotionSnapshot?: OrderLinePromotionSnapshot | null;
    selectedPaymentMethod: { providerCode: string | null; methodCode: string | null } | null;
    selectedDeliveryMethod: { partnerCode: string | null; methodCode: string | null } | null;
    timeline: { eventType: string; title: string | null; occurredAt: string }[];
    shipments: ShipmentDetail[];
  };
  cancellationWindow: CancellationWindow | null;
}

export interface CancelOrderResponse {
  orderId: string;
  cancellationAccepted: boolean;
  orderCancelled: boolean;
  requiresRefund: boolean;
}

/**
 * The guide documents this endpoint with detail-style events
 * (`status` / `occurredAt`), but the live API returns the carrier timeline
 * shape — `eventStatus` / `eventTime` / `title`, plus `carrier`,
 * `shipmentNumber` and a merged `timeline`. Typed to what it actually sends.
 */
export type CustomerOrderTrackingResponse = OrderTrackingTimeline & {
  orderId: string;
  fulfillmentStatus: string;
};

// ─── Service functions ────────────────────────────────────────────────────────

export interface ListOrdersParams {
  limit?: number;
  offset?: number;
  status?: string;
  paymentStatus?: string;
  fulfillmentStatus?: string;
  from?: string;
  to?: string;
}

/**
 * GET /storefront/customer/orders
 * JWT required. Returns paginated order history.
 */
function withMarket(params: URLSearchParams): URLSearchParams {
  const ctx = resolveStorefrontContext();
  if (ctx.zoneCode?.trim()) params.set("zoneCode", ctx.zoneCode.trim());
  if (ctx.salesChannelCode?.trim()) {
    params.set("salesChannelCode", ctx.salesChannelCode.trim());
  }
  return params;
}

export async function listOrders(params: ListOrdersParams = {}): Promise<PaginatedOrdersResponse> {
  const q = withMarket(new URLSearchParams({
    limit: String(params.limit ?? 20),
    offset: String(params.offset ?? 0),
  }));
  if (params.status) q.set("status", params.status);
  if (params.paymentStatus) q.set("paymentStatus", params.paymentStatus);
  if (params.fulfillmentStatus) q.set("fulfillmentStatus", params.fulfillmentStatus);
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  return apiGet<PaginatedOrdersResponse>(`/storefront/customer/orders?${q}`);
}

/**
 * GET /storefront/customer/orders/:orderId
 * JWT required. Full order detail with shipments + cancellation window.
 */
export async function getCustomerOrderDetail(orderId: string): Promise<CustomerOrderDetailResponse> {
  return apiGet<CustomerOrderDetailResponse>(
    `/storefront/customer/orders/${orderId}?${withMarket(new URLSearchParams()).toString()}`,
  );
}

/**
 * POST /storefront/customer/orders/:orderId/cancel
 * JWT required. Only call when cancellationWindow.canCancel === true.
 */
export async function cancelOrder(
  orderId: string,
  reason = "Customer request",
): Promise<CancelOrderResponse> {
  return apiPost<CancelOrderResponse>(
    `/storefront/customer/orders/${orderId}/cancel?${withMarket(new URLSearchParams()).toString()}`,
    { reason, idempotencyKey: `cancel-${orderId}` },
  );
}

/**
 * GET /storefront/customer/orders/:orderId/tracking
 * JWT required. Merged tracking timeline for all shipments.
 */
export async function getCustomerOrderTracking(orderId: string): Promise<CustomerOrderTrackingResponse> {
  return apiGet<CustomerOrderTrackingResponse>(
    `/storefront/customer/orders/${orderId}/tracking?${withMarket(new URLSearchParams()).toString()}`,
  );
}
