# Swiss Arabian Admin Panel — Project Overview

**Repo:** `swiss-arabian-admin-panel`  
**Updated:** 2026-07-30  
**Purpose:** Enterprise admin console for Swiss Arabian commerce ops — markets, catalog, orders, D365 integrations, reports, users/RBAC.

This document covers folder structure, tech stack, design tokens, shared UI, state/API patterns, and how pages are organized.

---

## 1. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16** (App Router) | Dev server on **port 3001** |
| UI library | **React 19** | |
| Language | **TypeScript 5** | Strict project; `npm run typecheck` |
| Component library | **MUI 9** (`@mui/material`) | Themed via design tokens |
| Styling | **Emotion** + **Tailwind CSS 4** | Tokens shared with MUI/`@theme` |
| Date pickers | **MUI X Date Pickers 9** + **dayjs** | |
| Forms | **react-hook-form** + **Zod 4** + `@hookform/resolvers` | |
| Server state | **TanStack React Query 5** | `src/lib/api/queryClient.ts`, `queryHooks.ts`, feature `*.keys.ts` |
| Client state | **Zustand 5** | Auth / UI / market draft only — **not** API cache |
| Icons | **lucide-react** | |
| Charts | **recharts** | Reports / analytics |
| Tests | **Vitest** + Testing Library + jsdom | |
| Lint | **ESLint 9** + `eslint-config-next` | `max-warnings=0` |
| OpenAPI types | `openapi-typescript` | `npm run openapi:generate` → `src/types/adminApi.generated.d.ts` |
| Deploy | Docker + Azure Container Apps | Local docs may include deploy runbooks |

> **Do not** use Redux Toolkit / RTK Query for new work. That stack was removed; migration uses TanStack Query + Zustand.

### Key npm scripts

| Script | What it does |
|---|---|
| `npm run dev` | Next dev on `:3001` |
| `npm run build` / `start` | Production build / serve on `:3001` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint, zero warnings |
| `npm run test` | Vitest once |
| `npm run quality` | typecheck + lint + test + build |
| `npm run check` / `check:fix` | Project quality pipeline (`scripts/check-project.mjs`) |
| `npm run openapi:generate` | Regenerate admin API types from Swagger |

---

## 2. Top-level folder structure

```
swiss-arabian-admin-panel/
├── .cursor/                 # Cursor rules / project AI config
├── .github/                 # CI / workflows
├── docs/                    # Phase guides, audits, smoke results (gitignored — local only)
├── public/                  # Static assets
├── scripts/                 # check-project, openapi generate, self-test, ops
├── src/                     # Application source (see §3)
├── .env / .env.example      # Env config (never commit secrets)
├── AGENTS.md / CLAUDE.md    # Agent notes (Next.js 16 caveats)
├── Dockerfile
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs       # Tailwind 4 PostCSS
├── tsconfig.json
└── vitest.config.ts
```

> **`docs/`** is listed in `.gitignore` (`/docs`) so phase audits stay local and are not pushed to GitHub. Keep copies locally or share files out-of-band when needed.

---

## 3. `src/` architecture

```
src/
├── app/                     # Next.js App Router routes only (thin pages)
│   ├── (auth)/              # login, forgot/reset password
│   ├── (dashboard)/         # authenticated shell pages
│   ├── (design-system)/     # internal DS gallery
│   └── api/                 # Next route handlers (if any)
├── assets/                  # Static images / media used in UI
├── components/
│   ├── forms/               # Shared form building blocks
│   ├── guards/              # AuthGuard, PermissionGuard, RoutePermissionGuard
│   ├── layout/              # AdminShell, Header, Sidebar, Breadcrumbs, Settings
│   ├── shared/              # Cross-feature presentational bits
│   └── ui/                  # Design-system primitives (AppButton, DataTable, PageLoading, …)
├── features/                # Domain modules (preferred place for business UI + API)
├── hooks/                   # App-wide hooks (permissions, sidebar, theme, current user)
├── lib/                     # API client, auth, RBAC, nav, env, constants
├── providers/               # QueryProvider, MUI, Theme, Emotion, Zone, Step-up
├── stores/                  # Zustand: auth, UI, create-market draft
├── test/                    # Shared test helpers / Vitest setup
├── theme/                   # designTokens + MUI theme factory
└── types/                   # Shared API envelope + generated OpenAPI types
```

