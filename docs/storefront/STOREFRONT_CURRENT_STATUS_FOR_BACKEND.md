# Storefront FE — done status for backend

**Date:** 2026-09-04  
**Audience:** NestJS backend  
**Repo:** `swiss-arabian-website`  
**Purpose:** What the customer storefront has **already wired and shipped** against `/storefront/*`. Use this as the current FE status — older August status files are out of date.

**Phase 2 account guide** (`STOREFRONT_FRONTEND_INTEGRATION_GUIDE_PHASE_2.md`) is received. It is **not wired yet**. Profile PATCH, address book, phones, preferences, and marketing consents are still placeholders on FE.

---

## Environments

| | URL |
|--|--|
| Azure Dev storefront | `https://ca-swissarabian-website-dev.greenbush-d5b07575.uaenorth.azurecontainerapps.io` |
| Azure Dev API | `https://ca-swissarabian-backend-dev.greenbush-d5b07575.uaenorth.azurecontainerapps.io` |

Local FE can also hit a LAN/VPN Nest instance via `NEXT_PUBLIC_USE_LOCAL_API`.

**Default context on catalog / cart / checkout:**

```
zoneCode=UAE
salesChannelCode=platform_uae
languageCode=en
currencyCode=AED
```

**Envelope:** `{ success, data?, error?, meta? }` — FE unwraps `data`.  
**Auth:** Bearer JWT when logged in. Guests send `guestToken` (same UUID as cart).  
**Paths:** `/storefront/...` — no `/api/v1`.

---

## Done on FE (live APIs)

| Module | Routes | Status |
|--------|--------|--------|
| **Auth** | `/login` `/register` `/verify` `/forgot-password` `/reset-password` | Live. OAuth off |
| **Customer identity** | `/account` greeting, `/account/security` | Live: `/me`, sessions, change-password, logout |
| **Catalog** | `/products` `/products/[slug]` | Live, public |
| **Collections** | `/collections` `/collections/[slug]` | Live, public. Heroes static. `minis`/`bundles` fall back to full catalog if empty |
| **Search** | header + `/search` | Live: `GET /storefront/catalog/search` |
| **Navigation** | header + footer | Live: `GET /storefront/navigation`. Footer empty until admin binds a menu |
| **Cart** | `/cart` + mini-cart | Live. Guest + JWT. Merge on login. Validate before checkout |
| **Checkout** | `/checkout` | Live. Session, delivery, payment, shipping + billing, validate, place order |
| **Paymob** | `/checkout/payment/success` `/cancel` | Live. Redirect + poll |
| **Stripe** | `/checkout/payment/stripe` | Live. Inline Payment Element + poll |
| **Order confirmation** | `/order-confirmation/[orderId]` | Live |
| **Account orders** | `/account/orders` `/account/orders/[id]` | Live: list, detail, cancel, tracking |
| **Guest tracking** | `/track/[orderNumber]` | Live: `orderAccessToken` |

**Commerce path that works today:**

```
register/login → browse catalog/search → add to cart (guest or JWT)
  → checkout (address snapshot + billing) → place order
  → Paymob redirect or Stripe inline → poll payment-status
  → confirmation → account order history / guest track
```

---

## Not done (UI exists, APIs not called)

These screens are built. They do **not** call storefront APIs yet (honest “available soon” / placeholder — no fake success).

| Area | Route | Waiting on |
|------|-------|------------|
| Profile edit | `/account/profile` | Phase 2 `PATCH /me` (name/DOB/gender/prefs). Display from `GET /me` only |
| Address book | `/account/addresses` | Phase 2 `addresses*` |
| Phones | (no dedicated page yet) | Phase 2 `phones*` |
| Locale/currency prefs | profile “soon” | Phase 2 `GET/PATCH /preferences` |
| Marketing consents | profile comms “soon” | Phase 2 `GET/PATCH /marketing-consents` |
| Dashboard recent order | `/account` | Wire existing `GET /customer/orders` (list page already live) |
| Wishlist / saved | `/account/wishlist` `/account/saved` | Later phase |
| Saved cards / transactions | `/account/payments` | Later phase (checkout pay is already live) |
| Subscriptions | `/subscriptions` `/account/subscription` | Later phase |
| Rewards / membership | `/account/rewards` `/account/membership` | Later phase |
| Coupons | checkout discount input | Promo API — field is **not** posted |
| Newsletter | home form | Subscribe API — client thank-you only |
| Markets | header selector | Zones list — hardcoded UAE |
| Gift cards | `/gift-cards` | Stub |
| OAuth / MFA / passkeys | login / profile | Deferred |

