# Platform fixes handover — November 2026

Date: 9 Nov 2026 · Prepared by: Zeeshan Nawaz

## Why this document

While rebuilding the platform from a clean database (Swiss Arabian + Sapil, 3+ markets each), we found issues across all three repos. This is the list of what was changed and why, grouped by area, so each owner knows what happened in their code. Most of it is not anyone's fault: nothing in CI checked lint, test types or schema drift, so problems built up unnoticed. The fixes below include the checks that stop that from happening again.

Everything is on branch **feature/market-tax-policy** in each repo and is **not merged yet**. Please review the parts in your area.

## Status at a glance

| Repo | Files changed | Checks now |
| --- | --- | --- |
| Backend (swiss-arabian-backend-d) | ~150 | Typecheck of ALL code: 0 errors (was 366) · 4,409 unit tests pass · migrations apply cleanly · no schema drift |
| Storefront (swiss-arabian-website) | ~90 | Lint: 0 problems (was 103) · typecheck clean · 654 tests pass (was 48 failing) |
| Admin panel (swiss-arabian-admin-panel) | ~30 | Typecheck clean · affected tests pass |

## New rules (enforced by CI)

- **Backend CI** now also: applies all migrations to an empty database, fails on any difference between migrations and the Prisma schema (`npm run prisma:drift`), and type-checks tests, integration tests and scripts (`npm run typecheck`). Jest does not type-check, so this is the only thing keeping tests in step with the code.
- **Storefront CI** is new (there was only a deploy workflow): lint with zero warnings, typecheck, unit tests and production build run as four parallel jobs on every pull request.
- **Faster backend CI:** the checks run as parallel jobs (secret scan, migrations + drift, build, typecheck, and unit tests split into 2 shards). Tests no longer run one file at a time (`--runInBand` removed), and Jest uses swc instead of ts-jest (full cold run 101s → 86s locally). Under swc, two subscription services that inject each other through `forwardRef` now use the `WrapperType<T>` alias (`src/common/types/wrapper-type.ts`), as NestJS documents for circular dependencies.
- **Schema changes go through migrations only.** Never edit the database by hand or with `db push`. See `prisma/README.md` → "Schema change rules".
- **Storefront unit tests cannot reach the network.** Any request a test did not mock fails immediately with the URL. Mock the service (`vi.mock`) or stub `fetch`.
- **Needs an admin:** turn on branch protection for `main` in all three repos (require a pull request and require these checks to pass). Until then the checks can be bypassed.

## Markets and VAT (tax policy)

**Problem:** VAT inclusive/exclusive was hard-coded (UAE treated as "prices exclude VAT, 5%"), there was no setting for it, and the D365 "prices include sales tax" flag was set separately, so the storefront, checkout and D365 could disagree.

**What changed (backend):**

- New table `core.zone_tax_policies`: one versioned VAT policy per market (prices include VAT yes/no, rate, VAT on delivery, label, start date, reason). Versions are append-only; a change is scheduled as a new version from a start time and never rewrites the past.
- Carts, checkout sessions and orders now store the policy version and rate they were priced with, so placed orders keep their tax even if the policy changes later.
- The D365 sales order flag `ArePricesIncludingSalesTax` now comes from the order's own stored VAT setting. The old hard-coded UAE default was removed.
- Market creation now **requires** a VAT policy, and creating a market is one database transaction (market, legal entity, D365 scope and tax policy all succeed or all roll back).
- New admin endpoints: view a market's tax policy, and schedule a new version (permissions `markets.tax.read` / `markets.tax.write`). Changes are audit-logged.
- The migration backfilled version 1 for every existing market using the old rule. Each environment must set the correct policy per market on the new Tax page (locally UAE is set to "prices include VAT, 5%").

**Admin panel:** VAT section in the market wizard (required), a new **Tax** tab per market with history and "Schedule a change". The wizard's old D365 "prices include tax" field is now read-only and derived from the VAT choice. The old unused `CreateMarketPageViewNew` screen was removed.

**Storefront:** cart and checkout show "Includes VAT" or the VAT line according to the market's policy instead of a fixed rule.

## Database and migrations

**Problem:** the live schema had drifted from the migrations (changes applied without a migration, and migrations that no longer matched the schema). A fresh database could not be built to match the code.

**Fix:** one reconciling migration (`20261109130000_reconcile_schema_drift`) that first **refuses to run if it would lose data**, then:

- creates the missing `stock_alert_requests` table and its enum (stock alerts);
- makes `gift_cards.code_hash` unique;
- removes the global unique `code` on product categories and collections (codes are unique per brand);
- aligns `content.*` column types with the Prisma schema (ids and timestamps);
- stores subscription paused/resumed times in UTC;
- drops unused columns/tables: `refunds.d365_credit_note_number`, `subscription_plans.image_url`, `subscription_cycle_skips`, and enum value `SEED_D365_ECOM`;
- renames about 44 indexes to the names Prisma expects.

After this, `prisma migrate diff` reports no drift, and CI keeps it that way.

## Permissions (RBAC)

