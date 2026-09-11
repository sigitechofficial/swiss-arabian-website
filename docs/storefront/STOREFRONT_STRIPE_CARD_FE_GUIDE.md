# Swiss Arabian — Stripe Card Payment Integration Guide for Frontend

> **Audience:** Frontend developer implementing the payment step of the storefront checkout flow.  
> **Scope:** Stripe PaymentIntents — inline card form (Stripe.js / Payment Element), initiation, confirmPayment, and status polling.  
> **Prerequisite:** Checkout + Orders guide wired — [`STOREFRONT_CHECKOUT_AND_ORDERS_FE_GUIDE.md`](./STOREFRONT_CHECKOUT_AND_ORDERS_FE_GUIDE.md). An `orderId` must already exist before starting this flow.  
> **Related:** Paymob redirect flow — [`STOREFRONT_PAYMOB_PAYMENT_FE_GUIDE.md`](./STOREFRONT_PAYMOB_PAYMENT_FE_GUIDE.md).  
> **Provider:** Stripe PaymentIntents API  
> **Payment method code:** `stripe_card` · Provider code: `stripe`

---

## 0. Golden rules

1. **Never redirect for Stripe.** Stripe is an **inline** flow. `redirectUrl` is `null`. Do not send the customer to a hosted Stripe Checkout page.
2. **Always read `redirectUrl` first.** If it is populated, follow that provider (Paymob). If it is `null` and `providerCode === "stripe"`, initialize Stripe.js.
3. **`paymentAction === "INLINE_CARD"`** means render Stripe Elements / Payment Element — not a redirect link.
4. **`clientSecret` is single-use.** Do not persist it in localStorage, logs, or analytics. Use it only to create Elements and call `confirmPayment`.
5. **`publishableKey` comes from the initiate response** (`metadata.publishableKey`). It is not a secret. Do not hardcode `pk_test_…` in the frontend.
6. **Payment confirmation comes from the backend webhook, not from `confirmPayment` alone.** After `confirmPayment` resolves without error, poll `GET /storefront/orders/:orderId/payment-status` until `PAID` or `FAILED`.
7. **Send `zonePaymentMethodId`.** Get it from `GET /storefront/checkout/:id/payment-methods` (`stripe_card`, `requiresRedirect: false`).
8. **All amounts are Decimal strings.** The backend converts to Stripe integer cents. The FE never multiplies by 100.
9. **Never handle raw PAN/CVV yourself.** Stripe Elements collect card data. The FE never POSTs card numbers to our API.

---

## 1. How Stripe differs from Paymob

| | Paymob | Stripe |
|---|---|---|
| Flow | Redirect to hosted page | Inline card form (Stripe.js) |
| `paymentAction` | `REDIRECT` | `INLINE_CARD` |
| `redirectUrl` | populated | `null` |
| `clientSecret` | `null` | populated |
| `metadata.publishableKey` | n/a | `pk_test_…` / `pk_live_…` |
| FE renders | nothing (just redirect) | Stripe Elements / Payment Element |
| Webhook | HMAC query param | HMAC `Stripe-Signature` header + raw body |

```
FE: POST /storefront/orders/:orderId/payment/initiate
    body: { zonePaymentMethodId, returnUrl, idempotencyKey }
        │
        ▼
Backend: POST https://api.stripe.com/v1/payment_intents
Backend: returns client_secret + publishableKey in metadata
        │
        ▼
FE receives: {
  paymentAction: "INLINE_CARD",
  redirectUrl: null,
  clientSecret: "pi_xxx_secret_xxx",
  metadata: { publishableKey: "pk_test_...", clientSecret: "pi_xxx_secret_xxx" }
}
        │
        ▼
FE: Stripe(publishableKey) → elements({ clientSecret }) → mount PaymentElement
FE: stripe.confirmPayment({ elements, confirmParams: { return_url }, redirect: "if_required" })
        │
        ├──► error → show message, stay on page
        └──► no error → poll GET /storefront/orders/:orderId/payment-status
        │
        (in background, Stripe POSTs /webhooks/payments/stripe → order PAID / FAILED)
        │
        ▼
        ├──► orderPaymentStatus = "PAID"    → success screen
        ├──► orderPaymentStatus = "FAILED"  → failure + retry
        └──► still PENDING after 30s        → "check your email"
```

---

## 2. Step-by-step checkout flow for Stripe

### Wave 1 — Session setup (same as Paymob)

**a.** `POST /storefront/checkout/from-cart`

