# Storefront — Order Detail, Order History & Tracking Integration Guide

**Date:** 2026-08-28
**Environment:** Local dev (`http://localhost:3001`)
**Base URL:** `http://192.168.18.33:3000`
**Zone:** `UAE` · **Sales Channel:** `platform_uae`

---

## Overview

This document covers everything the FE needs to build:

1. **Order confirmation page** — after checkout, show order detail
2. **Account area — Orders list** — paginated order history for logged-in customers
3. **Account area — Order detail** — full order view with shipment and cancellation window
4. **Guest order tracking** — public proof-protected tracking (no login needed)

This is a continuation of `STOREFRONT_ORDER_PLACEMENT_STATUS.md`. All APIs in that document are prerequisites to this one.

---

## Answers to Open Questions from Order Placement Status

| # | Question | Answer |
|---|----------|--------|
| 2 | Stripe webhook `payment_intent.succeeded` not updating order | **Fixed.** A webhook idempotency bug was patched on 2026-08-28. Restart dev server and test with a fresh order. |
| 3 | `postalCode: "00000"` for UAE | Send `"00000"` or `""` — both are accepted. Do not omit the field. The backend does not validate UAE postal codes. |
| 4 | How to verify payment method is confirmed on the session | Call `GET /storefront/checkout/:id` and check `selectedPaymentMethodId !== null`. If null after your POST, retry the select. |
| 5 | Does `GET /storefront/orders` support `?page=&limit=`? | Orders list is under `GET /storefront/customer/orders` (JWT required, see below). Uses `?limit=&offset=` (not page). |
| 6 | Is `guestTracking.orderAccessToken` returned on every GET? | **No — one time only.** It is returned only in the `POST /storefront/orders/from-checkout` response when the order is first created (`created: true`). Save it immediately. |

---

## Authentication Context (same rules as before)

| Scenario | How to identify |
|----------|----------------|
| Authenticated customer | `Authorization: Bearer <accessToken>` header — added by `apiClient` |
| Guest customer | `guestToken=<uuid>` query param — stored in `localStorage` as `sa_guest_token` |

- **Customer account endpoints** (`/storefront/customer/*`) require JWT. No guest fallback.
- **Order detail by orderId** (`/storefront/orders/:orderId`) supports both JWT and `guestToken`.
- **Order tracking by orderNumber** (`/storefront/order-tracking/:orderNumber`) supports `orderAccessToken`, `trackingToken`, or JWT.

---

## localStorage / sessionStorage Keys (full reference)

| Key | Storage | Value |
|-----|---------|-------|
| `sa_guest_token` | localStorage | anonymous UUID (cart session) |
| `sa_cart_id` | localStorage | active cart UUID |
| `sa_order_id` | localStorage | last placed orderId |
| `sa_order_number` | localStorage | last placed orderNumber |
| `sa_order_access_token` | localStorage | guest tracking token (save once!) |
| `sa_stripe_client_secret` | sessionStorage | Stripe PaymentIntent client_secret |
| `sa_stripe_publishable_key` | sessionStorage | Stripe publishable key |
| `sa_payment_transaction_id` | sessionStorage | paymentTransactionId from initiate |
| `sa_pay_attempt` | sessionStorage | incrementing payment attempt counter |
| `sa_checkout_session_id` | sessionStorage | active checkout session UUID |
| `sa_pending_order_id` | sessionStorage | orderId stored before Paymob redirect |

---

## API 1 — Get Order Detail (Guest or JWT)

```
GET /storefront/orders/:orderId
    ?zoneCode=UAE
    &salesChannelCode=platform_uae
    [&guestToken=<uuid>]          ← required for guests
```

**Auth:** JWT Bearer OR `guestToken` query param. One must be present.

**Use case:**
- Order confirmation page (`/order-confirmation/:orderId`) immediately after `POST /orders/from-checkout`
- Retry the same call on the confirmation page to check latest `paymentStatus`

