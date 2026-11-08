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
- The database wipe and clean rebuild of both brands, then turning on Redis.

## Related documents

| Document | What it is | Where |
| --- | --- | --- |
| This handover | What was fixed and why, by area | `docs/PLATFORM_FIXES_HANDOVER_2026-11.md` in each repo (same file) |
| Platform Production Readiness Plan | The overall rebuild plan, decisions log and findings log | https://claude.ai/artifact/QYxofBqEu35LdakLNLP3k7 |
| End-to-end QA report | Results of the order lifecycle test run (order, payment, D365, returns, refunds, exchanges) | https://claude.ai/artifact/3pCeyGXCeoMPfieZpck6rV |
| Schema change rules | How to change the database safely (migrations only, drift check) | Backend repo: `prisma/README.md` |
| Storefront CI | The new lint / typecheck / test / build checks | Storefront repo: `.github/workflows/storefront-ci.yml` |
| Backend CI | Migration, drift and typecheck steps | Backend repo: `.github/workflows/backend-ci.yml` |

The plan and QA report links open only for people they have been shared with. Ask Zeeshan for access if a link does not open.

## How to run the checks locally

- Backend: `npm run typecheck`, `npm test`, `npm run prisma:drift`
- Storefront: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`
- Admin panel: `npx tsc --noEmit`, `npm test`