**Problem:** several admin screens were guarded by unrelated permissions (brand screens by `payments.read` / `settings.write`, market screens by `d365.read`), so the wrong people could or could not open them.

**Fix:** new permissions `markets.read`, `brands.read`, `brands.manage`, `markets.tax.read`, `markets.tax.write`, seeded with role grants (Brand Admin, Market Admin, Finance Manager; every role gets read access to markets and brands). Backend controllers and the admin panel's navigation, routes and buttons now use these. Re-run the RBAC seed after merging.

## Backend platform

- **Shared database transactions:** `PrismaService` now has `prisma.db` and `prisma.transaction(...)`, so several repositories can take part in one transaction without passing `tx` around. Used for market creation. A real-client test guards it (a mock hid a bug here at first).
- **Error logs:** unexpected 500 errors now log the original error message and stack trace (server side only; the API response is unchanged). Before, logs only said "TypeError".
- **Dashboards:** widget concurrency could only ever be 4 because of a typing mistake; it is now a normal number.
- **Market overview:** the empty catalog summary is typed like the full one, so callers can read counts per status.
- **Promotions:** the coupon/campaign definition type now declares the campaign's product-scope fields that the code already merges.

## Storefront

- **Lint 103 → 0.** Mainly React effects that set state (replaced with React's recommended patterns), refs read during render, and `img` tags. New shared hooks: `useResetOnChange`, `useMediaQuery`, `usePersistHydrated` (plus the existing `useHydrated`).
- **Images:** new `MediaImage` component plus one shared allow-list of image hosts (`src/lib/images/remoteImagePatterns.ts`, also used by `next.config.ts`). Known hosts are optimised; any other host loads as-is instead of breaking the page — important for Sapil media.
- **Real bugs fixed along the way:** hero carousel buttons used a React API that is not allowed there; a collection that does not exist crashed with a 500 (now a proper 404 page); the offers page now loads through React Query; the catalog price filter writes to the URL from the slider itself; a dead "Start a new attempt" link on the Stripe card form was removed; the navbar search is now an accessible combobox.
- **Tests (48 failing → 0).** Causes: unit tests were calling the real local backend (its 401 logged the test user out mid-test, so results depended on what was running); a bad merge nested one test inside another; the Scent Club redesign changed month labels and button names without updating tests; a missing `scrollIntoView` in the test browser. Fixed in the shared test setup and in the tests. The Surprise-mode note "no shipment is promised" was intentionally dropped from the subscription page (agreed), and its unused helper removed.

## Backend tests and types (366 type errors → 0)

All production code was already clean; the errors were in tests and scripts that had drifted. Worth knowing for each area:

| Area | What was wrong | Fix |
| --- | --- | --- |
| Returns | A test used reason code `CHANGED_MIND`, which does not exist, so it created returns with no reason | Uses `CUSTOMER_CHANGED_MIND` |
| Payments / Telr | Test used payment status `PENDING`, which does not exist | Uses `REDIRECT_PENDING` |
| Refund safety | Two SQA tests passed the old input shape | Updated to `{ promotionSnapshot, giftCardUsages }` |
| Subscriptions | Reminder test had no status, so "skipped / paid / too far" cases passed for the wrong reason; consent test replaced the real brand access check with a fake | Status added; consent test now uses the real check and proves a Sapil admin cannot see Swiss Arabian data |
| Multi-brand | Fixtures missing new brand fields (D365 market scope, analytics events, coupons, subscription plans) | Fixtures match real data |
| Services with new dependencies | Tests built services without newly added dependencies; they only passed because those paths were not hit | Explicit stand-ins passed |
| Loyalty | Fixtures missing new snapshot columns; an integration test used `formatPoints` without importing it | Fixed |
| Duplicate mock keys | Several mocks defined the same key twice (the second silently won) | Kept the intended one |
| Ops scripts | Analytics audit could crash on an order without a creation date | Counted separately |

Shared test helpers added so this drift is less likely: typed `commerceNotifyMock`, `authenticatedAdmin` fixture, typed Prisma transaction mocks.

## Clean rebuild log (9 Nov 2026)

The local database was wiped and rebuilt only through the project's own commands and the admin UI, the way a new environment would be. Backup of the state before the wipe: `_backups/before-rebuild-2-2026-11-09/` (outside the repos).

**Steps run:** `prisma migrate deploy` on an empty database (all migrations apply, no drift) → `seed:identity-rbac` (68 permissions, 11 roles) → `seed:identity-admin` (Super Admin) → `seed:notification-templates` → market creation in the admin UI.

**Before the wipe:** D365 UAT refused every call from the platform (HTTP 403 "Please verify that the user is valid and set up correctly"). Cause: the platform's app registration (client ID `22b2f6ae-…`) had no row in D365 → System administration → Setup → **Microsoft Entra applications** (likely removed by a UAT refresh). Fixed by adding the row. It currently points to a personal user; use a dedicated integration user before go-live so D365 changes are not recorded under a person's name.

Problems found while rebuilding, and what was changed:

| # | Where | Problem | Cause | Fix | Test |
| --- | --- | --- | --- | --- | --- |
| R1 | Backend · market creation | Creating any market failed with "Record not found" | Market creation is one transaction, but the D365 commerce-scope repository wrote outside it (`tx ?? this.prisma` instead of `this.prisma.db`), so it could not see the sales channel created a moment earlier; the whole create rolled back. Never seen before because no market had been created from scratch since the transaction change. | The 6 writes in `d365-commerce-scope-config.repository.ts` now join the open transaction | `d365-commerce-scope-config.repository.spec.ts` |
| R2 | Admin · market setup page | "Continue setup" did nothing; "12 of 17 required steps" counted optional steps | The backend marks some checklist steps `optional`, but the admin ignored the flag, picked an optional step as "Next", and that step had no link | Checklist, progress count and "Next" now follow the backend's `optional` flag; the pricing step links to "Refresh prices & stock" | `marketReadinessNavigation.test.ts` |
| R3 | Backend · load products from D365 | 25 of 310 products failed: "Unique constraint failed (owning_brand_id, slug)" | D365 items with the same name (e.g. two sizes of EDGE) both got the web address `edge`. Products are created without a brand, where the clash is not checked, and the brand is attached later | New `assignProductOwningBrand` (in `product-public-slug.util.ts`) attaches the brand and gives a clashing product the next free address in the brand (`edge-2`); used by market visibility | `product-public-slug.util.assign-brand.spec.ts` |
| R4 | Backend · load products (re-run) | After R3, the 25 products still had no brand on re-run | The brand was only attached the first time a product was enabled for a market | Attached on every enable when the product has no brand (no-op otherwise) | covered by R3 spec + re-run: 310/310 with brand, 0 duplicate addresses |
| R5 | Admin · Refresh prices & stock | A new market had no stock: products from D365 were all "out of stock" | Markets use "website owns stock" (`PLATFORM_OPS_STOCK`, Shopify-era design, gap UAE-G29), so the refresh copies prices only. The backend option to copy D365 stock existed but the admin never offered it, and the screen said it updated "prices and stock" | New switch in the dialog: **Also set website stock from Dynamics** (off by default). Screen text now says stock is kept unless it is on | used live: UAE 185 products sellable |
| R6 | Admin · all tables | Job summary showed "[object Object]" in Item / Why | The shared `DataTable` turned any custom cell into text | Custom cells render as components | `DataTable.test.tsx` |
| R7 | Admin · job summaries | Every failure said "This item couldn't be added" | Backend reasons `PRICE_MISSING` / `PRICE_AND_INVENTORY_MISSING` had no friendly text | Clear reasons added ("No price and no stock in Dynamics … then refresh") | `catalogJobFriendlyErrors.test.ts` |
| R8 | Backend + admin · payments | Only Test Payment could be offered; "Add payment provider" said "not wired yet" | Paymob / Stripe / COD rows were created by hand-run scripts (which also looked for a market coded `UAE`), and the add-provider screen was never finished | Every payment adapter registered in code is listed on each market's **Payments** page from one definition file (`payments/constants/payment-provider-catalog.definitions.ts`); offering it on a market creates its records. The unfinished add/edit provider pages now open Payments | `admin-market-payment-config.catalog.spec.ts` |
| R9 | Backend · payments | "Checkout ready" was shown for Paymob/Stripe even when the brand had no credentials (checkout would fail) | Only Tabby's credentials were checked | `hasPaymentCredentials` checks Paymob, Stripe, Telr and Tabby for the market's brand | same spec |
| R10 | Backend · background jobs | Shopify "Seed catalog" for UAE and Qatar failed at the last step with "Zone not found: URD1" | Jobs started from a request kept the **brand picked in the admin header** (it was Sapil), so "URD1 under Sapil" was looked up | Background jobs (Shopify seed, D365 load products, D365 refresh) now run detached from the header brand (`runWithoutAdminBrandSignal`); the collection import also passes the market's own brand | `admin-brand-signal.als.spec.ts` |
| R11 | Backend · Shopify categories/collections | KSA Shopify seed crashed: unique `(owning_brand_id, slug)` | A Shopify tag ("Heritage Collection") had the same web address as a D365 collection of the same brand; and every Arabic-only tag became one collection called "collection" | Same-address collection/category of the brand is reused (D365-owned ones keep their name and address); Arabic-only tags get their own stable address (`t-<hash>`); existing addresses are never rewritten | `shopify-taxonomy-seed.service.spec.ts` |
| R12 | Admin · create market | Review page showed "Prices include tax: —" | It read a field nothing sets | Shows Yes/No from the market tax setting (what D365 receives) | — |
| R13 | Backend · D365 safety | Orders imported from Shopify could be posted to D365 again (they are already there via the old Shopify connector — Shopify tags them `OrderCreatedInD365`) | Nothing marked them as history for D365 | One rule (`orders/utils/historical-import-order.util.ts`): SHOPIFY-source orders are never posted. Enforced in D365 eligibility, export readiness (before D365 customer creation), the document post guard (last line for every sales order and negative sales order), and storefront returns/exchanges ("placed on our previous website — contact customer care") | `d365-document-post-guard.service.spec.ts`, `d365-outbound-eligibility.service.spec.ts`, `storefront-after-sales-eligibility.refunded.spec.ts` |
| R14 | Backend · Shopify order import | "Include payment & shipping details" failed for every order | Shopify's delivery method is an object; it was saved into a text field | Saves the carrier name (e.g. "J&T Express") | `shopify-order-bulk-import.core.spec.ts` |
| R15 | Backend · Shopify order import | Imported orders showed a wrong subtotal and "After promotion" (e.g. SAR 129.90 on a SAR 299.70 order) | Shopify's subtotal is after discounts; the platform's is before discounts | Uses Shopify's before-discount line total; the 35 orders already imported were corrected | checked: all 181 imported orders reconcile (subtotal − discount + shipping = total) |
| R16 | Backend · Shopify customer import | Customer batches re-read everyone already copied; from batch 4 a batch added nobody | No resume point | Each batch continues from the oldest customer already copied (newest first) | `shopify-customer-seed-pipeline.service.spec.ts` |
| R17 | Backend · Shopify customer import | One duplicate email crashed a whole 5,000-customer batch when markets ran together | Email is unique per brand across markets; checked only before inserting | Clash held for review, rest of the batch created | checked on real data (3 markets in parallel) |
| R18 | Backend · Shopify customer import | 23% of phones stored as `05x…`/`5x…` (no country code) | Import only stripped spaces | Market phone rules (`+971`, `+966`, `+974`); existing 13,483 repaired, 31 invalid set aside | `phone-normalization.import-formats.spec.ts` |
| R19 | Backend · Shopify customer import | Customers from an interrupted batch were never created (4,938 UAE, 86 Qatar) | Later batches only processed their own rows | Each batch first finishes and re-checks leftovers | `shopify-customer-seed-pipeline.service.spec.ts` |
| R20 | Backend · Shopify order import | Imported order lines had no product link (7,683 of 7,683) | Line insert never looked up the product | Exact SKU sold, else the Shopify listing's product; existing lines repaired (7,671 linked) | checked on real data |
| R21 | Backend · Shopify order import | Each order pull restarted at the newest order (max 10,000); UAE has 36,711 | No resume point | "Continue from oldest copied" option | `shopify-order-bulk-import.core.spec.ts` |
| R22 | Backend · product URLs | A market's old Shopify product URL 404'd when another market used the same address | Brand-wide address only; last market's import could also move it | Market-own address when the brand one is taken; never moves another market's | `shopify-matched-handle-restore.core.spec.ts` |
| R23 | Backend · categories | Customer-facing category "simple" (133 products) | Shopify product type set by a bundle app | Technical product types skipped; category removed | `shopify-taxonomy-seed.service.spec.ts` |
| R24 | Website · SEO | Unknown product/category URLs returned 200 (soft 404); an unknown product URL could open the first search result | No 404 path; fuzzy fallback | Real 404s; exact SKU/slug match only | — (checked live) |
| R25 | Website · SEO | Old Shopify URL shapes 404'd (`/collections/x/products/y`, `/account/login`, `/pages/about-us`, `/blogs/…`) | No mapping | 301 redirects in the proxy, `/ar` kept | `shopifyLegacyRedirects.spec.ts` |
| R26 | Website · home | Hand-written "Verified buyer" reviews, another brand's claims and images ("Crafted in France", dossier.eu), made-up plan prices, hard-coded AED prices in the menu | Pre-CMS placeholder content | Sections show only real content; placeholders removed | — (checked in browser) |
| R27 | Backend + Admin · collections | A market could only hold a full copy of a collection or nothing; Qatar/KSA differ from UAE on products in some collections and on text in others | One all-or-nothing market copy | Each market follows the brand collection and keeps its own version only of the parts that differ (products, text & SEO, image); per-part "Reset to brand" in the admin; brand default market setting (Brand go-live → Default market) | `collection-market-overlay.service.spec.ts`, `collection-market-sync.util.spec.ts`, `shopify-website-ia-import.service.spec.ts`, `admin-brand-ops.service.spec.ts` |
| R28 | Backend · collections | 250 public collection pages made from product tags (e.g. "15yes", "30f") that are not Shopify collections | Taxonomy seed turned every tag into a collection by default | Tag collections are opt-in only; the 250 archived (soft delete, restorable); nothing linked to them | `shopify-taxonomy-seed.service.spec.ts`, migration `20261110140000_archive_shopify_tag_collections` |
| R29 | Backend · collections | Collections that exist only in Qatar/KSA kept a product-tag list as their brand version | A non-default market never wrote the brand version over a leftover tag row | The store writes the brand version over a tag leftover; an archived tag row is restored; a collection deleted on purpose stays deleted | `shopify-website-ia-import.service.spec.ts` |
| R30 | Backend · collections | 99 Shopify collections had no owning brand | Created before the import set it | Backfilled from the markets that show them (all one brand) | migration `20261110120000_collection_owning_brand_backfill` |
| R31 | Backend + Admin · collection import | Import ran inside one long request with no progress; closing the page lost it | Synchronous endpoint, no admin screen | "Import from Shopify" on Website → Collections: Preview, then a background job with live "collection N of M" progress; can be closed and reopened; one run per market | `admin-market-shopify-seed.controller.spec.ts` |
| R32 | Backend + Admin · menus | Website showed a header made from categories and an empty footer; "Seed Navbar" wrote a hand-typed, out-of-date UAE menu into any market | Shopify menus were never imported; the old import assumed `new-nav` and matched links across brands | "Import from Shopify" on Website → Navigation: reads each store's live theme (header menu + footer columns), Arabic labels, links matched within the brand only; preview first, one transaction; Seed Navbar removed | `shopify-menu-import.util.spec.ts`, `shopify-menu-import.service.spec.ts` |
| R33 | Website · footer | Footer "Services" / "More links" were fixed lists (mostly `/faq`); social icons linked to bare facebook.com etc. | Placeholder content | Footer columns come from the market's footer menu; social icons only for links set in the CMS footer | `SiteFooter.test.ts` |
| R34 | Website · header | Third-level menu links (e.g. PERFUMES → HAIR MIST → products) were dropped | Header only handled titled groups | A link with its own links becomes a column with a clickable heading (desktop and mobile) | `toChromeNav.test.ts` |
| R35 | Backend · menus | Product links in menus ignored a market's own product address | Reader used the brand slug only | Menu product links use the market address first (R22) | `storefront-homepage-navigation.service.spec.ts` |
| R36 | Admin · markets | Opening a market link (e.g. Swiss Arabian KSA) while the header was on another brand opened that brand's market instead | The page followed the header, never the address | The address wins when a page opens (brand + market switch to it); changing the header still moves the page | checked in browser |
| R37 | Backend + Website · product images | Product pages showed every photo 2–3 times (e.g. Shaghaf Oud: 7 photos × 3) | Each store's images were imported separately and the per-market filter broke when images moved to Azure (no market folder in the address) | One brand gallery (from the default market's store) + a market gallery only where its store really differs (same photo = same file or same Shopify file name); market-only images belong to (market, product); settles after every image import; 1,456 copies retired, 192 market galleries kept | `product-market-gallery.core.spec.ts`, `product-market-gallery.service.spec.ts`, migration `20261110160000_product_media_market_only` |
| R38 | Backend · product tags | Every store's tags merged into one brand list (a Qatar-only tag applied in every market) | Tag import unions all stores | Brand tags from the default market's store (+ platform-added tags); market tags where a store differs; settles after every tag import | `product-market-tags.core.spec.ts` |
| R39 | Backend + Website · collection banners | Collections had almost no images (6 of 96 in UAE) | Themes keep banners in collection metafields (desktop/mobile × English/Arabic); the import read only the standard image | Banner set imported per collection (4 slots), brand vs market like other parts, copied to our storage; website shows the banner full width with the mobile version on phones and Arabic on /ar | `collection-market-sync.util.spec.ts`, `shopify-website-ia-import.service.spec.ts` |
| R40 | Backend + Website · breadcrumb | Product breadcrumb "Collection 1000" | D365 holds a bare code in the e-commerce collection field; the projection made it a public collection | Code-only values are never projected; the 2 existing ones archived | `d365-taxonomy-code.shopper-label.spec.ts`, migrations `20261110170000`, `20261110171000` |
| R41 | Backend · imports | A collection import cut off by a server restart stayed "running" forever and blocked new runs | No interruption detection | A run with no progress for 10 minutes is marked failed and a new run starts | `admin-market-shopify-seed.controller.spec.ts` |
| R42 | Website · SEO | Product/catalog pages: relative canonical, hreflang and og:url; brand twice in titles; no share image; structured data without price/stock/brand/rating | No site base address; template suffix always added | Absolute addresses per market domain; brand once; og:image + large Twitter card; Product structured data with offers, brand, images, rating | `requestOrigin.test.ts` |