### Rule of thumb

- **`app/**/page.tsx`** — thin: import a feature page view, wrap with guards if needed.
- **`features/<domain>/`** — real UI, service functions + React Query hooks, types, utils, schemas.
- **`components/ui/`** — reusable DS components only; no domain business logic.
- **Backend Swagger** is source of truth for routes/DTOs — do not invent APIs.

---

## 4. Feature modules (`src/features/`)

Typical feature layout:

```
features/<name>/
├── api/           # Service fns + useApiQuery / useApiMutation (+ *.keys.ts)
├── components/    # Page views + section components
├── constants/
├── data/          # Mocks / empty seeds (prefer live APIs)
├── hooks/
├── schemas/       # Zod
├── types/
├── utils/
└── index.ts       # Public exports
```

| Feature | Role |
|---|---|
| `auth` | Login, session, password flows, `performLogout` |
| `account` | Account security / sessions UI |
| `dashboard` | Home KPIs / module cards |
| `markets` | Markets list, create wizard, onboarding, edit, shared `MarketReadinessChecklist` |
| `orders` | Orders console, export candidates, Shopify import |
| `integrations` | D365 ops, catalog ops, inventory, order pipeline, analytics outbox |
| `inventory` | Inventory / sellability surfaces |
| `collections`, `gift-box`, `gift-cards`, `subscriptions` | Product merchandising modules |
| `customers`, `employees` | CRM / staff |
| `discounts`, `loyalty` | Marketing |
| `payments`, `shipping` | Settings-linked commerce connectors |
| `reports` | Commerce reports, dashboards, saved reports |
| `users`, `roles` | Admin users + RBAC |
| `security` | Security events / ops |
| `design-system` | Internal component gallery |

---

## 5. App routes (high level)

Route groups under `src/app/(dashboard)/`:

| Area | Example paths |
|---|---|
| Home | `/dashboard` |
| Orders | `/orders`, `/orders/[id]`, `/orders/export-candidates`, `/orders/shopify-import`, `/orders/shopify-import/[batchId]`, `/orders/drafts` |
| Products | `/products`, `/products/collections`, `/products/inventory`, `/products/gift-box`, `/products/gift-cards`, `/products/subscriptions` |
| Customers | `/customers`, `/customers/[id]`, `/customers/employees` |
| Markets | `/markets`, `/markets/create`, `/markets/[id]`, `/markets/[id]/onboarding`, `/markets/[id]/edit` |
| Marketing | `/marketing/discounts`, `/marketing/loyalty` |
| Integrations | `/integrations/d365/*`, `/integrations/catalog`, `/integrations/analytics-outbox` |
| Reports | `/reports/*` (commerce, dashboards, attribution, …) |
| Settings | `/settings/*` (shipping, payments, roles, …) |
| Users / Security | `/users`, `/security` |
| Account | `/account/security`, `/account/sessions` |
| Auth | `/login`, `/forgot-password`, `/reset-password` |

Nav source of truth: `src/lib/navigation/adminNavigation.ts` (+ `settingsNavigation.ts`).

---

## 6. State, API, auth

### TanStack Query

| Piece | Path |
|---|---|
| Query client | `src/lib/api/queryClient.ts` (`staleTime` 2m, browser singleton) |
| Provider | `src/providers/QueryProvider.tsx` |
| RTK-compatible hooks | `src/lib/api/queryHooks.ts` — `useApiQuery`, `useLazyApiQuery`, `useApiMutation` (`.unwrap()`) |
| Feature keys | e.g. `features/orders/api/orders.keys.ts`, `markets.keys.ts` |
| SSR hydrate helper | `src/lib/api/hydrate.tsx` (auth is still client-token based) |

### API client (`src/lib/api/apiClient.ts`)

- `apiGet` / `apiPost` / `apiPatch` / `apiPut` / `apiDelete`
- Attaches bearer token from `src/lib/auth/token.ts`
- Unwraps backend `{ success, data, error, meta }` → returns `data`
- 401 → single-flight refresh → retry; failure calls **`endSession()`**
- 403 `STEP_UP_REQUIRED` → step-up flow when feature flag enabled
- Prefer provider messages for Shopify / `EXTERNAL_PROVIDER_ERROR`

