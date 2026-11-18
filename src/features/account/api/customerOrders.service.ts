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

/** Why online cancel is unavailable (the order's after-sales policy or the clock). */
export type CancellationBlockedCode =
  | "ALREADY_CANCELLED"
  | "NOT_ELIGIBLE"
  | "SHIPMENT_EXISTS"
  | "CUSTOMER_CANCEL_DISABLED"
  | "FULFILLMENT_STARTED"
  | "WINDOW_NOT_STARTED"
  | "WINDOW_CLOSED";

export interface CancellationWindow {
  isInsideWindow: boolean;
  /** The customer may cancel online now. */
  canCancel: boolean;
  /** …and may cancel some items only. Older backends omit it. */
  canCancelItems?: boolean;
  remainingSeconds: number | null;
  endsAt: string | null;
  /** Older backends omit these. */
  blockedCode?: CancellationBlockedCode | null;
  reason?: string | null;
}

/** Customer state of one refund (backend maps its internal statuses). */
export type CustomerRefundState =
  | "processing"
  | "waiting_for_review"
  | "completed"
  | "not_approved"
  | "cancelled";

/** `card` is the original online payment; label it by `cardLast4` when present. */
/** `original_order`: exchange credit, refunded to how the original order was paid. */
export type CustomerRefundPartType =
  | "card"
  | "gift_card"
  | "points"
  | "cash_on_delivery"
  | "original_order";
export type CustomerRefundPartState = "pending" | "done";

/** One tender leg of a refund: where that share of the money goes back. */
export interface CustomerRefundPartApi {
  type: CustomerRefundPartType;
  /** Backend label in the order's language. The page builds its own from the fields. */
  label: string;
  amount: string;
  currency: string;
  points: string | null;
  cardLast4: string | null;
  giftCardMaskedCode: string | null;
  state: CustomerRefundPartState;
}

export interface CustomerRefundApi {
  refundId: string;
  refundNumber: string;
  state: CustomerRefundState;
  requestedAmount: string;
  refundedAmount: string;
  currency: string;
  requestedAt: string;
  completedAt: string | null;
  parts: CustomerRefundPartApi[];
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
      /** A free gift (gift with purchase). Older backends omit it. */
      isGift?: boolean;
      giftOfferLabel?: string | null;
      /** Units the customer cancelled before shipping. Older backends omit it. */
      cancelled?: boolean;
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
    /** Legacy location of refund records; current backends send top-level `refunds`. */
    refunds?: unknown;
    selectedPaymentMethod: { providerCode: string | null; methodCode: string | null; displayName?: string | null } | null;
    selectedDeliveryMethod: { partnerCode: string | null; methodCode: string | null } | null;
    timeline: { eventType: string; title: string | null; occurredAt: string }[];
    shipments: ShipmentDetail[];
  };
  cancellationWindow: CancellationWindow | null;
  /** The order's refunds, newest first. Older backends omit this. */
  refunds?: CustomerRefundApi[];
}

export interface CancelOrderResponse {
  orderId: string;
  cancellationAccepted: boolean;
  orderCancelled: boolean;
  requiresRefund: boolean;
  requiresManualReview?: boolean;
  /** Some items were cancelled; the order goes on with the rest. */
  partial?: boolean;
  /** Partial cancel: the drop in the order total (refunded unless cash on delivery). */
  refundAmount?: string;
  offerAdjustmentAmount?: string;
  deliveryChargeAmount?: string;
  /** Present when the Backend registered a refund. Absent for unpaid cancellations. */
  refund?: {
    refundId?: string | null;
    status?: string | null;
    resultState?: string | null;
    blockedCode?: string | null;
    amount?: string | null;
    currency?: string | null;
    requiresManualReview?: boolean;
  } | null;
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

export interface CancelItemInput {
  orderLineId: string;
  quantity: number;
}

/** What cancelling some items would do. Nothing is changed. */
export interface CancelItemsPreview {
  /** Every item chosen: the whole order would be cancelled. */
  wholeOrder: boolean;
  /** Cash on delivery: nothing to refund, the courier collects less. */
  cashOnDelivery: boolean;
  cancelledAmount: string;
  offerAdjustmentAmount: string;
  deliveryChargeAmount: string;
  refundAmount: string;
  totalBefore: string;
  totalAfter: string;
  giftsRemoved: { orderLineId: string; sku: string | null; productName: string | null }[];
}

/**
 * POST /storefront/customer/orders/:orderId/cancel/preview
 * JWT required. Only when cancellationWindow.canCancelItems === true.
 */
export async function previewCancelItems(orderId: string, items: CancelItemInput[]): Promise<CancelItemsPreview> {
  return apiPost<CancelItemsPreview>(
    `/storefront/customer/orders/${orderId}/cancel/preview?${withMarket(new URLSearchParams()).toString()}`,
    { items },
  );
}

/**
 * POST /storefront/customer/orders/:orderId/cancel with items.
 * One idempotency key per confirmation, so a repeated tap returns the first result.
 */
export async function cancelOrderItems(
  orderId: string,
  items: CancelItemInput[],
  idempotencyKey: string,
): Promise<CancelOrderResponse> {
  return apiPost<CancelOrderResponse>(
    `/storefront/customer/orders/${orderId}/cancel?${withMarket(new URLSearchParams()).toString()}`,
    { reason: "Customer cancelled some items", items, idempotencyKey },
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
