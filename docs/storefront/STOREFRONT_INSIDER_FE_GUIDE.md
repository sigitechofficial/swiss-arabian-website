# Insider — Frontend Integration & Testing Guide

**Repo:** swiss-arabian-website
**Backend companion:** swiss-arabian-backend
**As of:** 2026-08-28
**Status:** Backend live (`user_register` + `purchase` via BullMQ). Frontend SDK wired.

---

## 1. Golden Rules

- Never call `window.Insider` directly outside `src/lib/insider.ts`
- Insider failures must never break auth, cart, or checkout — all wrappers are `try/catch`
- `purchase` and `user_register` are **backend-only** — do NOT fire them from the frontend
- Events fire only when `INSIDER_ENABLED=true` AND `INSIDER_ACCOUNT_ID` is non-empty
- Add-to-cart Insider event fires **only after the cart API returns 200**, never on button click

---

## 2. Environment Variables (Frontend)

Add these to `.env.local`:

```bash
NEXT_PUBLIC_INSIDER_ENABLED=true
NEXT_PUBLIC_INSIDER_ACCOUNT_ID=<numeric id from ins.js?id=XXXXX>
NEXT_PUBLIC_INSIDER_SCRIPT_HOST=swissarabianuatnew.api.useinsider.com
```

**Rules:**

- `ACCOUNT_ID` is the number from `ins.js?id=XXXXX` in the Insider dashboard (Settings → Setup → Web SDK)
- Empty `ACCOUNT_ID` = no script loaded, no events fired (safe default)
- Backend API keys (`INSIDER_API_KEY`, `X-REQUEST-TOKEN`) stay backend-only — never in frontend env

---

## 3. Full Event Map

| # | Event | Who fires | When | API endpoint |
|---|---|---|---|---|
| 1 | `user_register` | **Backend (BullMQ)** | After customer registers | `/user/v1/upsert` |
| 2 | `identify` | **Frontend SDK** | Login / register / page refresh / email verify | Browser cookie stitch |
| 3 | `setItem` | **Frontend SDK** | Product detail page loaded | Browser |
| 4 | `addItem` | **Frontend SDK** | Cart API returns 200 | Browser |
| 5 | `logout` | **Frontend SDK** | `endSession()` called | Browser |
| 6 | `purchase` | **Backend (BullMQ)** | Order payment → PAID status | `/event/v1/collect` |

---

## 4. Frontend Events — Detailed

### 4.1 Identify (`identify`)

**Trigger:** Called from `stitchInsiderSession()` in `applyAuthSession.ts`

Fires on:

| Trigger | Path |
|---|---|
| Password login | `LoginPageView` → `applyAuthResult` |
| Email-code login | `LoginPageView` → `applyAuthResult` |
| Register | `RegisterPageView` → `applyAuthResult` |
| Session restore on refresh | `AuthSessionProvider` → `GET /storefront/customer/me` → `applyCustomerProfile` |
| Email verify | `VerifyPageView` → `applyCustomerProfile` |

**Payload sent:**

```typescript
{
  uuid: customer.id,                    // platform UUID
  email: customer.email,                // omitted if empty
  phone_number: customer.phoneE164,     // omitted if empty
  custom: {
    first_name: customer.firstName,
    last_name: customer.lastName,
    zone_code: "UAE",                   // hardcoded for now
    locale: "en"                        // hardcoded for now
  }
}
```

---

### 4.2 Product View (`setItem`)

**Trigger:** `ProductDetailPageView` useEffect when catalog data is loaded
**Re-fires:** When navigating to a different PDP
**Not fired:** On listing pages, search, or home browse

**Payload sent:**

```typescript
{
  id: data.variantId || data.id,
  sku: data.sku || data.variantId || data.id,
  name: data.title,
  unit_price: data.price ?? 0,
  unit_sale_price: data.price ?? 0,     // same value — no promo split yet
  currency: data.currency || "AED",
  taxonomy: [collectionName],           // featured collection or first collection, or []
  product_image_url: data.imageUrl,
  url: window.location.href,
  brand: data.brandName                 // omitted if empty
}
```

---

### 4.3 Add to Cart (`addItem`)

**Trigger:** `useAddToCart` hook — fires only in `.then()` after `POST /storefront/cart/items` returns 200
**Not fired:** On button click. If the API fails, no Insider event.

