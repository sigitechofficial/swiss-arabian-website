# Storefront Implementation Status (FE → Backend)

**Date:** 2026-08-11  
**Audience:** Backend team  
**Purpose:** Complete inventory of what the storefront FE has implemented — every module, route, API call, and user flow — plus what is still waiting on backend.

**API base pattern:** `{apiBaseUrl}/storefront/...`  
**Response envelope:** `{ success, data?, error?, meta? }` — FE unwraps `data`  
**Default catalog context:** `zoneCode=UAE&languageCode=en&currencyCode=AED`

---

## Summary (one glance)

| Area | FE UI | API wired | Notes |
|------|-------|-----------|--------|
| Auth (register / login / OTP / reset) | Done | **Live** | Phase 1 complete; OAuth deferred |
| Customer me / sessions / change-password | Done | **Live** | |
| Catalog products (PLP + PDP) | Done | **Live** | Public, no login |
| Catalog collections | Done | **Live** | `minis` / `bundles` fall back to full catalog |
| Catalog search (PDP fallback) | Partial | **Live** (fallback only) | Dedicated `/search` page not wired |
| Cart | Done | **None** | Local Zustand only (`localStorage`) |
| Checkout | Done | **None** | Submit blocked — honest toast |
| Orders | Done (mock) | **None** | Waiting Phase 6 |
| Addresses | Placeholder | **None** | Waiting Phase 2 |
| Wishlist / Saved | Placeholder | **None** | |
| Payments (account) | Done (mock) | **None** | Waiting Phase 5 |
| Subscriptions (commerce) | Marketing UI | **None** | Account page = mock |
| Markets / zones | Selector shell | **None** | Hardcoded UAE default |
| Home / Blog / FAQ / Story / Stores | Done (static) | **None** | Content only |
| Gift box / Gift cards | Partial / Stub | **None** | |
| Newsletter | Form UI | **None** | Client fake thank-you |
| OpenAPI codegen | Script only | Spec missing | `storeApi.generated.d.ts` not generated |

**Bottom line:** Only **Auth/Customer** and **Catalog** call real `/storefront/*` APIs. Cart is local. Checkout / orders / payments / wishlist / addresses / subscriptions commerce are UI-ready and waiting on backend.

---

## Guest vs logged-in

| Flow | Guest | Logged-in |
|------|-------|-----------|
| Browse catalog / PDP / collections | Yes | Yes |
| Add to cart / cart sheet / `/cart` | Yes (local) | Yes (same local store) |
| Checkout form | Yes | Yes — **submit not connected** |
| Account (`/account/*`) | Redirect → `/login?returnTo=…` | Allowed (`AuthGuard`) |
| Wishlist / addresses / saved | N/A | Placeholder pages |
| Guest cart merge on login | Not implemented | `guestToken` typed on login but **UI never sends it** |

---

## Client infrastructure (shared)

| Piece | Status | Detail |
|-------|--------|--------|
| `apiClient` | Done | Bearer auth; 401 → single-flight refresh → retry → `endSession()` |
| React Query | Done | `useApiQuery` / `useApiMutation` |
| Auth bootstrap | Done | `AuthSessionProvider`: refresh if needed → `GET /storefront/customer/me` |
| Auth guard | Done | Account shell requires auth |
| OpenAPI types | Stub | Codegen script exists; generated file not present |

### Zustand stores

| Store | Holds | Persistence |
|-------|-------|-------------|
| `useAuthStore` | `user`, `isAuthenticated`, `bootstrapped` | Memory (tokens in `localStorage`) |
| `useCartStore` | Line items (product/variant/slug/title/image/price/qty/size/notes) | `localStorage` key `sa-store-cart` |
| `useUiStore` | `mobileNavOpen`, `cartOpen`, `selectedMarketId` | Memory |

**No server cart sync.** Guest and logged-in share the same local cart.

