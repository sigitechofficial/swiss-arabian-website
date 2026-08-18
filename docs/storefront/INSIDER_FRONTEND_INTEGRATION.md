# Insider frontend integration

**Repo:** `swiss-arabian-website`  
**Updated:** 2026-08-18  
**Audience:** Storefront engineers, CRM, Insider TAM  
**Source of truth for FE wiring:** this file. Backend companion: `swiss-arabian-backend/docs/storefront/INSIDER_FRONTEND_INTEGRATION_GUIDE.md`

---

## 1. What this integration does

Insider is the CRM / customer-engagement layer. The storefront **only pushes data out** to Insider. There are **no Insider inbound webhooks** on the website.

| Direction | Mechanism | Used for |
|---|---|---|
| Website → Insider | Insider Web SDK (`ins.js` + `window.Insider`) | Identity stitch, product view, add to cart, logout |
| Backend → Insider | Upsert User Data API (BullMQ) | `user_register`, `purchase` after payment confirmed |
| Insider → us | Not used | Do not build Data Stream / Architect “Call an API” unless CRM requests it later |

Payment webhooks (Stripe, Telr, Tabby, Tamara, …) stay on the **backend**. They are not Insider. After payment is `PAID`, the backend sends `purchase` to Insider.

**Timing**

- Product view, add to cart, identify, logout: **real time** (seconds), via the Web SDK.
- Purchase: **near real time** from the **backend** when payment confirms — not from the thank-you page.
- Product catalogue feed (if used for recommendations): periodic, owned by backend/CRM — not this repo.

---

## 2. Ownership split (do not duplicate)

| Event | Who fires | When |
|---|---|---|
| Identity stitch (`identify`) | **Frontend** | After login, register, session restore (`/me`) |
| Product detail page view (`setItem`) | **Frontend** | PDP data loaded |
| Add to cart (`addItem`) | **Frontend** | After `POST /storefront/cart/items` **succeeds** |
| Logout (`track.logout`) | **Frontend** | `endSession()` — logout and 401 session clear |
| `user_register` (profile upsert) | **Backend** (BullMQ) | After `POST /storefront/auth/register` |
| `purchase` | **Backend** (BullMQ) | Order payment status → PAID |

Frontend `insiderIdentify()` after register **is not** the same as backend `user_register`. Identify stitches the **browser cookie** to the customer. Backend upserts **profile attributes**. Both should fire.

**Never** call `window.Insider.track.purchase()` from the storefront.

---

## 3. Architecture (this repo)

Follow existing storefront rules: thin pages, domain logic in `features/`, no `window.Insider` outside the utility.

```
src/lib/insider.ts                         ← only place that touches window.Insider
src/components/layout/InsiderScripts.tsx   ← buffer snippet + ins.js (root layout <head>)
src/lib/config/env.ts                      ← NEXT_PUBLIC_INSIDER_* flags
src/app/layout.tsx                         ← renders <InsiderScripts />

Call sites:
src/features/auth/lib/applyAuthSession.ts  ← identify (login + register + /me)
src/lib/auth/endSession.ts                 ← logout
src/features/catalog/components/ProductDetailPageView.tsx  ← product view
src/features/cart/hooks/useAddToCart.ts    ← add to cart (after API success)
```

Add-to-cart UI (PDP, `ProductCard`, home sections) does **not** call Insider. They all go through `useAddToCart`, which fires Insider only in the API success branch.

---

## 4. Environment variables

