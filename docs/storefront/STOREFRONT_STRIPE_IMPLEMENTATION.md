# Stripe Card Payment — FE Implementation Reference

> **Status:** Implemented ✅  
> **Date:** Aug 27, 2026  
> **Provider:** Stripe PaymentIntents  
> **Payment method code:** `stripe_card` · Provider code: `stripe`  
> **Related guide:** `docs/storefront/STOREFRONT_STRIPE_CARD_FE_GUIDE.md`

---

## 1. Packages installed

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

| Package | Purpose |
|---|---|
| `@stripe/stripe-js` | `loadStripe()` — loads Stripe.js script dynamically |
| `@stripe/react-stripe-js` | `Elements`, `PaymentElement`, `useStripe`, `useElements` React hooks |

---

## 2. Flow overview

```
Checkout form submitted
    ↓
useCheckout.submitCheckout()
    ↓ POST /storefront/orders/from-checkout  →  orderId
    ↓ POST /storefront/orders/:orderId/payment/initiate
    ↓
Response: paymentAction === "INLINE_CARD"
    ↓
Store in sessionStorage:
  sa_stripe_client_secret  = payment.clientSecret
  sa_stripe_publishable_key = payment.metadata.publishableKey
  sa_order_id               = orderId
    ↓
router.push("/checkout/payment/stripe")
    ↓
StripePaymentFormView mounts
  loadStripe(publishableKey)
  Elements({ clientSecret })
  PaymentElement renders card form
    ↓
User submits form
  stripe.confirmPayment({ redirect: "if_required" })
    ↓
No error → poll GET /storefront/orders/:orderId/payment-status
    ↓
PAID/AUTHORIZED → /order-confirmation/:orderId
DECLINED        → show "card declined" message
TIMEOUT (30s)   → "check your email" message
FAILED          → soft message (card may have been charged — contact support)
```

---

## 3. Files involved

| File | Role |
|---|---|
| `src/features/checkout/hooks/useCheckout.ts` | Detects `INLINE_CARD`, stores keys, navigates to stripe page |
| `src/features/checkout/components/StripePaymentFormView.tsx` | Full Stripe UI — loads Elements, confirms payment, polls status |
| `src/features/checkout/utils/checkoutSession.ts` | sessionStorage helpers for `clientSecret`, `publishableKey` |
| `src/features/checkout/types/checkout.ts` | `PaymentInitiationResponse.paymentAction`, `StripePaymentMetadata` |
| `src/features/checkout/api/orders.service.ts` | `initiatePayment`, `pollUntilPaymentSettles` |
| `src/app/(shop)/checkout/payment/stripe/page.tsx` | Next.js route — renders `StripePaymentFormView` |

---

## 4. `useCheckout.ts` — INLINE_CARD handler

**Location:** `src/features/checkout/hooks/useCheckout.ts` inside `submitCheckout()`

```ts
if (payment.paymentAction === "INLINE_CARD" && payment.clientSecret) {
  if (payment.paymentTransactionId) {
    storePaymentTransactionId(payment.paymentTransactionId);
  }
  const publishableKey =
    payment.metadata?.publishableKey ??
    (payment.metadata?.publishable_key as string | undefined);
  if (publishableKey) storeStripePublishableKey(publishableKey);
  storeStripeClientSecret(payment.clientSecret);
  router.push("/checkout/payment/stripe");
  return;
}
```

**All three provider cases handled:**
```ts
paymentAction === "REDIRECT"    → window.location.href = redirectUrl  (Paymob)
paymentAction === "INLINE_CARD" → router.push("/checkout/payment/stripe")  (Stripe)
null / other                    → router.push("/order-confirmation/...")  (COD etc.)
```

---

## 5. `StripePaymentFormView.tsx` — Component structure

Two-component pattern (required by Stripe React hooks):

```
StripePaymentFormView          ← outer: reads sessionStorage, loads Stripe
    └── Elements (provider)
         └── StripeForm        ← inner: uses useStripe(), useElements()
```

### Outer component (`StripePaymentFormView`)

1. On mount: reads `sa_stripe_client_secret`, `sa_stripe_publishable_key`, `sa_order_id` from sessionStorage
2. If any missing → shows "Session expired" error
3. Calls `loadStripe(publishableKey)` — dynamic, no hardcoded key
4. Passes `clientSecret` to `Elements` via `options`
5. Applies brand theme to Stripe Elements:
   ```ts
   appearance: {
     variables: {
       colorPrimary: "#B46E57",   // terra brand color
       colorText: "#2c241d",
       borderRadius: "2px",
     }
   }
   ```

### Inner component (`StripeForm`)

1. `PaymentElement` renders the card form (Stripe-hosted UI)
2. On submit: calls `stripe.confirmPayment({ redirect: "if_required" })`
   - `redirect: "if_required"` → handles 3DS inline without leaving the page
   - If 3DS redirect needed, Stripe redirects to `returnUrl` then back
3. On error: `mapStripeError(error.code, error.decline_code)` → user-friendly message
4. On success: polls backend status

---