**Notes:**
- Use `orderId` (UUID), NOT `orderNumber`
- Returns 404 if JWT customer doesn't own the order or wrong `guestToken`
- `guestTracking` field in the response: after first creation it will show `previouslyIssued: true` with `orderAccessToken: null` — the token cannot be retrieved again

### Response `data` shape

```typescript
interface StorefrontOrderResponse {
  orderId: string;
  orderNumber: string | null;            // e.g. "UAE-MTBHJQDG-HK3G1Y"
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
  checkoutSessionId: string | null;
  cartId: string | null;
  currency: string;                      // "AED"
  created: boolean;                      // true only on first placement call
  createdAt: string;                     // ISO 8601

  customer: {
    customerId: string | null;
    email: string | null;
    fullName: string | null;
    isGuest: boolean;
  };

  lines: {
    orderLineId: string;
    lineNumber: number;
    productId: string | null;
    variantId: string | null;
    sku: string;
    productName: string | null;
    variantName: string | null;
    quantity: string;                    // decimal string e.g. "1"
    unitPrice: string;                   // decimal string e.g. "560.0000"
    lineTotal: string;                   // decimal string
    currencyCode: string;
  }[];

  addresses: {
    addressType: "SHIPPING" | "BILLING";
    fullName: string | null;
    address1: string | null;
    city: string | null;
    countryCode: string | null;
    postalCode: string | null;
  }[];

  totals: {
    subtotal: string;
    discount: string;
    shipping: string;
    tax: string;
    total: string;
  };

  selectedPaymentMethod: {
    providerCode: string | null;         // "stripe" | "paymob"
    methodCode: string | null;           // "stripe_card" | "paymob_card"
  } | null;

  selectedDeliveryMethod: {
    partnerCode: string | null;
    methodCode: string | null;
  } | null;

  timeline: {
    eventType: string;
    title: string | null;
    occurredAt: string;                  // ISO 8601
  }[];                                   // last 5 events only

  metadata: Record<string, unknown> | null;

  // GUEST ONLY — present only when isGuestOrder === true
  guestTracking: {
    orderNumber: string | null;
    orderAccessToken: string | null;     // SAVE immediately — one time only
    trackingToken: string | null;        // same value as orderAccessToken
    previouslyIssued: boolean;           // true = token already issued, cannot retrieve
    message: string;
  } | null;
}

type OrderStatus =
  | "DRAFT"
  | "PAYMENT_PENDING"
  | "PAYMENT_AUTHORIZED"
  | "PAID"
  | "CANCELLATION_WINDOW"
  | "READY_FOR_FULFILLMENT"
  | "FULFILLMENT_QUEUED"
  | "SHIPMENT_CREATED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUND_PENDING"
  | "REFUNDED"
  | "MANUAL_REVIEW"
  | "FAILED";

type OrderPaymentStatus =
  | "PENDING" | "AUTHORIZED" | "PAID" | "FAILED"
  | "REFUNDED" | "PARTIALLY_REFUNDED" | "NOT_REQUIRED";

type OrderFulfillmentStatus =
  | "NOT_READY" | "READY" | "QUEUED"
  | "PARTIALLY_FULFILLED" | "FULFILLED" | "CANCELLED";
```

### Example — Order Confirmation Page (guest)

```typescript
// orders.service.ts
async function getOrder(orderId: string): Promise<StorefrontOrderResponse> {
  const guestToken = localStorage.getItem("sa_guest_token");
  const params = new URLSearchParams({
    zoneCode: "UAE",
    salesChannelCode: "platform_uae",
    ...(guestToken ? { guestToken } : {}),
  });
  const res = await apiClient.get(
    `/storefront/orders/${orderId}?${params}`,
  );
  return res.data.data;
}
```

### Order Status → UI Label Map

