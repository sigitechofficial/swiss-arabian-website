# Swiss Arabian — Storefront Checkout, Orders & Payment Frontend Integration Guide

> **Audience:** Customer storefront frontend developer + their Cursor/AI coding agent.  
> **Purpose:** Everything needed to wire **checkout, order placement, and payment initiation** against the NestJS backend — flow, endpoint contracts, TypeScript interfaces, error handling, guest token lifecycle, and a drop-in API module.  
> **Source of truth:** Running backend + Swagger at `/api/docs`. This guide is derived from backend code. Where a field is not listed here, **treat Swagger as authoritative — never invent fields.**  
> **Scope:** `/storefront/checkout/*` + `/storefront/orders/*` (create, get, initiate payment, payment status).  
> **Prerequisite:** Phase 1 auth/session client wired — [`STOREFRONT_FRONTEND_INTEGRATION_GUIDE_PHASE_1.md`](./STOREFRONT_FRONTEND_INTEGRATION_GUIDE_PHASE_1.md). Cart fully wired — [`STOREFRONT_CART_FE_HANDOFF.md`](./STOREFRONT_CART_FE_HANDOFF.md).  
> **Out of scope:** Order list/history (`/storefront/customer/orders`), guest order tracking (`/storefront/order-tracking`), returns, support — covered in later guides.  
> **Companion inventory:** [`STOREFRONT_FRONTEND_SMOKE_TEST_PLAN.md`](./STOREFRONT_FRONTEND_SMOKE_TEST_PLAN.md) §2.6–2.7.  
> **UI note:** Checkout UI is fully built — this phase is **API wiring + submit unblock**, not a redesign.

---

## 0. How to use this document (read first)

Keep this file in the frontend repo (e.g. `docs/backend/STOREFRONT_CHECKOUT.md`) and attach it to the Cursor agent when wiring checkout and payment screens.

### 0.1 Golden rules

1. **Envelope — same as always.** Business payload = `data`. Branch on `error.code` / HTTP status. Log `meta.requestId` on every failure.
2. **No global `/api/v1` prefix.** Routes are absolute: `POST /storefront/checkout/from-cart`.
3. **Auth is optional JWT.** All checkout and order routes accept optional Bearer. If sent, JWT `customerId` is authoritative and overrides any `customerId` in body/query. Never send `customerId` as ownership proof when Bearer is present — JWT wins.
4. **Guest token = same `sa_guest_token` from cart.** Pass it as query param `guestToken` on all checkout/order requests where no Bearer is sent.
5. **`checkoutSessionId` is the session key.** Store it in memory (or `sessionStorage`) after `POST /storefront/checkout/from-cart`. Pass it as a URL param on every subsequent checkout call.
6. **`orderId` is issued on `POST /storefront/orders/from-checkout`.** Store it immediately for payment initiation and order detail.
7. **Guest tracking token is ONE-TIME.** `guestTracking.orderAccessToken` in the place-order response is issued **once only**. Save it to `localStorage` immediately. Idempotent replays of the same request do NOT re-issue the raw token.
8. **Payment redirect URL.** If `paymentAction === 'REDIRECT'` after payment initiation, redirect the customer to `redirectUrl`. Do not invent your own redirect logic.
9. **All prices are strings (Decimal).** Parse with a Decimal library — not `parseFloat`.
10. **Never invent fields.** Swagger wins.

### 0.2 Wave plan (build in this order)

| Wave | Theme | Ship when |
|------|--------|-----------|
| **C.0** | Foundation — checkout API module on Phase 1 client; types; `checkoutSessionId` state | Module compiles; one create call works |
| **C.1** | `POST from-cart` → `GET session` → show checkout summary | Cart contents visible in checkout UI |
| **C.2** | List + select delivery method | Delivery option renders; fee shows |
| **C.3** | List + select payment method | Payment method selection works |
| **C.4** | Set address (guest snapshot OR saved address) | Address form saves to session |
| **C.5** | `POST validate` → gate checkout submit | Validation errors block submit button |
| **C.6** | `POST orders/from-checkout` → place order | Order created; `orderId` + `orderNumber` stored |
| **C.7** | `POST orders/:id/payment/initiate` → handle redirect or COD confirm | Payment flow live |
| **C.8** | `GET orders/:id/payment-status` → poll/confirm | Payment status page works |
| **C.9** | Order detail `GET orders/:id` → confirmation page | Order confirmation screen complete |

**Stop rule:** Do not pull order history (`/storefront/customer/orders`), guest tracking (`/storefront/order-tracking`), returns, or support into this phase.

---

## 1. Environment, auth, and Swagger