**VAT decision (9 Nov):** all markets of both brands use VAT-inclusive prices (UAE 5%, KSA 15%, Oman 5%, Qatar 0%). UAE changed on its Tax page (v2), which also sends "prices include tax: Yes" to D365, matching the D365 ECOM price list.

**Local machine change (not in git):** credential pack names in `brand-credential-packs.local.json` were renamed from the old market code (`paymob-swiss-arabian-uae-test`) to the brand names the code looks for (`paymob-swiss-arabian-test`, same for Stripe and Sapil). Other environments must use the same naming: `{provider}-{brand}[-{market}][-test]`.

**UAE end-to-end on the clean database:** product → cart (VAT included) → checkout (Stripe, Paymob, Test Payment, Cash on Delivery, IQ simulated delivery) → order `URD1-MW8Y1HXG-15645B` paid → confirmation email → admin order page. Correct.

### Integrations status (local, checked 9 Nov 2026)

"Credentials" = test credentials present on the testing machine. Same-account check compares values without revealing them.

| Integration | Built | On here | Swiss Arabian creds | Sapil creds | Same account for both brands? |
| --- | --- | --- | --- | --- | --- |
| Paymob (card) | Yes | Yes | Test | Test | **Yes — identical pack; Sapil would collect into Swiss Arabian's Paymob** |
| Stripe (card) | Yes | Yes | Test | **None — Sapil pack is an empty placeholder** | — |
| Cash on Delivery | Yes | Yes | not needed | not needed | — (no account, nothing to share) |
| Test Payment (dev) | Yes | Yes | not needed | not needed | — (no account; error if run in production) |
| Telr | Yes | No | none | none | — |
| Tabby | Yes | No | none | none | — |
| Tamara | **No** | — | none | none | — ("Coming soon" text only) |
| Amwal | **No** | — | none | none | — (admin placeholder data only) |
| Insider | Yes | Yes | Test (`swissarabianuatnew`) | Test | **Yes — identical; Sapil events go to Swiss Arabian's Insider** |
| IQ Fulfillment | Yes | Simulated | one pack `SHARED_SAPG_UAE` | same | Yes — named as shared; confirm with client. Needs `IQ_FULFILLMENT_SHARED_PACK=SHARED_SAPG_UAE` (was missing: real IQ calls would have failed) |
| Test delivery (dev only) | Yes | Yes | no account | no account | — (nothing to share; error if run in production) |
| Brevo | **No** | — | — | — | Not in the code at all |
| Aramex, DHL | **No** | — | none | none | — (README only) |
| D365 | Yes | Yes | UAT app | same | Yes — one app for the group; brands/markets separated by D365 company |
| Trendyol | Yes | Simulated | one token | same | Yes — confirm whether Sapil sells separately |
| Google Merchant | Yes | **Submission on** | one account | same | Yes — usually one per brand; turn submission off locally until ready |
| Shopify (migration) | Yes | Not linked | app keys | same app | Yes for the app; each market links its own store |
| Email (SMTP) | Yes | Yes | Mailpit locally | same | Production needs per-brand sender addresses |
| Google sign-in | Yes | Yes | yes | same | Yes — one login app |
| Azure image storage | Yes | Yes | yes | same | Yes (normal) |
| ZeptoMail (email) | Yes | Yes (Mailpit locally) | — | — | Platform-wide; per-brand senders not configured |
| SMS / WhatsApp sending | Stub only | Off | — | — | No real gateway: customers get no texts |
| Karix, Unifonic, Twilio | **No** | — | — | — | Candidate SMS/WhatsApp gateways; client to choose |
| Apple sign-in | Yes | Yes | none | — | Platform-wide; client IDs missing locally |
| Microsoft Entra (staff sign-in) | Yes | Yes | none | — | Platform-wide; not configured locally |
| Google Maps (storefront) | Yes | storefront setting | — | — | Address autocomplete + stores map |
| Insider website tag (storefront) | Yes | storefront setting | — | — | |
| Redis | Yes | Yes | local | — | |
| ClickHouse (analytics) | Yes | Off | local | — | |