Add to `.env` / `.env.local` (see `.env.example`):

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_INSIDER_ENABLED` | No | `true` | Set `false` to disable all SDK load + events (local/QA) |
| `NEXT_PUBLIC_INSIDER_ACCOUNT_ID` | **Yes for live events** | empty | Numeric Insider account id (`ins.js?id=`) |
| `NEXT_PUBLIC_INSIDER_SCRIPT_HOST` | No | `swissarabian.api.useinsider.com` | CDN host Insider assigns per account |

**Script does not load** unless `ENABLED !== false` **and** `ACCOUNT_ID` is non-empty. Empty ID = silent no-op (safe for local without CRM credentials).

Get **Account ID** and confirm the **script host** from the Insider / CRM team. Backend `INSIDER_API_KEY` / `X-REQUEST-TOKEN` stay **backend-only**. Never put them in `NEXT_PUBLIC_*`.

Read in code via `env.insider` in `src/lib/config/env.ts` (static `process.env.NEXT_PUBLIC_*` access so Next inlines them).

---

## 5. SDK load

`InsiderScripts` in `src/app/layout.tsx` `<head>`:

1. **Bootstrap buffer** (inline script) — queues `identify` / `setItem` / `addItem` / `logout` if the app fires before `ins.js` is ready. Events replay automatically.
2. **`ins.js`** via `next/script` `strategy="afterInteractive"`:
   `https://{NEXT_PUBLIC_INSIDER_SCRIPT_HOST}/ins.js?id={NEXT_PUBLIC_INSIDER_ACCOUNT_ID}`

Do not fire events before this snippet is on the page. Do not restore the legacy `window.insider_object` object API *and* a second InsiderQueue implementation at the same time.

---

## 6. Utility API (`src/lib/insider.ts`)

All calls are wrapped in `try/catch`. Insider must never break checkout, cart, or auth.

| Function | Insider method | When to call |
|---|---|---|
| `insiderIdentify({ uuid, email, phone, firstName, lastName, zoneCode, locale })` | `Insider.identify` | After known customer is in session |
| `insiderProductViewed({ id, sku, name, price, currency, imageUrl, productUrl, category, brand })` | `Insider.track.setItem` | PDP loaded |
| `insiderAddToCart({ …same, quantity })` | `Insider.track.addItem` | Cart API success |
| `insiderLogout()` | `Insider.track.logout` | Session end |

`isEnabled()` requires: browser, `env.insider.enabled`, non-empty `accountId`, and `window.Insider`.

### Identity payload

| Field we send | Insider key | Source |
|---|---|---|
| Customer UUID | `uuid` | `customer.id` |
| Email | `email` | `customer.email` |
| Phone E.164 | `phone_number` | `customer.phoneE164` |
| First / last name | `custom.first_name` / `last_name` | profile |
| Zone | `custom.zone_code` | `DEFAULT_ZONE_CODE` (`UAE`) until zone API is live |
| Locale | `custom.locale` | `DEFAULT_LANGUAGE_CODE` (`en`) |

### Product / cart item payload

| Field | Insider key | Notes |
|---|---|---|
| Variant id (preferred) | `id` | Affinity at variant level |
| D365 SKU | `sku` | Falls back to variant id |
| Name | `name` | Product title |
| Price (number, not string) | `unit_price` and `unit_sale_price` | Same value until promo split exists |
| ISO currency | `currency` | e.g. `AED` |
| Category | `taxonomy` | Array of one collection/family name |
| Image | `product_image_url` | |
| URL | `url` | PDP: current href; ATC: `{origin}/products/{slug}` |
| Brand | `brand` | Optional |
| Quantity | `quantity` | Add-to-cart only |

---

## 7. Call sites (exact files)

### 7.1 Identify — login, register, session restore

**File:** `src/features/auth/lib/applyAuthSession.ts`

- `applyAuthResult` — password login, email-code login, register (all go through this).
- `applyCustomerProfile` — `AuthSessionProvider` `/storefront/customer/me` and email verify.

Do not add extra `insiderIdentify` in `LoginPageView` / `RegisterPageView`. Those already call `applyAuthResult`.

### 7.2 Product view — SOW event #2

**File:** `src/features/catalog/components/ProductDetailPageView.tsx`

`useEffect` when catalog product `data` is present. Uses `variantId` as Insider `id`. Re-fires when navigating to another PDP (`data` changes).

### 7.3 Add to cart — SOW event #3