Home, blog, FAQ, story, stores, gift-box = **static content**. Home add-to-cart still resolves slug via catalog PDP, then cart API.

---

## Client behaviour (already in place)

| Piece | Detail |
|-------|--------|
| `apiClient` | Bearer. 401 → single-flight refresh → retry. Logout / logout-all **do not** refresh. Remaining 401 with a token ends the session |
| Auth bootstrap | Refresh if needed → `GET /storefront/customer/me`. Failure → `endSession()` |
| Logout | Local session cleared **first**, then `POST /logout` with captured Bearer. Does not hang if `/me` or `/logout` is 401 |
| Cart session | Guest restore / `POST /cart` merge after login |
| Account shell | `AuthGuard` — `/account/*` requires JWT |

**Storage**

| Key | Where | Value |
|-----|-------|-------|
| tokens | `localStorage` | access + refresh |
| `sa_guest_token` | `localStorage` | guest UUID; cleared after login merge |
| `sa_cart_id` | `localStorage` | active cart UUID |
| `sa_checkout_session_id` | `sessionStorage` | checkout session |
| `sa_order_id` / `sa_order_number` | `localStorage` | last order |
| `sa_order_access_token` | `localStorage` | guest tracking token — saved **once** from place-order |
| Stripe / Paymob | `sessionStorage` | payment attempt |

Login DTO **can** take `guestToken`; UI does **not** send it. Merge is `POST /storefront/cart` with Bearer + previous guest `cartId`.

---

## Done modules — contracts we follow

### 1. Auth (Phase 1) — done

Register body: `zoneCode` lowercase `uae`, `salesChannelCode` `platform_uae`, email, phone E.164, password ≥ 8, optional names, optional `marketingConsent` / `smsConsent`.  
Login: `identifier` = email or E.164. Email-code login, verify, forgot/reset, OTP resend are wired (UI flag-gated).  
OAuth not wired (`NEXT_PUBLIC_ENABLE_OAUTH=false`).

Older smoke (2026-08-10): `POST /storefront/auth/forgot-password` returned **401 Validation failed** on Azure Dev if reset was disabled. Please confirm current Dev flags.

### 2. Catalog / collections / search — done

Public, `skipAuth`. PLP page size 24. PDP: slug → SKU query → search fallback. Search: debounce ~300ms, min 2 chars, `onlySellable=true`, limit 20.  
Collections use **catalog** routes, not `/storefront/merchandising/*`.

### 3. Navigation — done

`GET /storefront/navigation?zoneCode=UAE`. 3-level mega-menu + `GROUP_HEADER`. Empty `footer[]` → no invented footer links. Please bind a footer menu in Website Management when ready.

### 4. Cart — done

Guest: `guestToken` on first add. Authenticated: Bearer, no guest token. Login: `POST /cart` merges. Logout clears `sa_cart_id`. Optimistic mutations; failure refetches. `POST /cart/validate` before checkout. Add prefers `sku`, else `variantId`.

### 5. Checkout + pay — done

- Create/resume session from cart  
- List + select delivery (`deliveryMethodId`)  
- List + select payment (`paymentMethodId` — **not** `zonePaymentMethodId`)  
- Address: guest `addressSnapshot`; billing on same call (`billingSameAsShipping: true` or `billingAddressSnapshot`). Saved `customerAddressId` ready but unused until Phase 2 address book  
- UAE `postalCode`: `"00000"`  
- Validate (`validation.isValid`) then `POST /orders/from-checkout`  
- Paymob: `REDIRECT` + `returnUrl` / `cancelUrl` + poll  
- Stripe: `INLINE_CARD` + `clientSecret` + poll  
- Guest `orderAccessToken` saved only when place-order returns `created: true`  

Discount input is **not** sent. Card PAN never hits FE.

### 6. Orders + tracking — done

Logged-in: `GET /storefront/customer/orders?limit=&offset=`, detail, cancel, tracking. JWT only.  
Guest: `GET /storefront/order-tracking/:orderNumber?orderAccessToken=`.  
Dashboard “recent purchase” is still a **static mock** (list page is live).