This status is now live in the admin: **Settings → Integrations** (phase 1 of `docs/integrations/INTEGRATIONS_ACCOUNTS_PLAN.md`; also in the main menu under Integrations → All integrations), plus an account line on each market's Payments and Shipping cards. Each market's Payments page also lists Tabby / Telr (switched off) and Tamara / Amwal (not built) with the reason.

All rows of the client access tracker (ACC-001 … ACC-031) are listed on Settings → Integrations with their tracker ID; the full mapping is in `docs/integrations/INTEGRATIONS_ACCOUNTS_PLAN.md` (backend repo).

**Ask the client for:** Sapil's own Paymob and Insider accounts, and Sapil Stripe test keys (most urgent); Telr/Tabby test accounts per brand if wanted; whether Tamara, Amwal, Aramex, DHL and SMS are in scope (none is built); confirmation that IQ, Trendyol and Google Merchant are meant to be shared.

**More UI notes (not fixed yet):** product pages show "Pay in 4 with Tamara / Tabby" although neither is set up; checkout labels Tabby/Tamara as "Paymob · …"; cart/checkout show a fixed "30-day guarantee · Ships from Sharjah"; checkout City/Emirate/Postal fields have no linked labels (screen readers); order confirmation and admin say "Tax" where the cart says "Includes VAT"; admin shows postcode "00000" when none was given; "D365 customer unresolved" reads like an error before the order is exported; admin shows "Smoke Payment · Test Pay"; shipping cards show developer text ("Runtime adapter registered…"); no product images (D365 has none — they came from Shopify).

