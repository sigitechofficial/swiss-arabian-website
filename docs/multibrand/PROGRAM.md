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
| H | Right-to-left layout, performance budgets, visual-diff + isolation checks | done in I and J | ✅ RTL checked en/ar on all routes; budgets in `docs/sapil/PERFORMANCE.md` (LCP still over); isolation: no Swiss Arabian text/ids in Sapil HTML, Sapil CSS/kit out of Swiss Arabian builds |
| I | Two reviewer agents | `review/platform`, `review/sapil` (website); backend `review/sapil-cms` (`9dff01a5`) | ✅ merged |
| J | Final UI check of both sites + fixes | `review/ui` | ✅ see "Final UI check" below and `docs/ui-check/REPORT.md` |
| K | Brand design coverage: every route in its own brand's design, brand feature switches enforced | `fix/brand-design-coverage` | ✅ see "Brand design coverage" below and `docs/ui-check/BRAND_COVERAGE.md` |

## Decisions still open, and the defaults used until answered

Each default is reversible. It is used only so the work isn't blocked.

| # | Open item | Default used |
|---|---|---|
| 1 | Sapil domains / first market (O1, O2) | Local `sapil.test` / `sp.localhost`, staging `sapil-website.vercel.app`; market Sapil UAE |
| 2 | Day-one scope (O7) | All v9 pages + auth, account (orders, addresses, wishlist, profile), search, bag page, blog + blog post, FAQ / policies, 404. Store locator, loyalty, subscriptions, gift box and employee benefits are off for Sapil (brand feature switches: those routes answer 404 and are never linked) |
| 3 | Cash on delivery for Sapil | Shown when the market's delivery method supports it (backend `supportsCOD`); fee comes from the API |
| 4 | Payment providers (Sapil UAE) | Whatever the market's payment methods return (credential packs; test mode locally) |
| 5 | Price-edit URLs | `/collections/under-99`-style listing with a `maxPrice` filter, tiers from the market setting |
| 6 | Blog URL | Same as Swiss Arabian (`/blog`); Shopify `/blogs/news/*` → 301 redirects at cutover |
| 7 | Arabic / other-script fonts for Sapil | Arabic: the platform's existing Arabic font until the designer picks one |
| 8 | Data owners (bottle colours, moods, hero rooms, bundles) | Admin editors + seed data from the v9 mock catalog for local demo only |

## Known gaps (for the reviewer agents)

- ~~**Product cards:** home rails / wishlist on `HomeProductTile` / inline `ProductCard`~~ — closed by reviewer 2: every Sapil card (home rails, mood band with white tiles, search dialog, wishlist, grids) is `SapilProductCard`.
- **Wording not yet Sapil's or translated:**
  - ~~Payment screens' inner copy~~ — return screens (success, cancel / retry, Tabby, Telr) closed by reviewer 2 (Sapil views, en + ar). ~~Paymob and Stripe card-form screens~~ ✅ final UI check: Sapil's own views (`SapilCardPayment.tsx`, en + ar) on shared hooks. ~~The inline card / wallet forms inside the checkout payment step (`InlineMethodPayment`), the Tabby card and the Paymob 3-D Secure overlay's error sentence~~ ✅ `fix/remaining-gaps`: Sapil's own `SapilInlinePayment`, `SapilTabbyCard`, `SapilThreeDsModal` (en + ar) on shared hooks.
  - Toasts on Sapil pages are drawn by `SapilToastHost` (Sapil style), but sentences raised by shared hooks (account mutations, wishlist) are the shared English ones.
  - API error sentences.
  - ~~`features/catalog/i18n/reviewsCopy.ts` is not in the JSON message files.~~ ✅ closed (reviewer 1): `reviews.*` in `src/messages/en.json` + `ar.json` (plurals), the reply line names the brand.