| Item | Value |
|------|-------|
| Base URL | Same as cart phase (`VITE_API_BASE_URL` or equivalent) |
| Auth | Optional JWT Bearer on all checkout/order routes |
| Swagger scheme | `customer-bearer` |
| Swagger tags | **Storefront — Checkout** · **Storefront — Orders** |
| Feature flags | None specific to checkout — needs `CUSTOMER_AUTH_ENABLED=true` only for JWT-authenticated flow |

---

## 2. Complete purchase flow (ASCII)

```
Cart validated (sa_cart_id stored)
        │
        ▼
POST /storefront/checkout/from-cart
        │  body: { cartId }
        │  → checkoutSessionId stored in memory/sessionStorage
        │
        ├──► GET /:id/delivery-methods   → list options
        ├──► POST /:id/delivery-method   → select one (deliveryMethodId)
        ├──► GET /:id/payment-methods    → list options
        ├──► POST /:id/payment-method    → select one (paymentMethodId)
        └──► POST /:id/address           → set shipping address
                │  (customerAddressId for logged-in OR addressSnapshot for guest)
                ▼
        POST /:id/validate
                │  → validation.isValid must be true
                ▼
        POST /storefront/orders/from-checkout
                │  body: { checkoutSessionId, idempotencyKey }
                │  → orderId + orderNumber stored
                │  → guestTracking.orderAccessToken saved to localStorage (GUEST ONLY, ONE-TIME)
                ▼
        POST /storefront/orders/:orderId/payment/initiate
                │  → paymentAction = 'REDIRECT' → redirect to redirectUrl
                │  → paymentAction = null (COD/etc.) → show confirmation
                ▼
        (On return from payment gateway or COD)
        GET /storefront/orders/:orderId/payment-status
                │  → poll until orderPaymentStatus = PAID / FAILED / etc.
                ▼
        GET /storefront/orders/:orderId
                │  → order confirmation payload
                ▼
        Order confirmation page
```

---

## 3. TypeScript interfaces