**b.** `POST /storefront/checkout/:id/address`

**c.** `GET /storefront/checkout/:id/delivery-methods` → pick one

**d.** `POST /storefront/checkout/:id/delivery-method`

**e.** `GET /storefront/checkout/:id/payment-methods`  
Find `stripe_card` where `requiresRedirect: false`. Store `zonePaymentMethodId`.

```ts
const methods = paymentMethodsResponse.data; // PaymentMethodItem[]
const stripeMethod = methods.find(
  (m) => m.providerCode === 'stripe' && m.methodCode === 'stripe_card',
);
if (!stripeMethod || stripeMethod.requiresRedirect) {
  throw new Error('Stripe Payment is not available for this checkout');
}
sessionStorage.setItem('sa_zone_payment_method_id', stripeMethod.zonePaymentMethodId);
```

**f.** `POST /storefront/checkout/:id/payment-method` with `{ zonePaymentMethodId }`

**g.** `POST /storefront/checkout/:id/validate` → confirm `isValid: true`

---

### Wave 2 — Order and payment

**h.** Place order

```
POST /storefront/orders/from-checkout
```

```json
{
  "checkoutSessionId": "uuid",
  "idempotencyKey": "order-CHECKOUT_ID-1"
}
```

Store `orderId` from `response.data`.

**i.** Initiate Stripe PaymentIntent

```
POST /storefront/orders/:orderId/payment/initiate
     ?guestToken=...   (guest only)
```

```json
{
  "zonePaymentMethodId": "uuid",
  "returnUrl": "https://your-storefront.com/checkout/payment/return",
  "idempotencyKey": "pay-ORDER_ID-1"
}
```

`returnUrl` is used by Stripe.js if a redirect (3DS) is required. Use `window.location.href` (or origin + path).

**Success `data`:**

```json
{
  "orderId": "uuid",
  "paymentTransactionId": "uuid",
  "paymentAttemptId": "uuid",
  "paymentStatus": "PENDING",
  "paymentMethod": {
    "providerCode": "stripe",
    "methodCode": "stripe_card"
  },
  "providerCode": "stripe",
  "amount": "315.00",
  "currency": "AED",
  "paymentExecutionStatus": "SUCCESS",
  "paymentAction": "INLINE_CARD",
  "redirectUrl": null,
  "clientSecret": "pi_xxx_secret_xxx",
  "requiresProviderExecution": true,
  "providerExecutionAvailable": true,
  "outboxEventId": "uuid",
  "warnings": [],
  "metadata": {
    "publishableKey": "pk_test_...",
    "clientSecret": "pi_xxx_secret_xxx"
  }
}
```

If `paymentExecutionStatus === "PENDING_PROVIDER_EXECUTION"` or `clientSecret` is null → do **not** mount Stripe.js. Show a support message (`warnings` is for logs only).

---

### Wave 3 — Stripe.js

**j.** Load Stripe.js once:

```html
<script src="https://js.stripe.com/v3/"></script>
```

**k–n.** Mount Payment Element and confirm:

```ts
async function startStripePayment(payment: PaymentInitiationResponse) {
  const publishableKey =
    payment.metadata?.publishableKey ?? payment.metadata?.publishable_key;
  const clientSecret = payment.clientSecret ?? payment.metadata?.clientSecret;

  if (typeof publishableKey !== 'string' || !publishableKey) {
    showError('Payment is temporarily unavailable. Please contact support.');
    return;
  }
  if (typeof clientSecret !== 'string' || !clientSecret) {
    showError('Payment is temporarily unavailable. Please contact support.');
    return;
  }

  const stripe = Stripe(publishableKey);
  const elements = stripe.elements({ clientSecret });
  const paymentElement = elements.create('payment');
  paymentElement.mount('#payment-element');

  const form = document.getElementById('payment-form') as HTMLFormElement;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: paymentReturnUrl(), // same origin as initiate returnUrl
      },
      redirect: 'if_required',
    });

    if (error) {
      showError(mapStripeJsError(error));
      return;
    }

    await pollPaymentStatus(payment.orderId);
  });
}

function paymentReturnUrl() {
  return `${window.location.origin}/checkout/payment/return`;
}
```

**o.** If `error` → show the message. Stay on the page. Do not treat the order as paid.

**p.** If no error → poll:

```
GET /storefront/orders/:orderId/payment-status
    ?guestToken=...   (guest only)
```

Every **2 seconds**, max **30 seconds** (15 attempts), until `orderPaymentStatus` is `PAID` or `FAILED`.