| `status` | Label | Show button |
|----------|-------|-------------|
| `PAYMENT_PENDING` | Awaiting Payment | Pay Now |
| `CANCELLATION_WINDOW` | Processing | Cancel Order (with timer) |
| `READY_FOR_FULFILLMENT` | Confirmed | — |
| `FULFILLMENT_QUEUED` | Preparing | — |
| `SHIPMENT_CREATED` | Shipped | Track Order |
| `IN_TRANSIT` | On the Way | Track Order |
| `DELIVERED` | Delivered | — |
| `CANCELLED` | Cancelled | — |
| `FAILED` | Failed | Contact Support |
| `MANUAL_REVIEW` | Under Review | Contact Support |

### Guest Tracking Token — Save Pattern

```typescript
// Inside order placement success handler
const order = response.data as StorefrontOrderResponse;

// Save orderId and orderNumber always
localStorage.setItem("sa_order_id", order.orderId);
if (order.orderNumber) {
  localStorage.setItem("sa_order_number", order.orderNumber);
}

// Save guest tracking token ONCE — never returned again
if (
  order.guestTracking?.orderAccessToken &&
  !order.guestTracking.previouslyIssued
) {
  localStorage.setItem(
    "sa_order_access_token",
    order.guestTracking.orderAccessToken,
  );
}
```

---

## API 2 — Account Orders List (JWT only)

```
GET /storefront/customer/orders
    ?limit=20
    &offset=0
    [&status=PAID]
    [&paymentStatus=PAID]
    [&fulfillmentStatus=FULFILLED]
    [&from=2026-01-01T00:00:00Z]
    [&to=2026-12-31T23:59:59Z]
```

**Auth:** JWT Bearer — required. No guest fallback.

**Use case:** Account area orders history page.

### Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | string | `"20"` | Max 100 |
| `offset` | string | `"0"` | For pagination (not page-based) |
| `status` | string | — | Filter by `OrderStatus` |
| `paymentStatus` | string | — | Filter by `OrderPaymentStatus` |
| `fulfillmentStatus` | string | — | Filter by `OrderFulfillmentStatus` |
| `from` | string | — | ISO date — filter by `createdAt >= from` |
| `to` | string | — | ISO date — filter by `createdAt <= to` |

### Response `data` shape

```typescript
interface PaginatedOrdersResponse {
  items: OrderSummary[];
  total: number;           // total matching count (use for pagination UI)
  limit: number;
  offset: number;
}

interface OrderSummary {
  orderId: string;
  orderNumber: string | null;
  createdAt: string;              // ISO 8601
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
  total: string;                  // decimal string e.g. "560.0000"
  currency: string;               // "AED"
  itemCount: number;
  shipment: {
    status: string;
    trackingNumber: string | null;
    trackingUrl: string | null;
  } | null;
}
```

### Example

```typescript
// orders.service.ts
async function listOrders(params: {
  limit?: number;
  offset?: number;
  status?: string;
}): Promise<PaginatedOrdersResponse> {
  const query = new URLSearchParams({
    limit: String(params.limit ?? 20),
    offset: String(params.offset ?? 0),
    ...(params.status ? { status: params.status } : {}),
  });
  const res = await apiClient.get(`/storefront/customer/orders?${query}`);
  return res.data.data;
}
```

### Pagination Pattern

```typescript
// Offset-based — not page-based
const PAGE_SIZE = 20;

function getOffset(page: number): number {
  return (page - 1) * PAGE_SIZE;
}

function getTotalPages(total: number): number {
  return Math.ceil(total / PAGE_SIZE);
}

// Fetch page 2
const result = await listOrders({
  limit: PAGE_SIZE,
  offset: getOffset(2),
});
```

---

## API 3 — Account Order Detail (JWT only)

```
GET /storefront/customer/orders/:orderId
```

**Auth:** JWT Bearer — required. Returns 404 if order does not belong to this customer.

**Use case:** Account area — order detail page. Richer than the guest detail because it also includes shipments and cancellation window.

### Response `data` shape