**D365 data notes (URD1):** 11 of 310 loaded items have no ECOM price; 7 have neither price nor stock; 114 have no stock in E-COMMAIN.

**Dead code to remove later:** `features/payments` add-provider / edit-provider screens and their mock data (also used by the design-system demo page).

**Swiss Arabian Qatar and KSA (created 9 Nov 2026, through the admin):**

| Market | D365 company | Site / warehouse | Price / tax / customer group | VAT | Products | Buyable | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Qatar (QTR) | QTR1 | E-6STQTR1 | ECOM / OOS-L / E-COMMERCE | 0% included | 186 | **0** | E-6STQTR1 has **no stock in D365 UAT** (stock is in QR6STREET1, QRCNFAT1, QRKLH1). 42 items without price and stock; 7 without brand. Client: stock E-6STQTR1 or confirm the warehouse |
| KSA (KSA) | KSA1 | SR6STREET1 | ECOM / SR-CUST / E-COMMERCE | 15% included | 224 | 47 | 175 out of stock in SR6STREET1; 2 without price; 27 without brand. ECOM chosen (1,572 KSA prices) over SR RETAIL (876) |

Payments: Qatar has Test Payment, Cash on Delivery, Paymob and Stripe on; KSA has Test Payment, Cash on Delivery and Stripe (Paymob left off). **Paymob's only account is the UAE one (AED)**, so a real QAR / SAR payment through it would likely fail — the client needs Qatar / KSA Paymob accounts, or Paymob stays off there. Delivery: test delivery on both (IQ's account is the UAE warehouse).