### Env vars FE uses (names only)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_USE_LOCAL_API` | LAN vs cloud API toggle |
| `NEXT_PUBLIC_APP_ENV` | `local` \| `dev` \| `staging` \| `production` |
| `NEXT_PUBLIC_LOCAL_API_BASE_URL` | Local API base |
| `NEXT_PUBLIC_DEV_API_BASE_URL` | Dev API base |
| `NEXT_PUBLIC_STAGING_API_BASE_URL` | Staging API base |
| `NEXT_PUBLIC_PRODUCTION_API_BASE_URL` | Production API base |
| `NEXT_PUBLIC_*_RETURN_URL` | OAuth / return URLs per env |
| `NEXT_PUBLIC_ENABLE_MFA` | MFA UI (off) |
| `NEXT_PUBLIC_ENABLE_PASSWORD_RESET` | Password reset UI |
| `NEXT_PUBLIC_CUSTOMER_VERIFICATION_UI` | Phone verify chrome |
| `NEXT_PUBLIC_ENABLE_OAUTH` | Google/Apple buttons |
| `NEXT_PUBLIC_USE_DEV_SESSION` | Dev session shortcut |
| `NEXT_PUBLIC_CUSTOMER_MASTER_OTP` | Local QA OTP (dev only) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Store locator |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | Advanced markers |
| `NEXT_PUBLIC_CATALOG_MEDIA_BASE_URL` | Relative catalog image base |
| `OPENAPI_SPEC_URL` | Swagger → codegen (script only) |

---

## Module-by-module status

### 1. Auth — **DONE** (API live)

| | |
|--|--|
| **Routes** | `/login`, `/register`, `/verify`, `/forgot-password`, `/reset-password` |
| **Status** | Phase 1 complete |
| **Partial** | OAuth UI-only until `NEXT_PUBLIC_ENABLE_OAUTH`; MFA unused; passkeys “coming soon” |

#### Flows implemented

1. **Register** → tokens returned immediately (non-blocking) → account (or verify if flag on)
2. **Password login** (`identifier` = email or E.164 phone)
3. **Email-code login** — request code → confirm code
4. **Email verification required** path on login (`EMAIL_VERIFICATION_REQUIRED`)
5. **Phone verify** — request / confirm / resend OTP (flag-gated)
6. **Forgot password** → **Reset password** (flag-gated)
7. **Logout** / **Logout all devices**
8. **Session list + revoke** (`/account/security`)
9. **Change password** → FE clears session → force re-login
10. **Session bootstrap** on app load via refresh + `/me`

#### Endpoints FE calls

| Method | Path | Auth |
|--------|------|------|
| POST | `/storefront/auth/register` | Public |
| POST | `/storefront/auth/login` | Public |
| POST | `/storefront/auth/login/email-code/request` | Public |
| POST | `/storefront/auth/login/email-code/confirm` | Public |
| POST | `/storefront/auth/refresh` | Public (refreshToken body) |
| POST | `/storefront/auth/logout` | Bearer |
| POST | `/storefront/auth/logout-all` | Bearer |
| POST | `/storefront/auth/verify-email/request` | Public |
| POST | `/storefront/auth/verify-email/confirm` | Public |
| POST | `/storefront/auth/verify-phone/request` | Public |
| POST | `/storefront/auth/verify-phone/confirm` | Public |
| POST | `/storefront/auth/forgot-password` | Public |
| POST | `/storefront/auth/reset-password` | Public |
| POST | `/storefront/auth/otp/resend` | Public |
| GET | `/storefront/customer/me` | Bearer |
| GET | `/storefront/customer/sessions` | Bearer |
| DELETE | `/storefront/customer/sessions/:sessionId` | Bearer |
| POST | `/storefront/customer/change-password` | Bearer |

#### Request / response shapes FE expects

**Register body:**

```json
{
  "zoneCode": "uae",
  "salesChannelCode": "platform_uae",
  "email": "…",
  "phone": "+971…",
  "password": "…",
  "firstName": "…",
  "lastName": "…"
}
```

- `zoneCode` sent **lowercase**
- `salesChannelCode` = `platform_{zone}` (default UAE → `platform_uae`)
- Phone normalized to E.164

**Login body:** `{ "identifier": "…", "password": "…", "guestToken?": "…" }`  
(`guestToken` typed but **not sent by UI yet**)

**Token shape (`IssuedCustomerToken`):**

```ts
{
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  sessionId: string;
  refreshToken: string;
  refreshExpiresIn: number;
}
```

**Customer (`CustomerProfileView`):**

```ts
{
  id: string;
  email: string | null;
  phoneE164: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  zoneId: string | null;
  isEmailVerified: boolean;
}
```

**Auth result:** `{ token, customer }`  
**OTP resend purpose:** `VERIFY_EMAIL` | `VERIFY_PHONE` | `RESET_PASSWORD` | `LOGIN`

#### Known BE issue (from 2026-08-10 smoke)