```ts
async function pollPaymentStatus(
  orderId: string,
  guestToken?: string,
): Promise<{ success: boolean; status: string }> {
  const MAX_ATTEMPTS = 15;
  const DELAY_MS = 2000;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const response = await api.get(
      `/storefront/orders/${orderId}/payment-status`,
      { params: guestToken ? { guestToken } : {} },
    );

    const status = response.data.orderPaymentStatus;

    if (status === 'PAID' || status === 'AUTHORIZED') {
      return { success: true, status };
    }
    if (status === 'FAILED' || status === 'DECLINED' || status === 'CANCELLED') {
      return { success: false, status };
    }
    if (attempt < MAX_ATTEMPTS - 1) {
      await sleep(DELAY_MS);
    }
  }

  return { success: false, status: 'TIMEOUT' };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
```

**3DS / redirect:** with `redirect: 'if_required'`, some cards leave the page and return to `return_url`. On that return page, still poll `/payment-status` — do not trust query params.

---

## 3. TypeScript interfaces

```ts
interface PaymentMethodItem {
  zonePaymentMethodId: string;
  paymentMethodId?: string;
  paymentProviderId?: string;
  providerCode: string;          // "stripe" | "paymob" | …
  methodCode: string;            // "stripe_card" | …
  displayName: string;           // "Stripe Payment"
  isEnabled?: boolean;
  isDefault?: boolean;
  isTestMode?: boolean | null;
  requiresRedirect: boolean;     // false for Stripe
  reason?: string | null;
}

interface StripeMetadata {
  publishableKey?: string;       // pk_test_… — initialize Stripe.js
  clientSecret?: string;         // same as top-level clientSecret (compat)
  [key: string]: unknown;
}

interface PaymentInitiationResponse {
  orderId: string;
  paymentTransactionId: string;
  paymentAttemptId?: string | null;
  paymentStatus: string;
  paymentMethod: {
    providerCode: string;
    methodCode: string;
  };
  providerCode: string;
  amount: string;
  currency: string;
  paymentExecutionStatus: 'SUCCESS' | 'PENDING_PROVIDER_EXECUTION' | string;
  paymentAction: 'INLINE_CARD' | 'REDIRECT' | null;
  redirectUrl: string | null;    // null for Stripe
  clientSecret: string | null;   // pi_…_secret_… for Stripe
  requiresProviderExecution: boolean;
  providerExecutionAvailable: boolean;
  outboxEventId?: string | null;
  warnings: string[];
  metadata?: StripeMetadata | null;
}

interface PaymentStatusResponse {
  orderId: string;
  orderPaymentStatus:
    | 'PENDING'
    | 'AUTHORIZED'
    | 'PAID'
    | 'FAILED'
    | 'DECLINED'
    | 'CANCELLED'
    | 'REFUNDED'
    | string;
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

## 4. Error codes and UX

| Code / case | User-facing copy |
|---|---|
| `STRIPE_CARD_DECLINED` | Your card was declined. Please try another card. |
| `STRIPE_INSUFFICIENT_FUNDS` | Insufficient funds. |
| `STRIPE_NETWORK_ERROR` | Network error — please try again. |
| `STOREFRONT_CHECKOUT_VALIDATION_FAILED` | Your cart changed. Please review and retry. |
| `PAYMENT_METHOD_VALIDATION_FAILED` | Payment method unavailable. Please refresh. |
| Stripe.js `card_declined` | Your card was declined. Please try another card. |
| Stripe.js `insufficient_funds` | Insufficient funds. |
| Poll timeout (30s) | Payment is taking longer than expected. Check your email. |

Map Stripe.js `error.code` / `error.decline_code` to the same copy. Do not show raw Stripe or backend `warnings` strings.

| HTTP | Code | FE action |
|---|---|---|
| `400` | `PAYMENT_METHOD_VALIDATION_FAILED` | Refresh payment methods |
| `400` | `ORDER_NOT_PAYABLE` | Order already paid or cancelled |
| `403` | `FORBIDDEN` | Re-authenticate |
| `404` | `RESOURCE_NOT_FOUND` | Redirect home |
| `422` | `BUSINESS_RULE_FAILED` | Show `message` from envelope |

---

## 5. Webhook flow (FE awareness only)

The backend owns webhooks. The FE must **not** wait for a browser callback from Stripe Dashboard.

```
Stripe → POST /webhooks/payments/stripe
  → HMAC verified using Stripe-Signature + exact raw body
     (Nest rawBody: true — do not re-serialize JSON)
  → payment_intent.succeeded     → order PAID
  → payment_intent.payment_failed → order FAILED
