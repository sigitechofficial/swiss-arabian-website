# Swiss Arabian — Paymob Payment Integration Guide for Frontend

> **Audience:** Frontend developer implementing the payment step of the storefront checkout flow.  
> **Scope:** Everything needed to integrate Paymob card payments — initiation, redirect, return handling, and status polling.  
> **Prerequisite:** Checkout + Orders guide wired — [`STOREFRONT_CHECKOUT_AND_ORDERS_FE_GUIDE.md`](./STOREFRONT_CHECKOUT_AND_ORDERS_FE_GUIDE.md). An `orderId` must already exist before starting this flow.  
> **Provider:** Paymob UAE — `https://uae.paymob.com`  
> **Payment method code:** `CARD` · Provider code: `paymob`

---

## 0. Golden rules

1. **Paymob is a redirect-based provider.** After payment initiation the FE receives a `redirectUrl` pointing to Paymob's hosted checkout page. The customer fills card details there — never on our storefront.
2. **Never handle card data.** All card entry happens on the Paymob-hosted page. The FE never sees PAN, CVV, or expiry.
3. **Payment confirmation comes from the backend webhook, not from the redirect return.** When Paymob redirects the customer back, the payment may still be processing. Always poll `GET /storefront/orders/:orderId/payment-status` to confirm final status.
4. **`redirectUrl` is single-use.** Once the customer completes or cancels on Paymob's page, do not reuse the same URL. Call payment initiate again for a new session.
5. **Send `returnUrl` and `cancelUrl`.** These are the URLs Paymob redirects the browser to after the customer completes or cancels on their hosted page.
6. **Send `zonePaymentMethodId`.** This must be included in the payment initiation body — get it from `checkoutSession.data.selectedPaymentMethod.zonePaymentMethodId`.
7. **All amounts are Decimal strings.** The backend converts to Paymob's integer cents format internally. The FE never does this conversion.

---

## 1. How Paymob works — full flow

```
FE: POST /storefront/orders/:orderId/payment/initiate
    body: { zonePaymentMethodId, returnUrl, cancelUrl, idempotencyKey }
        │
        ▼
Backend: calls Paymob Intention API → gets client_secret
Backend: builds redirect URL:
  https://uae.paymob.com/unifiedcheckout/?publicKey=...&clientSecret=...
        │
        ▼
FE receives: { paymentAction: "REDIRECT", redirectUrl: "https://uae.paymob.com/..." }
        │
        ▼
FE: window.location.href = redirectUrl   (hard browser redirect)
        │
        ▼ (customer is now on Paymob's hosted checkout page)

Customer: enters card details + completes 3DS if required
        │
        ├──► Success → Paymob redirects to: {returnUrl}?...params...
        └──► Cancel  → Paymob redirects to: {cancelUrl}?...params...
        │
        (in background, Paymob also sends server-to-server webhook to backend)
        │
        ▼
FE: customer lands on returnUrl page
FE: poll GET /storefront/orders/:orderId/payment-status
        │
        ├──► orderPaymentStatus = "PAID"       → show success screen
        ├──► orderPaymentStatus = "FAILED"     → show failure + retry option
        └──► orderPaymentStatus = "PENDING"    → keep polling (max 10 attempts)
```

---

## 2. Step-by-step implementation

### Step 1 — Get `zonePaymentMethodId` from checkout session

After the customer selects a payment method during checkout, the checkout session contains:

```ts
// From GET /storefront/checkout/:id or after POST /:id/payment-method
const checkoutSession = response.data; // CheckoutSessionResponse

const zonePaymentMethodId = checkoutSession.selectedPaymentMethod?.zonePaymentMethodId;
// e.g. "3fa85f64-5717-4562-b3fc-2c963f66afa6"

// Store it — you need it at payment initiation
sessionStorage.setItem('sa_zone_payment_method_id', zonePaymentMethodId!);
```

**Also store the `orderId` after placing the order:**

```ts
const order = response.data; // OrderResponse from POST /orders/from-checkout
sessionStorage.setItem('sa_order_id', order.orderId);
sessionStorage.setItem('sa_order_number', order.orderNumber ?? '');
```

---

### Step 2 — Define your return and cancel URLs

These are the URLs on your storefront that Paymob redirects back to:

```ts
const BASE_URL = 'https://your-storefront.com'; // or window.location.origin

const returnUrl = `${BASE_URL}/checkout/payment/success`;
const cancelUrl = `${BASE_URL}/checkout/payment/cancel`;
```

The `returnUrl` page must call `GET /storefront/orders/:orderId/payment-status` to confirm actual payment status — the redirect alone does not confirm payment.

---

### Step 3 — Initiate payment

```
POST /storefront/orders/:orderId/payment/initiate
     ?guestToken=...   (guest only)
```

**Request body:**

