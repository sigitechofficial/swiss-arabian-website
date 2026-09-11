# Storefront API Payload Reference

> Complete request payloads for every Cart, Checkout, Order, and Payment API call.  
> **Note:** Cart items are never sent to checkout/order APIs — only IDs are passed. The backend looks up items from the stored cart/session.

---

## Context Query Parameters

These are appended to **every** API call as query parameters:

| Param | Value | When |
|---|---|---|
| `zoneCode` | `UAE` | Always |
| `salesChannelCode` | `platform_uae` | Always |
| `guestToken` | UUID from `localStorage.sa_guest_token` | Guest users only |
| `cartId` | UUID from `localStorage.sa_cart_id` | Cart endpoints only |

---

## 1. Cart APIs

### `POST /storefront/cart` — Create / resolve cart

```
URL: /storefront/cart?zoneCode=UAE&salesChannelCode=platform_uae&guestToken=xxx
```

**Body:**
```json
{}
```

**Response contains:** `cartId`, `items[]`, `totals`, `currency`, `validation`

---

### `GET /storefront/cart` — Get active cart

```
URL: /storefront/cart?zoneCode=UAE&salesChannelCode=platform_uae&cartId=uuid&guestToken=xxx
```

**Body:** none (GET)

---

### `POST /storefront/cart/items` — Add item to cart

```
URL: /storefront/cart/items?zoneCode=UAE&salesChannelCode=platform_uae&cartId=uuid&guestToken=xxx
```

**Body (with SKU — preferred):**
```json
{
  "sku": "TOB1141901",
  "quantity": 1
}
```

**Body (with variantId — fallback):**
```json
{
  "variantId": "d387dff8-f429-4daf-a44c-e0b72837cba6",
  "quantity": 1
}
```

---

### `PATCH /storefront/cart/items/:cartItemId` — Update quantity

```
URL: /storefront/cart/items/{cartItemId}?zoneCode=UAE&salesChannelCode=platform_uae&cartId=uuid&guestToken=xxx
```

**Body:**
```json
{
  "quantity": 3
}
```

---

### `DELETE /storefront/cart/items/:cartItemId` — Remove single item

```
URL: /storefront/cart/items/{cartItemId}?zoneCode=UAE&salesChannelCode=platform_uae&cartId=uuid&guestToken=xxx
```

**Body:** none (DELETE)

---

### `DELETE /storefront/cart/items` — Clear all items

```
URL: /storefront/cart/items?zoneCode=UAE&salesChannelCode=platform_uae&cartId=uuid&guestToken=xxx
```

**Body:** none (DELETE)

---

### `POST /storefront/cart/validate` — Validate cart

```
URL: /storefront/cart/validate?zoneCode=UAE&salesChannelCode=platform_uae&cartId=uuid&guestToken=xxx
```

**Body:**
```json
{
  "cartId": "uuid"
}
```

---

## 2. Checkout APIs

> ⚠️ Items are **not** sent here. The backend reads them from the cart using `cartId`.

### `POST /storefront/checkout/from-cart` — Create checkout session

```
URL: /storefront/checkout/from-cart?zoneCode=UAE&salesChannelCode=platform_uae&guestToken=xxx
```

**Body:**
```json
{
  "cartId": "uuid-of-cart"
}
```

**Response contains:** `checkoutSessionId`, `items[]` (from cart), `totals`, `selectedDeliveryMethod`, `selectedPaymentMethod`, `validation`

---

### `GET /storefront/checkout/:checkoutSessionId` — Get session

```
URL: /storefront/checkout/{checkoutSessionId}?guestToken=xxx
```

**Body:** none (GET)

---

### `GET /storefront/checkout/:checkoutSessionId/delivery-methods` — List delivery options

```
URL: /storefront/checkout/{checkoutSessionId}/delivery-methods?guestToken=xxx
```

**Body:** none (GET)

---

### `POST /storefront/checkout/:checkoutSessionId/delivery-method` — Select delivery

```
URL: /storefront/checkout/{checkoutSessionId}/delivery-method?guestToken=xxx
```

**Body:**
```json
{
  "deliveryMethodId": "uuid-of-delivery-method"
}
```

---

### `GET /storefront/checkout/:checkoutSessionId/payment-methods` — List payment options

```
URL: /storefront/checkout/{checkoutSessionId}/payment-methods?guestToken=xxx
```

**Body:** none (GET)

---

### `POST /storefront/checkout/:checkoutSessionId/payment-method` — Select payment

```
URL: /storefront/checkout/{checkoutSessionId}/payment-method?guestToken=xxx
```

**Body:**
```json
{
  "paymentMethodId": "uuid-of-payment-method"
}
```

---

### `POST /storefront/checkout/:checkoutSessionId/address` — Set shipping address

```
URL: /storefront/checkout/{checkoutSessionId}/address?guestToken=xxx
```

**Body:**
```json
{
  "addressSnapshot": {
    "fullName": "Hamza Iqbal",
    "address1": "123 Main Street",
    "address2": "Apt 4",
    "city": "Dubai",
    "countryCode": "AE",
    "postalCode": "00000",
    "phone": "+971501234567"
  }
}
```

> Alternatively, for saved addresses (authenticated users):
> ```json
> { "customerAddressId": "uuid-of-saved-address" }
> ```

---

### `POST /storefront/checkout/:checkoutSessionId/validate` — Validate checkout