**Payload sent:**

```typescript
{
  id: payload.variantId,
  sku: payload.sku || payload.variantId,
  name: payload.title,
  quantity: 1,
  unit_price: payload.unitPrice,
  unit_sale_price: payload.unitPrice,
  currency: payload.currency,
  url: `${origin}/products/${slug}`,
  product_image_url: payload.imageUrl || "",
  taxonomy: [category] || [],
  brand: payload.brandName              // PDP only; not always passed from listing cards
}
```

**What each add-to-cart UI passes:**

| UI | sku | variantId | currency | brand |
|---|---|---|---|---|
| PDP | catalog SKU | catalog `variantId` | product currency (fallback AED) | `brandName` |
| `ProductCard` (catalog/home) | catalog SKU | catalog `variantId` | product currency (fallback AED) | not passed |
| Home Shaghaf / Best Sellers | **not passed** | static mock id | **hardcoded USD** | not passed |

> Home Shaghaf / Best Sellers use static IDs like `spot-oud-tonka`. These are known gaps — not blocking.

---

### 4.4 Logout (`track.logout`)

**Trigger:** First line of `endSession()`
**Covers all session-end paths:**

| Trigger | Path |
|---|---|
| User logout | `performLogout` / `performLogoutAll` |
| 401 after token refresh fails | `apiClient` |
| Account security sign-out | `AccountSecurityPageView` |
| Reset password | `ResetPasswordPageView` |

---

## 5. Backend Events — Fires Automatically (No FE Action Needed)

### 5.1 `user_register`

**Fires:** After every successful `POST /storefront/auth/register`
**Queue:** BullMQ — fire-and-forget, never blocks registration
**Sent to:** `POST https://unification.useinsider.com/api/user/v1/upsert`

**Payload includes:**

```typescript
{
  users: [{
    identifiers: {
      uuid: customerId,
      email: customer.email,
      phone_number: customer.phoneE164
    },
    attributes: {
      custom: {
        first_name, last_name,
        zone_code, locale, currency,
        registration_source: "PLATFORM",
        gdpr_optin,           // if consent provided
        sms_optin,            // if consent provided
        registered_at
      }
    },
    events: [{
      event_name: "user_register",
      timestamp: registeredAt,
      event_params: {
        zone_code: "UAE",
        registration_channel: "storefront"
      }
    }]
  }]
}
```

---

### 5.2 `purchase`

**Fires:** When order transitions to `PAID` for the first time
**Queue:** BullMQ — fire-and-forget, never blocks payment confirmation
**Sent to:** `POST https://unification.useinsider.com/api/event/v1/collect`

**Payload includes:**

```typescript
{
  users: [{
    identifiers: { uuid, email, phone_number },
    events: [{
      event_name: "purchase",
      timestamp: paidAt,
      event_params: {
        order_id,
        order_number,
        currency,
        total,
        subtotal,
        discount,
        tax,
        shipping_cost,
        payment_method,       // e.g. "stripe", "paymob"
        zone_code,
        items: [{
          product_id: variantId || sku,
          sku,
          name,
          quantity,
          unit_price,
          total,
          currency,
          taxonomy,           // product type
          brand               // brand name
        }]
      }
    }]
  }]
}
```

---

## 6. Complete User Flow

```
Guest opens any storefront page
  → ins.js loads (requires ACCOUNT_ID set)
  → anonymous Insider cookie assigned

Opens a Product Detail Page
  → setItem fires

Adds product to cart (API returns 200)
  → addItem fires

Adds to cart but API fails
  → NO Insider event (correct — do not fire on failure)

Logs in or registers
  → identify fires (frontend — browser cookie stitch)
  → user_register fires (backend BullMQ, on register only)

Page refresh while logged in
  → /storefront/customer/me called → identify fires again

Completes checkout, payment succeeds
  → payment webhook confirmed → order status → PAID
  → purchase fires (backend BullMQ)

Logs out / 401 session end
  → track.logout fires before tokens and store are cleared
```

---

## 7. Testing Checklist

### 7.1 Verify SDK Loads

1. Set `NEXT_PUBLIC_INSIDER_ENABLED=true` and `NEXT_PUBLIC_INSIDER_ACCOUNT_ID=<id>` in `.env.local`
2. Restart dev server
3. Open any storefront page
4. DevTools → Network tab → filter by `ins.js`
5. ✅ Request to `swissarabianuatnew.api.useinsider.com/ins.js?id=<your-id>` appears