```json
{
  "zonePaymentMethodId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "returnUrl": "https://your-storefront.com/checkout/payment/success",
  "cancelUrl": "https://your-storefront.com/checkout/payment/cancel",
  "idempotencyKey": "pay-ORDER_ID-1"
}
```

| Field | Required | Notes |
|---|---|---|
| `zonePaymentMethodId` | **Yes** | UUID from `checkoutSession.selectedPaymentMethod.zonePaymentMethodId` |
| `returnUrl` | Strongly recommended | Where Paymob redirects after success — your storefront URL |
| `cancelUrl` | Strongly recommended | Where Paymob redirects after cancel |
| `idempotencyKey` | Recommended | Prevents duplicate payment sessions on retry. Use `"pay-{orderId}-{attempt}"` |
| `guestToken` | Query param (guest) | Same token used throughout the session |

**Success response:**

```json
{
  "success": true,
  "data": {
    "orderId": "bc70095c-08c6-4640-bb47-c9355a245c7a",
    "paymentTransactionId": "uuid",
    "paymentAttemptId": "uuid",
    "paymentStatus": "PENDING",
    "paymentMethod": {
      "providerCode": "paymob",
      "methodCode": "CARD"
    },
    "providerCode": "paymob",
    "amount": "315.00",
    "currency": "AED",
    "paymentExecutionStatus": "SUCCESS",
    "paymentAction": "REDIRECT",
    "redirectUrl": "https://uae.paymob.com/unifiedcheckout/?publicKey=YOUR_PK&clientSecret=...",
    "clientSecret": null,
    "requiresProviderExecution": true,
    "providerExecutionAvailable": true,
    "outboxEventId": "uuid",
    "warnings": [],
    "metadata": null
  }
}
```

---

### Step 4 — Handle the response and redirect

```ts
async function initiatePayment(orderId: string, guestToken?: string) {
  const zonePaymentMethodId = sessionStorage.getItem('sa_zone_payment_method_id');
  const attempt = sessionStorage.getItem('sa_pay_attempt') ?? '1';

  const response = await api.post(
    `/storefront/orders/${orderId}/payment/initiate`,
    {
      zonePaymentMethodId,
      returnUrl: `${window.location.origin}/checkout/payment/success`,
      cancelUrl: `${window.location.origin}/checkout/payment/cancel`,
      idempotencyKey: `pay-${orderId}-${attempt}`,
    },
    { params: guestToken ? { guestToken } : {} },
  );

  const payment = response.data;

  if (payment.paymentAction === 'REDIRECT' && payment.redirectUrl) {
    // Store transaction ID for later status lookup
    sessionStorage.setItem('sa_payment_transaction_id', payment.paymentTransactionId);
    sessionStorage.setItem('sa_order_id', orderId);

    // Hard redirect to Paymob hosted checkout
    window.location.href = payment.redirectUrl;

  } else if (payment.paymentExecutionStatus === 'PENDING_PROVIDER_EXECUTION') {
    // Backend execution not yet enabled — show error/contact support
    console.error('Payment execution not configured:', payment.warnings);
    showError('Payment is temporarily unavailable. Please contact support.');

  } else {
    // Unexpected — log and handle
    console.error('Unexpected payment state:', payment);
  }
}
```

---

### Step 5 — Handle return from Paymob (success/cancel page)

When Paymob redirects the customer back to your `returnUrl` or `cancelUrl`, it may append query params like `?success=true&txnResponseCode=APPROVED` — but **do not rely on these** for payment confirmation. They are informational only. Always poll the backend.

**On your return page (`/checkout/payment/success`):**

```ts
// On mount / page load
async function handlePaymentReturn() {
  const orderId = sessionStorage.getItem('sa_order_id');
  const guestToken = localStorage.getItem('sa_guest_token');

  if (!orderId) {
    router.push('/'); // Lost context — go home
    return;
  }

  showLoadingSpinner();
  const result = await pollPaymentStatus(orderId, guestToken ?? undefined);

  if (result.success) {
    // Clear payment session state
    sessionStorage.removeItem('sa_zone_payment_method_id');
    sessionStorage.removeItem('sa_payment_transaction_id');
    localStorage.removeItem('sa_cart_id'); // Cart already consumed

    router.push(`/order-confirmation/${orderId}`);
  } else {
    showPaymentError(result.status);
    // Offer retry option
  }
}
```

**On your cancel page (`/checkout/payment/cancel`):**

```ts
async function handlePaymentCancel() {
  const orderId = sessionStorage.getItem('sa_order_id');
  // Order is NOT cancelled — only the payment session was abandoned
  // Customer can retry payment
  showMessage('Payment was cancelled. You can try again.');
  router.push(`/checkout/retry-payment/${orderId}`);
}
```

---

### Step 6 — Poll payment status

```
GET /storefront/orders/:orderId/payment-status
    ?guestToken=...   (guest only)
```

