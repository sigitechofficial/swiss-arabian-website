# Storefront FE — current status for backend

**Date:** 2026-09-07  
**Audience:** NestJS backend  
**Repo:** `swiss-arabian-website`  
**Purpose:** What the customer storefront has **wired against `/storefront/*`**. Use this as the current FE status. Older August files and the 4 Sep snapshot are out of date.

**Reached through wishlist + Phase 2 + reviews.** Auth → catalog → search → cart → checkout → orders → wishlist / saved → Phase 2 account → **product reviews** (PDP + `/account/reviews`).

Insider Web SDK is a separate handoff: `INSIDER_STATUS_FOR_BACKEND.md`.

---

## Environments

| | URL |
|--|--|
| Azure Dev storefront | `https://ca-swissarabian-website-dev.greenbush-d5b07575.uaenorth.azurecontainerapps.io` |
| Azure Dev API | `https://ca-swissarabian-backend-dev.greenbush-d5b07575.uaenorth.azurecontainerapps.io` |

Local FE can hit a LAN/VPN Nest instance via `NEXT_PUBLIC_USE_LOCAL_API`.

**Default context (catalog / cart / checkout / wishlist):**

```
zoneCode=UAE
salesChannelCode=platform_uae
languageCode=en
currencyCode=AED
```

**Envelope:** `{ success, data?, error?, meta? }` — FE unwraps `data`.  
**Auth:** Bearer JWT when logged in. Guests send `guestToken` on cart.  
**Paths:** `/storefront/...` — no `/api/v1`.

---

## Done on FE (live APIs)

| Module | Routes | Status |
|--------|--------|--------|
| **Auth** | `/login` `/register` `/verify` `/forgot-password` `/reset-password` | Live. OAuth off |
| **Customer identity** | `/account` `/account/security` `/account/profile` | Live: `GET /me`, `PATCH /me` (name), sessions, change-password, logout |
| **Phones** | `/account/profile` | Live: list / create / delete / set primary |
| **Marketing consents** | `/account/profile` | Live: `GET/PATCH /marketing-consents` |
| **Address book** | `/account/addresses` | Live: list / create / update / delete / set default |
| **Catalog** | `/products` `/products/[slug]` | Live, public |
| **Collections** | `/collections` `/collections/[slug]` | Live, public. Heroes static. `minis`/`bundles` fall back to full catalog if empty |
| **Search** | header + `/search` | Live: `GET /storefront/catalog/search` |
| **Navigation** | header + footer | Live: `GET /storefront/navigation`. Footer empty until admin binds a menu |
| **Cart** | `/cart` + mini-cart | Live. Guest + JWT. Merge on login. Validate before checkout |
| **Checkout** | `/checkout` | Live. Session, delivery, payment, shipping + billing **snapshot**, validate, place order |
| **Paymob** | `/checkout/payment/success` `/cancel` | Live. Redirect + poll |
| **Stripe** | `/checkout/payment/stripe` | Live. Inline Payment Element + poll |
| **Order confirmation** | `/order-confirmation/[orderId]` | Live |
| **Account orders** | `/account/orders` `/account/orders/[id]` | Live: list, detail, cancel, tracking |
| **Guest tracking** | `/track/[orderNumber]` | Live: `orderAccessToken` |
| **Wishlist / saved** | hearts on PLP/PDP/search/collections + `/account/wishlist` `/account/saved` | Live. JWT only. Same API for both pages |
| **Reviews** | PDP `#product-reviews` + `/account/reviews` | **Live (2026-09-07).** Public summary/list (no JWT, product UUID). JWT write/edit/delete + helpful. Create/edit stay PENDING until approved. Detail: `STOREFRONT_REVIEWS_FE_STATUS.md` |

**Path that works today:**

```
register/login
  → browse catalog/search
  → heart (JWT) / add to cart (guest or JWT)
  → checkout (address snapshot + billingSameAsShipping or billing snapshot)
  → place order → Paymob or Stripe → poll payment-status
  → confirmation → account orders / guest track
  → account wishlist / saved (list, ATC, remove, clear-all)
  → profile: name, phones, consents
  → address book CRUD
  → PDP reviews (public) / write review (JWT) / account reviews
```

Checkout still posts **guest-style snapshots**. It does **not** yet send `customerAddressId` from the new address book.

---

## Not done (UI exists, APIs not called)

Honest placeholders — no fake success.