---

### 7.2 Verify `identify`

1. Log in with any account
2. DevTools → Network tab → filter `useinsider` or `insider`
3. ✅ Request with identify payload appears after login
4. OR: DevTools → Console → type `window.Insider` → SDK object should be visible

---

### 7.3 Verify `setItem` (Product View)

1. Navigate to any Product Detail Page (`/products/:slug`)
2. DevTools → Network → Insider event request appears
3. ✅ Check payload: correct product ID, SKU, name, price, currency

---

### 7.4 Verify `addItem`

1. Add a product to cart from PDP
2. Wait for cart API `POST /storefront/cart/items` to return 200
3. DevTools → Network → Insider `addItem` request fires immediately after cart success
4. ✅ Check payload: correct variantId, SKU, quantity, price

---

### 7.5 Verify `logout`

1. Log out from any page
2. DevTools → Network → Insider `track.logout` request fires
3. ✅ Fires before tokens are cleared (should be the first Insider call in the logout sequence)

---

### 7.6 Verify `user_register` (Backend — confirm with backend team)

1. Register a new customer account
2. Ask backend team to check server logs:
   ```
   Insider [user_register] SUCCESS customerId=XXX status=200
   ```
3. ✅ In Insider dashboard → Contacts → search by email → profile appears

---

### 7.7 Verify `purchase` (Backend — confirm with backend team)

1. Complete a full order with payment (Stripe or Paymob)
2. Payment webhook received → order status transitions to `PAID`
3. Ask backend team to check server logs:
   ```
   Insider [purchase] SUCCESS customerId=XXX status=200
   ```
4. ✅ In Insider dashboard → Events → `purchase` event visible for that customer

---

## 8. Insider Dashboard — Where to Verify Events

| What to check | Dashboard path |
|---|---|
| Customer profiles | Contacts → search by email or phone |
| `user_register` event | Contacts → customer profile → Events tab |
| `purchase` event | Contacts → customer profile → Events tab |
| All events stream | Analytics → Events |
| Identify (cookie stitch) | Contacts → profile should show browser session linked |

---

## 9. Known Gaps (Not Blocking)

| Gap | Impact | Fix |
|---|---|---|
| Home Shaghaf / Best Sellers use static mock IDs | `addItem` Insider payload has non-D365 IDs | FE: wire real catalog data to those sections |
| `removeItem` not tracked | Cart removals not sent to Insider | FE: add `insiderRemoveFromCart()` call in `useCartMutations` |
| Quantity update not tracked | Cart `+/-` not sent | FE: add event after quantity update API success |
| `checkout_started` not tracked | Checkout funnel incomplete in Insider | FE: fire event on checkout session creation |
| Zone/locale hardcoded to UAE/en on `identify` | Multi-market identify not dynamic yet | FE: read from `MarketProvider` |
| Cookie/consent gate not implemented | SDK loads regardless of consent banner | FE: gate `ins.js` behind consent flag |

---

## 10. What NOT to Implement on Frontend

| Item | Reason |
|---|---|
| `track.purchase` call on order confirmation page | Backend-owned — backend BullMQ fires it on PAID |
| `user_register` API call from register page | Backend-owned — fires automatically after register API |
| Direct `window.Insider.*` calls anywhere | All calls must go through `src/lib/insider.ts` wrappers only |
| `INSIDER_API_KEY` in any `NEXT_PUBLIC_*` env var | Secret — backend-only, never expose to browser |
| Retry logic for failed Insider events | Handled by backend BullMQ with exponential backoff |

---

## 11. Backend Env Reference (For Context Only — Not FE)

```bash
INSIDER_ENABLED=true
INSIDER_PARTNER_NAME=swissarabianuatnew
INSIDER_API_KEY=<secret — backend .env only>
INSIDER_WORKER_ENABLED=true
INSIDER_API_BASE_URL=https://unification.useinsider.com/api
INSIDER_QUEUE_CONCURRENCY=3
INSIDER_MAX_RETRIES=5
INSIDER_RETRY_DELAY_MS=30000
INSIDER_LOG_PAYLOADS=true
```

> Frontend developers do not need and must not have access to `INSIDER_API_KEY`.
