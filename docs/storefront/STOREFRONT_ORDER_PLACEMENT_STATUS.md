# Storefront — Order Placement & Payment Integration Status

**Date:** 2026-08-28  
**Environment:** Local dev (`http://localhost:3001`)  
**Base URL:** `http://192.168.18.33:3000`  
**Zone:** `UAE` · **Sales Channel:** `platform_uae`

---

## Overview

The full checkout-to-payment flow has been implemented on the frontend. Below is a step-by-step breakdown of every API that is wired up, what we send, what we expect back, and any known issues or open questions.

---

## APIs Implemented

### 1. Create Checkout Session
```
POST /storefront/checkout/from-cart
     ?zoneCode=UAE&salesChannelCode=platform_uae[&guestToken=<uuid>]
```
**Body:**
```json
{
  "cartId": "<uuid from localStorage sa_cart_id>"
}
```
**Behaviour:**
- Called once when user lands on `/checkout`
- If `sa_checkout_session_id` exists in `sessionStorage`, we call `GET /checkout/:id` first and resume if `status === "ACTIVE"`, otherwise create a new session
- Session ID stored in `sessionStorage` as `sa_checkout_session_id`

---

### 2. List Delivery Methods
```
GET /storefront/checkout/:checkoutSessionId/delivery-methods
    [?guestToken=<uuid>]
```
**Behaviour:**
- Called immediately after session is created/resumed
- First method with `isDefault: true` (or `[0]`) is auto-selected and confirmed via POST below

---

### 3. Select Delivery Method
```
POST /storefront/checkout/:checkoutSessionId/delivery-method
     [?guestToken=<uuid>]
```
**Body:**
```json
{ "deliveryMethodId": "<uuid from delivery method list>" }
```

---

### 4. List Payment Methods
```
GET /storefront/checkout/:checkoutSessionId/payment-methods
    [?guestToken=<uuid>]
```
**Behaviour:**
- Called alongside delivery methods (parallel)
- First method with `isDefault: true` (or `[0]`) is auto-selected and confirmed via POST below

---

### 5. Select Payment Method
```
POST /storefront/checkout/:checkoutSessionId/payment-method
     [?guestToken=<uuid>]
```
**Body:**
```json
{ "paymentMethodId": "<uuid from payment method list>" }
```
> **Note:** We send `paymentMethodId` (not `zonePaymentMethodId`) here. This follows backend confirmation.

---

### 6. Set Address
```
POST /storefront/checkout/:checkoutSessionId/address
     [?guestToken=<uuid>]
```
**Body:**
```json
{
  "addressSnapshot": {
    "fullName": "John Doe",
    "address1": "123 Main Street",
    "address2": "Apt 4B",
    "city": "Dubai",
    "countryCode": "AE",
    "postalCode": "00000",
    "phone": "+971501234567"
  }
}
```
> **Known issue:** We are sending `postalCode: "00000"` as a placeholder because UAE addresses do not use postal codes. If backend validation rejects `"00000"`, please advise what value to use (empty string, null, or omit the field entirely).

---

### 7. Validate Checkout
```
POST /storefront/checkout/:checkoutSessionId/validate
     [?guestToken=<uuid>]
```
**Body:** `{}`

**Behaviour:**
- We check `response.validation.isValid` in the response body (not just HTTP 200)
- If `isValid !== true`, we surface the first blocking issue to the user with a friendly message mapped by `issueType`:

| `issueType` | User-facing message |
|---|---|
| `PRICE_MISSING` | One or more items have no price. Please contact support. |
| `INSUFFICIENT_INVENTORY` | One or more items are out of stock. |
| `PRODUCT_NOT_SELLABLE` | One or more items are no longer available. |
| `VARIANT_INACTIVE` | One or more items are inactive. Please remove them. |
| `ADDRESS_INVALID` | Your shipping address is incomplete or invalid. |
| `PAYMENT_METHOD_UNAVAILABLE` | The selected payment method is not available. |
| `DELIVERY_METHOD_UNAVAILABLE` | The selected delivery method is not available. |
| `CURRENCY_MISMATCH` | Currency mismatch. Please refresh and try again. |
| `MANUAL_REVIEW_REQUIRED` | Your order requires manual review. Please contact support. |

---