### Zustand stores (`src/stores/`)

| Store | Role |
|---|---|
| `useAuthStore` | `user`, `isAuthenticated`, `bootstrapped` (permissions from login / `/me`) |
| `useUiStore` | Sidebar + header country filter visibility/selection |
| `useCreateMarketDraftStore` | Create-market wizard draft |

**Do not** put API list/detail payloads in Zustand — that belongs in React Query.

### Session teardown

| Piece | Path |
|---|---|
| `endSession()` | `src/lib/auth/endSession.ts` — tokens + Zustand + `queryClient.clear()` |
| Logout | `features/auth/lib/performLogout.ts` → server logout then `endSession()` |
| Auth bootstrap | `components/guards/AuthGuard.tsx` — always `GET /admin/auth/me` when tokens exist |

### Auth / RBAC

| Piece | Path |
|---|---|
| Tokens | `src/lib/auth/token.ts` |
| Refresh | `refreshScheduler.ts`, `refreshCoordinator.ts` |
| Dev bypass | `devSession.ts` (`NEXT_PUBLIC_USE_DEV_SESSION` + `NODE_ENV=development` only) |
| RBAC | `src/lib/auth/rbac.ts`, `roles.ts` |
| Permissions constants | `src/lib/constants/permissions.ts` |
| UI gate | `components/guards/PermissionGuard` + `liveActionAllowed` on `DryRunActionModal` |
| Hook | `hooks/usePermissions.ts` |

FE gates hide/disable writes; **server** `ADMIN_RBAC_ENFORCED=true` is required for real 403 enforcement (Phase 12 leftover for staging/ops).

### Errors / toasts

| Piece | Path |
|---|---|
| `ApiClientError` | `src/lib/api/apiError.ts` |
| Message helpers | `adminApiError.ts`, `userFacingErrors.ts` |
| Toast wiring | `toastApiError.ts` |

Sanitize ops/debug phrases before showing them to operators. Never show raw `POST /admin/...` paths in operator UI (e.g. onboarding “Suggested next actions” is humanized).

### Env (`src/lib/config/env.ts` + `.env.example`)

- `NEXT_PUBLIC_APP_ENV` — `local` \| `dev` \| `staging` \| `production`
- Per-env API base + return URL (`NEXT_PUBLIC_*_API_BASE_URL`, `*_RETURN_URL`)
- Feature flags: MFA, step-up, password reset, OAuth, analytics ops writes
- Admin UI default local: **http://localhost:3001** → API via `NEXT_PUBLIC_LOCAL_API_BASE_URL`

---

## 7. Design system & tokens

**Source file:** `src/theme/designTokens.ts`  
**MUI wiring:** `src/theme/muiTheme.ts` (+ `muiTheme.augment.ts`)  
**Providers:** `ThemeProvider`, `MuiProvider`, `EmotionCacheProvider`

Design is based on Figma **“Design system Swiss Arabian”** (Black & White Edition) with brand terra accents.

### Token groups

| Export | Purpose |
|---|---|
| `primitiveColors` | Neutral gray scale |
| `brandColors` | SA brand (ink, cream, **terra `#B46E57`**, gold, …) |
| `darkColors` / `darkSemanticColors` | Dark mode palette |
| `lightSemanticColors` | Light semantic hex (docs/swatches) |
| `cssVarTokens` / `semanticColors` | **Preferred in components** — CSS vars that follow `html.dark` |
| `sidebarColors` / `darkSidebarColors` | Sidebar chrome |
| `spacing` | 0 → 64 (4px grid) |
| `radius` | `none` 0 · `xs` 4 · `sm` 6 · **`md` 10** · `lg` 14 · `xl` 20 · `full` |
| `shadows` | `flat`, `xs`, `sm`, `md`, `lg`, `card`, `chip` |
| `typography` | Font stacks + sizes (display → label) |
| `buttonSizes` / `inputSizes` / `badgeSizes` | Figma component sizes |

### Brand accents (common)

| Token | Value | Usage |
|---|---|---|
| Terra (primary action) | `#B46E57` | Primary / “black” buttons, active nav, focus |
| Terra hover | `#A25E48` | Hover |
| Gold | `#B5883E` / `#CDA766` | Dark accents / warnings |
| Ink | `#2C241D` | Brand text |
| Cream / paper | `#FBF7F0` / `#F6F0E6` | Soft surfaces (storefront-oriented) |

