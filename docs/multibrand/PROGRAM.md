# Multi-brand storefront + Sapil website: program log

**Goal:**
- Finish the Sapil website (v9 design, pixel-exact, built in Tailwind).
- Make the storefront ready for future brands: a new brand = a config file + a design system (its own, or a re-skin) + a deployment.

**Branch:** `feat/multibrand-sapil` (website), kept in the worktree `.claude/worktrees/multibrand`. Everything is committed locally; nothing is pushed or deployed.

**Started:** 2026-11-13.

**Closing steps:**
1. Two reviewer agents review the work, fix what they find and close the gaps.
2. One last agent checks the UI of both websites (Swiss Arabian + Sapil) and fixes any remaining UI or other issues.

Documentation is updated at every step (this file + the docs linked below).

---

## Architecture (decided)

| Layer | Shared by all brands | Per brand |
|---|---|---|
| Backend + admin | One NestJS platform; brand → storefront → market; brand-scoped admin | Brand rows, markets, credentials (credential packs), content |
| Website shop logic | API client, `features/*/api`, hooks, stores, providers, i18n, SEO rules, analytics events | — |
| Website config | `src/lib/brand` (`getBrand()`, `npm run check:brand`) | `src/lib/brand/brands/<brand>.ts` + deployment env |
| Website look | — | Design system: `src/brands/<theme>/` (tokens + components); pages built from it |
| Deployment | Same code | One deployment per brand (brand fixed per build → static/cached pages) |

Other rules:
- **Integrations** (payments, analytics, Insider, Maps, etc.) are built once and configured per brand. New code is needed only when a brand uses a vendor no other brand uses.
- **Languages:** N languages per market (`ZoneLanguage`). English + Arabic today; more are added through settings + message files, with no code changes.

## Workstreams

| # | Workstream | Branch | Status |
|---|---|---|---|
| A | Brand config + per-brand build check | `feat/brand-config` (`e6707ff`) | ✅ merged into `feat/multibrand-sapil` |
| B | Multi-language `[locale]` routing + static rendering | `feat/i18n-locale-routing` (`e6a0750`) | ✅ merged — catalog pages ISR, N languages via `NEXT_PUBLIC_SHOP_LOCALES` + `src/messages/<lang>.json` |
| C | Sapil v9 design system (Tailwind tokens, fonts, components, visual diff) | `feat/sapil-design-system` (`15900fe`) | ✅ merged — scoped to `[data-brand="sapil"]`, ~20 components, diff 0–0.1% (inputs 1.6% at 390px) |
| D | Backend + admin: hero gallery, mood picker, tile colour, best sellers, collection summaries, price tiers, delivery summary, demo seed | backend `feat/sapil-cms` (`417fd109`, `1294ed75`, `80634f35`, `27a08212`), admin `feat/sapil-cms` (`b3fc689`) | ✅ done — contract: backend `docs/frontend/SAPIL_STOREFRONT_DATA_HANDOFF.md` |
| E | Shop logic moved out of components into shared hooks | done per page inside G | 🔄 |
| F | Per-brand UI selection (`@brand-ui` contract, `BrandHead`, Sapil per-area messages, conventions) + Sapil app shell | `feat/multibrand-sapil` + `feat/sapil-shell-home` | ✅ contract merged; 🔄 shell in progress |
| G | Sapil pages (plan: [`SAPIL_PAGES_PLAN.md`](../sapil/SAPIL_PAGES_PLAN.md), rules: [`BUILD_CONVENTIONS.md`](../sapil/BUILD_CONVENTIONS.md)) | `feat/sapil-shell-home`, `feat/sapil-catalog`, `feat/sapil-commerce` | 🔄 3 agents in progress |
| H | Right-to-left layout, performance budgets, visual-diff + isolation checks | — | ⏳ |
| I | Two reviewer agents | — | ⏳ |
| J | Final UI check of both sites + fixes | — | ⏳ |

## Decisions still open, and the defaults used until answered

Each default is reversible. It is used only so the work isn't blocked.

| # | Open item | Default used |
|---|---|---|
| 1 | Sapil domains / first market (O1, O2) | Local `sapil.test` / `sp.localhost`, staging `sapil-website.vercel.app`; market Sapil UAE |
| 2 | Day-one scope (O7) | All v9 pages + auth, account (orders, addresses, wishlist, profile), search, bag page, blog post, FAQ / policies, 404. Loyalty, subscriptions, gift box and employee benefits are off for Sapil (brand feature flags) |
| 3 | Cash on delivery for Sapil | Shown when the market's delivery method supports it (backend `supportsCOD`); fee comes from the API |
| 4 | Payment providers (Sapil UAE) | Whatever the market's payment methods return (credential packs; test mode locally) |
| 5 | Price-edit URLs | `/collections/under-99`-style listing with a `maxPrice` filter, tiers from the market setting |
| 6 | Blog URL | Same as Swiss Arabian (`/blog`); Shopify `/blogs/news/*` → 301 redirects at cutover |
| 7 | Arabic / other-script fonts for Sapil | Arabic: the platform's existing Arabic font until the designer picks one |
| 8 | Data owners (bottle colours, moods, hero rooms, bundles) | Admin editors + seed data from the v9 mock catalog for local demo only |

## Local Sapil test backend

The `:3002` API runs the other chat's code. Sapil development uses the `feat/sapil-cms` build on **`:3012`**:
- Launch config `backend-sapil-cms` in `swiss-complete/.claude/launch.json`.
- Runs with `SCHEDULERS_ENABLED=false`, workers off and Redis off, so cron jobs (D365 and others) never run twice against the shared local database.
- Website env for it: `NEXT_PUBLIC_USE_LOCAL_API=true NEXT_PUBLIC_LOCAL_API_BASE_URL=http://127.0.0.1:3012 NEXT_PUBLIC_STOREFRONT_BRAND_CODE=SAPIL NEXT_PUBLIC_STOREFRONT_HOST=sapil.test`.
- Demo data: `npm run seed:sapil-demo` in the backend (local only). It creates 85 products, 14 collections, a 10-section home, menus, delivery methods (free over AED 100, cash on delivery, express) and price tiers.

## Decisions raised by the backend work (open)

1. **Was-price editing:** it is stored per market (`ZoneProductVisibility.metadata.compareAtPrice`), but there is no admin screen yet.
2. **Cash-on-delivery fee:** the design shows AED 10, but the platform has no fee field. The Sapil site shows no fee.
3. **Browsing by gender, mood or season:** collections or product attributes?
4. **Tile colour:** stored in the shared product data; there is no colour per market.
5. **Curation:** Sapil's fragrance-notes and shoppable-video tiles still need curating in admin.
6. **Backend `role-walk` permissions snapshot:** needs an intentional refresh (upstream routes + the new presentation route).

## Log

- **2026-11-13:**
  - Performance and SEO pass on Swiss Arabian (see `docs/performance/BASELINE-2026-11-13.md`).
  - Brand config merged.
  - Sapil page plan written.
  - Agents B, C and D started.
- **2026-11-13 (later):**
  - Merged multi-language/static rendering and the Sapil design system.
  - Added the `@brand-ui` contract: both brands build; 954 tests pass.
  - Added Sapil per-area messages, `BrandHead` and the page conventions.
  - Started 3 page agents (shell + home + content; catalog + product; bag + checkout + orders + auth + account).
  - The local Sapil market has no products, so the backend agent was asked for a local-only demo seed.
- **2026-11-13 (later):** Backend/admin Sapil pieces and the demo seed are done. The shared `:3012` Sapil backend is running, and the page agents were pointed at it.