### 8. Place Order
```
POST /storefront/orders/from-checkout
     ?zoneCode=UAE&salesChannelCode=platform_uae[&guestToken=<uuid>]
```
**Body:**
```json
{
  "checkoutSessionId": "<uuid from sessionStorage sa_checkout_session_id>",
  "idempotencyKey": "order-<cartId>"
}
```
**On success:**
- `orderId` stored in `localStorage` as `sa_order_id`
- `orderNumber` stored in `localStorage` as `sa_order_number`
- `guestTracking.orderAccessToken` stored in `localStorage` as `sa_order_access_token` (one-time, only stored if `previouslyIssued === false`)
- Cart is cleared (`sa_cart_id` removed)
- Checkout session ID cleared from `sessionStorage`

**Known errors received during testing:**

| Error code | Status | Our diagnosis |
|---|---|---|
| `STOREFRONT_CHECKOUT_VALIDATION_FAILED` | 422 | Checkout failed backend's stricter `assertCheckoutReadyForPlacement`. Most likely cause: `PRICE_MISSING` on products in dev catalog. |
| `STOREFRONT_ORDER_PLACEMENT_BLOCKED` | 422 | Payment method was not successfully selected on the session. We believe the auto-select POST was silently failing. |

---

### 9. Initiate Payment
```
POST /storefront/orders/:orderId/payment/initiate
     [?guestToken=<uuid>]
```
**Body (as per backend guidance):**
```json
{
  "idempotencyKey": "pay-<orderId>-<attempt>",
  "returnUrl": "http://localhost:3001/checkout/payment/success",
  "cancelUrl": "http://localhost:3001/checkout/payment/cancel"
}
```
> **Confirmed:** We do NOT send `zonePaymentMethodId` in this body. The backend reads the payment method from the checkout session. We removed this after backend feedback to avoid `forbidNonWhitelisted` 400 error.

**Response handling by `paymentAction`:**

| `paymentAction` | FE behaviour |
|---|---|
| `REDIRECT` | Hard redirect to `redirectUrl` (Paymob hosted page) |
| `INLINE_CARD` | Store `clientSecret` + `publishableKey` from `metadata`, navigate to `/checkout/payment/stripe` |
| `null` / COD | Navigate directly to `/order-confirmation/:orderId` |

---

### 10. Stripe Inline Card Payment (`INLINE_CARD`)
**Route:** `/checkout/payment/stripe`  
**Package:** `@stripe/stripe-js` + `@stripe/react-stripe-js`

**Flow:**
1. `publishableKey` read from `sessionStorage` (`sa_stripe_publishable_key`)
2. `clientSecret` read from `sessionStorage` (`sa_stripe_client_secret`)
3. Stripe `loadStripe(publishableKey)` called
4. `<Elements>` wrapper mounted with `clientSecret`
5. User fills card details in `<PaymentElement>`
6. On submit: `stripe.confirmPayment({ redirect: "if_required" })` called
7. After confirmation: poll `GET /storefront/orders/:orderId/payment-status` (up to 10×, every 2s)
8. On `PAID` / `AUTHORIZED` → navigate to `/order-confirmation/:orderId`
9. On `FAILED` / `DECLINED` / `TIMEOUT` → show error, allow retry

**Session storage keys used for Stripe:**

| Key | Value |
|---|---|
| `sa_stripe_client_secret` | PaymentIntent `client_secret` from `initiate` response |
| `sa_stripe_publishable_key` | Stripe publishable key from `initiate` response `metadata` |
| `sa_payment_transaction_id` | `paymentTransactionId` from `initiate` response |
| `sa_pay_attempt` | Incrementing attempt counter for idempotency key |

---

### 11. Paymob Redirect Flow (`REDIRECT`)
**Return page:** `/checkout/payment/success`  
**Cancel page:** `/checkout/payment/cancel`

**Return flow:**
1. User returns from Paymob gateway to `/checkout/payment/success`
2. FE reads `orderId` from `localStorage` (`sa_order_id`)
3. Polls `GET /storefront/orders/:orderId/payment-status` (up to 10×, every 2s)
4. On success → navigate to `/order-confirmation/:orderId`
5. On failure/timeout → show error with retry option