| Area | Route | Waiting on |
|------|-------|------------|
| Locale / currency prefs | profile | Phase 2 `GET/PATCH /preferences` |
| Email change | profile | Not Phase 2 (identity stays Phase 1) |
| Dashboard recent order | `/account` | Wire existing `GET /customer/orders` (list page already live) |
| Checkout saved-address picker | `/checkout` | FE: pass `customerAddressId` now that address book exists |
| Saved cards / transactions | `/account/payments` | Later phase (checkout pay is already live) |
| Subscriptions | `/subscriptions` `/account/subscription` | Later phase |
| Rewards / membership | `/account/rewards` `/account/membership` | Later phase |
| Coupons | checkout discount input | Promo API — field is **not** posted |
| Newsletter | home form | Subscribe API — client thank-you only |
| Markets | header selector | Zones list — hardcoded UAE |
| Gift cards | `/gift-cards` | Stub |
| OAuth / MFA / passkeys | login / profile | Deferred |
| Account delete | profile | No API |

Home, blog, FAQ, story, stores, gift-box = **static content**. Home add-to-cart resolves slug via catalog PDP, then cart API.

---

## Client behaviour

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

### 1. Auth (Phase 1)

Register body: `zoneCode` lowercase `uae`, `salesChannelCode` `platform_uae`, email, phone E.164, password ≥ 8, optional names, optional `marketingConsent` / `smsConsent`.  
Login: `identifier` = email or E.164. Email-code login, verify, forgot/reset, OTP resend are wired (UI flag-gated).  
OAuth not wired (`NEXT_PUBLIC_ENABLE_OAUTH=false`).

Older smoke (2026-08-10): `POST /storefront/auth/forgot-password` returned **401 Validation failed** on Azure Dev if reset was disabled. Please confirm current Dev flags.

### 2. Catalog / collections / search

Public, `skipAuth`. PLP page size 24. PDP: slug → SKU query → search fallback. Search: debounce ~300ms, min 2 chars, `onlySellable=true`, limit 20.  
Collections use **catalog** routes, not `/storefront/merchandising/*`.

### 3. Navigation

`GET /storefront/navigation?zoneCode=UAE`. 3-level mega-menu + `GROUP_HEADER`. Empty `footer[]` → no invented footer links. Please bind a footer menu in Website Management when ready.

### 4. Cart

Guest: `guestToken` on first add. Authenticated: Bearer, no guest token. Login: `POST /cart` merges. Logout clears `sa_cart_id`. Optimistic mutations; failure refetches. `POST /cart/validate` before checkout. Add prefers `sku`, else `variantId`.

### 5. Checkout + pay

- Create/resume session from cart  
- List + select delivery (`deliveryMethodId`)  
- List + select payment (`paymentMethodId` — **not** `zonePaymentMethodId`)  
- Address: `addressSnapshot` + `billingSameAsShipping: true` or `billingAddressSnapshot`  
- UAE `postalCode`: `"00000"`  
- Validate (`validation.isValid`) then `POST /orders/from-checkout`  
- Paymob: `REDIRECT` + `returnUrl` / `cancelUrl` + poll  
- Stripe: `INLINE_CARD` + `clientSecret` + poll  
- Guest `orderAccessToken` saved only when place-order returns `created: true`  

Discount input is **not** sent. Card PAN never hits FE.

### 6. Orders + tracking

Logged-in: `GET /storefront/customer/orders?limit=&offset=`, detail, cancel, tracking. JWT only.  
Guest: `GET /storefront/order-tracking/:orderNumber?orderAccessToken=`.  
Dashboard “recent purchase” is still a **static mock** (list page is live).

### 7. Wishlist / saved items (2026-09-04 / 07)

