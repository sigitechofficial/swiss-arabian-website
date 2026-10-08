# Swiss Arabian Website — Project Overview

**Repo:** `swiss-arabian-website`  
**Updated:** 2026-07-31  
**Purpose:** Customer-facing Swiss Arabian storefront — catalog, cart/checkout, account, gifts, subscriptions. Architecture mirrors `swiss-arabian-admin-panel`.

Admin panel reference: `docs/ADMIN_PANEL_PROJECT_OVERVIEW.md` (also under `src/app/docs/`).

---

## 1. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16** (App Router) | Dev server on **port 3000** (admin uses 3001) |
| UI library | **React 19** | |
| Language | **TypeScript 5** | Strict; `npm run typecheck` |
| Component library | **MUI 9** (`@mui/material`) | Themed via design tokens |
| Styling | **Emotion** + **Tailwind CSS 4** | Tokens shared with MUI/`@theme` |
| Date pickers | **MUI X Date Pickers 9** + **dayjs** | |
| Forms | **react-hook-form** + **Zod 4** + `@hookform/resolvers` | |
| Server state | **TanStack React Query 5** | `src/lib/api/queryClient.ts`, `queryHooks.ts` |
| Client state | **Zustand 5** | Auth / UI / cart only — **not** API cache |
| Icons | **lucide-react** | |
| Charts | **recharts** | Optional analytics surfaces |
| Tests | **Vitest** + Testing Library + jsdom | |
| Lint | **ESLint 9** + `eslint-config-next` | `max-warnings=0` |
| OpenAPI types | `openapi-typescript` | `npm run openapi:generate` → `src/types/storeApi.generated.d.ts` |

> **Do not** use Redux / RTK Query. Use TanStack Query + Zustand.

### Key npm scripts

| Script | What it does |
|---|---|
| `npm run dev` | Next dev on `:3000` |
| `npm run build` / `start` | Production build / serve on `:3000` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint, zero warnings |
| `npm run test` | Vitest once |
| `npm run quality` | typecheck + lint + test + build |
| `npm run openapi:generate` | Regenerate store API types from Swagger |

---

## 2. Top-level folder structure

```
swiss-arabian-website/
├── .cursor/                 # Cursor rules / project AI config
├── docs/                    # Local docs (gitignored when `/docs` listed)
├── public/                  # Static assets
├── scripts/                 # openapi generate, ops
├── src/                     # Application source (see §3)
├── .env / .env.example
├── AGENTS.md / CLAUDE.md
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
└── vitest.config.ts
```

---

## 3. `src/` architecture

```
src/
├── app/                     # Next.js App Router routes only (thin pages)
│   ├── (shop)/              # storefront shell pages
│   ├── (auth)/              # login, register, password flows
│   ├── (account)/           # authenticated account area
│   ├── api/                 # Next route handlers
│   └── docs/                # committed reference docs (optional)
├── assets/
├── components/
│   ├── forms/
│   ├── guards/              # AuthGuard
│   ├── layout/              # StorefrontShell, Header, Footer, MobileNav
│   ├── shared/
│   └── ui/                  # AppButton, AppCard, PageLoading, Toaster, …
├── features/                # Domain modules
├── hooks/
├── lib/                     # API client, auth, nav, env, constants
├── providers/               # Query, MUI, Theme, Emotion, Locale, Market
├── stores/                  # Zustand: auth, UI, cart
├── test/
├── theme/                   # designTokens + MUI theme
└── types/
```

### Rule of thumb

- **`app/**/page.tsx`** — thin: import a feature page view, wrap with guards if needed.
- **`features/<domain>/`** — real UI, service functions + React Query hooks, types, schemas.
- **`components/ui/`** — reusable DS only; no domain business logic.
- **Backend Swagger** is source of truth — do not invent APIs.

---

## 4. Feature modules (`src/features/`)

| Feature | Role |
|---|---|
| `home` | Landing / hero |
| `catalog` | Product list + detail |
| `collections` | Merchandising collections |
| `cart` | Bag UI (Zustand cart store) |
| `checkout` | Checkout form (RHF + Zod) |
| `auth` | Login, logout (`performLogout`) |
| `account` | Account hub |
| `search` | Search surface |
| `gift-box`, `gift-cards`, `subscriptions` | Merchandising modules |
| `markets` | Market/region context (expand with API) |

Typical layout:

```
features/<name>/
├── api/           # Service fns + keys
├── components/    # Page views
├── schemas/       # Zod
├── types/
└── index.ts
```

---

## 5. App routes (high level)

| Area | Paths |
|---|---|
| Home | `/` |
| Catalog | `/products`, `/products/[slug]` |
| Collections | `/collections`, `/collections/[slug]` |
| Cart / Checkout | `/cart`, `/checkout` |
| Gifts | `/gift-box`, `/gift-cards`, `/subscriptions` |
| Search | `/search` |
| Auth | `/login`, `/register`, `/forgot-password`, `/reset-password` |
| Account | `/account`, `/account/orders`, `/account/addresses`, `/account/security` |

Nav source of truth: `src/lib/navigation/storeNavigation.ts`.

---

## 6. State, API, auth

Same patterns as the admin panel:

- `apiGet` / `apiPost` / … unwrap `{ success, data, error }`
- Bearer token from `src/lib/auth/token.ts`
- 401 → refresh → retry; failure → `endSession()`
- Zustand: auth, UI, cart — **not** product lists
- Env: `src/lib/config/env.ts` + `.env.example`

Storefront default local: **http://localhost:3000** → API via `NEXT_PUBLIC_LOCAL_API_BASE_URL`.

---

## 7. Design system & tokens

**Source:** `src/theme/designTokens.ts`  
**MUI:** `src/theme/muiTheme.ts`

Shared with admin — terra `#B46E57`, ink `#2C241D`, cream `#FBF7F0`, gold accents.

Fonts: **Cormorant Garamond** (display) + **Nunito Sans** (body).

---

## 8. Conventions

1. Swagger / OpenAPI first — regenerate types; don’t invent paths.
2. TanStack Query for server state; Zustand for small client state only.
3. Reuse DS — `App*` + `semanticColors` / `radius`.
4. No fake success — honest empty/error when APIs missing.
5. Thin pages — logic lives in `features/`.
6. Session end — `endSession()` / `performLogout()`.

---

## 9. Local run

```bash
cp .env.example .env
npm install
npm run dev            # http://localhost:3000
```

```bash
npm run quality
```