```ts
// ─── Checkout context ─────────────────────────────────────────────────────────
interface CheckoutContextSummary {
  zoneId: string | null;
  zoneCode: string;
  legalEntityCode: string;
  salesChannelId: string | null;
  salesChannelCode: string | null;
  countryCode: string | null;
  currencyCode: string;
  languageCode: string | null;
}

// ─── Checkout item (from price snapshots) ─────────────────────────────────────
interface CheckoutItemSummary {
  cartItemId: string | null;
  sku: string | null;
  productId: string | null;
  variantId: string | null;
  quantity: string | null;            // Decimal string
  unitPriceEstimate: string | null;   // Decimal string
  lineSubtotalEstimate: string | null; // Decimal string
}

// ─── Price snapshot ───────────────────────────────────────────────────────────
interface CheckoutPriceSnapshot {
  id: string;
  sku: string | null;
  quantity: string | null;
  unitPrice: string | null;
  lineTotal: string | null;
  currencyCode: string | null;
  calculatedAt: string | null; // ISO 8601
}

// ─── Inventory snapshot ───────────────────────────────────────────────────────
interface CheckoutInventorySnapshot {
  id: string;
  sku: string | null;
  requestedQty: string | null;
  availableQty: string | null;
  isAvailable: boolean;
  checkedAt: string | null; // ISO 8601
}

// ─── Selected method summaries ────────────────────────────────────────────────
interface SelectedPaymentMethod {
  paymentMethodId: string | null;
  zonePaymentMethodId: string | null;
  providerCode: string | null;
  methodCode: string | null;
}

interface SelectedDeliveryMethod {
  deliveryMethodId: string | null;
  zoneDeliveryMethodId: string | null;
  partnerCode: string | null;
  methodCode: string | null;
  estimatedFee: string | null; // Decimal string
}

// ─── Validation issue ─────────────────────────────────────────────────────────
interface CheckoutValidationIssue {
  id?: string;
  issueType: string;
  severity: string | null;  // 'ERROR' | 'WARNING' | 'INFO'
  code: string | null;
  message: string;
  sku: string | null;
  fieldPath: string | null;
}

// ─── Full checkout session response ───────────────────────────────────────────
interface CheckoutSessionResponse {
  checkoutSessionId: string;
  status: string;           // 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED'
  context: CheckoutContextSummary;
  cartId: string;
  items: CheckoutItemSummary[];
  priceSnapshots: CheckoutPriceSnapshot[];
  inventorySnapshots: CheckoutInventorySnapshot[];
  selectedPaymentMethod: SelectedPaymentMethod | null;
  selectedDeliveryMethod: SelectedDeliveryMethod | null;
  validationIssues: CheckoutValidationIssue[];
  totalsEstimate: {
    subtotal: string;
    discount: string;
    shipping: string;
    tax: string;
    total: string;
  };
  currency: string;
  expiresAt: string | null;     // ISO 8601
  validation: {
    isValid: boolean;
    status: string;             // validation status enum
  };
  metadata?: Record<string, unknown> | null;
}

// ─── Available method options ─────────────────────────────────────────────────
interface PaymentMethodOption {
  zonePaymentMethodId: string;
  paymentMethodId: string;
  providerCode: string;
  methodCode: string;
  displayName: string;
  isDefault: boolean;
  metadata?: Record<string, unknown> | null;
}

interface DeliveryMethodOption {
  zoneDeliveryMethodId: string;
  deliveryMethodId: string;
  partnerCode: string;
  methodCode: string;
  displayName: string;
  isDefault: boolean;
  estimatedFee: string | null; // Decimal string; null = free / TBD
  metadata?: Record<string, unknown> | null;
}

// ─── Order response ───────────────────────────────────────────────────────────
interface OrderLineSummary {
  orderLineId: string;
  lineNumber: number;
  productId: string | null;
  variantId: string | null;
  sku: string;
  productName: string | null;
  variantName: string | null;
  quantity: string;    // Decimal string
  unitPrice: string;   // Decimal string
  lineTotal: string;   // Decimal string
  currencyCode: string;
}

interface OrderAddressSummary {
  addressType: string; // 'SHIPPING' | 'BILLING'
  fullName: string | null;
  address1: string | null;
  city: string | null;
  countryCode: string | null;
  postalCode: string | null;
}

interface OrderCustomerSummary {
  customerId: string | null;
  email: string | null;
  fullName: string | null;
  isGuest: boolean;
}

interface OrderTotals {
  subtotal: string;
  discount: string;
  shipping: string;
  tax: string;
  total: string;
}

interface OrderTimelineEvent {
  eventType: string;
  title: string | null;
  occurredAt: string; // ISO 8601
}

interface GuestTrackingResponse {
  orderNumber: string | null;
  orderAccessToken: string | null;   // ONE-TIME — save to localStorage immediately
  trackingToken: string | null;      // ONE-TIME — also save
  previouslyIssued: boolean;         // true = replay; raw token not re-issued
  message: string;
}

interface OrderResponse {
  orderId: string;
  orderNumber: string | null;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  checkoutSessionId: string | null;
  cartId: string | null;
  customer: OrderCustomerSummary;
  lines: OrderLineSummary[];
  addresses: OrderAddressSummary[];
  totals: OrderTotals;
  currency: string;
  selectedPaymentMethod: { providerCode: string | null; methodCode: string | null; } | null;
  selectedDeliveryMethod: { partnerCode: string | null; methodCode: string | null; } | null;
  timeline: OrderTimelineEvent[];
  created: boolean;               // false on idempotent replay (order already existed)
  createdAt: string;              // ISO 8601
  metadata?: Record<string, unknown> | null;
  guestTracking?: GuestTrackingResponse | null; // present ONLY on guest order creation
}

// ─── Payment initiation response ──────────────────────────────────────────────
interface PaymentInitiationResponse {
  orderId: string;
  paymentTransactionId: string;
  paymentAttemptId: string | null;
  paymentStatus: string;
  paymentMethod: { providerCode: string; methodCode: string; };
  providerCode: string;
  amount: string;    // Decimal string
  currency: string;
  paymentExecutionStatus: string; // 'SUCCESS' | 'PENDING_PROVIDER_EXECUTION'
  paymentAction: string | null;   // 'REDIRECT' | null
  redirectUrl: string | null;     // if REDIRECT — send customer here
  clientSecret: string | null;    // for client-side SDK flows (e.g. Stripe)
  requiresProviderExecution: boolean;
  providerExecutionAvailable: boolean;
  outboxEventId: string | null;
  warnings: string[];
  metadata?: Record<string, unknown> | null;
}

// ─── Payment status response ──────────────────────────────────────────────────
interface OrderPaymentStatusResponse {
  orderId: string;
  orderPaymentStatus: string;
  payments: Array<{
    paymentTransactionId: string;
    status: string;
    providerCode: string;
    methodCode: string;
    amount: string;
    currency: string;
    paymentExecutionStatus: string;
    paymentAction: string | null;
    redirectUrl: string | null;
    requiresProviderExecution: boolean;
    providerExecutionAvailable: boolean;
  }>;
}
```

---

## 4. Endpoint reference — Checkout

Base path: `/storefront/checkout` · Auth: **Optional JWT** · Tag: `Storefront — Checkout`

---

### 4.1 Create checkout from cart

```
POST /storefront/checkout/from-cart
```