### How to use in UI

```ts
import { semanticColors, radius, cssVarTokens } from "@/theme/designTokens";

// Preferred — theme-aware
sx={{
  border: "1px solid",
  borderColor: semanticColors.border.default,
  borderRadius: `${radius.md}px`,
  bgcolor: semanticColors.bg.default,
  color: semanticColors.text.primary,
  boxShadow: "none", // match Orders / Catalog card shell
}}
```

Card shell used on many ops pages (Orders, Shopify import, Catalog, Markets):

- `border: 1px solid` + `semanticColors.border.default`
- `borderRadius: radius.md` (10px)
- `boxShadow: "none"`
- `bgcolor: semanticColors.bg.default`

### Typography / fonts

- CSS vars: `--font-sans`, `--font-nunito-stack` (see `typography.fontFamily`)
- Page titles typically `1.5rem`–`1.75rem`, weight 700
- Body / helpers: `0.875rem` secondary text

---

## 8. Shared UI components (`src/components/ui/`)

Export barrel: `src/components/ui/index.ts`

| Component | Role |
|---|---|
| `AppButton` | DS buttons (`dsVariant`: primary, secondary, subtle, soft, ghost, black, ink, gold, danger, success, warning; `dsSize`) |
| `AppCard` | Card + optional title / subtitle / headerAction / `noPadding` |
| `AppTextField` / `AppPasswordField` | Form fields + sanitize helpers |
| `AppSelect` | Select + stacked label |
| `AppSwitch` | Toggle |
| `AppBadge` / `StatusBadge` | Chips / status pills |
| `AppUnderlineTabs` | Underline tab strip |
| `AppDatePicker` / `AppDateTimePicker` / `AppDateRangePicker` | Dates |
| `DataTable` (+ Toolbar, Pagination, DateRangeFilter) | Standard admin tables |
| `AppModal` / `AppModalFooter` | Dialogs |
| `PageLoading` | Shared page/section spinner (prefer over raw “Loading…”) |
| `Toaster` (`toast`, `useToast`) | Notifications |
| `FieldHelpTip` | ⓘ help |
| `ForbiddenView` | 403-style empty |
| `inputSanitize` / `emailValidation` | Input hygiene |

### Layout components (`src/components/layout/`)

| Piece | Role |
|---|---|
| `AdminShell` | Sidebar + Header + main content |
| `Sidebar` / `MobileSidebar` | Nav (RBAC-filtered) |
| `Header` | Title + optional page-scoped country filter + profile |
| `Breadcrumbs` / `AppBreadcrumbs` | Nested trails (`breadcrumbs.utils.ts`) |
| `Settings` layout/nav | Settings sub-IA |

### Header country / market filter

- Hidden by default.
- Pages opt in with `useHeaderCountryFilter({ enabled: true })` (e.g. Dashboard).
- Visibility stored in `useUiStore` (formerly `uiSlice`).

### Integrations / markets shared widgets

`src/features/integrations/components/shared/`:

- `IntegrationsPageHeader`
- `MetricsGrid`
- `SectionNotice`
- `DryRunActionModal` (dry-run → apply + reason; supports `liveActionAllowed` / `renderDryRunSummary`)
- `StatusChip`, `RecordTable`, `JsonBlock`, …

`src/features/markets/components/MarketReadinessChecklist.tsx` — shared readiness UI for market **detail** and **onboarding**.

Prefer these on ops screens so Shopify import / Catalog / D365 / Markets feel consistent.

---

## 9. Providers & hooks

### Providers (`src/providers/`)

| Provider | Role |
|---|---|
| `QueryProvider` | TanStack Query client + Devtools (dev only) |
| `ThemeProvider` / `MuiProvider` | Color mode + MUI theme |
| `EmotionCacheProvider` | SSR-safe Emotion |
| `LocaleProvider` | Locale |
| `ZoneProvider` | Market/zone context |
| `StepUpProvider` | Step-up auth UX |

Wired from `src/app/providers.tsx`.

### App hooks (`src/hooks/`)