```ts
async function pollPaymentStatus(
  orderId: string,
  guestToken?: string,
): Promise<{ success: boolean; status: string }> {
  const MAX_ATTEMPTS = 12;
  const DELAY_MS = 2500;

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

    // PENDING — wait and retry
    if (attempt < MAX_ATTEMPTS - 1) {
      await sleep(DELAY_MS);
    }
  }

  // Timed out — treat as pending, show "check your email" fallback
  return { success: false, status: 'TIMEOUT' };
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
```

---

### Step 7 — Order confirmation page

```
GET /storefront/orders/:orderId
    ?guestToken=...   (guest only)
```

Use the existing order response to render the confirmation page. See [`STOREFRONT_CHECKOUT_AND_ORDERS_FE_GUIDE.md`](./STOREFRONT_CHECKOUT_AND_ORDERS_FE_GUIDE.md) §5.2 for the full response shape.

---

## 3. `paymentExecutionStatus` values

| Value | Meaning | FE action |
|---|---|---|
| `SUCCESS` | Paymob was called, `redirectUrl` is ready | Redirect immediately |
| `PENDING_PROVIDER_EXECUTION` | Paymob NOT called yet (backend config issue) | Show error — do not redirect |

---

## 4. `orderPaymentStatus` values (from payment-status endpoint)

| Value | Meaning | FE action |
|---|---|---|
| `PENDING` | Payment initiated, not confirmed | Keep polling |
| `AUTHORIZED` | Payment hold placed | Show success (backend captures later) |
| `PAID` | Payment confirmed | Show success, go to confirmation |
| `FAILED` | Payment failed | Show failure, offer retry |
| `DECLINED` | Declined by card issuer / Paymob | Show specific decline message, offer retry |
| `CANCELLED` | Payment was cancelled | Show cancelled state, offer retry |
| `REFUNDED` | Order was refunded | Show refund state |

---

## 5. Retry payment flow

If payment fails or the customer cancels, the order is NOT cancelled. The customer can retry:

```ts
async function retryPayment(orderId: string, guestToken?: string) {
  // Increment attempt counter for idempotency key
  const currentAttempt = Number(sessionStorage.getItem('sa_pay_attempt') ?? '1');
  sessionStorage.setItem('sa_pay_attempt', String(currentAttempt + 1));

  // Call initiate again with a fresh idempotencyKey
  await initiatePayment(orderId, guestToken);
}
```

The backend will create a new payment transaction for the new attempt. The previous failed transaction is not reused.

---

## 6. TypeScript interfaces

```ts
interface InitiatePaymentBody {
  zonePaymentMethodId: string;
  returnUrl?: string;
  cancelUrl?: string;
  idempotencyKey?: string;
  paymentMethodId?: string;   // optional — use zonePaymentMethodId instead
  metadata?: Record<string, unknown>;
}

interface PaymentInitiationResponse {
  orderId: string;
  paymentTransactionId: string;
  paymentAttemptId: string | null;
  paymentStatus: string;
  paymentMethod: {
    providerCode: string;   // "paymob"
    methodCode: string;     // "CARD"
  };
  providerCode: string;
  amount: string;           // Decimal string e.g. "315.00"
  currency: string;         // "AED"
  paymentExecutionStatus: 'SUCCESS' | 'PENDING_PROVIDER_EXECUTION';
  paymentAction: 'REDIRECT' | null;
  redirectUrl: string | null;  // Paymob hosted checkout URL — redirect here
  clientSecret: string | null; // Not used for Paymob card redirect flow
  requiresProviderExecution: boolean;
  providerExecutionAvailable: boolean;
  outboxEventId: string | null;
  warnings: string[];
  metadata?: Record<string, unknown> | null;
}

interface PaymentStatusResponse {
  orderId: string;
  orderPaymentStatus: 'PENDING' | 'AUTHORIZED' | 'PAID' | 'FAILED' | 'DECLINED' | 'CANCELLED' | 'REFUNDED';
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

## 7. sessionStorage keys for this flow

| Key | Value | Set when | Clear when |
|---|---|---|---|
| `sa_zone_payment_method_id` | UUID | After checkout payment method selected | After payment confirmed |
| `sa_order_id` | Order UUID | After order placed | After order confirmation rendered |
| `sa_order_number` | e.g. `SA-10001` | After order placed | After confirmation |
| `sa_payment_transaction_id` | UUID | After initiate, before redirect | After status confirmed |
| `sa_pay_attempt` | `"1"`, `"2"`, etc. | First initiate call | After payment confirmed |

---

## 8. Error handling

| HTTP | Code | When | FE action |
|---|---|---|---|
| `400` | `PAYMENT_METHOD_VALIDATION_FAILED` | `zonePaymentMethodId` not found or invalid | Check field is sent correctly |
| `400` | `VALIDATION_ERROR` | `zonePaymentMethodId` missing/wrong type | Add to request body |
| `400` | `ORDER_NOT_PAYABLE` | Order already paid or cancelled | Show appropriate message |
| `403` | `FORBIDDEN` | Order belongs to different session | Re-authenticate |
| `404` | `RESOURCE_NOT_FOUND` | Order not found | Redirect to home |
| `422` | `BUSINESS_RULE_FAILED` | General business rule violation | Show error message |

---

## 9. `warnings` array in initiate response

The `warnings` array is informational — log it, do not show raw strings to users.

| Warning content | Meaning |
|---|---|
| `"Payment provider adapter is not registered..."` | Paymob env vars missing — backend config issue |
| `"Provider adapter is registered but sync execution did not run..."` | `PAYMENT_EXECUTION_PROVIDER_CALLS_ENABLED` is off — backend config issue |

If `warnings` is non-empty AND `redirectUrl` is still null → **do not redirect**, show a support message.

---

## 10. Complete drop-in API module

```ts
// paymobPaymentApi.ts