- `POST /storefront/auth/forgot-password` returned **401 Validation failed** on Azure Dev  
  — please confirm if verification/reset is disabled on Dev or contract changed.

---

### 2. Catalog — **DONE** (API live)

| | |
|--|--|
| **Routes** | `/products`, `/products/[slug]` |
| **Status** | PLP + PDP wired to real APIs |

#### Flows implemented

1. Paginated product list (page size **24**)
2. PDP by slug (detail → SKU query → search fallback)
3. Add to cart from PDP (**local cart only**)
4. Related products from list
5. Public browse (no login) — `skipAuth: true`

#### Endpoints FE calls

| Method | Path | Query |
|--------|------|-------|
| GET | `/storefront/catalog/products` | `zoneCode`, `languageCode`, `currencyCode`, `page`, `limit` (+ optional `sku`) |
| GET | `/storefront/catalog/products/:slug` | context qs |
| GET | `/storefront/catalog/search` | `q`, `limit`, context qs (**PDP fallback only**) |
| GET | `/storefront/catalog/collections` | context qs |
| GET | `/storefront/catalog/collections/:slug` | context qs |
| GET | `/storefront/catalog/collections/:slug/products` | `page`, `limit`, context qs |

#### List item fields FE maps

```ts
{
  productId, variantId, sku?, slug, name,
  shortDescription?, description?,
  image?, images?: [{ url, altText, sortOrder, mediaType }],
  priceSummary?: { price, currencyCode, hasValidPrice },
  inventorySummary?: { availableQty, hasAvailableInventory },
  isVisible?, isSellable?, sellabilityStatus?, blockReasons?
}
```

#### Detail fields FE maps

```ts
{
  product: { productId, productCode?, slug, name, shortDescription?, description?, brandCode?, brandName? },
  variants?, media?,
  collections?: [{ collectionId?, code?, name, slug, isFeatured? }],
  priceSummary?, inventorySummary?, isVisible?, isSellable?, blockReasons?
}
```

**Pagination FE expects:** `{ page, limit, total, totalPages }`  
**Images:** Relative `/catalog/media/...` resolved via `NEXT_PUBLIC_CATALOG_MEDIA_BASE_URL` or API base.

---

### 3. Collections — **PARTIAL** (API live)

| | |
|--|--|
| **Routes** | `/collections`, `/collections/[slug]` |
| **Status** | List + detail + infinite product feed from API |
| **Gaps** | Hero copy/images are **static per slug** (not CMS). `minis` / `bundles` **fall back to full catalog products** when collection feed empty/missing |

#### Flows

1. List all collections from API
2. Collection detail + paginated products
3. Navigate into PDP

---

### 4. Cart — **PARTIAL** (UI done, **no API**)

| | |
|--|--|
| **Routes** | `/cart` + global cart side sheet |
| **Status** | Full UI; **Zustand local only** |

#### Flows implemented (client-only)

1. Add line (productId, variantId, slug, title, image, unitPrice, currency, qty, sizeLabel, notes)
2. Update quantity / remove / clear
3. Free-shipping progress UI (threshold local)
4. Upsells from static content
5. Navigate to `/checkout`

#### Backend needed

- Cart CRUD (create / update qty / remove / clear)
- Guest cart token
- Merge guest cart on login (`guestToken` already on login types)
- Server-side pricing + inventory validation

---

### 5. Checkout — **PARTIAL** (UI done, submit **stub**)

| | |
|--|--|
| **Route** | `/checkout` |
| **Status** | Full form UI; **Pay now does not call API** |

#### Flows implemented (UI only)

1. Contact + UAE address form (`react-hook-form` + Zod)
2. Payment method radios: `card` | `wallet` | `tabby` | `tamara` | `cod`
3. Card fields shown (not tokenized / not sent to gateway)
4. Hard-coded promo `SA10` (−100 AED) for UI demo
5. Pay now → toast: **“Checkout API not connected yet”** (no fake success)

#### Backend needed

- Checkout / order create
- Shipping rates, tax
- Promo / coupon validation
- Payment session (card / BNPL / COD)
- Guest checkout
- Order confirmation payload for success page

---

### 6. Orders — **STUB** (UI + mock data)

| | |
|--|--|
| **Routes** | `/account/orders`, `/account/orders/[id]` |
| **Status** | List UI uses static `purchaseHistoryOrders`; detail page placeholder |
| **Mapper ready** | `OrderSummaryView` in `src/features/orders/types/order.ts` |

#### Backend needed (Phase 6)