```typescript
interface CustomerOrderDetailResponse {
  order: StorefrontOrderResponse & {    // everything from API 1, plus:
    shipments: {
      shipmentId: string;
      status: string;
      trackingNumber: string | null;
      trackingUrl: string | null;
      deliveredAt: string | null;
      events: {
        status: string;
        description: string | null;
        occurredAt: string;
      }[];
    }[];
  };
  cancellationWindow: {
    isInsideWindow: boolean;
    canCancel: boolean;
    remainingSeconds: number | null;    // seconds remaining — use for countdown UI
    endsAt: string | null;             // ISO 8601
  } | null;
}
```

**Note:** `timeline` in this response is filtered to customer-safe events only:
`ORDER_CREATED`, `STATUS_CHANGED`, `PAYMENT_STATUS_CHANGED`, `FULFILLMENT_STATUS_CHANGED`,
`CANCELLATION_WINDOW_STARTED`, `CANCELLATION_WINDOW_ENDED`, `CANCELLED`,
`REFUND_REQUESTED`, `REFUND_UPDATED`, `SHIPMENT_UPDATED`

### Example

```typescript
async function getMyOrderDetail(orderId: string): Promise<CustomerOrderDetailResponse> {
  const res = await apiClient.get(`/storefront/customer/orders/${orderId}`);
  return res.data.data;
}
```

### Cancellation Window UI

```typescript
const { cancellationWindow } = await getMyOrderDetail(orderId);

if (cancellationWindow?.isInsideWindow && cancellationWindow.canCancel) {
  const remaining = cancellationWindow.remainingSeconds; // e.g. 843
  const endsAt = cancellationWindow.endsAt;

  // Show countdown timer
  // Show "Cancel Order" button
}

// If cancellationWindow is null → order is not in cancellation window
// If canCancel === false → window is active but cancel not allowed (already paid + shipped)
```

---

## API 4 — Cancel Order (JWT only)

```
POST /storefront/customer/orders/:orderId/cancel
```

**Auth:** JWT Bearer — required.

**When to show:** Only when `cancellationWindow.canCancel === true`.

**Body:**
```json
{
  "reason": "Changed my mind",
  "idempotencyKey": "cancel-<orderId>"
}
```

**Response `data`:**
```typescript
interface CancelOrderResponse {
  orderId: string;
  cancellationAccepted: boolean;  // true = cancellation request registered
  orderCancelled: boolean;        // true = order status is now CANCELLED
  requiresRefund: boolean;        // true = payment was collected, refund will be processed
}
```

**Error codes:**

| HTTP | Code | Meaning |
|------|------|---------|
| 404 | `NOT_FOUND` | Order not found or not owned by this customer |
| 422 | `BUSINESS_RULE_FAILED` | Cancellation not allowed (window closed) |

---

## API 5 — Account Order Shipments (JWT only)

```
GET /storefront/customer/orders/:orderId/shipments
```

**Auth:** JWT Bearer — required.

**Use case:** Detailed shipment list for a specific order inside account area.

**Response:** Array of shipment summaries with tracking events (same shape as `shipments[]` in API 3).

---

## API 6 — Account Order Tracking (JWT only)

```
GET /storefront/customer/orders/:orderId/tracking
```

**Auth:** JWT Bearer — required.

**Use case:** Merged tracking timeline for all shipments of an order. No carrier API calls — DB only.

**Response `data`:**
```typescript
interface CustomerOrderTrackingResponse {
  orderId: string;
  orderNumber: string | null;
  fulfillmentStatus: string;
  shipments: {
    shipmentId: string;
    status: string;
    trackingNumber: string | null;
    trackingUrl: string | null;
    deliveredAt: string | null;
    events: {
      status: string;
      description: string | null;
      occurredAt: string;
    }[];
  }[];
}
```

---

## API 7 — Guest Order Tracking Summary (public, proof-protected)

```
GET /storefront/order-tracking/:orderNumber
    ?orderAccessToken=<token>     ← preferred
    &trackingToken=<token>        ← alias, same value
    &guestToken=<uuid>            ← legacy fallback only
```