## 6. Payment initiate body (Stripe)

```json
{
  "returnUrl": "http://localhost:3001/checkout/payment/stripe",
  "cancelUrl": "http://localhost:3001/checkout/payment/cancel",
  "idempotencyKey": "pay-{orderId}-1"
}
```

> ⚠️ `zonePaymentMethodId` is NOT sent in the body — backend reads it from the checkout session.  
> `returnUrl` for Stripe is the same stripe page (Stripe returns here after 3DS redirect).

---

## 7. Backend response (initiate) — Stripe shape

```json
{
  "paymentAction": "INLINE_CARD",
  "redirectUrl": null,
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentExecutionStatus": "SUCCESS",
  "metadata": {
    "publishableKey": "pk_test_...",
    "clientSecret": "pi_xxx_secret_xxx"
  }
}
```

**Guard before mounting Stripe:**
```ts
if (paymentExecutionStatus === "PENDING_PROVIDER_EXECUTION" || !clientSecret) {
  // Stripe not configured on backend — do NOT mount Elements
  // Show: "Payment temporarily unavailable. Contact support."
}
```

---

## 8. Polling after confirmPayment

**Function:** `pollUntilPaymentSettles(orderId)` in `orders.service.ts`

```ts
MAX_ATTEMPTS = 10
DELAY_MS     = 2000
// Total max wait = 20 seconds
```

| Poll result | FE action |
|---|---|
| `PAID` / `AUTHORIZED` | `router.push("/order-confirmation/:id")` |
| `DECLINED` | "Your card was declined. Please try another card." |
| `TIMEOUT` | "Payment received, check your email for confirmation." |
| `FAILED` / other | Soft message: "Couldn't confirm status. If charged, contact support before retrying." |

> ⚠️ **Known issue in dev:** Stripe webhook may not fire if ngrok is not running.  
> Stripe PaymentIntent can show `status: "succeeded"` but backend order stays `PENDING/FAILED`  
> because `payment_intent.succeeded` webhook was never delivered to the backend.

---

## 9. sessionStorage keys (Stripe-specific)

| Key | Value | Set when | Cleared when |
|---|---|---|---|
| `sa_stripe_client_secret` | `pi_xxx_secret_xxx` | After `INLINE_CARD` initiate | After poll completes (success or failure) |
| `sa_stripe_publishable_key` | `pk_test_...` | After `INLINE_CARD` initiate | Via `clearPaymentState()` |
| `sa_order_id` | Order UUID | After `placeOrder` | — |
| `sa_payment_transaction_id` | UUID | After initiate | Via `clearPaymentState()` |
| `sa_pay_attempt` | `"1"`, `"2"`, ... | First initiate | Via `clearPaymentState()` |

> `clientSecret` is NEVER stored in localStorage. sessionStorage only (tab-scoped, cleared on tab close).

---

## 10. Error message mapping

| Stripe `error.code` / `decline_code` | User sees |
|---|---|
| `insufficient_funds` | "Insufficient funds. Please try another card." |
| `card_declined` / `generic_decline` | "Your card was declined. Please try another card." |
| `expired_card` | "Your card has expired." |
| `incorrect_cvc` | "Incorrect CVC. Please check and try again." |
| `incorrect_number` / `invalid_number` | "Invalid card number. Please check and try again." |
| `processing_error` | "A processing error occurred. Please try again." |
| anything else | "Payment failed. Please try another card or contact your bank." |

---

## 11. Test cards (Stripe TEST mode)

| Result | Card number | Expiry | CVC |
|---|---|---|---|
| ✅ Success | `4242 4242 4242 4242` | Any future date | Any 3 digits |
| ❌ Declined | `4000 0000 0000 0002` | Any future date | Any 3 digits |
| 🔐 3DS required | `4000 0027 6000 3184` | Any future date | Any 3 digits |

ZIP: any 5 digits. Only use with `pk_test_...` publishable key.

---

## 12. Webhook issue in dev

Stripe confirms payment on their end, but backend order status stays `PENDING`/`FAILED` because the webhook isn't delivered.

**Fix:**
1. Install Stripe CLI: `stripe listen --forward-to http://localhost:3000/webhooks/payments/stripe`
2. Or use ngrok: expose backend port, add endpoint in Stripe Dashboard
3. Listen for: `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.requires_action`
4. Set `STRIPE_WEBHOOK_SECRET` in backend env and restart Nest

---

## 13. Routes summary

| Route | Component | When reached |
|---|---|---|
| `/checkout/payment/stripe` | `StripePaymentFormView` | After `INLINE_CARD` initiate — shows card form |
| `/checkout/payment/success` | `PaymentSuccessView` | After Paymob redirect return |
| `/checkout/payment/cancel` | `PaymentCancelView` | After Paymob cancel / user cancels |
| `/order-confirmation/:id` | `OrderConfirmationView` | After payment confirmed |

---

*Source files: `src/features/checkout/components/StripePaymentFormView.tsx`, `src/features/checkout/hooks/useCheckout.ts`, `src/features/checkout/utils/checkoutSession.ts`*
