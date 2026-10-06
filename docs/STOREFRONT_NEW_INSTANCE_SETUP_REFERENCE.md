# Swiss Arabian Storefront — Complete Setup Guide (New Instance)

> **Purpose:** Everything a developer needs to clone, configure, and run a second instance of the Swiss Arabian storefront from scratch.  
> **Updated:** 2026-08-24  
> **Repo name:** `swiss-arabian-website`  
> **Backend Swagger:** `{apiBaseUrl}/api/docs`

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Clone & Install](#2-clone--install)
3. [Environment Variables](#3-environment-variables)
4. [Running the App](#4-running-the-app)
5. [Tech Stack & Architecture](#5-tech-stack--architecture)
6. [Folder Structure](#6-folder-structure)
7. [API Integration Status](#7-api-integration-status)
8. [Key Source Files](#8-key-source-files)
9. [Design System & Branding](#9-design-system--branding)
10. [Navigation Setup (Backend Required)](#10-navigation-setup-backend-required)
11. [Cart & Checkout (Backend Required)](#11-cart--checkout-backend-required)
12. [Auth Flows](#12-auth-flows)
13. [Feature Flags](#13-feature-flags)
14. [OpenAPI Code Generation](#14-openapi-code-generation)
15. [Quality Checks](#15-quality-checks)
16. [Deployment Notes](#16-deployment-notes)
17. [What Still Needs Wiring](#17-what-still-needs-wiring)

---

## 1. Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| **Node.js** | 20 LTS or 22 | `node -v` to check |
| **npm** | 10+ | Comes with Node |
| **Git** | Any recent | |
| **Backend API** | Running | See §3 for URL config |

No global installs needed beyond Node/npm.

---

## 2. Clone & Install

```bash
# Clone the repo
git clone <repo-url> swiss-arabian-website
cd swiss-arabian-website

# Install all dependencies
npm install

# Copy the example env file
cp .env.example .env.local
```

Then fill in `.env.local` (see §3 below).

---

## 3. Environment Variables

Create `.env.local` in the root. All variables are `NEXT_PUBLIC_*` (inlined at build time by Next.js).

### Minimal config (quickest start)

```env
# Which environment is this build?
NEXT_PUBLIC_APP_ENV=dev

# Point to Azure Dev backend (default)
NEXT_PUBLIC_USE_LOCAL_API=false
NEXT_PUBLIC_DEV_API_BASE_URL=https://ca-swissarabian-backend-dev.greenbush-d5b07575.uaenorth.azurecontainerapps.io
```

That is enough to run against the live Azure Dev backend.

---

### Full variable reference

```env
# ─── Environment ──────────────────────────────────────────────────────────────
# Values: local | dev | staging | production
NEXT_PUBLIC_APP_ENV=dev

# ─── API base URLs (one per environment) ──────────────────────────────────────
# Toggle: true = use LOCAL_API_BASE_URL regardless of APP_ENV
NEXT_PUBLIC_USE_LOCAL_API=false

# Local backend on LAN (only used when USE_LOCAL_API=true or APP_ENV=local)
NEXT_PUBLIC_LOCAL_API_BASE_URL=http://192.168.18.143:3000

# Azure Dev cloud backend
NEXT_PUBLIC_DEV_API_BASE_URL=https://ca-swissarabian-backend-dev.greenbush-d5b07575.uaenorth.azurecontainerapps.io

# Staging and production (fill when you have those URLs)
NEXT_PUBLIC_STAGING_API_BASE_URL=
NEXT_PUBLIC_PRODUCTION_API_BASE_URL=

# ─── Return / redirect URLs (used for OAuth and payment callbacks) ────────────
NEXT_PUBLIC_LOCAL_RETURN_URL=http://localhost:3000
NEXT_PUBLIC_DEV_RETURN_URL=http://localhost:3000
NEXT_PUBLIC_STAGING_RETURN_URL=
NEXT_PUBLIC_PRODUCTION_RETURN_URL=

# ─── Feature flags ────────────────────────────────────────────────────────────
# MFA login step — off until backend enables it
NEXT_PUBLIC_ENABLE_MFA=false

# Password reset flow — keep true unless disabled on backend
NEXT_PUBLIC_ENABLE_PASSWORD_RESET=true

# Phone verification chrome after register/login
NEXT_PUBLIC_CUSTOMER_VERIFICATION_UI=true

# Google / Apple OAuth buttons
NEXT_PUBLIC_ENABLE_OAUTH=false

# Dev shortcut: skip OTP + login checks in local dev only
NEXT_PUBLIC_USE_DEV_SESSION=false

# ─── Local QA only ────────────────────────────────────────────────────────────
# Master OTP for dev — never set against production build
NEXT_PUBLIC_CUSTOMER_MASTER_OTP=

# ─── Google Maps (store locator page) ─────────────────────────────────────────
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=

# ─── Catalog media ────────────────────────────────────────────────────────────
# Override base URL for relative /catalog/media/... image paths.
# Leave empty → falls back to apiBaseUrl automatically.
NEXT_PUBLIC_CATALOG_MEDIA_BASE_URL=

# ─── OpenAPI codegen (build script, not browser) ──────────────────────────────
OPENAPI_SPEC_URL=https://{apiBaseUrl}/api/docs-json
```

### How API URL is resolved at runtime

```
USE_LOCAL_API=true  →  LOCAL_API_BASE_URL  (regardless of APP_ENV)
USE_LOCAL_API=false →  API_BASE_BY_ENV[APP_ENV]
                        local    → LOCAL_API_BASE_URL
                        dev      → DEV_API_BASE_URL      ← default
                        staging  → STAGING_API_BASE_URL
                        production → PRODUCTION_API_BASE_URL
```

---

## 4. Running the App

```bash
# Development server — hot reload on http://localhost:3000
npm run dev

# Production build + serve
npm run build
npm run start

# Type check only
npm run typecheck

# Lint (zero warnings enforced)
npm run lint

# Unit tests (Vitest)
npm run test

# All quality gates at once (typecheck + lint + test + build)
npm run quality
```

> **Port:** storefront uses **3000**. Admin panel uses **3001**. Both can run simultaneously.

---

## 5. Tech Stack & Architecture

| Layer | Choice |
|-------|--------|
| Framework | **Next.js 16** — App Router |
| UI | **React 19** |
| Language | **TypeScript 5** (strict) |
| Component lib | **MUI 9** (`@mui/material`) |
| Styling | **Tailwind CSS 4** + Emotion |
| Forms | `react-hook-form` + **Zod 4** + `@hookform/resolvers` |
| Server state | **TanStack React Query 5** |
| Client state | **Zustand 5** (auth / UI / cart only — never API cache) |
| Icons | `lucide-react` |
| Animation | `framer-motion` |
| Tests | **Vitest** + Testing Library |
| Lint | **ESLint 9** (`max-warnings=0`) |

### Core architecture rules

- `app/**/page.tsx` — **thin pages only**: import a feature view, wrap with guard if needed.
- `features/<domain>/` — all real UI, service functions, React Query hooks, Zod schemas, types.
- `components/ui/` — pure design system components; no domain logic.
- `src/lib/api/apiClient.ts` — all API calls go through here; unwraps `{ success, data, error }` envelope.
- **Swagger is source of truth** — do not invent API paths or shapes.
- **No Redux / RTK Query** — use TanStack Query + Zustand.

---

## 6. Folder Structure

```
swiss-arabian-website/
├── .cursor/                    # Cursor AI rules (project conventions)
├── docs/                       # All integration + handoff docs
│   └── storefront/             # Phase guides, status, handoffs
├── public/
│   └── assets/                 # Static images (hero banners, icons, etc.)
├── scripts/                    # openapi generate, ops scripts
├── src/
│   ├── app/                    # Next.js App Router — thin pages only
│   │   ├── (shop)/             # Storefront shell pages (/, /products, /collections …)
│   │   ├── (auth)/             # /login, /register, /forgot-password …
│   │   ├── (account)/          # /account/* (requires auth)
│   │   ├── (checkout)/         # /checkout, /order-confirmation/*
│   │   └── api/                # Next.js route handlers
│   ├── assets/                 # Imported static asset paths
│   ├── components/
│   │   ├── forms/              # Shared form primitives
│   │   ├── guards/             # AuthGuard
│   │   ├── layout/             # StorefrontShell, SiteHeader, SiteFooter, MobileNav
│   │   ├── shared/             # Cross-feature shared components
│   │   └── ui/                 # AppButton, AppCard, PageLoading, Toaster …
│   ├── features/               # Domain modules (see §7)
│   │   ├── auth/
│   │   ├── catalog/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── collections/
│   │   ├── home/
│   │   ├── navigation/
│   │   ├── account/
│   │   ├── orders/
│   │   ├── search/
│   │   ├── payments/
│   │   ├── subscriptions/
│   │   └── …
│   ├── hooks/                  # Shared React hooks (useIsMobile, useDebounce …)
│   ├── lib/
│   │   ├── api/                # apiClient, queryClient, apiError
│   │   ├── auth/               # token.ts, endSession.ts
│   │   ├── config/             # env.ts (all env var access goes here)
│   │   ├── motion/             # Framer Motion variants
│   │   ├── navigation/         # storeNavigation.ts
│   │   └── storefront/         # context.ts (zoneCode, salesChannelCode)
│   ├── providers/              # QueryProvider, ThemeProvider, AuthSessionProvider, CartSessionProvider
│   ├── stores/                 # Zustand: useAuthStore, useCartStore, useUiStore
│   ├── theme/                  # designTokens.ts, muiTheme.ts
│   └── types/                  # storeApi.generated.d.ts (from openapi codegen)
├── .env.example
├── .env.local                  # Your local config (gitignored)
├── next.config.ts
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### Feature module layout

```
features/<name>/
├── api/            # Service functions (apiGet/Post wrappers) + React Query hooks
├── components/     # Page view components
├── hooks/          # Feature-specific React hooks
├── schemas/        # Zod validation schemas
├── types/          # TypeScript interfaces
├── utils/          # Pure helpers
└── index.ts        # Public barrel export
```

---

## 7. API Integration Status

### Live (calling real backend)

| Module | Endpoints |
|--------|-----------|
| **Auth** | Register, Login (password + email-code), Refresh, Logout, Verify email/phone, Forgot/Reset password, OTP resend |
| **Customer** | `/me`, Sessions list, Revoke session, Change password |
| **Catalog products** | List, Detail by slug, Search (PDP fallback) |
| **Catalog collections** | List, Detail, Products in collection |
| **Navigation** | `GET /storefront/navigation` — header + footer from API |
| **Cart** | Full CRUD + guest token + login merge |
| **Checkout** | Session create, delivery/payment methods, address, validate, place order, initiate payment |
| **Orders** | Place from checkout, Get order detail, Payment status polling |

### UI built, API not yet wired

| Module | Status |
|--------|--------|
| Search page (`/search`) | Shell exists, not wired to API |
| Orders list/history | UI + mock data; waiting backend |
| Addresses CRUD | Placeholder page |
| Wishlist / Saved | Placeholder pages |
| Payments vault | Mock UI |
| Subscriptions (commerce) | Marketing static; account mock |
| Profile update (`PATCH /me`) | Display works; edit deferred |
| Markets / zones API | Hardcoded UAE default |
| Newsletter subscribe | Fake thank-you only |

---

## 8. Key Source Files

| File | What it does |
|------|-------------|
| `src/lib/api/apiClient.ts` | All HTTP calls — Bearer auth, envelope unwrap, 401 → refresh → retry → endSession |
| `src/lib/config/env.ts` | **All environment variable access goes here** — never read `process.env` directly in components |
| `src/lib/auth/token.ts` | localStorage access/write for `accessToken` + `refreshToken` |
| `src/lib/auth/endSession.ts` | Clears tokens + Zustand + queryClient + cart on logout |
| `src/lib/storefront/context.ts` | `DEFAULT_ZONE_CODE`, `toAuthSalesChannelCode()` — passed on every storefront API call |
| `src/providers/AuthSessionProvider.tsx` | App bootstrap: refresh tokens → GET /me → hydrate auth store |
| `src/providers/CartSessionProvider.tsx` | Cart lifecycle: restore on load, merge on login, clear on logout |
| `src/stores/useAuthStore.ts` | Zustand: `user`, `isAuthenticated`, `bootstrapped` |
| `src/stores/useCartStore.ts` | Zustand: cart lines, totals, cartId — persists to localStorage |
| `src/stores/useUiStore.ts` | Zustand: mobileNavOpen, cartOpen, selectedMarketId |
| `src/features/auth/api/auth.service.ts` | All auth API calls |
| `src/features/catalog/api/catalog.service.ts` | All catalog API calls + product/image mappers |
| `src/features/cart/api/cart.service.ts` | All cart API calls + guestToken param builder |
| `src/features/cart/utils/guestToken.ts` | `sa_guest_token` + `sa_cart_id` localStorage helpers |
| `src/features/checkout/api/checkout.service.ts` | Checkout session API calls |
| `src/features/checkout/api/orders.service.ts` | Place order, payment initiate, payment status polling |
| `src/features/checkout/hooks/useCheckout.ts` | Full checkout state machine (session → methods → submit) |
| `src/features/navigation/api/navigation.service.ts` | `GET /storefront/navigation` |
| `src/features/navigation/hooks/useNavigation.ts` | React Query hook + adapter to MobileNavItem format |
| `src/components/layout/SiteHeader.tsx` | Fetches nav, passes to DesktopNav + MobileNav |
| `src/components/layout/SiteFooter.tsx` | Fetches nav, renders footer columns from API |
| `src/features/home/constants/homeAssets.ts` | Static hero slides, nav fallback, asset paths |

---

## 9. Design System & Branding

### Colors (design tokens — `src/theme/designTokens.ts`)

| Token | Value | Use |
|-------|-------|-----|
| `terra` | `#B46E57` | Primary CTAs, active states |
| `ink` / `sa-primary` | `#2C241D` | Main text, dark backgrounds |
| `cream` | `#FBF7F0` | Section backgrounds (not page bg) |
| `gold` | `#B5883E` | Eyebrows, accents |
| `gold-light` | `#CDA766` | Lighter gold accents |
| `bg-page` | `#FFFFFF` light / `#1a1510` dark | Page background |
| `bg-inverse` | `#2C241D` | Footer + always-dark surfaces |

### Fonts
- **Cormorant Garamond** — display headings
- **Nunito Sans** — body text

### Theme rules
- Dark mode: `html.dark` class (not `prefers-color-scheme`)
- Tailwind dark variant: `@custom-variant dark (&:where(.dark, .dark *));`
- Logo on light: `class="site-logo"` (no filter)
- Logo on dark header: `class="site-logo"` (cream filter from CSS)
- Logo on always-dark surfaces (footer): `class="site-logo-on-dark"` (cream filter always)
- **No purple, glow, or generic AI-gradient styles**

### Card pattern
```
border: 1px solid semanticColors.border.default
border-radius: radius.md
box-shadow: none
```

---

## 10. Navigation Setup (Backend Required)

The header and footer nav are fetched from `GET /storefront/navigation?zoneCode=UAE`.

### How it works

1. Admin binds a menu in **Website Management** → header/footer
2. API returns `{ header: NavItem[], footer: NavItem[], metadata: { source } }`
3. `source = "bound_menu"` → API menu is live
4. `source = "catalog_categories"` → fallback (no menu bound)

### To activate the bound menu (ops step)

```http
PUT /admin/website-management/markets/UAE/bindings
Content-Type: application/json

{
  "headerMenuId": "<active-menu-id>",
  "reason": "Publish UAE header on storefront"
}
```

Then verify:

```http
GET /storefront/navigation?zoneCode=UAE
```

Expect `metadata.source === "bound_menu"`.

### NavItem type mapping

| `type` | UI behavior | Example `href` |
|--------|-------------|----------------|
| `COLLECTION` | Link to collection PLP | `/collections/men` |
| `CATEGORY` | Link to category PLP | `/categories/…` |
| `PRODUCT` | Link to PDP | `/products/gharam` |
| `URL` | Internal or external link | Any |
| `GROUP_HEADER` | **Label only — not clickable** | `null` |

Max depth = 3 levels. `GROUP_HEADER` = section heading inside dropdown.

---

## 11. Cart & Checkout (Backend Required)

### Cart flow

The cart is API-backed with guest + authenticated support.

| localStorage key | Value | Lifecycle |
|------------------|-------|-----------|
| `sa_guest_token` | UUIDv4 | Set on first cart action; cleared on login |
| `sa_cart_id` | Cart UUID | Set when cart created; cleared after order placed |

**Context params on every cart/checkout call:**
```
zoneCode=UAE&salesChannelCode=platform_uae
```

For guests, also add: `&guestToken={sa_guest_token}`

### Checkout flow (C.0 → C.9)

```
1. POST /storefront/checkout/from-cart          → create/resume checkout session
2. GET  /:id/delivery-methods                   → list delivery options
3. POST /:id/delivery-method                    → select one
4. GET  /:id/payment-methods                    → list payment options
5. POST /:id/payment-method                     → select one
6. POST /:id/address                            → set address snapshot
7. POST /:id/validate                           → validate (check data.validation.isValid, NOT HTTP status)
8. POST /storefront/orders/from-checkout        → place order
9. POST /storefront/orders/:id/payment/initiate → start payment
   → paymentAction=REDIRECT  → window.location.href = redirectUrl
   → paymentAction=null (COD) → router.push('/order-confirmation/:orderId')
```

> **Important:** `POST /:id/validate` always returns HTTP 200 even when `isValid: false`. Always check `data.validation.isValid === true` before calling from-checkout.

### Session storage

| Key | Storage | Value |
|-----|---------|-------|
| `sa_checkout_session_id` | `sessionStorage` | Checkout UUID (tab-scoped) |
| `sa_order_id` | `localStorage` | Order UUID after placement |
| `sa_order_number` | `localStorage` | e.g. `SA-10001` |
| `sa_order_access_token` | `localStorage` | Guest tracking token (one-time, never overwrite) |

---

## 12. Auth Flows

### Implemented flows

1. **Register** → tokens returned immediately → account page
2. **Password login** (`identifier` = email or E.164 phone)
3. **Email-code login** → request code → confirm
4. **Email verification** (flag: `NEXT_PUBLIC_CUSTOMER_VERIFICATION_UI`)
5. **Phone verify** (OTP — flag-gated)
6. **Forgot password** → Reset password (flag: `NEXT_PUBLIC_ENABLE_PASSWORD_RESET`)
7. **Logout** + **Logout all devices**
8. **Session list + revoke** (`/account/security`)
9. **Change password** → force re-login

### Register request body

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

Note: `zoneCode` is **lowercase** for auth; **uppercase** (`UAE`) for cart/checkout/catalog.

### Token shape

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

Tokens are stored in `localStorage` via `src/lib/auth/token.ts`.

### Session end (`endSession()`)

Calling `endSession()` from `src/lib/auth/endSession.ts`:
- Removes tokens from localStorage
- Clears Zustand auth + cart stores
- Clears `queryClient` cache
- Clears `sa_cart_id` from localStorage

---

## 13. Feature Flags

All flags are read from `src/lib/config/env.ts` via `env.flags.*`.

| Flag env var | `env.flags.*` | Default | Effect when `true` |
|---|---|---|---|
| `NEXT_PUBLIC_ENABLE_MFA` | `mfa` | `false` | Show MFA step in login |
| `NEXT_PUBLIC_ENABLE_PASSWORD_RESET` | `passwordReset` | `true` | Show forgot/reset password UI |
| `NEXT_PUBLIC_CUSTOMER_VERIFICATION_UI` | `verification` | `true` | Show phone verify step |
| `NEXT_PUBLIC_ENABLE_OAUTH` | `oauth` | `false` | Show Google/Apple login buttons |
| `NEXT_PUBLIC_USE_DEV_SESSION` | `useDevSession` | `false` | Skip OTP checks (dev only) |
| `NEXT_PUBLIC_USE_LOCAL_API` | `useLocalApi` | `false` | Use LAN backend instead of Azure |

---

## 14. OpenAPI Code Generation

The storefront has an OpenAPI → TypeScript codegen script.

```bash
# Set the URL in .env.local
OPENAPI_SPEC_URL=https://{apiBaseUrl}/api/docs-json

# Run codegen
npm run openapi:generate
```

Output: `src/types/storeApi.generated.d.ts`

> This file is not committed. Run the script whenever the backend API changes.

---

## 15. Quality Checks

Run all gates before shipping:

```bash
npm run quality
# Runs: typecheck + lint + test + build
```

Individual:

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint (zero warnings)
npm run test        # Vitest
npm run build       # Next.js production build
```

---

## 16. Deployment Notes

### Environment variables at build time

All `NEXT_PUBLIC_*` variables are **inlined at build time** by Next.js. They must be present when you run `npm run build`, not just at runtime.

For each target environment, set the correct vars:

```env
# For staging build:
NEXT_PUBLIC_APP_ENV=staging
NEXT_PUBLIC_STAGING_API_BASE_URL=https://your-staging-api.example.com
NEXT_PUBLIC_STAGING_RETURN_URL=https://your-staging-storefront.example.com

# For production build:
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_PRODUCTION_API_BASE_URL=https://your-prod-api.example.com
NEXT_PUBLIC_PRODUCTION_RETURN_URL=https://www.swissarabian.com
```

### Port

Default Next.js port is **3000**. Change with `next start -p 4000` or set `PORT=4000`.

### Static assets

All static assets are under `public/assets/`. They are served at `/assets/…`. No CDN config needed for a basic deployment.

---

## 17. What Still Needs Wiring

These are UI-ready modules waiting on backend APIs. Implement in priority order:

### P0 — Critical commerce

| Module | FE status | What backend needs to provide |
|--------|-----------|-------------------------------|
| ~~Cart API~~ | ~~Done~~ | ~~CRUD + guest token + login merge~~ ✅ |
| ~~Checkout/Orders~~ | ~~Done~~ | ~~Session + payment initiation~~ ✅ |

### P1 — Account completeness

| Module | FE status | Backend endpoint needed |
|--------|-----------|------------------------|
| Orders list | UI + mock | `GET /storefront/orders` |
| Orders detail | UI ready | `GET /storefront/orders/:id` |
| Addresses | Placeholder page | `GET/POST/PATCH/DELETE /storefront/customer/addresses` |
| Profile edit | Display works | `PATCH /storefront/customer/me` |

### P2 — Account extras

| Module | FE status | Backend endpoint needed |
|--------|-----------|------------------------|
| Wishlist / Saved | Placeholder | Wishlist CRUD |
| Payments vault | Mock UI | Saved cards + transactions |
| Subscriptions | Account mock | Manage subscribe/pause/cancel |
| Search page | Shell exists | Wire to `GET /storefront/catalog/search` |

### P3 — Nice to have

| Module | Notes |
|--------|-------|
| Markets / zones list | Hardcoded UAE default today |
| Newsletter subscribe | Fake thank-you today |
| Rewards / loyalty | Client-only math today |
| OAuth (Google/Apple) | Flag-gated UI-only today |
| MFA | Flag-gated, backend must enable |
| CMS home feeds | Static content today |
| Collection heroes | Static per-slug assets today |

---

## Companion Docs

| Doc | Location |
|-----|----------|
| Phase 1 integration guide (auth + catalog) | `docs/storefront/STOREFRONT_FRONTEND_INTEGRATION_GUIDE_PHASE_1.md` |
| Cart integration handoff | `docs/storefront/STOREFRONT_CART_FE_HANDOFF.md` |
| Checkout + Orders guide | `docs/storefront/STOREFRONT_CHECKOUT_AND_ORDERS_FE_GUIDE.md` |
| Navigation (web config) guide | `docs/storefront/WEB_CONFIGURATION_GUIDE.md` |
| Collections + products guide | `docs/storefront/COLLECTIONS_AND_PRODUCTS_GUIDE.md` |
| Full implementation status | `docs/storefront/STOREFRONT_IMPLEMENTATION_STATUS.md` |
| Account UI → API map | `docs/storefront/STOREFRONT_ACCOUNT_UI_API_MAP.md` |
| FE status for backend team | `docs/storefront/STOREFRONT_FE_STATUS_FOR_BACKEND.md` |

---

*Generated from codebase state on 2026-08-24. Always check Swagger at `{apiBaseUrl}/api/docs` as the source of truth for API shapes.*
