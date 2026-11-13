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
| E | Shop logic moved out of components into shared hooks | done per page inside G | ✅ ~40 hooks extracted (cart, checkout, orders, tracking, auth, account, catalog, PDP, CMS, search, wishlist, newsletter…); Swiss Arabian views use them unchanged |
| F | `@brand-ui` contract + `BrandHead` + Sapil per-area messages + Sapil shell (header, chip row, phone menu, search, bag drawer, footer, market/language switcher) | merged | ✅ |
| G | Sapil pages: shell + home + content (`feat/sapil-shell-home`), catalog + product + search (`feat/sapil-catalog`), bag + checkout + payments + orders + tracking + auth + account (`feat/sapil-commerce`) | merged into `feat/multibrand-sapil` | ✅ built; reviewer pass next. Docs: `docs/sapil/pages/*.md` |
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

## Known gaps (for the reviewer agents)

- ~~**Product cards:** home rails / wishlist on `HomeProductTile` / inline `ProductCard`~~ — closed by reviewer 2: every Sapil card (home rails, mood band with white tiles, search dialog, wishlist, grids) is `SapilProductCard`.
- **Wording not yet Sapil's or translated:**
  - ~~Payment screens' inner copy~~ — return screens (success, cancel / retry, Tabby, Telr) closed by reviewer 2 (Sapil views, en + ar). **Still open:** the Paymob and Stripe card-form screens render the shared provider views (Swiss Arabian copy and styling) inside Sapil's frame.
  - Toasts on Sapil pages are drawn by `SapilToastHost` (Sapil style), but sentences raised by shared hooks (account mutations, wishlist) are the shared English ones.
  - API error sentences.
  - `features/catalog/i18n/reviewsCopy.ts` is not in the JSON message files.
- ~~**Per-brand metadata**~~ — closed by reviewer 2: `routeTranslator()` fills `{brand}` with the deployment brand's name, and the five route descriptions (blog, collections, track, stores, FAQ) use it. A Sapil build's HTML has no "Swiss Arabian" / "سويس" text.
- **`getBrand()` adoption** (callers listed in `src/lib/brand/README.md`):
  - analytics, Insider, Tabby, Maps, catalog media base and storefront host still read env directly
  - layout icons and site name
  - ~~the Insider default in `env.ts`~~ — closed by reviewer 2: `env.insider` comes from the deployment brand (`deploymentInsider()`); Sapil builds no longer load Swiss Arabian's `ins.js` (account 10015366).
- **Not yet Sapil-styled:**
  - `OfferShop`
  - rewards / subscriptions / employee benefits / gift box (off for Sapil; never linked)
- **Data / decisions:**
  - "Shop by" chips need a CMS menu.
  - Gender / mood / season filters (collections vs attributes).
  - Sapil fragrance-notes and video tiles not curated.
  - No collection colour field.
  - No product FAQ source.
  - Sapil Arabic font.
- **Platform (found by reviewer 2, not changed: shared routing):**
  - Transactional paths (`/checkout`, `/login`, `/register`, `/track`, `/order-confirmation`, …) are never locale-prefixed by `localizeHref`, so an Arabic shopper who clicks "Checkout", "Create account" or "Track" lands on the **English** page. The `/ar/…` versions of those routes render correctly in Arabic. Their RSC prefetch from an `/ar` page also 404s (console noise; navigation falls back to a full load). Needs a product decision: keep the language through checkout and sign-in (recommended), or keep them English.
  - Swiss Arabian merchandising slugs (`you-may-also-like`, `dont-miss-this`, `new-launches`) are requested on Sapil and 404 until Sapil's admin creates those rails (data; or make the slugs per brand).
  - Forgot password puts the shopper's email in the reset URL (`/reset-password?identifier=…`); better kept in session storage.
- **Platform:**
  - Unmatched URLs get Next's error shell (the client then draws our 404), not a server-rendered 404.
  - `check:brand` not yet wired into CI / Docker.
  - One storefront host per deployment: Swiss Arabian's Qatar domains need their own deployments (or a per-request host for those).
- **Visual diff, larger numbers:**
  - hero intro (real data and font wrap)
  - shell "Shop by" row and footer (intended differences)
  - checkout empty bag (no demo "sample bag")

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
- **2026-11-13 (later):** All three Sapil page branches are merged. Conflicts resolved: one wishlist hook, one collections hook, combined i18n areas and diff specs, the market delivery types. The shell now renders `SapilBagDrawer`. Next: the two reviewer agents, then the final UI check of both sites.