Creates a new checkout session from a validated cart. If the same cart already has an active checkout session, it is resumed (idempotent per cart).

**Query params:** `zoneCode`, `salesChannelCode`, `guestToken` (guest only)

**Request body:**

```json
{
  "cartId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "customerAddressId": "uuid-optional",
  "guestContact": {
    "email": "customer@example.com",
    "phone": "+971501234567",
    "fullName": "Aisha Hassan"
  }
}
```

| Field | Required | Notes |
|-------|----------|--------|
| `cartId` | **Yes** | UUID of the active cart |
| `customerAddressId` | No | Pre-fill address for logged-in users from their address book |
| `guestContact` | No | Guest contact info — can also be set later via address endpoint |

**Success `data`:** `CheckoutSessionResponse`

**Errors:**

| HTTP | Code | When |
|------|------|------|
| `400` | `CHECKOUT_CART_EMPTY` | Cart has no active items |
| `403` | `FORBIDDEN` | Cart does not belong to this identity |
| `404` | `RESOURCE_NOT_FOUND` | Cart not found |

---

### 4.2 Get checkout session

```
GET /storefront/checkout/:checkoutSessionId
```

Returns the current state of the checkout session.

**Query params:** `guestToken` (guest only)

**Success `data`:** `CheckoutSessionResponse`

**Errors:**

| HTTP | Code | When |
|------|------|------|
| `404` | `CHECKOUT_NOT_FOUND` | Session not found |
| `403` | `FORBIDDEN` | Session belongs to another identity |

---

### 4.3 List delivery methods

```
GET /storefront/checkout/:checkoutSessionId/delivery-methods
```

Returns delivery options available for this checkout context (zone, order amount, warehouse, country).

**Query params:** `guestToken` (guest only)

**Success `data`:** `DeliveryMethodOption[]`

```json
[
  {
    "zoneDeliveryMethodId": "uuid",
    "deliveryMethodId": "uuid",
    "partnerCode": "ARAMEX",
    "methodCode": "STANDARD",
    "displayName": "Standard Delivery",
    "isDefault": true,
    "estimatedFee": "15.00",
    "metadata": null
  },
  {
    "zoneDeliveryMethodId": "uuid",
    "deliveryMethodId": "uuid",
    "partnerCode": "STORE",
    "methodCode": "CLICK_AND_COLLECT",
    "displayName": "Click & Collect",
    "isDefault": false,
    "estimatedFee": "0.00",
    "metadata": null
  }
]
```

**Returns empty array `[]`** if zone is not resolved yet — handle gracefully (show loading/retry).

---

### 4.4 Select delivery method

```
POST /storefront/checkout/:checkoutSessionId/delivery-method
```

**Query params:** `guestToken` (guest only)

**Request body:**

```json
{
  "deliveryMethodId": "uuid-from-delivery-methods-list"
}
```

**Success `data`:** Updated `CheckoutSessionResponse`

**Errors:**

| HTTP | Code | When |
|------|------|------|
| `400` | `CHECKOUT_DELIVERY_METHOD_UNAVAILABLE` | Method not available for this checkout |
| `400` | `CHECKOUT_SESSION_NOT_ACTIVE` | Session expired or already completed |

---

### 4.5 List payment methods

```
GET /storefront/checkout/:checkoutSessionId/payment-methods
```

Returns payment options available for this checkout context (zone, currency, order amount, guest/auth).

**Query params:** `guestToken` (guest only)

**Success `data`:** `PaymentMethodOption[]`

```json
[
  {
    "zonePaymentMethodId": "uuid",
    "paymentMethodId": "uuid",
    "providerCode": "PAYMOB",
    "methodCode": "CARD",
    "displayName": "Credit / Debit Card",
    "isDefault": true,
    "metadata": null
  },
  {
    "zonePaymentMethodId": "uuid",
    "paymentMethodId": "uuid",
    "providerCode": "COD",
    "methodCode": "COD",
    "displayName": "Cash on Delivery",
    "isDefault": false,
    "metadata": null
  }
]
```

**Display guidance:**
- Use `displayName` for the UI label
- Use `methodCode` to determine which UI panel to show (card fields, wallet redirect, etc.)
- Use `isDefault` to pre-select the first option on load
- `estimatedFee` on delivery method → show as shipping line in totals

---

### 4.6 Select payment method

```
POST /storefront/checkout/:checkoutSessionId/payment-method
```

**Query params:** `guestToken` (guest only)

**Request body:**

```json
{
  "paymentMethodId": "uuid-from-payment-methods-list"
}
```

**Success `data`:** Updated `CheckoutSessionResponse`

**Errors:**