**Cancel/retry flow:**
1. User lands on `/checkout/payment/cancel`
2. Option to retry: increments `sa_pay_attempt` counter, re-calls `POST payment/initiate`, redirects to new gateway URL
3. Option to return to home

---

### 12. Get Payment Status (polling)
```
GET /storefront/orders/:orderId/payment-status
    [?guestToken=<uuid>]
```
**Polling config:**
- Max attempts: `10`
- Delay between attempts: `2000ms`
- Terminal success: `PAID`, `AUTHORIZED`
- Terminal failure: `FAILED`, `DECLINED`
- Timeout fallback: after 10 attempts, show "payment pending" message

---

### 13. Get Order (Confirmation Page)
```
GET /storefront/orders/:orderId
    [?guestToken=<uuid>]
```
**Route:** `/order-confirmation/:orderId`  
**Displays:** order number, status badge, line items with images, totals, address, delivery/payment method, timeline

---

## Authentication Context

| Scenario | How identified |
|---|---|
| Authenticated user | `Authorization: Bearer <accessToken>` header — added automatically by `apiClient` |
| Guest user | `guestToken=<uuid>` query param — UUID stored in `localStorage` as `sa_guest_token`, created on first cart action |

All checkout and order endpoints receive either the Bearer token (authenticated) or `guestToken` (guest). Both are handled in `buildContextParams()` / `buildGuestParam()` in the service files.

---

## Known Issues / Open Questions for Backend

| # | Issue | Impact | Question |
|---|---|---|---|
| 1 | `STOREFRONT_CHECKOUT_VALIDATION_FAILED` on `POST /orders/from-checkout` even after validate returns 200 | Order cannot be placed | Is there a product in the dev catalog that is missing a price (`PRICE_MISSING`)? Can you list which products have `hasValidPrice: false` for `zoneCode=UAE`? |
| 2 | Stripe `confirmPayment` returns `status: "succeeded"` but `GET payment-status` returns `FAILED` | Payment appears succeeded to user but order not confirmed | Is the Stripe webhook (`payment_intent.succeeded`) configured for the dev environment? What is the webhook endpoint URL? |
| 3 | `postalCode: "00000"` in address snapshot | May cause `ADDRESS_INVALID` | Should we send an empty string, `null`, or omit `postalCode` entirely for UAE addresses? |
| 4 | `STOREFRONT_ORDER_PLACEMENT_BLOCKED` — "Payment method must be selected" | Order cannot be placed | We are auto-selecting the default payment method after loading the session. If the auto-select POST fails silently, the method is not confirmed. Should we retry, or is there a way to check if the method is confirmed on `GET /checkout/:id`? |
| 5 | Orders list + detail UI (account area) | Not yet built | `GET /storefront/orders` — does it support `?page=` and `?limit=` pagination? What is the response shape? |
| 6 | Guest order tracking | Not yet tested end-to-end | Is `guestTracking.orderAccessToken` returned on every `GET /orders/:orderId` call, or only once on the `from-checkout` response? |

---

## Files Involved (FE)

| File | Purpose |
|---|---|
| `src/features/checkout/api/checkout.service.ts` | All checkout session API calls |
| `src/features/checkout/api/orders.service.ts` | Place order, initiate payment, poll payment status |
| `src/features/checkout/hooks/useCheckout.ts` | State machine orchestrating the full flow |
| `src/features/checkout/components/CheckoutPageView.tsx` | Checkout form UI |
| `src/features/checkout/components/StripePaymentFormView.tsx` | Stripe inline card form |
| `src/features/checkout/components/PaymentSuccessView.tsx` | Paymob return page (polls status) |
| `src/features/checkout/components/PaymentCancelView.tsx` | Paymob cancel page (retry logic) |
| `src/features/checkout/components/OrderConfirmationView.tsx` | Order confirmation page |
| `src/features/checkout/utils/checkoutSession.ts` | sessionStorage / localStorage helpers |
| `src/features/checkout/types/checkout.ts` | All TypeScript types |

---

## Pending FE Work (Not Yet Started)

| Task | API needed |
|---|---|
| Orders list page (account area) | `GET /storefront/orders` |
| Order detail page (account area) | `GET /storefront/orders/:orderId` |
| Addresses CRUD (account area) | `GET/POST/PATCH/DELETE /storefront/addresses` |