- `GET /storefront/orders` (list + channel filter: All / Online / In Store)
- `GET /storefront/orders/:id` (detail)

---

### 7. Account — **PARTIAL**

| Route | UI | API | Notes |
|-------|----|-----|-------|
| `/account` | Done | Partial | Greeting from `/me`; recent order = **mock** |
| `/account/profile` | Done | Partial | Display from `/me`; edit name/email/passkeys/comms/delete → “soon” |
| `/account/security` | Done | **Live** | Change password + sessions |
| `/account/rewards` | Done | None | Local points demo only |
| `/account/subscription` | Done | None | Static mock |
| `/account/addresses` | Placeholder | None | Explicit Phase 2 placeholder |
| `/account/wishlist` | Placeholder | None | Waiting wishlist API |
| `/account/saved` | Placeholder | None | Same as wishlist |
| `/account/membership` | Placeholder | None | Points to subscription |
| `/account/payments` | Done (mock) | None | Static saved cards + transactions |
| `/account/orders` | Done (mock) | None | See Orders |

#### Backend needed for account completeness

- `PATCH /storefront/customer/me` (profile update)
- Addresses CRUD (Phase 2)
- Preferences / marketing consents
- Delete account (if planned)
- Passkeys / MFA / OAuth link-unlink
- Wishlist CRUD
- Payments vault + transaction history (tokenized only — FE never wants full PAN)
- Rewards / loyalty
- Subscriptions manage (pause / skip / cancel / swap)

---

### 8. Payments (account) — **STUB**

| | |
|--|--|
| **Route** | `/account/payments` |
| **Status** | Display-only mock UI |
| **Checkout payments** | Separate form-only — no gateway |

---

### 9. Search — **STUB**

| | |
|--|--|
| **Route** | `/search` |
| **Status** | Page shell exists; **not wired** to API |
| **Note** | Catalog already has `GET /storefront/catalog/search` — used only as PDP slug fallback. Header search is cosmetic |

#### Backend / FE next step

- Wire `/search` to `GET /storefront/catalog/search` (or confirm final search path)

---

### 10. Markets — **STUB**

| | |
|--|--|
| **Status** | `selectedMarketId` in UI store; catalog defaults to `UAE` |
| **API** | No markets service |

#### Backend needed

- Markets / zones list + currency / language
- Wire selector → catalog context qs

---

### 11. Home — **PARTIAL** (static marketing)

| | |
|--|--|
| **Route** | `/` |
| **Status** | Full landing UI; product rails from **static** `homeContent` |
| **Newsletter** | Client-only fake thank-you — **no API** |

#### Backend needed (optional)

- Homepage / merchandising feeds
- Newsletter subscribe API

---

### 12. Subscriptions — **PARTIAL**

| | |
|--|--|
| **Routes** | `/subscriptions` (marketing), `/account/subscription` (mock) |
| **Status** | Marketing + fragrance picker static; account manage = mock |

#### Backend needed

- Subscribe / manage / pause / cancel
- Next delivery, billing, scent swap, history

---

### 13. Gift box / Gift cards

| Module | Status | Route | Notes |
|--------|--------|-------|-------|
| Gift box | Partial | `/gift-box` | Static gift-set marketing |
| Gift cards | Stub | `/gift-cards` | Placeholder only |

---

### 14. Content pages (static — no storefront API)

| Module | Routes | Status |
|--------|--------|--------|
| Blog | `/blog`, `/blog/[slug]` | Static posts |
| FAQ | `/faq` | Static |
| Our Story | `/our-story` | Static |
| Stores | `/stores` | Static UAE list; Google Maps if key set |

---

## All app routes (inventory)

### Shop
`/`, `/products`, `/products/[slug]`, `/collections`, `/collections/[slug]`, `/cart`, `/search`, `/gift-box`, `/gift-cards`, `/subscriptions`, `/blog`, `/blog/[slug]`, `/faq`, `/our-story`, `/stores`

### Auth
`/login`, `/register`, `/verify`, `/forgot-password`, `/reset-password`

### Checkout
`/checkout`

### Account
`/account`, `/account/profile`, `/account/security`, `/account/orders`, `/account/orders/[id]`, `/account/payments`, `/account/rewards`, `/account/subscription`, `/account/addresses`, `/account/wishlist`, `/account/saved`, `/account/membership`

### Other
`GET /api/health` — Next.js only (not storefront backend)

---

## Complete list of APIs FE calls today