---

## Every API FE calls today

```
# Auth / customer identity
POST   /storefront/auth/register
POST   /storefront/auth/login
POST   /storefront/auth/login/email-code/request
POST   /storefront/auth/login/email-code/confirm
POST   /storefront/auth/refresh
POST   /storefront/auth/logout
POST   /storefront/auth/logout-all
POST   /storefront/auth/verify-email/request
POST   /storefront/auth/verify-email/confirm
POST   /storefront/auth/verify-phone/request
POST   /storefront/auth/verify-phone/confirm
POST   /storefront/auth/forgot-password
POST   /storefront/auth/reset-password
POST   /storefront/auth/otp/resend
GET    /storefront/customer/me
GET    /storefront/customer/sessions
DELETE /storefront/customer/sessions/:sessionId
POST   /storefront/customer/change-password

# Catalog
GET    /storefront/catalog/products
GET    /storefront/catalog/products/:slug
GET    /storefront/catalog/search
GET    /storefront/catalog/collections
GET    /storefront/catalog/collections/:slug
GET    /storefront/catalog/collections/:slug/products

# Nav
GET    /storefront/navigation

# Cart
POST   /storefront/cart
GET    /storefront/cart
POST   /storefront/cart/items
PATCH  /storefront/cart/items/:cartItemId
DELETE /storefront/cart/items/:cartItemId
DELETE /storefront/cart/items
POST   /storefront/cart/validate

# Checkout + pay
POST   /storefront/checkout/from-cart
GET    /storefront/checkout/:id
GET    /storefront/checkout/:id/delivery-methods
POST   /storefront/checkout/:id/delivery-method
GET    /storefront/checkout/:id/payment-methods
POST   /storefront/checkout/:id/payment-method
POST   /storefront/checkout/:id/address
POST   /storefront/checkout/:id/validate
POST   /storefront/checkout/:id/cancel
POST   /storefront/orders/from-checkout
GET    /storefront/orders/:orderId
POST   /storefront/orders/:orderId/payment/initiate
GET    /storefront/orders/:orderId/payment-status

# Account orders
GET    /storefront/customer/orders
GET    /storefront/customer/orders/:orderId
POST   /storefront/customer/orders/:orderId/cancel
GET    /storefront/customer/orders/:orderId/tracking

# Guest tracking
GET    /storefront/order-tracking/:orderNumber
GET    /storefront/order-tracking/:orderNumber/tracking
```

---

## Phase 2 — received, not implemented

Guide: `STOREFRONT_FRONTEND_INTEGRATION_GUIDE_PHASE_2.md`

FE will wire next (same Phase 1 client, JWT only). **Not called today:**

```
PATCH  /storefront/customer/me
GET    /storefront/customer/addresses
POST   /storefront/customer/addresses
GET    /storefront/customer/addresses/:addressId
PATCH  /storefront/customer/addresses/:addressId
DELETE /storefront/customer/addresses/:addressId
PATCH  /storefront/customer/addresses/:addressId/default
GET    /storefront/customer/phones
POST   /storefront/customer/phones
PATCH  /storefront/customer/phones/:phoneId
DELETE /storefront/customer/phones/:phoneId
PATCH  /storefront/customer/phones/:phoneId/default
GET    /storefront/customer/preferences
PATCH  /storefront/customer/preferences
GET    /storefront/customer/marketing-consents
PATCH  /storefront/customer/marketing-consents
```

Checkout already supports `customerAddressId` once the address book exists.

---

## Asks for backend

1. Confirm Phase 2 routes above are live on the API we should hit (Azure Dev and/or current Nest).  
2. Confirm Dev `forgot-password` / verification flags.  
3. Bind footer menu in Website Management (`footer` is `[]` today).  
4. Collection products for `minis` / `bundles` if those should not fall back to full catalog.  
5. Coupon / newsletter / markets / wishlist — not started; no FE inventing of those paths.

---

## Slack one-liner

> FE done 2026-09-04: **auth, catalog, search, nav, cart, checkout, Paymob, Stripe, confirmation, account orders/cancel, guest tracking** are live. **Phase 2** (PATCH `/me`, addresses, phones, prefs, consents) guide received — **not wired yet**. Full list: `docs/storefront/STOREFRONT_CURRENT_STATUS_FOR_BACKEND.md`.
