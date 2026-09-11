# Insider — what we have now (storefront)

**Repo:** `swiss-arabian-website`  
**As of:** 2026-08-28  
**Scope:** Frontend only — this is an inventory of what is **implemented in this repo today**.  
**Wiring guide (how it should work):** `docs/storefront/INSIDER_FRONTEND_INTEGRATION.md`  
**Backend companion:** `swiss-arabian-backend/docs/storefront/INSIDER_FRONTEND_INTEGRATION_GUIDE.md`

This file answers: *what is live in the website code right now?*

---

## 1. Summary

Insider is wired as a **one-way Web SDK push**. The storefront loads `ins.js`, queues events until the SDK is ready, and sends four frontend events. It does **not** receive webhooks from Insider. Purchase and `user_register` are **backend-owned** and are **not** fired from this repo.

| Status | Item |
|---|---|
| Done | SDK load (`ins.js`) + event buffer |
| Done | Kill switch + account ID gate |
| Done | Identify (login, register, session restore, email verify) |
| Done | Product view on PDP (`setItem`) |
| Done | Add to cart after cart API success (`addItem`) |
| Done | Logout on every `endSession()` |
| Not in this repo | `purchase` (backend, after payment `PAID`) |
| Not in this repo | `user_register` profile upsert (backend, after register) |
| Not implemented | Cart `removeItem`, quantity-change events, search, wishlist, checkout-started, cookie consent gate |

---

## 2. Files we have

| File | Role |
|---|---|
| `src/lib/insider.ts` | **Only** place that calls `window.Insider`. Wrappers + types. |
| `src/components/layout/InsiderScripts.tsx` | Inline buffer snippet + `ins.js` |
| `src/app/layout.tsx` | Renders `<InsiderScripts />` in `<head>` |
| `src/lib/config/env.ts` | `env.insider` from `NEXT_PUBLIC_INSIDER_*` |
| `.env.example` | Documented env vars (commented) |
| `src/features/auth/lib/applyAuthSession.ts` | Identify after auth / `/me` |
| `src/lib/auth/endSession.ts` | Logout before tokens/store clear |
| `src/features/catalog/components/ProductDetailPageView.tsx` | Product view |
| `src/features/cart/hooks/useAddToCart.ts` | Add to cart (API success only) |

UI that adds to cart (**no direct Insider calls** — they all go through `useAddToCart`):

- `src/features/catalog/components/ProductDetailPageView.tsx`
- `src/features/home/components/ProductCard.tsx`
- `src/features/home/components/ShaghafSection.tsx`
- `src/features/home/components/BestSellersSection.tsx`

---

## 3. Environment / flags

Read in `src/lib/config/env.ts` as `env.insider`:

| Variable | Default | Behaviour |
|---|---|---|
| `NEXT_PUBLIC_INSIDER_ENABLED` | `true` | Set `false` to skip script **and** all events |
| `NEXT_PUBLIC_INSIDER_ACCOUNT_ID` | empty | Required for live events. Empty = no script, silent no-op |
| `NEXT_PUBLIC_INSIDER_SCRIPT_HOST` | `swissarabian.api.useinsider.com` | CDN host for `ins.js` |

**Load rule:** script + events run only when `ENABLED !== false` **and** `ACCOUNT_ID` is non-empty.

Backend keys (`INSIDER_API_KEY`, `X-REQUEST-TOKEN`) are **not** in this frontend. They must stay backend-only.

---

## 4. SDK load (what actually happens)

`InsiderScripts` in root layout `<head>`:

1. **Inline bootstrap** (runs immediately):
   - Sets `window.insider_object = "Insider"`
   - Creates a stub `window.Insider` with `eventBuffer`
   - Stub methods (`identify`, `track.setItem`, `track.addItem`, `track.logout`, plus unused `setUser` / `removeItem` / `purchase`) push into the buffer until `ins.js` loads
2. **`ins.js`** via `next/script` `strategy="afterInteractive"`:
   - `https://{scriptHost}/ins.js?id={accountId}`