**Auth:** One of the above tokens OR JWT Bearer (for logged-in customer's own order).

**Use case:** "Track my order" page — no login required. Accessible via link in email.

**Note:** Uses `orderNumber` (e.g. `UAE-MTBHJQDG-HK3G1Y`), NOT `orderId`.

### Response `data` shape

```typescript
interface GuestOrderTrackingSummaryResponse {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
  createdAt: string;
  currency: string;
  total: string;
  itemCount: number;
  isGuestOrder: boolean;

  shipments: GuestShipmentSummary[];
  latestTrackingStatus: string | null;        // latest carrier event status
  latestTrackingEventTime: string | null;     // ISO 8601
  estimatedDeliveryAt: string | null;         // ISO 8601 — computed from delivery method days
  deliveredAt: string | null;                 // ISO 8601

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
}

interface GuestShipmentSummary {
  shipmentId: string;
  shipmentNumber: string;
  status: string;
  deliveryMethod: {
    methodCode: string;
    displayName: string | null;
    methodType: string | null;
    estimatedMinDays: number | null;
    estimatedMaxDays: number | null;
  };
  shippingPartner: {
    partnerCode: string;
    displayName: string | null;
  };
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
  }[];
  latestTrackingEvent: {
    eventStatus: string;
    eventTime: string;
    title: string | null;
    description: string | null;
    location: string | null;
    countryCode: string | null;
    partnerCode: string;
    trackingNumber: string | null;
  } | null;
}
```

### Example — Track My Order Page

```typescript
async function trackOrder(
  orderNumber: string,
  orderAccessToken: string,
): Promise<GuestOrderTrackingSummaryResponse> {
  const params = new URLSearchParams({ orderAccessToken });
  const res = await fetch(
    `/storefront/order-tracking/${orderNumber}?${params}`,
  );
  const body = await res.json();
  if (!res.ok) throw new Error(body.error?.message);
  return body.data;
}

// Usage
const orderNumber = localStorage.getItem("sa_order_number")!;
const token = localStorage.getItem("sa_order_access_token")!;
const tracking = await trackOrder(orderNumber, token);
```

---

## API 8 — Guest Order Shipments

```
GET /storefront/order-tracking/:orderNumber/shipments
    ?orderAccessToken=<token>
```

**Response `data`:**
```typescript
interface GuestOrderShipmentsResponse {
  orderNumber: string;
  fulfillmentStatus: string;
  shipments: GuestShipmentSummary[];    // same as API 7 shipments array
}
```

---

## API 9 — Guest Order Tracking Timeline

```
GET /storefront/order-tracking/:orderNumber/tracking
    ?orderAccessToken=<token>
```

**Use case:** Detailed tracking event timeline page — "Where is my parcel right now?"

**Response `data`:**
```typescript
interface GuestOrderTrackingTimelineResponse {
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
    deliveryMethod: {
      methodCode: string;
      displayName: string | null;
      methodType: string | null;
      estimatedMinDays: number | null;
      estimatedMaxDays: number | null;
    };
    latestEvent: TrackingEvent | null;
    events: TrackingEvent[];           // all events for this shipment
  }[];
  timeline: (TrackingEvent & { shipmentId: string })[];  // merged, sorted ascending
}

interface TrackingEvent {
  eventStatus: string;
  eventTime: string;                   // ISO 8601
  title: string | null;
  description: string | null;
  location: string | null;
  countryCode: string | null;
  partnerCode: string;
  trackingNumber: string | null;
}
```

---

## Full Flow — Order Confirmation Page (Guest)

```
User lands on /order-confirmation/:orderId
  ↓
1. Read orderId from localStorage (sa_order_id)
   Save guestTracking.orderAccessToken if present (sa_order_access_token)
  ↓
2. GET /storefront/orders/:orderId?guestToken=<token>
   → Display: orderNumber, status badge, lines, totals, address, delivery method
  ↓
3. If paymentStatus === "PENDING":
   → Show "Pay Now" button → re-trigger payment/initiate flow
4. If paymentStatus === "PAID":
   → Show green confirmation UI
5. If status === "SHIPMENT_CREATED" / "IN_TRANSIT":
   → Show "Track Order" link → /track/:orderNumber
```

---

## Full Flow — Account Area Order History

```
User navigates to /account/orders
  ↓
1. GET /storefront/customer/orders?limit=20&offset=0
   → Display paginated list of OrderSummary rows
   → Each row: orderNumber, createdAt, status badge, total, itemCount, shipment status
  ↓
User clicks an order row → /account/orders/:orderId
  ↓
2. GET /storefront/customer/orders/:orderId
   → Display full CustomerOrderDetailResponse
   → Lines with productName, quantity, unitPrice, lineTotal
   → Shipping address
   → Payment method, delivery method
   → Shipment cards with tracking events
   → Filtered timeline
  ↓
3. If cancellationWindow.canCancel === true:
   → Show countdown timer + "Cancel Order" button
   → POST /storefront/customer/orders/:orderId/cancel
  ↓
4. If shipment has trackingNumber:
   → Show "Track Shipment" button
   → GET /storefront/customer/orders/:orderId/tracking
```

---

## Full Flow — Guest Order Tracking Page

```
User receives email with tracking link:
  https://shop.example.com/track/UAE-MTBHJQDG-HK3G1Y?token=<orderAccessToken>
  ↓
FE reads orderNumber from URL param
FE reads token from query string (save to localStorage if not already there)
  ↓
1. GET /storefront/order-tracking/UAE-MTBHJQDG-HK3G1Y?orderAccessToken=<token>
   → Display: status, total, itemCount, latestTrackingStatus, estimatedDeliveryAt
   → Shipment cards with latestTrackingEvent
  ↓
2. If shipments.length > 0:
   → GET /storefront/order-tracking/:orderNumber/tracking
   → Display full timeline sorted ascending (oldest first at top)
  ↓
3. If cancellationWindow.canCancel === true:
   → Show "Cancel Order" button — links to login, cancellation requires JWT
```

---

## Error Codes Reference

| HTTP | Code | Meaning | FE action |
|------|------|---------|-----------|
| 401 | `UNAUTHORIZED` | JWT missing or expired | Redirect to login |
| 404 | `NOT_FOUND` | Wrong orderId/orderNumber, wrong token, or order owned by another customer | Show "Order not found" |
| 422 | `BUSINESS_RULE_FAILED` | Cancellation not allowed — window closed or already shipped | Disable cancel button |
| 400 | `VALIDATION_ERROR` | Bad request body | Fix request fields |

---

## Stop Rules

- **Never call `/storefront/customer/orders`** without a valid JWT — returns 401.
- **Never expose `guestTracking.orderAccessToken`** in a URL. Store in localStorage only.
- **Do not show a Cancel button** unless `cancellationWindow.canCancel === true`. Window checks are real-time — always fetch fresh detail before showing the button.
- **Do not poll order detail** as a substitute for `payment-status`. Use `GET /orders/:orderId/payment-status` for payment polling.
- **Do not use `trackingUrl`** from shipments for internal navigation. It is a third-party carrier URL — open in a new tab.
- **`guestTracking.orderAccessToken` is null on every call except the first `from-checkout` response.** Do not call GET order detail expecting to retrieve a lost token.

---

## Files to Create (suggested FE structure)

| File | Purpose |
|------|---------|
| `src/features/account/api/customerOrders.service.ts` | `listOrders`, `getOrderDetail`, `cancelOrder`, `getOrderTracking` |
| `src/features/account/pages/OrdersListPage.tsx` | Paginated order history |
| `src/features/account/pages/OrderDetailPage.tsx` | Full order detail with cancellation |
| `src/features/tracking/pages/TrackOrderPage.tsx` | Public guest tracking page |
| `src/features/tracking/api/orderTracking.service.ts` | `trackOrder`, `getShipments`, `getTracking` |
| `src/features/checkout/pages/OrderConfirmationPage.tsx` | Already partially built — extend to handle shipments |