| Hook | Role |
|---|---|
| `useCurrentUser` / `useIsAuthenticated` | Session from Zustand |
| `usePermissions` | RBAC checks |
| `useSidebarState` | Collapse / mobile drawer |
| `useColorMode` | Light / dark |
| `useIsMobile` | Breakpoint |
| `useHeaderCountryFilter` | Page-scoped header market select |
| `useSelectedCountry` | Selected market id (prefer header filter API) |

---

## 10. Docs map (`docs/` — local / gitignored)

| Kind | Examples |
|---|---|
| This overview | `PROJECT_OVERVIEW.md` |
| Phase guides | `ADMIN_FRONTEND_INTEGRATION_GUIDE_PHASE_*` |
| FE handoffs | `ADMIN_PHASE_*_FE_HANDOFF.md` |
| Status audits | `PHASE_*_INTEGRATION_STATUS.md` |
| Smoke | `PHASE_*_SMOKE_RESULTS.md` |
| Deploy | Azure / enterprise runbooks (if present locally) |

### Integration phase themes

| Phase | Theme | Smoke (local docs) |
|---|---|---|
| 1–2 | Foundation + D365 / catalog ops | — |
| 3–5 | Reports / analytics | — |
| 6 | Create Market + Orders console | — |
| 6B | UX polish for selects / help | — |
| 7 | Market onboarding | — |
| 7B | Shopify order pull / batches / SKU link | — |
| 8 | D365 ops hardening | `PHASE_8_SMOKE_RESULTS.md` |
| 9 | Full-path smoke / timeline normalize | `PHASE_9_SMOKE_RESULTS.md` |
| 10 | Hardening (pull dry-run count, Shopify errors) | `PHASE_10_SMOKE_RESULTS.md` |
| 11 | Staging readiness / FE RBAC gates | `PHASE_11_SMOKE_RESULTS.md` |
| 12 | Auth close-out, limited principals, tiny applies / staging leftovers | `PHASE_12_SMOKE_RESULTS.md` (**PASS** w/ skips) |
| 13+ | Payments / shipping / imagery / analytics product track | Deferred |

---

## 11. Conventions (for contributors & agents)

1. **Swagger / OpenAPI first** — regenerate types; don’t invent paths.
2. **TanStack Query for server state; Zustand for small client state only.**
3. **Dry-run before write** — `apply: false` default; `reason` required on apply (`DryRunActionModal`).
4. **Permission gates** — `PermissionGuard` + `PERMISSIONS.*` + `liveActionAllowed` for live applies.
5. **Reuse DS** — `App*` components + `semanticColors` / `radius`; avoid one-off purple/glow UI.
6. **No fake success** — honest empty/error when APIs missing.
7. **Operator-friendly copy** — never show raw API endpoints in admin UI.
8. **Thin pages** — logic lives in `features/`.
9. **Card shell** — match Orders/Catalog borders; no heavy multi-shadow cards.
10. **Header market filter** — page-opt-in only via `useHeaderCountryFilter`.
11. **Session end** — use `endSession()` / `performLogout()`; never clear tokens without clearing the Query cache.

---

## 12. Local run (quick)

```bash
cd swiss-arabian-admin-panel
cp .env.example .env   # set NEXT_PUBLIC_APP_ENV=local + API URLs
npm install
npm run dev            # http://localhost:3001
```

Quality:

```bash
npm run check:fix
# or
npm run quality
```

---

## 13. Related files to open first

| Need | Open |
|---|---|
| Tokens | `src/theme/designTokens.ts` |
| MUI theme | `src/theme/muiTheme.ts` |
| UI primitives | `src/components/ui/index.ts` |
| Nav | `src/lib/navigation/adminNavigation.ts` |
| Permissions | `src/lib/constants/permissions.ts` |
| API client | `src/lib/api/apiClient.ts` |
| Query hooks | `src/lib/api/queryHooks.ts` |
| Session end | `src/lib/auth/endSession.ts` |
| Auth store | `src/stores/useAuthStore.ts` |
| Env | `.env.example`, `src/lib/config/env.ts` |
| Generated API types | `src/types/adminApi.generated.d.ts` |
| Architecture rules | `.cursor/rules/project-architecture.mdc` |

---

*This overview describes the admin frontend as of 2026-07-30 (TanStack Query + Zustand, Phases 9–12). Prefer live Swagger and local phase smoke/status docs for API field-level detail.*