If the flag is off or account ID is empty, the component returns `null` — no script, no buffer, no events.

All wrapper calls in `src/lib/insider.ts` are wrapped in `try/catch`. Insider failures never break auth, cart, or checkout.

`isEnabled()` (inside the utility) requires:

- browser (`window`)
- `env.insider.enabled`
- non-empty `env.insider.accountId`
- `window.Insider` defined (true as soon as the bootstrap snippet has run)

---

## 5. Events implemented on the frontend

### 5.1 Identify — `Insider.identify`

**Wrapper:** `insiderIdentify()`  
**Call site:** `stitchInsiderSession()` in `applyAuthSession.ts`

Fires when a known customer is in session:

| Trigger | Path |
|---|---|
| Password login | `LoginPageView` → `applyAuthResult` |
| Email-code login | `LoginPageView` → `applyAuthResult` |
| Register | `RegisterPageView` → `applyAuthResult` |
| Session restore on refresh | `AuthSessionProvider` → `GET /storefront/customer/me` → `applyCustomerProfile` |
| Email verify | `VerifyPageView` → `applyCustomerProfile` |

Login/register pages do **not** call Insider themselves. If login already hydrated the session, `AuthSessionProvider` skips `/me` so identify is not double-fired on that mount.

**Payload we send:**

| We pass | Insider key | Source today |
|---|---|---|
| Customer UUID | `uuid` | `customer.id` |
| Email | `email` | `customer.email` (omitted if empty) |
| Phone E.164 | `phone_number` | `customer.phoneE164` (omitted if empty) |
| First name | `custom.first_name` | `customer.firstName` |
| Last name | `custom.last_name` | `customer.lastName` |
| Zone | `custom.zone_code` | Hardcoded `DEFAULT_ZONE_CODE` = `"UAE"` |
| Locale | `custom.locale` | Hardcoded `DEFAULT_LANGUAGE_CODE` = `"en"` |

This is **not** the same as backend `user_register`. Identify stitches the **browser cookie** to the customer. Backend upserts **profile attributes**. Both are supposed to fire on register.

---

### 5.2 Product view — `Insider.track.setItem` (SOW event #2)

**Wrapper:** `insiderProductViewed()`  
**Call site:** `ProductDetailPageView` `useEffect` when catalog `data` is present.

Re-fires when navigating to another PDP (`data` changes). Not fired on listing, search, or home browse.

**Payload we send:**

| We pass | Insider key | Source today |
|---|---|---|
| Variant id (preferred) | `id` | `data.variantId \|\| data.id` |
| D365 SKU | `sku` | `data.sku \|\| data.variantId \|\| data.id` |
| Title | `name` | `data.title` |
| Price | `unit_price` **and** `unit_sale_price` | `data.price ?? 0` (same value; no promo split) |
| Currency | `currency` | `data.currency \|\| "AED"` |
| Category | `taxonomy` | Array of one collection name (featured collection, else first), or `[]` |
| Image | `product_image_url` | `data.imageUrl` or first gallery image, else `""` |
| URL | `url` | Current `window.location.href` (PDP does not pass `productUrl`) |
| Brand | `brand` | `data.brandName` (omitted if empty) |

---

### 5.3 Add to cart — `Insider.track.addItem` (SOW event #3)

**Wrapper:** `insiderAddToCart()`  
**Call site:** `useAddToCart` **only in the `.then` of `addCartItem`**.

- Fired **after** `POST /storefront/cart/items` succeeds.
- **Not** fired on button click.
- Failed add: optimistic line is reverted, toast shown, **no Insider event**.

**Payload we send:**

| We pass | Insider key | Source today |
|---|---|---|
| Variant id | `id` | `payload.variantId` |
| SKU | `sku` | `sku \|\| variantId` |
| Title | `name` | `payload.title` |
| Quantity | `quantity` | line quantity (default 1) |
| Price | `unit_price` **and** `unit_sale_price` | `payload.unitPrice` (same value) |
| Currency | `currency` | `payload.currency` |
| URL | `url` | `{origin}/products/{slug}` |
| Image | `product_image_url` | `payload.imageUrl` or `""` |
| Category | `taxonomy` | `[category]` or `[]` |
| Brand | `brand` | passed only from PDP today |