| HTTP | Code | When |
|------|------|------|
| `400` | `CHECKOUT_PAYMENT_METHOD_UNAVAILABLE` | Method not available for this checkout |
| `400` | `CHECKOUT_SESSION_NOT_ACTIVE` | Session expired or already completed |

---

### 4.7 Set address

```
POST /storefront/checkout/:checkoutSessionId/address
```

At least one of `customerAddressId` or `addressSnapshot` is required.

**Query params:** `guestToken` (guest only)

**Option A — Logged-in user selects saved address:**

```json
{
  "customerAddressId": "uuid-from-address-book"
}
```

**Option B — Guest or new address (raw snapshot):**

```json
{
  "addressSnapshot": {
    "fullName": "Aisha Hassan",
    "address1": "Marina Walk, Building 5",
    "address2": "Apt 1204",
    "city": "Dubai",
    "countryCode": "AE",
    "postalCode": "00000",
    "phone": "+971501234567"
  }
}
```

`addressSnapshot` is a free JSON object — include any address fields the UI collects. Minimum recommended: `fullName`, `address1`, `city`, `countryCode`.

**Success `data`:** Updated `CheckoutSessionResponse`

**Errors:**

| HTTP | Code | When |
|------|------|------|
| `422` | `CHECKOUT_ADDRESS_INPUT_REQUIRED` | Neither `customerAddressId` nor `addressSnapshot` provided |
| `400` | `CHECKOUT_SESSION_NOT_ACTIVE` | Session expired or completed |

---

### 4.8 Validate checkout

```
POST /storefront/checkout/:checkoutSessionId/validate
```

Re-validates the entire checkout session — items, pricing, inventory, address, delivery method, payment method. **Call this immediately before showing the "Pay Now" / submit button.**

**Query params:** `guestToken` (guest only)

**Request body:** `{}` (empty or omit)

**Success `data`:** Updated `CheckoutSessionResponse`

Key fields to check after validation:

```ts
if (!session.validation.isValid) {
  // block submit; show session.validationIssues to user
}

// Per-issue severity:
session.validationIssues.forEach(issue => {
  if (issue.severity === 'ERROR') {
    // block checkout — show error
  } else if (issue.severity === 'WARNING') {
    // show warning but allow proceed
  }
});
```

**Validation issue types:**

| `issueType` | Severity | Meaning | UX |
|---|---|---|---|
| `ITEM_NOT_SELLABLE` | ERROR | Item became unsellable | Show item error, remove suggestion |
| `ITEM_PRICE_MISSING` | ERROR | No price available | Show "Price unavailable" |
| `ITEM_INSUFFICIENT_INVENTORY` | ERROR | Stock exhausted | Show "Out of stock" |
| `ITEM_PRICE_CHANGED` | WARNING | Price changed since cart | Show "Price updated" notice |
| `ADDRESS_MISSING` | ERROR | No shipping address set | Prompt address entry |
| `DELIVERY_METHOD_MISSING` | ERROR | No delivery method selected | Prompt selection |
| `PAYMENT_METHOD_MISSING` | ERROR | No payment method selected | Prompt selection |

---

### 4.9 Cancel checkout

```
POST /storefront/checkout/:checkoutSessionId/cancel
```

Cancels an active checkout session. The cart is not deleted and can be used to start a new checkout.

**Query params:** `guestToken` (guest only)

**Request body (optional):**

```json
{
  "reason": "User navigated away"
}
```

**Success `data`:** Updated `CheckoutSessionResponse` with `status: "CANCELLED"`

---

## 5. Endpoint reference — Orders

Base path: `/storefront/orders` · Auth: **Optional JWT** · Tag: `Storefront — Orders`

---

### 5.1 Place order from checkout

```
POST /storefront/orders/from-checkout
```

Places an order from a validated checkout session. **This is the final submit action.**

**Query params:** `zoneCode`, `salesChannelCode`, `guestToken` (guest only)

**Request body:**

```json
{
  "checkoutSessionId": "uuid-of-checkout-session",
  "idempotencyKey": "order-3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

| Field | Required | Notes |
|-------|----------|--------|
| `checkoutSessionId` | **Yes** | UUID of the validated checkout session |
| `idempotencyKey` | Recommended | Any unique string — prevents duplicate orders on retry. Use `"order-{cartId}"` or `"order-{UUID}"` |

**Success `data`:** `OrderResponse`

**Critical — Guest tracking token:**

```ts
const order = response.data; // OrderResponse

// ONLY present on first successful guest order creation
if (order.guestTracking && !order.guestTracking.previouslyIssued) {
  localStorage.setItem('sa_order_access_token', order.guestTracking.orderAccessToken!);
  localStorage.setItem('sa_order_number', order.guestTracking.orderNumber!);
}