**Admin UI fix:** dropdown scrollbars are now slim (no arrows) and long options wrap instead of scrolling sideways — set once in the MUI theme (`dropdownScrollSx` in `src/theme/muiTheme.ts`), so every select, menu, popover and autocomplete gets it.

**Sapil UAE, KSA and Oman (created 9 Nov 2026):** Sapil brand activated, then:

| Market | D365 company | Site / warehouse | Price / tax / customer group | VAT | Products | Buyable |
| --- | --- | --- | --- | --- | --- | --- |
| Sapil UAE (SAPIL_URD1) | URD1 | E-SAPIL | ECOM / SR-SHJ / E-COMMERCE | 5% included | 1 | 0 |
| Sapil KSA (SAPIL_KSA) | KSA1 | SRESAPIL1 | ECOM / SR-CUST / E-COMMERCE | 15% included | 0 | 0 |
| Sapil Oman (SAPIL_OAS1) | OAS1 | OMECOMM (E-COMMERCE OMAN NEW) | OM RETAIL / SR-CUST / E-COMMERCE | 5% included | 0 | 0 |

**Why Sapil has no products:** in D365 almost no website items carry **Product brand = SAPIL** — URD1 has 1 (with no price and no stock), KSA1 has none; URD1 has 95 and KSA1 27 website items with **no brand at all** (likely the Sapil range). Client action: set the brand on Sapil items in D365 (plus ECOM prices and stock in E-SAPIL / SRESAPIL1), then re-run "Load products" and "Refresh prices & stock" on each Sapil market. SRESAPIL1 also has no stock in UAT.