**What each add-to-cart UI actually passes into the hook:**

| UI | sku | variantId | currency | category | brand |
|---|---|---|---|---|---|
| PDP | catalog SKU | catalog `variantId` | product currency (fallback AED) | featured / first collection name | `brandName` |
| `ProductCard` (catalog/home cards that use `toProductCardModel`) | catalog SKU | catalog `variantId` | product currency (fallback AED) | `family` (subtitle / SKU) | **not passed** |
| Home `ShaghafSection` / `BestSellersSection` featured button | **not passed** | static mock id | **hardcoded `"USD"`** | static `family` string | **not passed** |

Home Shaghaf / Best Sellers featured buttons use static `homeContent` IDs (e.g. `spot-oud-tonka`, `bs-vanilla-01`). If the cart API succeeds, those values go to Insider. If it fails, no Insider event.

---

### 5.4 Logout — `Insider.track.logout`

**Wrapper:** `insiderLogout()`  
**Call site:** first line of `endSession()`.

Runs **before** tokens, Zustand auth, React Query cache, and local cart are cleared.

Every session-end path goes through `endSession()`, so logout is covered for:

| Trigger | Path |
|---|---|
| User logout | `performLogout` / `performLogoutAll` |
| 401 after refresh fails | `apiClient` |
| Account security sign-out | `AccountSecurityPageView` |
| Reset password | `ResetPasswordPageView` |

---

## 6. What is **not** implemented on the frontend

These exist as **SDK stub/type names only** (buffer + `Window` types). There is **no wrapper** and **no call site**:

| Missing | Notes |
|---|---|
| `track.purchase` | Intentionally backend-only. Order confirmation page does not call it. |
| `track.removeItem` | Cart remove / clear (`useCartMutations`) does not notify Insider |
| `track.setUser` | Unused; we use `identify` |
| Quantity update events | Cart sheet `+/-` does not send Insider |
| Search / listing / home page views | Only PDP `setItem` |
| Wishlist | Feature not live |
| Checkout started | Not tracked |
| Cookie / consent gate | `ins.js` loads on every page when enabled + account ID set |
| Unit tests | None for Insider |

Zone/locale on identify are **not** taken from `MarketProvider` / selected market. They are always `"UAE"` / `"en"`.

---

## 7. Ownership split (frontend vs backend)

| Event | Who | When |
|---|---|---|
| `identify` | **Frontend** | Login, register, `/me`, email verify |
| `setItem` (PDP) | **Frontend** | Product detail data loaded |
| `addItem` | **Frontend** | Cart API success |
| `logout` | **Frontend** | `endSession()` |
| `user_register` | **Backend** (BullMQ) | After register API |
| `purchase` | **Backend** (BullMQ) | Order payment → `PAID` |

Payment webhooks (Stripe, Telr, Tabby, Tamara, Paymob, …) stay on the backend. They are not Insider. After payment is `PAID`, the backend sends `purchase`.

---

## 8. User flow as implemented

```
Guest opens any storefront page
  → ins.js loads (if enabled + account ID set)
  → anonymous Insider cookie

Opens a product detail page
  → setItem

Adds to bag, cart API 200
  → addItem
Adds to bag, cart API fails
  → no Insider event

Login / register
  → identify
Register also
  → backend user_register (not this repo)

Refresh while logged in
  → /me → identify

Logout / 401 session end
  → track.logout

Checkout payment confirmed
  → frontend does nothing
  → backend purchase
```

---

## 9. Guardrails already in code

- `window.Insider` is not used outside `src/lib/insider.ts`
- Add-to-cart UI never calls Insider directly
- Add-to-cart event only after API success
- No frontend `purchase` or `user_register`
- Failures are swallowed (`try/catch`)
- Empty account ID = no script and no events
- `NEXT_PUBLIC_INSIDER_ENABLED=false` disables everything