// Always store orderId regardless of guest/auth
localStorage.setItem('sa_order_id', order.orderId);
sessionStorage.setItem('sa_order_number', order.orderNumber ?? '');
```

**Do not** rely on `previouslyIssued: false` to determine first creation — `order.created: true` is the correct flag.

**After placing order:**
1. Clear `sa_cart_id` from `localStorage` (cart is consumed)
2. Clear `checkoutSessionId` from state
3. Save `orderId` and `orderNumber`
4. If guest: save `orderAccessToken` immediately

**Errors:**

| HTTP | Code | When |
|------|------|------|
| `404` | `CHECKOUT_NOT_FOUND` | Checkout session not found |
| `400` | `CHECKOUT_SESSION_NOT_ACTIVE` | Session already completed, cancelled, or expired |
| `403` | `FORBIDDEN` | Session belongs to another identity |
| `422` | `BUSINESS_RULE_FAILED` | Checkout not validated / validation failed |

---

### 5.2 Get order

```
GET /storefront/orders/:orderId
```

Returns full order detail. Use this for the order confirmation page and order detail view (pre-account).

**Query params:** `guestToken` (guest only)

**Success `data`:** `OrderResponse` (without `guestTracking`)

**Example response `data`:**

```json
{
  "orderId": "uuid",
  "orderNumber": "SA-10001",
  "status": "PAYMENT_PENDING",
  "paymentStatus": "PENDING",
  "fulfillmentStatus": "UNFULFILLED",
  "checkoutSessionId": "uuid",
  "cartId": "uuid",
  "customer": {
    "customerId": null,
    "email": "customer@example.com",
    "fullName": "Aisha Hassan",
    "isGuest": true
  },
  "lines": [
    {
      "orderLineId": "uuid",
      "lineNumber": 1,
      "productId": "uuid",
      "variantId": "uuid",
      "sku": "AAPR141301",
      "productName": "Duqoor Al Dubai",
      "variantName": null,
      "quantity": "2",
      "unitPrice": "150.00",
      "lineTotal": "300.00",
      "currencyCode": "AED"
    }
  ],
  "addresses": [
    {
      "addressType": "SHIPPING",
      "fullName": "Aisha Hassan",
      "address1": "Marina Walk, Building 5",
      "city": "Dubai",
      "countryCode": "AE",
      "postalCode": "00000"
    }
  ],
  "totals": {
    "subtotal": "300.00",
    "discount": "0",
    "shipping": "15.00",
    "tax": "0",
    "total": "315.00"
  },
  "currency": "AED",
  "selectedPaymentMethod": {
    "providerCode": "PAYMOB",
    "methodCode": "CARD"
  },
  "selectedDeliveryMethod": {
    "partnerCode": "ARAMEX",
    "methodCode": "STANDARD"
  },
  "timeline": [
    {
      "eventType": "ORDER_CREATED",
      "title": "Order placed",
      "occurredAt": "2026-08-12T06:00:00.000Z"
    }
  ],
  "created": true,
  "createdAt": "2026-08-12T06:00:00.000Z",
  "metadata": null
}
```

**Errors:**

| HTTP | Code | When |
|------|------|------|
| `404` | `RESOURCE_NOT_FOUND` | Order not found or does not belong to this identity |

---

### 5.3 Initiate payment

```
POST /storefront/orders/:orderId/payment/initiate
```

Starts the payment flow for a placed order. Call this immediately after placing the order.

**Query params:** `guestToken` (guest only)

**Request body:**

```json
{
  "idempotencyKey": "pay-{orderId}-{attempt}"
}
```

All fields are optional — the payment method was already set during checkout.

**Success `data`:** `PaymentInitiationResponse`

**Payment action handling:**

```ts
const payment = response.data; // PaymentInitiationResponse