```
URL: /storefront/checkout/{checkoutSessionId}/validate?guestToken=xxx
```

**Body:**
```json
{}
```

> ⚠️ HTTP 200 does NOT mean `isValid: true`. Always check `response.validation.isValid`.

---

### `POST /storefront/checkout/:checkoutSessionId/cancel` — Cancel checkout

```
URL: /storefront/checkout/{checkoutSessionId}/cancel?guestToken=xxx
```

**Body:**
```json
{}
```

Or with reason:
```json
{
  "reason": "Customer abandoned"
}
```

---

## 3. Orders APIs

> ⚠️ Items are **not** sent here either. The backend reads them from the checkout session using `checkoutSessionId`.

### `POST /storefront/orders/from-checkout` — Place order

```
URL: /storefront/orders/from-checkout?zoneCode=UAE&salesChannelCode=platform_uae&guestToken=xxx
```

**Body:**
```json
{
  "checkoutSessionId": "uuid-of-checkout-session",
  "idempotencyKey": "order-{cartId}"
}
```

**Response contains:** `orderId`, `orderNumber`, `status`, `lines[]`, `totals`, `guestTracking`

---

### `GET /storefront/orders/:orderId` — Get order detail

```
URL: /storefront/orders/{orderId}?guestToken=xxx
```

**Body:** none (GET)

---

### `GET /storefront/orders/:orderId/payment-status` — Get payment status

```
URL: /storefront/orders/{orderId}/payment-status?guestToken=xxx
```

**Body:** none (GET)

**Response `orderPaymentStatus` values:**
| Value | Meaning |
|---|---|
| `PENDING` | Not yet confirmed — keep polling |
| `AUTHORIZED` | Card hold placed — show success |
| `PAID` | Confirmed — show success |
| `FAILED` | Failed — show retry |
| `DECLINED` | Declined by issuer — show retry |
| `CANCELLED` | Customer cancelled |
| `REFUNDED` | Refunded |

---

## 4. Payment API (Paymob)

### `POST /storefront/orders/:orderId/payment/initiate` — Initiate payment

```
URL: /storefront/orders/{orderId}/payment/initiate?guestToken=xxx
```

**Body (standard — payment method already selected at checkout):**
```json
{
  "returnUrl": "https://your-site.com/checkout/payment/success",
  "cancelUrl": "https://your-site.com/checkout/payment/cancel",
  "idempotencyKey": "pay-{orderId}-1"
}
```

> On retry, increment the attempt suffix: `pay-{orderId}-2`, `pay-{orderId}-3`, etc.

> ⚠️ Do **NOT** send `zonePaymentMethodId` — backend uses `forbidNonWhitelisted` and will return 400.  
> Payment method is already stored on the checkout session; the backend reads it from there.

**Optional override (if you need to change payment method at initiation):**
```json
{
  "paymentMethodId": "uuid-from-payment-methods-list",
  "returnUrl": "...",
  "cancelUrl": "...",
  "idempotencyKey": "pay-{orderId}-1"
}
```

**Response key fields:**
```json
{
  "paymentAction": "REDIRECT",
  "redirectUrl": "https://uae.paymob.com/unifiedcheckout/?publicKey=...&clientSecret=...",
  "paymentExecutionStatus": "SUCCESS",
  "paymentTransactionId": "uuid"
}
```

> If `paymentAction === "REDIRECT"` → use `window.location.href = redirectUrl` (hard redirect — never `router.push`)  
> If `paymentExecutionStatus === "PENDING_PROVIDER_EXECUTION"` → Paymob not configured on backend

---

## 5. How items flow through the system

```
1. User adds product
   POST /cart/items  { sku, quantity }
   ↓
   Backend stores item in cart (cartId saved in localStorage)

2. User proceeds to checkout
   POST /checkout/from-cart  { cartId }
   ↓
   Backend reads cart → creates checkout session with items copied in

3. User places order
   POST /orders/from-checkout  { checkoutSessionId }
   ↓
   Backend reads checkout session → creates order with items

4. FE never sends item details to checkout or order APIs.
   Only cartId → checkoutSessionId → orderId chain is passed.
```

---

## 6. sessionStorage / localStorage keys used

| Key | Storage | Value | Set when | Cleared when |
|---|---|---|---|---|
| `sa_cart_id` | localStorage | Cart UUID | Cart created | Order confirmed |
| `sa_guest_token` | localStorage | Guest UUID | First visit | Never (persists) |
| `sa_checkout_session_id` | sessionStorage | Session UUID | Checkout started | Order placed |
| `sa_order_id` | localStorage | Order UUID | Order placed | — |
| `sa_order_number` | localStorage | e.g. `UAE-MT8BZCX3` | Order placed | — |
| `sa_order_access_token` | localStorage | One-time guest token | Order placed (guest) | Never |
| `sa_zone_payment_method_id` | sessionStorage | UUID | Payment method selected | Payment confirmed |
| `sa_payment_transaction_id` | sessionStorage | UUID | Payment initiated | Payment confirmed |
| `sa_pay_attempt` | sessionStorage | `"1"`, `"2"`, ... | First payment attempt | Payment confirmed |

---

*Generated from source: `src/features/cart/api/cart.service.ts`, `src/features/checkout/api/checkout.service.ts`, `src/features/checkout/api/orders.service.ts`, `src/features/checkout/utils/checkoutSession.ts`*
