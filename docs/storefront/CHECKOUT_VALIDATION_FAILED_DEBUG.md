# STOREFRONT_CHECKOUT_VALIDATION_FAILED — Debugging Guide

> **Error:** `STOREFRONT_CHECKOUT_VALIDATION_FAILED` · HTTP 422  
> **Endpoint:** `POST /storefront/orders/from-checkout`  
> **Last seen:** 2026-08-25

---

## What was just implemented (Paymob FE integration)

Before this error surfaced, the following was wired:

| Done | What |
|---|---|
| ✅ | `returnUrl` + `cancelUrl` added to `initiatePayment` body |
| ✅ | `zonePaymentMethodId` stored in `sessionStorage` before redirect (for retry) |
| ✅ | `sa_pay_attempt` counter added — incremented on each retry for idempotency key |
| ✅ | `/checkout/payment/success` page — polls `GET /payment-status`, redirects to confirmation |
| ✅ | `/checkout/payment/cancel` page — shows "cancelled" message, re-initiates payment with incremented attempt key |

The FE flow is now:  
`POST /validate` → check `isValid` → `POST /orders/from-checkout` → `POST /payment/initiate` → `window.location.href = redirectUrl` → Paymob → `/checkout/payment/success` → poll → `/order-confirmation/[id]`

---

## Why this error happens

`STOREFRONT_CHECKOUT_VALIDATION_FAILED` means `POST /orders/from-checkout` ran `assertCheckoutReadyForPlacement` internally — a **stricter** check than `POST /validate`. The FE calls validate and checks `isValid`, but the order endpoint can still reject if conditions change or if it validates additional constraints that `POST /validate` skips.

### The key disconnect

```
POST /validate        → "lighter" check — may return isValid: true even if some
                         delivery/payment checks are deferred
POST /orders/from-checkout → runs assertCheckoutReadyForPlacement — STRICTER
                              can 422 even after a "passing" validate
```

---

## Possible causes (ranked by likelihood)

### 1. `PRICE_MISSING` — most common in dev ⭐
Products in the dev catalogue have no price set for `zoneCode=UAE`.  
`/validate` may pass (price check is deferred), but `from-checkout` catches it.

**How to confirm:**  
Ask backend: _"Do all products in the dev catalogue have a price set for zone UAE / salesChannel platform_uae?"_

---

### 2. Delivery method not saved on the session
Our auto-select in `useCheckout` calls `POST /:id/delivery-method`, but the call is fire-and-forget (`catch {}` swallows errors). If it failed silently, the checkout session has no delivery method when `from-checkout` runs.

**How to confirm:**  
`GET /storefront/checkout/:checkoutSessionId` → check `selectedDeliveryMethod` — is it `null`?

**FE code location:**
```ts
// src/features/checkout/hooks/useCheckout.ts — loadMethods()
try {
  const updated = await selectDeliveryMethod(id, defDelivery.deliveryMethodId);
  setSession(updated);
} catch {
  // Non-critical — user can still pick manually   ← this catch is the risk
}
```

---

### 3. Payment method not saved on the session
Same as above — `POST /:id/payment-method` could have failed silently.  
`assertCheckoutReadyForPlacement` requires a payment method to be set.

**How to confirm:**  
`GET /storefront/checkout/:checkoutSessionId` → check `selectedPaymentMethod` — is it `null`?

---

### 4. Race condition — validate → place order gap
If time passes between `POST /validate` and `POST /orders/from-checkout` (e.g. slow network, user thinks), the checkout session can expire or inventory can drop to zero.

`POST /validate` returning `isValid: true` is only valid at that instant.

---

### 5. Address validation — stricter at placement
The FE sends `postalCode: "00000"` as a placeholder:
```ts
// src/features/checkout/hooks/useCheckout.ts
postalCode: "00000",
```
`assertCheckoutReadyForPlacement` may reject a dummy postal code even if `/validate` accepted it.

---

### 6. Checkout session already used / expired
If the same `checkoutSessionId` is submitted twice (e.g. double-click, StrictMode double-render), the second call fails because an order was already created from it.

---

## What the FE currently does

```
1. POST /:id/validate        → check isValid, surface errors to user
2. If isValid === true:
3.   POST /orders/from-checkout   ← 422 happens here
4.   POST /payment/initiate
5.   window.location.href = redirectUrl
```

The FE **does** guard against `isValid !== true` at step 2:
```ts
if (afterValidate.validation?.isValid !== true) {
  setErrorMsg(ISSUE_MESSAGES[blockingIssue.issueType] ?? blockingIssue.message ?? fallback);
  setStatus("ready");
  return;   // ← stops before placeOrder
}
```

But if `validate` returns `isValid: true` and `from-checkout` still rejects → the 422 is caught as a generic error:
```ts
} catch (e) {
  const msg = e instanceof ApiClientError ? e.message : "Something went wrong.";
  setErrorMsg(msg);
  setStatus("ready");
}
```

---

## Questions for backend team

```
Hi team,

We're hitting STOREFRONT_CHECKOUT_VALIDATION_FAILED (422) on
POST /storefront/orders/from-checkout even when POST /validate returns isValid: true.

Could you help us with:

1. Does POST /validate perform the same checks as assertCheckoutReadyForPlacement,
   or does from-checkout run additional checks? If different, can you list what
   from-checkout checks that validate does not?

2. Do all products in the dev catalogue have a valid price for
   zoneCode=UAE / salesChannelCode=platform_uae?

3. The 422 response has "errors": [] — can backend include the specific
   validation issues (issueType, severity, message) in the errors array
   so FE can surface a meaningful message to the user?

4. Does delivery method AND payment method both need to be explicitly set on
   the checkout session before from-checkout will accept it?

5. Is there a maximum time window between POST /validate and POST /from-checkout?

Request ID of the failing call: 50dff706-f2a9-4f60-b695-82788561354b
Checkout session: 907e103a-faf4-4571-af78-4752e3dfa34c
Timestamp: 2026-08-25T10:51:32.149Z
```

---

## Immediate workarounds to try

1. **Check checkout session state before submitting:**  
   Log `GET /checkout/:id` response just before `placeOrder` — confirm `selectedDeliveryMethod` and `selectedPaymentMethod` are not null.

2. **Ensure delivery + payment method auto-select succeeds:**  
   Temporarily remove the `catch {}` swallow in `loadMethods()` and log errors to see if selection is failing silently.

3. **Test with a product that has a confirmed price in UAE zone** to rule out `PRICE_MISSING`.

4. **Use a real postal code** (e.g. `"00000"` → ask backend for a valid UAE postal code or confirm it is not required).

---

*File location: `docs/storefront/CHECKOUT_VALIDATION_FAILED_DEBUG.md`*