Payments on all three: Test Payment and Cash on Delivery. Paymob would use Swiss Arabian's account (shared); Stripe has no Sapil credentials. Delivery: test delivery.

**Sapil findings (checked sapil.com + D365, 9 Nov):** sapil.com is Sapil's *international* Shopify store (USD); it does not ship to any Gulf country, so it is not a source for Gulf prices/stock (and we have no API access to it). All 62 products on sapil.com exist in D365, but 61 have **no brand** and 1 is tagged SWISS ARABIAN — that is the whole reason Sapil markets are empty. OAS1 has no Sapil site, no ECOM price group (Sapil items are priced in retailer lists and `OM RETAIL`) and no Sapil stock; OMECOMM lists 0 website items for any brand. Full SKU list for the client: `swiss-arabian-backend-d/docs/client-actions/SAPIL_D365_BRAND_TAGGING.md`.

**Shopify import for Swiss Arabian (9 Nov):** each market linked to its own store from **Market → Shopify** (UAE `6cb457`, Qatar `qatar-swiss`, KSA `ksa-swissarabian`), then **Seed catalog** (products, tags, stock, prices, categories, collections) and **Seed media** (images → `stswissarabiandev` blob). Shopify's live selling price replaces the D365 ECOM price where Shopify has one (by design of the cutover seed).

| Market | Buyable before | Buyable after | Products on market | Collections |
| --- | --- | --- | --- | --- |
| UAE | 185 | 287 | 512 | 315 |
| Qatar | 0 | 215 | 333 | 200 |
| KSA | 47 | 196 | 397 | 206 |

Customers: one 1,000-customer wave per market ran to prove the pipeline (UAE: 995 added, 5 skipped; 154,453 in the UAE store ≈ 155 waves). Local only — no D365 or marketing writes. **Orders (after R13–R15):** one 100-order batch per market, pulled with payment and shipping details, validated, created and enriched. Created: UAE 56, Qatar 73, KSA 52 (181), each with addresses, payments and shipments. The rest of each batch (44 / 27 / 48) waits because the customer is not imported yet; it is created when the batch is promoted again after the customer waves. Proved on a real imported order: D365 readiness and posting both refuse it ("Imported from the previous Shopify store…"). Store sizes reported by Shopify: UAE 36,709 orders, Qatar 6,501. Oman and Kuwait stores exist (`oman-swiss`, `kuwait-swiss`) but have no Swiss Arabian market yet.

**Data notes for the client (D365, URD1):** 406 website-listed items; 95 have no product brand in D365 and 1 belongs to another brand, so they are not loaded into Swiss Arabian. Fill the brand in D365 if they should be sold.