if (payment.paymentAction === 'REDIRECT' && payment.redirectUrl) {
  // Redirect customer to payment gateway
  window.location.href = payment.redirectUrl;

} else if (!payment.paymentAction) {
  // COD, internal, or deferred payment
  // Show order confirmation immediately
  router.push(`/order-confirmation/${orderId}`);

} else if (payment.paymentExecutionStatus === 'PENDING_PROVIDER_EXECUTION') {
  // Provider adapter not configured on this env
  // Show message and redirect to confirmation
  console.warn('Payment execution pending:', payment.warnings);
  router.push(`/order-confirmation/${orderId}`);
}
```

**`warnings` array** — non-blocking messages about provider configuration state. Log them, do not show raw strings to customers.

---

### 5.4 Get payment status

```
GET /storefront/orders/:orderId/payment-status
```

Returns the payment status of an order. Use this after returning from a payment gateway redirect to confirm status.

**Query params:** `guestToken` (guest only)

**Success `data`:** `OrderPaymentStatusResponse`

**Polling guidance:**

```ts
// Poll after redirect return from payment gateway
async function pollPaymentStatus(orderId: string, guestToken?: string) {
  const MAX_ATTEMPTS = 10;
  const DELAY_MS = 2000;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const response = await checkoutApi.getPaymentStatus(orderId, guestToken);
    const status = response.data.orderPaymentStatus;

    if (status === 'PAID' || status === 'AUTHORIZED') {
      return { success: true, status };
    }
    if (status === 'FAILED' || status === 'DECLINED') {
      return { success: false, status };
    }
    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
  }
  return { success: false, status: 'TIMEOUT' };
}
```

**`orderPaymentStatus` values:**

| Value | Meaning | UX |
|---|---|---|
| `PENDING` | Awaiting payment | Show loading |
| `AUTHORIZED` | Payment authorized, not captured | Show success (capture is backend) |
| `PAID` | Payment confirmed | Show success / order confirmation |
| `FAILED` | Payment failed | Show error, offer retry |
| `DECLINED` | Declined by provider | Show specific message, offer retry |
| `REFUNDED` | Order refunded | Show refund status |

---

## 6. Checkout session status reference

| `status` | Meaning | FE action |
|---|---|---|
| `ACTIVE` | Session is open | Normal checkout flow |
| `COMPLETED` | Order was placed | Redirect to order confirmation |
| `CANCELLED` | Session cancelled | Redirect to cart |
| `EXPIRED` | Session timed out | Clear session, redirect to cart |

When you fetch a session and `status !== 'ACTIVE'` — do not allow further edits. Redirect appropriately.

---

## 7. Error codes reference

| HTTP | Code | Module | When |
|---|---|---|---|
| `404` | `CHECKOUT_NOT_FOUND` | Checkout | Session ID not found |
| `400` | `CHECKOUT_CART_EMPTY` | Checkout | Cart has no items |
| `400` | `CHECKOUT_SESSION_NOT_ACTIVE` | Checkout | Session is completed/cancelled/expired |
| `400` | `CHECKOUT_PAYMENT_METHOD_UNAVAILABLE` | Checkout | Payment method not available in zone |
| `400` | `CHECKOUT_DELIVERY_METHOD_UNAVAILABLE` | Checkout | Delivery method not available |
| `422` | `CHECKOUT_ADDRESS_INPUT_REQUIRED` | Checkout | Neither address field provided |
| `403` | `FORBIDDEN` | Both | Session/order belongs to another identity |
| `404` | `RESOURCE_NOT_FOUND` | Orders | Order not found |
| `422` | `BUSINESS_RULE_FAILED` | Orders | Checkout not validated or rules failed |

---

## 8. localStorage / sessionStorage keys (recommended)

| Key | Storage | Value | Lifecycle |
|-----|---------|-------|-----------|
| `sa_cart_id` | `localStorage` | Cart UUID | Clear after order placed |
| `sa_guest_token` | `localStorage` | UUIDv4 anonymous ID | Clear after login |
| `sa_order_id` | `localStorage` | Order UUID | Set after order placed |
| `sa_order_number` | `localStorage` | e.g. `SA-10001` | Set after order placed |
| `sa_order_access_token` | `localStorage` | Guest tracking proof token | Set once, never overwrite |
| `checkoutSessionId` | `sessionStorage` | Checkout UUID | Session only |

---

## 9. Suggested API module surface

```ts
// checkoutApi
checkoutApi.createFromCart(dto: { cartId: string; customerAddressId?: string; guestContact?: GuestContact }, ctx)
checkoutApi.getSession(checkoutSessionId: string, ctx)
checkoutApi.listDeliveryMethods(checkoutSessionId: string, ctx)
checkoutApi.selectDeliveryMethod(checkoutSessionId: string, deliveryMethodId: string, ctx)
checkoutApi.listPaymentMethods(checkoutSessionId: string, ctx)
checkoutApi.selectPaymentMethod(checkoutSessionId: string, paymentMethodId: string, ctx)
checkoutApi.setAddress(checkoutSessionId: string, dto: { customerAddressId?: string; addressSnapshot?: Record<string, unknown> }, ctx)
checkoutApi.validate(checkoutSessionId: string, ctx)
checkoutApi.cancel(checkoutSessionId: string, reason?: string, ctx)