- ~~**Per-brand metadata:** some route metadata still uses Swiss Arabian wording.~~ ✅ closed (reviewer 1): page meta descriptions use `{brand}` (filled by `routeTranslator()` from `getBrand()`); the brand-identity fallback and layout icons come from the brand config.
- ~~**`getBrand()` adoption**~~ ✅ closed (reviewer 1): analytics, Insider, Tabby, Maps, payment switches, catalog media base, storefront host, SEO indexing, layout icons / site name read the brand (`brandIntegrations()`); `env.ts` holds no per-brand setting and no Insider default (Sapil no longer inherits Swiss Arabian's account). Caller table in `src/lib/brand/README.md`.
- ~~**Not yet Sapil-styled:** `OfferShop`; rewards / subscriptions / employee benefits / gift box~~ ✅ brand coverage pass: `SapilOfferPage`; the switched-off sections answer 404 on Sapil (proxy + page guard) and are never linked.
- **Data / decisions:**
  - "Shop by" chips need a CMS menu.
  - Gender / mood / season filters (collections vs attributes).
  - Sapil fragrance-notes and video tiles not curated.
  - No collection colour field.
  - No product FAQ source.
  - Sapil Arabic font. Not implemented as decision 7 says: Sapil sets Poppins / Fraunces / Gloock for every language and Swiss Arabian's `"GE SS"` isn't served by the site either, so Arabic uses the system font and short Arabic pages shift when the Latin web fonts arrive (404 at 768px: CLS 0.42). Needs an Arabic web font.
- **Platform (found by reviewer 2, not changed: shared routing):**
  - ~~Transactional paths are never locale-prefixed~~ ✅ final UI check (recommended option taken): checkout, sign-in, tracking and the confirmation keep the language for both brands; the 404 RSC prefetches are gone. Only `/payments/tabby|telr/return` stay unprefixed (backend contract).
  - Swiss Arabian merchandising slugs (`you-may-also-like`, `dont-miss-this`, `new-launches`) are requested on Sapil and 404 until Sapil's admin creates those rails (data; or make the slugs per brand).
  - ~~Forgot password puts the email in the reset URL~~ ✅ final UI check: sessionStorage via the shared hook. **Still open (same kind):** sign-up / email sign-in go to `/verify?email=…` (shared `useAuthForms`).
- **Platform:**
  - ~~Unmatched URLs get Next's error shell.~~ ✅ closed (reviewer 1): `src/app/global-not-found.tsx` (`experimental.globalNotFound`) server-renders the brand's chrome + 404 view in the address's language, status 404 (the `[locale]/[...missing]` catch-all is gone). **Remaining:** `notFound()` inside a page (unknown product / collection) still gets Next's error document with status 404; the view is drawn after hydration. Next 16 does not server-render a `not-found.tsx` boundary under a root layout in a dynamic segment (`[locale]`), and `global-not-found` only covers unmatched routes. SEO is unaffected (status 404, noindex).
  - ~~`check:brand` not yet wired into CI / Docker.~~ ✅ closed (reviewer 1): CI build job + Dockerfile builder stage; image defaults the brand code to `SWISS_ARABIAN`.
  - One storefront host per deployment: Swiss Arabian's Qatar domains need their own deployments (or a per-request host for those). Canonical / hreflang / og:url use `NEXT_PUBLIC_STOREFRONT_HOST`, so a Qatar domain served by the UAE deployment would point its canonicals at the UAE host.
  - A Sapil build's global stylesheet still includes utilities of the Swiss Arabian views in `src/features/*/components` (shared folders). Moving those views under `src/brands/swiss-arabian/` would end it.
  - `notFound()` / client 404 note above; `/en/...` addresses now 301 to the unprefixed one (before: 404).
- **Visual diff, larger numbers:**
  - hero intro (real data and font wrap)
  - ~~shell "Shop by" row~~ (was a current-chip bug, now 0.00 — reviewer 2); footer copy (intended)
  - checkout empty bag (no demo "sample bag")

## Final UI check (2026-11-13, branch `review/ui`)

**Checked:** both brands' production builds, English + Arabic, 390 / 768 / 1280 / 1440: home,
listing, collection, product, search, bag, checkout, card payment, order confirmation, track,
login, register, forgot password, account (signed out), FAQ, blog, CMS page, stores (Swiss
Arabian), 404. Per page: status, horizontal scroll, broken images, console errors / 4xx,
hydration warnings, layout shift, `lang` / `dir`, Latin-only text on `/ar`, the other brand's
name. Swiss Arabian: screenshots and visible text against the pre-program baseline `5a55282`.
Per-page results: `docs/ui-check/REPORT.md`.

**Note:** the shared API on :3012 stopped for part of the session. It was not restarted by
this agent. Every check that hit the outage was re-run with data once it was back:
- the Sapil sweep after the fixes
- Sapil Lighthouse after the fixes
- the Swiss Arabian catalog / blog / CMS compare against `5a55282`

**Lighthouse (Sapil, mobile)**, perf before → after:

| Page | Perf |
|---|---|
| Home | 63 → 64 |
| Shop | 65 → 72 |
| Collection | 66 → 75 |
| Product | 68 → 74 |

LCP is still 5.6–6.4 s. The image now loads in about 0.2 s; LCP is set by render delay (fonts and
hydration). Details are in `docs/sapil/PERFORMANCE.md`.

**Swiss Arabian vs the pre-program baseline:**
- Product, search, blog, CMS page, stores, FAQ, auth, bag, checkout, card payment and 404:
  identical, en + ar.
- Listing, collection and home: under 0.7 % of pixels differ (2.6 % at 390 on home, from a
  0–1px hero offset that changes from run to run). Text is the same.
- Intended changes: `/ar/account` → Arabic sign-in, and a single chrome on the Arabic 404 of an
  English-only post.

**Fixed (by severity):**
- *High:* Arabic shoppers lost Arabic on checkout, sign-in, register, tracking and the
  confirmation (both brands); `/ar/account` signed out went to the English sign-in; `/track` etc.
  RSC prefetches 404'd from every `/ar` page. `localizeHref` + `useLocaleRouter` + `checkoutHref`
  (payment return URLs included). Tests added.
- *High:* forgot password put the email in the reset URL → sessionStorage (shared hook, tests).
- *High:* Sapil Stripe / Paymob card screens showed Swiss Arabian's copy and styling → Sapil views
  (en + ar) on new shared hooks (`useCardPaymentSession`, `useStripeCardPayment`,
  `usePaymobCardForm`, `useStripeSessionOptions`); Swiss Arabian unchanged.
- *Medium:* Sapil announcement rotated with no pause and announced every change (WCAG 2.2.2) →
  pause / play button, hold on hover / focus, no live region.
- *Medium:* Sapil LCP image on home / shop / collection was a 300 KB unoptimised PNG
  (`uae.sapil.com` not allowlisted) → allowlisted. The earlier "cards render after hydration"
  diagnosis was wrong (they are server-rendered; see `docs/sapil/PERFORMANCE.md`).
- *Medium:* Sapil pages shifted sideways when content changed after hydration (`Wrap` shrank to its
  content in the flex `<main>`; bag / checkout skeleton CLS 0.077, confirmation 0.25) → `w-full`.
- *Low:* Sapil `/ar`: English "was" read before was-prices; "AED" in the home hero stat → fixed.
- *Medium (coordinator):* Sapil home hydration mismatch in the mood wheel (`Math.sin/cos` last
  digits differ server vs browser) → coordinates rounded to 3 decimals (`MoodWheel.test.ts`).
- *Low (coordinator):* the market cookie leaked between brands on one host (Sapil :3045 + Swiss
  Arabian :3046 locally: Swiss Arabian's first load asked the API for `SAPIL_URD1`). Each brand has
  its own cookie (`zoneCookieName()`: Swiss Arabian keeps `sa-zone-code`, Sapil `sapil-zone-code`),
  `MarketProvider` trusts only its own per-origin store before the markets load, and a stored zone
  must be one of the brand's markets (`storedZoneFor`). The server already ignored foreign zones.
  A Sapil shopper's earlier choice under `sa-zone-code` is not carried over (Sapil isn't live).
- *Low:* Insider page types ignored the `/ar` prefix (Arabic PDP sent a second page event,
  Arabic checkout counted as "other") → bare path.

**Still open:** Sapil Arabic web font (shift on short Arabic pages); inline card / wallet forms
and the 3-D Secure overlay sentence in Sapil checkout are Swiss Arabian's; `/verify?email=`;
Tabby / Telr return screens are English (fixed backend paths; the confirmation after them is in
the shopper's language); CMS data in English on `/ar` (Sapil menus, collection taglines, moods);
Sapil has no blog posts / CMS pages yet; Swiss Arabian merchandising slugs 404 on Sapil (data).

**Decisions for the product owner:** Arabic web font for Sapil; whether `/verify` should drop the
email from the URL too; Sapil content in Arabic (menus, moods, collection copy) in the admin.

## Brand design coverage (2026-11-13, branch `fix/brand-design-coverage`)

Every route under `src/app/[locale]` (except `(dev)`) checked for both brands, English and `/ar`,
at 1280 and 390 px, on production builds; Swiss Arabian also against the pre-program build
`5a55282`. Route × brand table and method: `docs/ui-check/BRAND_COVERAGE.md`.

**Feature switches are enforced** (`src/lib/brand/features.ts`, documented in `src/brands/README.md`):
- `storeLocator` → `/stores`; `blog` → `/blog/**`; `loyalty` → `/account/rewards`, `/account/membership`;
  `subscriptions` → `/subscriptions/**`, `/account/subscription/**`; `giftBox` → `/gift-box`;
  new `employeeBenefits` → `/account/employee-benefits` (Swiss Arabian on, Sapil off).
- Off: the proxy answers with the server-rendered 404 (brand chrome, status 404), each page also
  calls `requireBrandFeature()`, and links are filtered (CMS menus, account tabs and tiles, mobile
  menu, `/pages` → `/stores` redirect, sitemap). Sapil now has `blog: true` (v9 blog design).
- Swiss Arabian keeps every section on.

**Sapil views added** (logic in shared hooks, Swiss Arabian's views use them unchanged):
`SapilSitePageRoute` (`/pages`, `/policies`), `SapilCmsPreviewHome` (`/preview/home`),
`SapilReviewRequestPage` (`/review/[token]`), `SapilOfferPage` (`/offers/[code]`),
`SapilPageLoading` (also the account sign-in check), `SapilFeaturePlaceholder`,
`SapilFooterSeoText`, `SapilOurStoryFallback` (Sapil no longer shows Swiss Arabian's brand history),
`SapilGiftChoiceDialog`. Contract changes: `OfferShop` → `OfferPageView`, new `OurStoryFallbackView`.

**Found by the sweep and fixed:** Sapil `/ar` buttons and fields used Swiss Arabian's Arabic font
stack (`GE SS`); sign-in-only pages of switched-off sections answered 200 (now 404 from the proxy).

**Sweep results:** Sapil 120 / 120 page loads pass (drawn in the Sapil root, no Swiss Arabian
text / font / asset, no horizontal scroll, switched-off sections 404). Swiss Arabian: no Sapil
markup or text anywhere; visible text identical to `5a55282` except the program's pagination
routes, the newer in-page 404 block and the product "Details" panel (open item); `/ar/cart`
scrolls sideways at 390 px exactly as on `5a55282`. Sapil v9 diff unchanged (0 % on the static
components; known data / copy differences on hero intro and footer).

**Still open:** Sapil announcement links to `/shop?maxPrice=99` (CMS data; no `/shop` route);
Sapil has no posts / CMS pages / offers locally to see those views with data; Arabic web font for
Sapil. Details: `docs/ui-check/BRAND_COVERAGE.md`.
~~Swiss Arabian product "Details" panel empty~~ (no regression: identical to `5a55282`, the diff
was tab rotation timing), ~~signed-in account pages not swept~~, ~~Sapil checkout's inline card /
wallet forms, Tabby card and 3-D Secure sentence still Swiss Arabian's~~, ~~`/ar/cart` sideways
scroll~~, ~~React script-tag warning~~, ~~Sapil generic loading label~~ — closed by
`fix/remaining-gaps` (log below).

## End-to-end order test from the screens (2026-11-13)

Sapil site (`:3045`), Sapil backend `feat/sapil-cms` (`:3012`, schedulers off), admin `feat/sapil-cms` (`:3001`), Mailpit (`:8025`). Guest, cash on delivery, test data.

| Order | Courier | Result |
|---|---|---|
| `SAPIL_URD1-MWENZWNS-DDFBAA` (AED 30) | Sapil Demo standard | Placed; email lost (Mailpit was off) |
| `SAPIL_URD1-MWEOEBVY-506E7C` (AED 106) | Sapil Demo standard | Placed, marked ready; **send to courier fails** (no adapter for `sapil_demo_courier`) → order stuck in Manual review |
| `SAPIL_URD1-MWEOP7Z4-83752F` (AED 114) | Smoke Standard (test adapter) | Placed → risk cleared → ready → dispatched → **Delivered** (admin test simulation); emails confirmed / on its way / delivered all sent |

**Fixed on the website** (`0565aa6` + delivery-label commit):
- An unpriced delivery method no longer says "Free" (the backend keeps the previous shipping amount when the fee is missing).
- Sapil names the card provider when Stripe and Paymob are both offered.
- 20 account / checkout / payment / tracking pages have translated browser titles.
- Order delivery label no longer doubles words ("Standard Standard delivery", "Demo Standard delivery").

**Changed in local data (admin UI):** IQ Fulfillment and Tokyo Freight turned off for Sapil UAE (they need credentials Sapil doesn't have).

**Fixed — backend** (`feat/sapil-cms`, see that branch's log; verified with new Sapil orders and Mailpit):
1. ~~Emails not brand-aware~~ → a second brand never gets the shared (Swiss Arabian) logo, sender name, links, social links or legal name. Sapil ships `assets/email/brands/sapil/logo.png`; links come from `EMAIL_BRAND_SETTINGS` or `STOREFRONT_PUBLIC_BASE_URL__{BRAND}`; production skips a brand's email rather than linking to another brand's site. Verified: sender "Sapil", Sapil logo, every link on the Sapil site, 0 "Swiss Arabian" mentions.
2. ~~Silent failures~~ → failed email sends, failed courier calls and blocked admin payment actions are written to the backend log (verified for courier and capture).
3. Guest order emails link to `/track/{orderNumber}` instead of the home page.
4. The COD capture refusal now reads as a sentence staff can act on.

**Fixed — backend / admin (round 2)** — backend `a0c92a09`, `d59d7632`; admin `c175dc8` (all `feat/sapil-cms`, local):
- Checkout offers/accepts only couriers with a registered adapter (same rule as admin "Ready at checkout"); `SMOKE_SHIPPING_ALIASES` lets the local Sapil demo courier ship through the smoke simulator.
- A method with no fee is free, never the previous method's stale fee.
- Cash on delivery: uncollected COD orders can be cancelled (shopper and admin; authorization voided); admin Capture records cash collected. Data migration `20261113140000_cod_capture_and_release` (applied locally with `prisma db execute`, not recorded, to keep the shared DB's migration history clean).
- Ops-entered tracking resolves a manual-review shipment; no "on its way" email for failed/cancelled/lost/damaged shipments; admin shows "On hold" instead of "Fulfilled" for blocked shipments.
- Guest emails always link to tracking; courier event times use the exact `in_seconds` instant; order item counts are units.
- Sapil demo seed adds the `you-may-also-like` / `dont-miss-this` rails.
- Admin: no doubled courier names; unique switch names; tracking note labelled customer-visible; fraud check closes after a decision; "Products on this market" counts visible products.

**Verified from the screens:** site checkout (only shippable couriers, correct fees), product rails, tracking wording/order/times/units, review message, hidden staff note.
**Verified in the admin** (temporary local test admin, removed afterwards): order `SAPIL_URD1-MWEQJRU8-72923A` sent through the Sapil demo courier → Delivered → COD captured (Paid); order `SAPIL_URD1-MWERXWE6-7BD1B6` cancelled from the admin (payment Voided, Sapil cancellation email); fraud check closes after Clear; labels read "Standard"; switches name their courier; "Products on this market" = 86.

**Found while verifying (open):**
- A cancelled order still shows "Cancellation window open — the customer can still cancel" until the window time passes (admin).
- The admin's market selector defaulted to SAPIL_KSA; after an action the order refetch is market-scoped, so the page said "Order not found" until SAPIL_UAE was picked (admin).
- Locally, the `:3002` backend's schedulers also process Sapil orders in the shared DB (it auto-fulfilled two Sapil orders and, lacking the courier alias, sent them to manual review). Expected in the shared local setup; not an issue for separate environments.

**Still open:**
1. Per-brand email colours/design (shared template) — design task.
2. Admin shipping page jumped after a toggle — not reproduced.
3. Cancellation window never closes on the local `:3012` backend (schedulers off by design).

**Open — website:**
- Account order list (both brands) still shows the API's `itemCount`, which counts lines (backend `storefront-customer-order.service`, `guest-order-tracking.service`: `order.lines.length`). Backend should send units; the tracking header falls back to lines when an order has no shipment yet.
- `you-may-also-like` / `dont-miss-this` rails missing for Sapil (admin content).

**Open — backend (found while fixing the history order):** the admin IQ status simulation sends its time as UTC wall time without a zone (`2026-11-13 08:00:00`); the backend parses it in the server's zone (+05:00), so simulated events are stored 5 h early. Real IQ webhooks that send zone-less times have the same risk.

**Not a bug (checked):** "Test Payment (dev only)" is preselected because the local DB marks it default; the cut-off Arabic step label was the TanStack devtools button; fraud hold on order 3 was the correct "3 orders / 60 min" rule.

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
- **2026-11-13 (review, reviewer 1 — platform, branch `review/platform`):**
  - Closed: `getBrand()` adoption, brand-aware metadata, reviews copy in messages, `check:brand` in CI + Docker, server-rendered 404 for unmatched URLs.
  - Fixed: open redirect in `?returnTo=` (`//host`), `/en/products?page=2` pagination links (301 hop), `next dev --hostname 127.0.0.1` 301 loop on every default-language page, sign-in / register / verify shipping only "Loading…" (now rendered per request as before), Sapil kit routes + ~60 KB of Sapil CSS in Swiss Arabian builds.
  - Swiss Arabian check: home, /products, a collection (+ page 2), a product (en + ar), cart, checkout, login, register, /ar, /faq, /blog, /stores, /track, robots, 404 — HTML (head tags, visible text, links, labels) identical to `feat/homepage-start-from-storefront` apart from the intended changes (canonical origin = storefront host, `/en/…` → 301, 404 title "Page not found – Swiss Arabian UAE").
  - Backend / admin `feat/sapil-cms` review: see the reviewer report (patches for the collection-summary cache, best-seller payment status and the demo seed's collection guard).
- **2026-11-13 (later):** All three Sapil page branches are merged. Conflicts resolved: one wishlist hook, one collections hook, combined i18n areas and diff specs, the market delivery types. The shell now renders `SapilBagDrawer`. Next: the two reviewer agents, then the final UI check of both sites.
- **2026-11-13 (final UI check, branch `review/ui`):** language kept through checkout / sign-in /
  tracking (both brands), reset email out of the URL, Sapil card screens, announcement pause, Sapil
  LCP image fix, layout-shift and Arabic fixes; plus the coordinator's mood-wheel hydration fix and
  the per-brand market cookie. Re-checked with data after the API outage. Details are above and in
  `docs/ui-check/REPORT.md`.
- **2026-11-13 (reviewer 2, Sapil, branch `review/sapil`):**
  - Closed: all Sapil cards on `SapilProductCard` (home rails, mood band with white tiles, search, wishlist); payment return screens in Sapil wording (en + ar) on extracted hooks (`usePaymentReturn`); Sapil bundle isolation (named `@brand-ui` exports + `src/brands/sapil/package.json` `sideEffects`: home JS 770 → 409 KB); no layout shift from the chrome (CLS 0.105 → 0.001); AA contrast (`--sapil-muted` #6f665b, design sign-off pending); price-edit links → `/products?under=N`; "Shop by" current-chip bug; nested `<main>`; localised breadcrumbs and Arabic currency sign.
  - Lighthouse (mobile, median of 3): home 41 → 65, shop 46 → 64, collection 55 → 66, product 42 → 68; a11y 100 on all four. Details: `docs/sapil/PERFORMANCE.md`.
  - Flows checked on the build (en + ar): browse, filter / sort, product, drawer, bag, guest cash-on-delivery order, confirmation, tracking, sign-in / register / forgot / reset / verify, account guard, search, language and market switchers, 404, API failure, empty states; no horizontal scroll at 390 / 768 / 1280.
  - Open for product: Arabic shoppers lose Arabic on checkout / sign-in / tracking (transactional paths unprefixed); the muted colour change; rotating announcement without a pause control.
- **2026-11-13 (close):** `review/ui` merged into `feat/multibrand-sapil`. Final checks on the merged code: tsc and eslint clean, vitest 184 files / 1116 tests with both brand UIs, Swiss Arabian and Sapil builds pass. Backend fixes from review 1 committed on backend `review/sapil-cms` (`9dff01a5`, on top of `feat/sapil-cms`). Nothing pushed or deployed. Open items: see "Final UI check → still open" and the decision tables above.
- **2026-11-13 (order test):** Three Sapil cash-on-delivery orders run from the screens (site → admin → site); one reached Delivered. Website fixes committed; backend/admin gaps listed under "End-to-end order test".
- **2026-11-13 (backend fixes):** per-brand email identity and failure logging on backend `feat/sapil-cms`; verified with two more Sapil orders. Remaining gaps above.
- **2026-11-13 (order-flow gaps):** branch `fix/order-flow-gaps`: tracking wording / order / time zone / delivered date / review wording, unit counts, checkout title, page-SEO lookups cached and skipped for catalog paths, catalog pages error (not 404) when the API is down, staff tracking notes hidden. Both brands.
- **2026-11-13 (gaps round 2):** website `fix/order-flow-gaps` merged (2e4a90e); backend/admin fixes committed on `feat/sapil-cms`. Website: tsc + eslint clean, 1156 tests × 2 UIs.
- **2026-11-13 (brand design coverage, branch `fix/brand-design-coverage`):** brand feature switches enforced (proxy 404 + page guard + link filters; `employeeBenefits` added, Sapil blog on); Sapil's own views for `/pages`, `/policies`, `/preview/home`, `/review/[token]`, `/offers/[code]`, loading, placeholders, footer SEO text, `/our-story` fallback and the free-gift dialog; Sapil Arabic controls keep Sapil's font. Every route swept for both brands (en + ar, 1280 + 390); results in `docs/ui-check/BRAND_COVERAGE.md`.
- **2026-11-13 (brand coverage merged):** `fix/brand-design-coverage` merged (8edf8c5); tsc + eslint clean, 1210 tests x 2 UIs. Demo seed links fixed (backend 462667be). Content still needed for Sapil launch: policy pages (privacy, terms, delivery, returns), blog posts, CMS pages, offers - entered in the admin.
- **2026-11-13 (remaining gaps, branch `fix/remaining-gaps`):** Swiss Arabian "Details" panel checked against `5a55282` (no regression; test added); `/ar/cart` sideways scroll fixed (logical margin); React "script tag" warning gone (root-layout inline scripts render from the server HTML only); Arabic mega-menu ids fixed (duplicate keys on every Swiss Arabian `/ar` page); Sapil's own inline card / wallet forms, Tabby card and 3-D Secure overlay on new shared hooks; Sapil loading lines translated per route; signed-in account pages swept for both brands (128 loads, all pass; `docs/ui-check/BRAND_COVERAGE.md`). tsc + eslint clean, 207 files / 1231 tests × 2 UIs, both builds pass. Open: the local API answers `inline-form` with `ready: false`, so inline card forms were not seen with a live provider session (unit-tested).
- **2026-11-13 (card payments and Sapil policies):**
  - **Stripe card, Swiss Arabian:** paid from the screens with Stripe's test card; order URD1-MWF1BVOW-9CE720 confirmed, "Payment confirmed". Bug fixed on the way: Stripe refused to confirm ("An email address is required to confirm this Checkout Session") when the session was created without the customer's email; card and wallet payments now pass the email to `confirm()` when the session has none (`confirmEmail`, 361e129).
  - **Paymob card, Sapil:** the form loads and accepts the test card; Sapil's 3-D Secure overlay opens. The bank page could not be finished in the in-app browser (paymob.com is blocked there). Check it in a normal browser.
  - **Stripe card, Sapil:** paid from the screens with Stripe's test card; order SAPIL_URD1-MWF1YZGL-E9CE38 shows "Paid AED 30". Locally, Sapil's Stripe test packs (`stripe-sapil-test`, `stripe-sapil-uae-test` in the git-ignored `brand-credential-packs.local.json`) reuse Swiss Arabian's Stripe test keys, as the Sapil Paymob pack already does. Sapil needs its own Stripe account before launch. Note: the backend reads the pack file at start-up; restart it after changing keys.
  - **Sapil policies:** `seed:sapil-demo` now copies Swiss Arabian's brand-wide policies (privacy, terms, shipping, refund, contact information) and pages (contact, privacy, refund) to Sapil, kind for kind, rebranded (backend 4cb1300f; `-- --pages-only` reruns just this). The group's legal names, customer-service email and phone stay. Arabic `/policies/*` shows English, as on Swiss Arabian: those source policies have no Arabic text.
- **2026-11-13 (ngrok, provider callbacks):**
  - Tunnel: `ngrok http 3012` on the machine's saved ngrok account (its address is `semestral-vito-sulfurously.ngrok-free.dev`; the `NGROK_DOMAIN` in the backend `.env` belongs to another ngrok account and is refused). The local Sapil backend's `.env` `APP_URL` points at the tunnel (the Azure value is kept as a comment, to restore).
  - **Paymob card, Sapil:** done end to end. Test card 5123 4567 8901 2346, Sapil's 3-D Secure overlay, bank step completed (paymob.com had to be allowed in the in-app browser), order SAPIL_URD1-MWF2BROK-017FE4 "Paid AED 30"; Paymob's `POST /webhooks/payments/paymob` reached the local backend through the tunnel, no errors.
  - **Tabby, Sapil:** done end to end. Local pack `tabby-sapil` reuses Swiss Arabian's Tabby TEST merchant (owner's choice; Tabby's page says "Swiss Arabian"; Sapil needs its own Tabby merchant before launch) and returns to `http://localhost:3045` through the pack's `devReturnOrigins` (non-production only, so no storefront tunnel was needed). Tabby sandbox customer `otp.success@tabby.ai`, +971 50 000 0001, code 8888, 4 payments; back on Sapil's "confirming" page, then order SAPIL_URD1-MWF2DTIR-46936B "Paid AED 60".
  - **Bug fixed (backend 3847e815):** "Try Pay again" after a failed attempt returned a 500. The site resends the same idempotency key; the backend returned the FAILED transaction and provider execution refused it. Failed, cancelled, expired and voided attempts are no longer reused.
  - **Still open:** Telr needs a public HTTPS return page (it rejects other return addresses), and Swiss Arabian's own Tabby `returnBaseUrl` is still a placeholder (its `devReturnOrigins` is `http://localhost:3004`, not the `:3046` test site).
- **2026-11-13 (Arabic account pages, branch `fix/sa-arabic-account`):** Swiss Arabian account views (dashboard, tabs, profile, phones, consents, addresses, security, orders + order detail, tracking, returns & exchanges, reviews, wishlist / saved, payments, rewards, employee benefits, subscriptions list + agreement), auth pages (login, register, forgot / reset, verify) and guest tracking now read `src/messages/{en,ar}.json` (~965 new keys, English unchanged). Shared helpers (order status, after-sales, loyalty, subscription labels) take an optional translator and default to English, so Sapil and existing tests read the same; zod / API-reader English is shown through `formError.*` / `loyalty.text.*` keys (`knownText`). Also: header tools, skip link, menu labels, `PageLoading` by `labelKey`, phone field and region / country names, logical CSS for the rewards tier track, auth slideshow and address cards. Swept `/ar/account/*` signed in (test customer `ui.account.test+mwf2mztv@example.test`): no code English left; remaining Latin is API data (tier names, product / order data, API error text), prices (`AED`) and brand names.
- **2026-11-14 (Swiss Arabian Arabic merged):** `fix/sa-arabic-account` merged (e674317): account, sign-in / register / reset and guest tracking pages in Arabic on `/ar` (about 965 new message keys). On the merged code: tsc and eslint clean, vitest 208 files / 1236 tests for both brand UIs, both builds pass. Spot check on `:3046` (en worktree of the branch): `/ar/login`, `/ar/register`, `/ar/track`, signed in `/ar/account`, profile, rewards: Arabic and right-to-left; English left only in customer data, API tier names (Silver / Gold) and "AED". Still English: the sign-in code email ("… is your Swiss Arabian sign-in code") even when requested from `/ar` — backend email language.
- **2026-11-14 (emails in the shopper's language):** backend b6e4d882 + website. The site sends the page language (`<html lang>`) as `x-storefront-language` on every API call (added to the production CORS list). Code emails (sign-in, verify, reset; also SMS / WhatsApp) use it; order, return and exchange emails use the order's locale; welcome and password-changed use the sign-up language saved at registration (`customer.metadata.language`). `CUSTOMER_EMAIL_LOCALE` still overrides; the brand default is the fallback. Checked on Sapil from the screens: `/ar/register` → Arabic verify + welcome emails (right-to-left); `/login` → English code for the same customer; `/ar` cash-on-delivery order → Arabic confirmation. Also fixed: Sapil's Terms and Shipping links pointed at Swiss Arabian page addresses (404 on Sapil); now `/policies/terms-of-service` and `/policies/shipping-policy`.
  - Leftovers fixed (backend e0e4eeac + website): Arabic emails print dates as "14 نوفمبر 2026" and name the brand in Arabic (سويس أرابيان / سابيل; override `EMAIL_BRAND_SETTINGS.<code>.nameAr`); Sapil's checkout (emirate list, "Deliver to" summary) and account addresses (form, dashboard, address book) show emirate and country names in the page's language; saved values stay English. Checked on Sapil: `/ar` order → subject "… من سابيل", date in Arabic, emirate list in Arabic. Only store data (e.g. the demo delivery method "Sapil demo standard") stays as entered.
  - **Email themes, phase 1 done (backend 21938431):** templates use `{{ theme_* }}` tokens; Swiss Arabian keeps its colours, Sapil's emails use its v9 palette (navy / cream). Email footer links fixed per brand (privacy, terms; Sapil "stores" → contact; were 404s). Guide: backend `docs/EMAIL_BRAND_THEMES.md`. Deploy note: deploy the backend, then `npm run seed:notification-templates` (a backend without token support would show raw `{{ theme_* }}`; locally the `:3002` backend on older code shares the reseeded database). Review-request and subscription emails themed too (backend 87caf388; Swiss Arabian's review email moved onto the shared cream palette). Still open: the `email-templates` source project must adopt the tokens; phases 2 (admin-managed brand email settings with preview / test send) and 3 (Sapil sending domain, client rendering checks).
- **2026-11-14 (emails in forced dark mode):** backend d68d6bab. Emails stay light-only; when Gmail / Outlook force dark mode they darken backgrounds but never images, so header logos are now opaque badges in the header colour (invisible in light mode) and Sapil has its own icons (pale blue / navy). Checked in Mailpit with forced inversion on a Sapil sign-in email: logo, code box, text and footer readable; light mode unchanged. Guide: backend `docs/EMAIL_BRAND_THEMES.md` → Dark mode.
- **2026-11-14 (review email, Telr, launch checklists):**
  - **Review request, Sapil:** sent through `ReviewRequestsService` for a delivered order (review requests switched on for Sapil only for the test, then put back off). Email in Sapil colours with links to the Sapil review page; the 5-star link opens the page with five stars selected; review posted ("your review is live"; a local test review on Very Vanilla). Review email logo moved onto the header band (backend aca6df7a).
  - **Telr, Sapil:** paid end to end (order SAPIL_URD1-MWFNVTEH-2E2202 "Paid AED 30") with Telr's test card; Telr returned to `http://localhost:3045` through the pack's `devReturnOrigins` (no tunnel needed; status confirmed by Telr's status check). Findings: the Telr integration is **test-only** (orders always `test: 1`, status check refuses live packs): going live needs development; Telr's page asks for name / email / phone again (backend sends no customer block).
  - **Launch checklists for the business team:** `docs/sapil/LAUNCH_CHECKLISTS.md` (payment accounts, email sending domain and DNS, policy and contact details to confirm, product decisions with recommendations, real mail-app rendering test list, testing status).