Guide: `STOREFRONT_WISHLIST_FE_GUIDE.md` · Jira: [SA-787](https://sigitechnologies-sapg.atlassian.net/browse/SA-787)

JWT only. No guest wishlist. Guest heart → `/login?returnTo=…`. Key is catalog **`productId` UUID** (not slug / SKU). `/account/wishlist` and `/account/saved` share the same list.

- Hearts on PLP, collections, search, PDP (UUID products only)  
- Toggle: `POST /items` + `DELETE /items/:productId` (duplicate add is success; missing remove is no-op)  
- Account list + add-to-cart + remove + clear-all with confirm  
- Cap 100 → show backend `422` `message`  
- Unsellable cards stay visible; ATC disabled  

### 8. Phase 2 account (2026-09-07)

Guide: `STOREFRONT_FRONTEND_INTEGRATION_GUIDE_PHASE_2.md` · Jira: [SA-788](https://sigitechnologies-sapg.atlassian.net/browse/SA-788)

JWT only. Same Phase 1 client.

| Piece | FE behaviour |
|-------|----------------|
| `PATCH /me` | Name (`firstName` / `lastName`) from profile. Email not editable |
| Addresses | Full CRUD + `PATCH …/default` `{ target: "both" }` |
| Phones | Create / delete / set primary. After mutate, FE refreshes `GET /me` |
| Marketing consents | Checkboxes EMAIL / SMS / WHATSAPP / PUSH → `OPTED_IN` / `OPTED_OUT`. Sends `zoneId` from profile when present |
| Preferences | **Not wired** |

Consents without `zoneId` on the customer are skipped server-side (guide). Please ensure register still stamps `zoneId`.

### 9. Product reviews (2026-09-07)

Guide: `STOREFRONT_REVIEWS_FE_GUIDE.md` · Status for backend: `STOREFRONT_REVIEWS_FE_STATUS.md`

**Implemented on FE.** Public PDP + customer write/edit/helpful + `/account/reviews`.

- Public: `skipAuth`. Key is catalog **`productId` UUID** (slug 404’d on current Nest reviews routes).
- Context: `zoneCode=UAE&salesChannelCode=platform_uae` on public + create.
- Guest write/helpful → `/login?returnTo=…`.
- Create/edit → toast pending. FE does **not** insert the review into the public PDP list.
- `409` → edit own review. `422` → no-purchase copy.
- Never send `status` / `verifiedPurchase`.
- Order-detail “write review” **not** wired (lines have no `productId`).
- Home testimonials block remains static marketing.

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
PATCH  /storefront/customer/me
GET    /storefront/customer/sessions
DELETE /storefront/customer/sessions/:sessionId
POST   /storefront/customer/change-password

# Phase 2 account
GET    /storefront/customer/addresses
POST   /storefront/customer/addresses
PATCH  /storefront/customer/addresses/:addressId
DELETE /storefront/customer/addresses/:addressId
PATCH  /storefront/customer/addresses/:addressId/default
GET    /storefront/customer/phones
POST   /storefront/customer/phones
DELETE /storefront/customer/phones/:phoneId
PATCH  /storefront/customer/phones/:phoneId/default
GET    /storefront/customer/marketing-consents
PATCH  /storefront/customer/marketing-consents

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

# Wishlist (JWT only — same API for /account/wishlist and /account/saved)
GET    /storefront/customer/wishlist
GET    /storefront/customer/wishlist/status?productIds=
POST   /storefront/customer/wishlist/items
DELETE /storefront/customer/wishlist/items/:productId
DELETE /storefront/customer/wishlist/items

# Reviews (public = no JWT, product UUID)
GET    /storefront/catalog/products/:productId/reviews/summary
GET    /storefront/catalog/products/:productId/reviews
POST   /storefront/catalog/reviews/:reviewId/helpful
DELETE /storefront/catalog/reviews/:reviewId/helpful
POST   /storefront/customer/reviews
GET    /storefront/customer/reviews
GET    /storefront/customer/reviews/:reviewId
PATCH  /storefront/customer/reviews/:reviewId
DELETE /storefront/customer/reviews/:reviewId
```

**Not called:** `GET/PATCH /storefront/customer/preferences`, `GET` single address, `PATCH` phone (edit number — we delete/re-add or set primary only).

---

## Asks for backend

1. Confirm Azure Dev (and current Nest) matches this list — especially **wishlist**, **Phase 2** addresses / phones / consents / `PATCH /me`, and **reviews**.  
2. Confirm Dev `forgot-password` / verification flags.  
3. Bind footer menu in Website Management (`footer` is `[]` today).  
4. Collection products for `minis` / `bundles` if those should not fall back to full catalog.  
5. Coupon / newsletter / markets — not started; FE will not invent paths.  
6. Wishlist: JWT, `productId` UUID, cap 100, duplicate add idempotent — please confirm on Azure Dev.  
7. Consents: items without `zoneId` are skipped — register must still set customer `zoneId`.  
8. Reviews: public UUID + context; create → PENDING; `409` / `422`; helpful duplicate is 200. Slug on reviews routes 404’d locally — confirm UUID is the contract.

---

## Slack one-liner

> FE 2026-09-07: **auth, catalog, search, nav, cart, checkout, Paymob, Stripe, confirmation, account orders/cancel, guest tracking, wishlist/saved, profile name, address book, phones, marketing consents, product reviews** are live. **Not wired:** preferences, checkout `customerAddressId`, coupons, newsletter, markets. Full list: `docs/storefront/STOREFRONT_CURRENT_STATUS_FOR_BACKEND.md`. Reviews detail: `docs/storefront/STOREFRONT_REVIEWS_FE_STATUS.md`.