// ordersApi
ordersApi.placeOrder(dto: { checkoutSessionId: string; idempotencyKey?: string }, ctx)
ordersApi.getOrder(orderId: string, ctx)
ordersApi.initiatePayment(orderId: string, dto: { idempotencyKey?: string }, ctx)
ordersApi.getPaymentStatus(orderId: string, ctx)
```

Where `ctx` = `{ guestToken?: string }` for guest, or nothing for JWT (Bearer auto-attached by interceptor).

---

## 10. Acceptance checklist

### Wave C.1 — Create + get session

- [ ] `POST from-cart` with `cartId` → `checkoutSessionId` stored in `sessionStorage`
- [ ] `GET /:id` → checkout summary renders (items, totals, context)
- [ ] Empty cart → `400 CHECKOUT_CART_EMPTY` handled
- [ ] Session not found → `404` handled; redirect to cart

### Wave C.2 — Delivery method

- [ ] `GET /delivery-methods` → list renders with `displayName` + `estimatedFee`
- [ ] Default method pre-selected (`isDefault: true`)
- [ ] `POST /delivery-method` → session refreshes with `selectedDeliveryMethod`
- [ ] Unavailable method → `400 CHECKOUT_DELIVERY_METHOD_UNAVAILABLE` handled

### Wave C.3 — Payment method

- [ ] `GET /payment-methods` → list renders with `displayName`
- [ ] Default method pre-selected
- [ ] `POST /payment-method` → session refreshes with `selectedPaymentMethod`
- [ ] COD and card both handled

### Wave C.4 — Address

- [ ] Guest: `addressSnapshot` flow works with form data
- [ ] Logged-in: `customerAddressId` flow works with saved address
- [ ] Missing both → `422 CHECKOUT_ADDRESS_INPUT_REQUIRED` handled

### Wave C.5 — Validate

- [ ] `POST validate` before submit
- [ ] `validation.isValid = false` → submit blocked; issues displayed
- [ ] `severity = 'WARNING'` → show warning, allow proceed
- [ ] `severity = 'ERROR'` → block submit

### Wave C.6 — Place order

- [ ] `POST orders/from-checkout` with `checkoutSessionId` + `idempotencyKey`
- [ ] `orderId` + `orderNumber` stored
- [ ] Guest: `guestTracking.orderAccessToken` saved to `localStorage` on `previouslyIssued: false`
- [ ] Cart cleared after success (`sa_cart_id` removed)
- [ ] Idempotent replay (same `idempotencyKey`) → returns same order, `created: false`

### Wave C.7 — Payment initiation

- [ ] `POST /payment/initiate` → handle `paymentAction`
- [ ] `REDIRECT` → `window.location.href = redirectUrl`
- [ ] `null` (COD) → show confirmation immediately
- [ ] `PENDING_PROVIDER_EXECUTION` → log warning, show confirmation

### Wave C.8 — Payment status

- [ ] Poll `GET /payment-status` after redirect return
- [ ] `PAID` / `AUTHORIZED` → success UX
- [ ] `FAILED` / `DECLINED` → error UX, retry option

### Wave C.9 — Order confirmation

- [ ] `GET orders/:orderId` → render confirmation page (lines, totals, address, timeline)
- [ ] Guest: show `orderNumber` prominently; instruct to save it

### Explicitly deferred

- [ ] Order history list (`/storefront/customer/orders`) → later guide
- [ ] Guest order tracking (`/storefront/order-tracking`) → later guide
- [ ] Returns / exchanges → later guide
- [ ] Payment webhook status updates → backend-handled, no FE polling needed beyond C.8

---

## 11. Agent prompt snippet (paste into Cursor)

```
You are integrating Swiss Arabian storefront Checkout + Orders (Phase C).
Read:
- docs/storefront/STOREFRONT_CHECKOUT_AND_ORDERS_FE_GUIDE.md
- docs/storefront/STOREFRONT_CART_FE_HANDOFF.md (prerequisite — cart must be wired first)
- docs/storefront/STOREFRONT_FRONTEND_INTEGRATION_GUIDE_PHASE_1.md (Phase 1 client reuse)

The Phase 1 axios client (envelope unwrap, Bearer interceptor, single-flight refresh) is already wired.
The cart is wired — sa_cart_id is in localStorage.

Implement in wave order C.1 → C.9 as defined in the guide.

Key rules:
- No /api/v1 prefix — routes are absolute: POST /storefront/checkout/from-cart
- guestToken passed as query param when no Bearer present
- checkoutSessionId stored in sessionStorage (not localStorage)
- Guest orderAccessToken saved to localStorage immediately on place-order success
- Payment REDIRECT action → window.location.href = redirectUrl
- Never invent fields — Swagger at /api/docs is the source of truth
- All prices are Decimal strings — use a Decimal library, not parseFloat
```

---

*Derived from `src/modules/storefront/checkout/` and `src/modules/storefront/orders/` backend source code. Align with Swagger if shapes drift.*