**File:** `src/features/cart/hooks/useAddToCart.ts`

Fired **only** in the `.then` of `addCartItem`. Failed adds revert the optimistic line and **do not** send Insider.

UI that uses the hook (no direct Insider calls):

- `ProductDetailPageView` (passes `sku`, collection category, `brandName`)
- `ProductCard` (catalog/home; `sku` from `toProductCardModel`)
- `ShaghafSection` / `BestSellersSection` featured add buttons

### 7.4 Logout

**File:** `src/lib/auth/endSession.ts`

`insiderLogout()` runs **before** token/Zustand/query/cart clear. Covers `performLogout`, `performLogoutAll`, and API 401 session end.

---

## 8. What CRM can build with this data

| Data | Insider use |
|---|---|
| `identify` | Anonymous session → known customer; prior page views attributed |
| `setItem` (PDP) | Product affinity / “viewed this” |
| `addItem` | Cart-abandon journeys (e.g. WhatsApp later) |
| Backend `user_register` | Welcome journey, zone/consent on profile |
| Backend `purchase` | Post-purchase, LTV, suppress abandon |

Journeys, segments, and templates are configured **in the Insider dashboard**, not in this repo.

---

## 9. Testing / signoff

Requires a real `NEXT_PUBLIC_INSIDER_ACCOUNT_ID`.

1. Load any storefront page. Console: `window.Insider` is defined (not `undefined`).
2. After SDK idle: `window.Insider.eventBuffer?.buffer` is empty (queued calls drained).
3. Insider panel → Visitor Debugger (or path CRM provides):
   - Open a PDP → `setItem`
   - Add to bag (API must succeed) → `addItem`
   - Login / register → `identify`
   - Logout → `logout`
4. Fail add-to-cart (network off / bad SKU) → **no** `addItem`.
5. `NEXT_PUBLIC_INSIDER_ENABLED=false` or empty account ID → no `ins.js`, no events, no console errors.

Checklist:

- [ ] `window.Insider` on all pages when enabled + account ID set
- [ ] Identify after login and register
- [ ] Identify after refresh (session restore)
- [ ] Product view on PDP
- [ ] Add to cart only after API success
- [ ] Logout clears Insider session
- [ ] No `purchase` / `user_register` from frontend
- [ ] No `window.Insider` usage outside `src/lib/insider.ts`
- [ ] Disable flag stops events

---

## 10. Do not do these

| Do not | Do instead |
|---|---|
| Call `window.Insider` from features/components | Use `@/lib/insider` |
| Fire add-to-cart on button click | Fire in `useAddToCart` after API success |
| Fire purchase or user_register from FE | Backend BullMQ |
| Put Insider API key in frontend env | Backend only |
| Throw if Insider fails | Keep internal try/catch |
| Load `ins.js` without account ID | `InsiderScripts` already no-ops |
| Mix InsiderQueue (`type: 'init'`) with this SDK | This project uses `identify` / `track.*` as specified by backend |

---

## 11. Credentials still needed from CRM

Before production events appear in Insider:

1. Insider **account ID** → `NEXT_PUBLIC_INSIDER_ACCOUNT_ID`
2. Confirm **script host** (default `swissarabian.api.useinsider.com`)
3. Confirm identity keys in the panel: email + phone + uuid
4. Test vs production Insider partner (do not mix)

Until (1) is set, the website runs normally and sends **nothing** to Insider.

---

## 12. Related docs

- Backend guide: `docs/storefront/INSIDER_FRONTEND_INTEGRATION_GUIDE.md` in `swiss-arabian-backend`
- Cart API: `docs/storefront/STOREFRONT_CART_FE_HANDOFF.md`
- Checkout (purchase is backend): `docs/storefront/STOREFRONT_CHECKOUT_AND_ORDERS_FE_GUIDE.md`
- Auth: `docs/storefront/STOREFRONT_FRONTEND_INTEGRATION_GUIDE_PHASE_1.md`