**UI notes (not fixed yet):** the "Load products" card shows "Completed 100%" even when items failed, and says "Queued / In progress" before anything is run; the product/price cards squeeze to one word per line at ~1000 px width; with no markets, the dashboard still shows "Saudi Arabia · SAR".

## Testing-round fixes (8–9 Nov 2026, restored old database)

Found while testing storefront, admin, returns, refunds and simulated shipping on the old data:

- **Order payment status after refunds:** an order now moves PAID → PARTIALLY_REFUNDED → REFUNDED when refunds complete (one shared recompute, called where a refund is recorded). Partly refunded orders still count as paid for cancellation, shipping and D365; fully refunded orders can no longer be returned or exchanged. Storefront no longer shows "payment processing" or "Pay now" on refunded orders.
- **Return refunds:** "Check refund status" now sends a return refund that was recorded but never sent; with `REFUND_EXECUTION_ENABLED` and `REFUND_EXECUTION_RETURN_AUTO_EXECUTE` on, "Request refund" sends it straight away. Test Payment supports simulated refunds.
- **Customer emails:** order, return and exchange emails go to the address on the order first (a linked account is only a fallback), so a guest order linked to another account by phone no longer emails that account. Missing email templates are seeded by `npm run seed:notification-templates`.
- **Simulated shipping:** with `IQ_FULFILLMENT_STATUS_SIMULATION_ENABLED=true` dispatch is simulated too (tracking `IQ-SIM-…`); no real IQ calls.
- **Smaller fixes:** instant Test Payment records the paid amount; return details show the return tracking number and "In transit" step; replacement order lines keep the product name; expired promotions show as expired; markets list shows order counts; dropdowns inside dialogs open above the dialog; storefront shows the payment method's display name and accessible checkout radio labels.
- **Open decision:** guest orders are linked to an existing account when only the phone number matches (address and history become visible in that account). Options: link only when phone and email both match, or use the phone match only for D365.

## What owners should do

- **Everyone:** pull the branch, run your area's tests, and flag anything that looks wrong. Read the new rules above.
- **Markets / checkout / D365:** set each market's VAT policy on the new Tax page in every environment after deploying.
- **DevOps / Azure:** run `prisma migrate deploy` on dev (the reconcile migration refuses to run if it would lose data — check its message if it stops), then re-run the RBAC seed.
- **Repo admins:** enable branch protection on `main` (require PR + these checks).
- **Storefront:** new tests must mock network calls; new images should use `MediaImage`.
- **Backend:** run `npm run typecheck` before pushing; specs are now checked.

## Still open

- ClickHouse and database integration tests were updated to compile but were not run (they need those services).
- A React warning about a script tag on storefront pages, most likely from the analytics (Insider) script.
- Clean rebuild: Swiss Arabian UAE, Qatar, KSA and Sapil UAE, KSA, Oman created. Sapil products wait for D365 brand data (see `docs/client-actions/SAPIL_D365_BRAND_TAGGING.md` in the backend repo).
- Full Shopify customer and order import not run yet — proven on 3–4 customer batches and 2 order batches per market. Readiness report, runbook and client decisions: `swiss-arabian-backend-d/docs/migration/SHOPIFY_MIGRATION_READINESS.md`.
- Admin order page for an imported order still shows "D365 customer unresolved" and the "Test simulation" card; both are irrelevant for history.
- UI: on Sapil Oman's setup checklist, "Shopify store (optional)" says "A Shopify store is linked" when none is; the header market chip can show another market (SAPIL_URD1) while you are on Sapil Oman; the create wizard suggests a doubled channel code (`platform_sapil_sapiloas1`).

## Related documents

| Document | What it is | Where |
| --- | --- | --- |
| This handover | What was fixed and why, by area | `docs/PLATFORM_FIXES_HANDOVER_2026-11.md` in each repo (same file) |
| Platform Production Readiness Plan | The overall rebuild plan, decisions log and findings log | https://claude.ai/artifact/QYxofBqEu35LdakLNLP3k7 |
| End-to-end QA report | Results of the order lifecycle test run (order, payment, D365, returns, refunds, exchanges) | https://claude.ai/artifact/3pCeyGXCeoMPfieZpck6rV |
| Integrations and accounts plan | How the admin will show which account each brand uses, sharing, test/live, phases | Backend repo: `docs/integrations/INTEGRATIONS_ACCOUNTS_PLAN.md` |
| Schema change rules | How to change the database safely (migrations only, drift check) | Backend repo: `prisma/README.md` |
| Storefront CI | The new lint / typecheck / test / build checks | Storefront repo: `.github/workflows/storefront-ci.yml` |
| Backend CI | Migration, drift and typecheck steps | Backend repo: `.github/workflows/backend-ci.yml` |

The plan and QA report links open only for people they have been shared with. Ask Zeeshan for access if a link does not open.

## How to run the checks locally

- Backend: `npm run typecheck`, `npm test`, `npm run prisma:drift`
- Storefront: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`
- Admin panel: `npx tsc --noEmit`, `npm test`