```
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
GET    /storefront/catalog/products
GET    /storefront/catalog/products/:slug
GET    /storefront/catalog/search
GET    /storefront/catalog/collections
GET    /storefront/catalog/collections/:slug
GET    /storefront/catalog/collections/:slug/products
```

---

## Waiting on backend (priority)

| Priority | Need | FE readiness |
|----------|------|--------------|
| **P0** | Cart API (CRUD + guest token + login merge) | Cart UI + local store ready; login types already have `guestToken` |
| **P0** | Checkout / order create + payment initiation | Checkout UI ready; submit currently blocked |
| **P1** | Orders list + detail | Purchase history UI + `OrderSummaryView` mapper ready |
| **P1** | Addresses CRUD | Placeholder page ready |
| **P1** | Profile update `PATCH /me` | Profile UI ready |
| **P2** | Wishlist / saved | Placeholder pages ready |
| **P2** | Payments vault + transaction history | Payments UI mock ready |
| **P2** | Subscriptions commerce + account manage | Marketing + account mock ready |
| **P2** | Wire search page to catalog search | `/search` shell + catalog search endpoint exist |
| **P3** | Markets / zones list | Selector shell + catalog context ready |
| **P3** | Newsletter subscribe | Form exists |
| **P3** | Rewards / loyalty | Rewards UI demo exists |
| **P3** | Gift cards, OAuth, MFA, passkeys, CMS/home feeds | UI stubs / deferred |
| **P3** | Collection membership for `minis` / `bundles` | FE falls back to full catalog today |
| **—** | Publish OpenAPI / Swagger URL | FE codegen script waiting |

---

## Mock / fallback behaviour (honest)

| Area | Behaviour |
|------|-----------|
| Home product rails | Static content |
| Cart | Local persisted Zustand |
| Checkout discount | Hardcoded `SA10` |
| Checkout submit | Explicit error toast — **no fake success** |
| Orders / payments / subscription account | Static Figma mock data for layout |
| Rewards redeem | Client-only math |
| Newsletter | Fake thank-you |
| Stores / Blog / FAQ / Story / Gift box | Static |
| Collection heroes | Static per-slug assets |
| `minis` / `bundles` products | Fall back to full catalog |
| OAuth | “Coming soon” unless flag on |
| Search page | Unwired |

**Policy:** Commerce actions do **not** fake success when APIs are missing (checkout already follows this). Some account/marketing screens still use illustrative mock data for layout fidelity.

---

## Key FE source files

| Area | Path |
|------|------|
| Auth API | `src/features/auth/api/auth.service.ts` |
| Catalog API | `src/features/catalog/api/catalog.service.ts` |
| API client | `src/lib/api/apiClient.ts` |
| Session bootstrap | `src/providers/AuthSessionProvider.tsx` |
| Cart store | `src/stores/` (`useCartStore`) |
| Checkout UI | `src/features/checkout/components/CheckoutPageView.tsx` |
| Orders types | `src/features/orders/types/order.ts` |

---

## Companion docs

- [`STOREFRONT_FE_STATUS_FOR_BACKEND.md`](./STOREFRONT_FE_STATUS_FOR_BACKEND.md) — smoke results (2026-08-10)
- [`STOREFRONT_PHASE_1_INTEGRATION_STATUS.md`](./STOREFRONT_PHASE_1_INTEGRATION_STATUS.md) — Phase 1 wave tracker
- [`STOREFRONT_ACCOUNT_UI_API_MAP.md`](./STOREFRONT_ACCOUNT_UI_API_MAP.md) — Account Figma ↔ API map
- [`COLLECTIONS_AND_PRODUCTS_GUIDE.md`](./COLLECTIONS_AND_PRODUCTS_GUIDE.md) — Catalog guide
- [`STOREFRONT_FRONTEND_INTEGRATION_GUIDE_PHASE_1.md`](./STOREFRONT_FRONTEND_INTEGRATION_GUIDE_PHASE_1.md) — Phase 1 contract

---

## Slack one-liner

> FE status 2026-08-11: **Auth + Catalog live** (register/login/OTP/reset/me/sessions/change-password + products/collections/PDP). **Cart is local only. Checkout UI ready but submit blocked.** Orders / addresses / wishlist / payments / subscriptions still UI+mock — waiting on Phase 2–6 APIs. Full module inventory: `docs/storefront/STOREFRONT_IMPLEMENTATION_STATUS.md`.