const API_BASE = process.env.VITE_API_BASE_URL; // or your env var

async function post<T>(path: string, body: unknown, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const token = localStorage.getItem('sa_auth_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url.toString(), { method: 'POST', headers, body: JSON.stringify(body) });
  const json = await res.json();
  if (!json.success) throw json;
  return json.data as T;
}

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const token = localStorage.getItem('sa_auth_token');
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url.toString(), { headers });
  const json = await res.json();
  if (!json.success) throw json;
  return json.data as T;
}

export const paymobApi = {
  initiate: (
    orderId: string,
    body: InitiatePaymentBody,
    guestToken?: string,
  ) =>
    post<PaymentInitiationResponse>(
      `/storefront/orders/${orderId}/payment/initiate`,
      body,
      guestToken ? { guestToken } : undefined,
    ),

  getPaymentStatus: (orderId: string, guestToken?: string) =>
    get<PaymentStatusResponse>(
      `/storefront/orders/${orderId}/payment-status`,
      guestToken ? { guestToken } : undefined,
    ),
};
```

---

## 11. Acceptance checklist

- [ ] `zonePaymentMethodId` stored from checkout session and sent in initiate body
- [ ] `returnUrl` and `cancelUrl` set to real storefront pages
- [ ] `idempotencyKey` unique per attempt (`"pay-{orderId}-{attempt}"`)
- [ ] `paymentAction === 'REDIRECT'` → `window.location.href = redirectUrl` (not `router.push`)
- [ ] `paymentExecutionStatus === 'PENDING_PROVIDER_EXECUTION'` → show error, do NOT redirect
- [ ] Return page polls `GET /payment-status` before showing success/failure
- [ ] Polling has max attempts + delay (do not infinite-loop)
- [ ] `PAID` / `AUTHORIZED` → success screen
- [ ] `FAILED` / `DECLINED` → error screen with retry button
- [ ] `PENDING` after all poll attempts → "Check your email, we'll notify you"
- [ ] Retry uses incremented `idempotencyKey` (e.g. `pay-{orderId}-2`)
- [ ] `warnings` array logged to console — never shown raw to user
- [ ] Guest token sent as query param on both initiate and payment-status
- [ ] `sa_cart_id` cleared from localStorage after order is confirmed paid

---

## 12. Agent prompt snippet

```
You are integrating Paymob card payments into the Swiss Arabian storefront.
Read:
- docs/storefront/STOREFRONT_PAYMOB_PAYMENT_FE_GUIDE.md  (this guide)
- docs/storefront/STOREFRONT_CHECKOUT_AND_ORDERS_FE_GUIDE.md  (prerequisite — order must exist)

Paymob is a redirect provider. The flow is:
1. POST /storefront/orders/:orderId/payment/initiate
   body: { zonePaymentMethodId, returnUrl, cancelUrl, idempotencyKey }
2. If paymentAction === "REDIRECT" → window.location.href = redirectUrl
3. Customer completes payment on Paymob hosted page
4. Customer returns to returnUrl / cancelUrl
5. Poll GET /storefront/orders/:orderId/payment-status until PAID/FAILED

Key rules:
- zonePaymentMethodId is REQUIRED — get from checkoutSession.selectedPaymentMethod.zonePaymentMethodId
- Hard browser redirect only (window.location.href) — not router.push
- Never rely on Paymob redirect query params for payment confirmation — always poll backend
- All amounts are Decimal strings — never parseFloat for money
- guestToken as query param when no Bearer token
```

---

*Derived from `src/modules/payments/providers/paymob/paymob.adapter.ts`, `paymob.mapper.ts`, `paymob.config.ts`, and the storefront payment orchestrator. Align with Swagger at `/api/docs` if shapes drift.*