```

FE relies on polling `GET /storefront/orders/:orderId/payment-status`.

---

## 6. Local test cards (Stripe TEST)

| Result | Number | Expiry | CVC |
|---|---|---|---|
| Success | `4242 4242 4242 4242` | any future MM/YY | any 3 digits |
| Decline | `4000 0000 0000 0002` | any future MM/YY | any 3 digits |
| 3DS required | `4000 0027 6000 3184` | any future MM/YY | any 3 digits |

ZIP / postal: any 5 digits. Use **TEST** `pk_test_…` from `metadata.publishableKey` only.

---

## 7. Local webhook testing

Public endpoint (current ngrok tunnel to local Nest `:3000`):

```
https://barbra-beneficent-jannette.ngrok-free.dev/webhooks/payments/stripe
```

Stripe Dashboard → Developers → Webhooks → Add endpoint. Listen for:

- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.requires_action`

Paste that endpoint’s `whsec_…` into `STRIPE_WEBHOOK_SECRET` and **restart Nest**.

Do not mix Dashboard `whsec_` with Stripe CLI `stripe listen` secrets.

---

## 8. `paymentExecutionStatus` / `orderPaymentStatus`

| `paymentExecutionStatus` | Meaning | FE action |
|---|---|---|
| `SUCCESS` | PaymentIntent created, `clientSecret` ready | Mount Stripe.js |
| `PENDING_PROVIDER_EXECUTION` | Stripe API not called (env/flag) | Show error — do not mount Elements |

| `orderPaymentStatus` | FE action |
|---|---|
| `PENDING` | Keep polling |
| `AUTHORIZED` / `PAID` | Success / confirmation |
| `FAILED` / `DECLINED` | Failure + retry |
| `CANCELLED` | Offer retry (order is not deleted) |

Retry: increment `idempotencyKey` (`pay-{orderId}-2`) and call initiate again. Do not reuse the old `clientSecret`.

---

## 9. sessionStorage keys

| Key | Set when | Clear when |
|---|---|---|
| `sa_zone_payment_method_id` | After selecting `stripe_card` | After `PAID` |
| `sa_order_id` | After place order | After confirmation |
| `sa_payment_transaction_id` | After initiate | After status confirmed |
| `sa_pay_attempt` | Each initiate | After `PAID` |

Do **not** store `clientSecret` or `publishableKey` in localStorage. Keep `clientSecret` in memory for the payment page only.

---

## 10. Acceptance checklist

- [ ] `GET …/payment-methods` → pick `stripe` / `stripe_card` with `requiresRedirect: false`
- [ ] `zonePaymentMethodId` sent on initiate
- [ ] `paymentAction === "INLINE_CARD"` → mount Payment Element (never `window.location.href` for Stripe)
- [ ] `Stripe(metadata.publishableKey)` — no hardcoded publishable key
- [ ] `confirmPayment` with `redirect: "if_required"`
- [ ] Poll `/payment-status` every 2s, max 30s
- [ ] `PAID` → confirmation; `FAILED` → retry with new idempotency key
- [ ] Timeout copy: payment taking longer, check email
- [ ] Guest: `guestToken` query param on initiate and payment-status
- [ ] Never log `clientSecret`

---

## 11. Agent prompt snippet

```
You are integrating Stripe card payments into the Swiss Arabian storefront.
Read:
- docs/storefront/STOREFRONT_STRIPE_CARD_FE_GUIDE.md
- docs/storefront/STOREFRONT_CHECKOUT_AND_ORDERS_FE_GUIDE.md

Stripe is INLINE (not Paymob redirect):
1. GET /storefront/checkout/:id/payment-methods → stripe_card, requiresRedirect false
2. Place order, then POST /storefront/orders/:orderId/payment/initiate
3. If paymentAction === INLINE_CARD:
   Stripe(metadata.publishableKey)
   elements({ clientSecret })
   confirmPayment({ redirect: "if_required" })
4. Poll GET /storefront/orders/:orderId/payment-status until PAID/FAILED (2s, max 30s)

Never redirect for Stripe. Never hardcode pk_test. Never store clientSecret.
```

---

*Derived from `src/modules/payments/providers/stripe/` and the storefront payment orchestrator. Align with Swagger at `/api/docs` if shapes drift. Live payment-status path is `GET /storefront/orders/:orderId/payment-status`.*
