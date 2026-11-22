# Brand configuration

One website codebase, deployed once per brand. Each deployment is fixed to one
brand by `NEXT_PUBLIC_STOREFRONT_BRAND_CODE`; everything that differs per brand
lives in one typed config file here.

```
src/lib/brand/
  types.ts          BrandConfig schema (zod) + per-brand env keys
  defineBrand.ts    validates a brand file when it loads
  brands/
    swiss-arabian.ts
    sapil.ts
  registry.ts       BRANDS keyed by code, resolveBrand(), brandOwningHost()
  publicEnv.ts      reads + validates the per-deployment NEXT_PUBLIC_* settings
  index.ts          getBrand() / getBrandConfig() / localized()
  validate.ts       rules behind `npm run check:brand`
scripts/check-brand-config.mjs   the CLI
```

## Using it

```ts
import { getBrand, localized } from "@/lib/brand";

const brand = getBrand(host);          // host optional: server passes the request host
brand.code;                            // "SWISS_ARABIAN" | "SAPIL" | …
localized(brand.name, locale);         // "Swiss Arabian" / "سويس أرابيان"
brand.logo.src;
brand.integrations.catalogMediaBaseUrl;

brandIntegrations().seoIndexingEnabled; // deployment settings only (parsed once per brand)
brandDisplayName(locale);              // "Swiss Arabian" / "سابيل" …
```

**Analytics (GTM / GA4), Insider's website tag, Tabby / Tamara promos and
Google Maps are not brand or build settings** (ADR-005 phase E, 2026-11-15).
They come from the backend per website address and market — the integrations
switchboard in the admin (Settings → Integrations) — through
`src/lib/site/siteIntegrations.ts` (server, cached per address) and
`useSiteIntegrations()` (client). See `docs/multibrand/SITE_INTEGRATIONS.md`.

| Integration | Read in |
| --- | --- |
| GTM / GA4 | `components/layout/AnalyticsScripts.tsx` (ids from the root layout) |
| Insider | `app/[site]/[locale]/layout.tsx` (head tag), `components/layout/InsiderScripts.tsx`, `lib/insider.ts` (`window.__SA_INSIDER_ON__`, set only when the tag rendered) |
| Tabby / Tamara promos | `features/catalog/utils/instalments.ts`, `hooks/useInstalmentPlan.ts`, `features/cart/components/CartTabbyPromo.tsx` |
| Google Maps | `lib/google/GooglePlacesProvider.tsx` |
| Catalog media base | `features/catalog/utils/resolveCatalogImageUrl.ts` (`next.config` image patterns still read the env var at build time) |
| Storefront host, brand code | `lib/storefront/brand.ts`, `lib/api/storefrontHost.ts` (via `readProcessPublicEnv`; `@/lib/brand` imports them) |
| SEO indexing | `app/[site]/[locale]/layout.tsx`, `lib/seo/siteRobots.ts` (`app/[site]/robots.txt`) |
| Site name, icons, default description | `app/[site]/[locale]/layout.tsx`, `lib/seo/brandIdentity.ts` (fallback when the API has no identity) |
| `{brand}` in page meta descriptions | `lib/i18n/routeLocale.ts` (`routeTranslator()` fills it) |

Which brand: `NEXT_PUBLIC_STOREFRONT_BRAND_CODE` → else the brand whose
`hosts` list the shop host → else Swiss Arabian. Locally
(`NEXT_PUBLIC_APP_ENV=local`) a `*.localhost` alias wins: `sp.localhost:3004`
is Sapil (see `src/lib/storefront/localStorefront.ts`).

`getBrandConfig()` returns only the static config (cheap; no env parsing).
`isSapilStorefront()` and `storefrontLogo()` in `src/lib/storefront/brand.ts`
use the same resolution. Do not test `host.includes("sapil")` anywhere —
compare `getBrandConfig(host).code` or, better, read the field you need.

## Adding a brand

1. Copy `brands/sapil.ts` to `brands/<brand>.ts`, set `code` (UPPER_SNAKE_CASE,
   e.g. `ACME_PERFUMES`) and fill every field. Names / alt / SEO text are
   `Record<locale, string>` and need at least `en`; add `ar`, `fr` … as the site
   gains languages. Mark unknown values `TODO(brand)`.
2. Put the logo / icons under `public/assets/` and reference them by path.
3. `hosts`: production shop domains (one per market), staging/preview hosts,
   local-only hosts (e.g. `acme.test`). Hostnames only; a host may belong to
   one brand only (a test enforces this).
4. `themeKey`: reuse `swiss-arabian` / `sapil` or add a key to `THEME_KEYS` in
   `types.ts` (plus its design tokens).
5. `requiredInProduction`: settings that must be set for a production build.
6. Register it in `registry.ts` (`BRANDS`).
7. Optional local alias: `NEXT_PUBLIC_LOCAL_STOREFRONTS=sp=SAPIL@sapil.test,ac=ACME_PERFUMES@acme.test`.
8. Deployment env: `NEXT_PUBLIC_STOREFRONT_BRAND_CODE=<CODE>`,
   `NEXT_PUBLIC_STOREFRONT_HOST=<shop host>`, `SITE_REVALIDATE_SECRET` (server
   only, shared with the backend).
9. Analytics, Insider, Tabby and Maps: integration accounts and assignments in
   the admin (Settings → Integrations), per market — nothing in the build.
   Ownership is enforced there: an account belongs to one brand.
10. `npm run check:brand` with that env, then `npx vitest run src/lib/brand`.

## Per-brand settings (`BRAND_ENV_KEYS` in `types.ts`)

| Setting | Group in `brand.integrations` |
| --- | --- |
| `NEXT_PUBLIC_STOREFRONT_BRAND_CODE` | (selects the brand) |
| `NEXT_PUBLIC_STOREFRONT_HOST` | `storefrontHost` |
| `NEXT_PUBLIC_STAGING_RETURN_URL`, `NEXT_PUBLIC_PRODUCTION_RETURN_URL` | `returnUrls` |
| `NEXT_PUBLIC_CATALOG_MEDIA_BASE_URL` | `catalogMediaBaseUrl` |
| `NEXT_PUBLIC_SEO_INDEXING_ENABLED` | `seoIndexingEnabled` (production only) |

Shared / technical settings (API base URLs, `NEXT_PUBLIC_APP_ENV`, MFA, OAuth,
password reset, verification UI, dev session, master OTP, CMS home switches,
local return URLs, `NEXT_PUBLIC_LOCAL_STOREFRONTS`) stay in
`src/lib/config/env.ts`. Stripe has no front-end switch: its publishable key
comes from the backend per market.

Malformed values are dropped at runtime. Removed in phase E (`REMOVED_ENV_KEYS`):
`NEXT_PUBLIC_GTM_ID`, `_GA4_ID`, `_INSIDER_ENABLED`, `_INSIDER_ACCOUNT_ID`,
`_INSIDER_SCRIPT_HOST`, `_TABBY_PUBLIC_KEY`, `_TABBY_MERCHANT_CODE`,
`_ENABLE_TABBY`, `_ENABLE_TAMARA`, `_ENABLE_PAYMOB`, `_GOOGLE_MAPS_API_KEY`,
`_GOOGLE_MAPS_MAP_ID` — and with them the brand files' `ownedIds` and
`integrationDefaults` (the hard-coded UAT Insider account). The Paymob switch
only put Paymob first at checkout; the market's default method and order in
the admin decide that now.

Removed with the settings fallbacks (`feat/env-fallback-removal`): `NEXT_PUBLIC_SHOP_LOCALES`,
`_DEFAULT_LOCALE` (each market's languages come from Markets → languages; when the backend
cannot say, every language the website has, English first), `_ASSISTANT_ENABLED`,
`_ONSITE_ENABLED`, `_TRACKING_ENABLED` (per brand + market in the admin). A build that still
sets one fails `npm run check:brand`: drop them from every build config before deploying.

## Build-time check: `npm run check:brand`

Loads env the same way `next build` does (`process.env`, then
`.env.production.local`, `.env.local`, `.env.production`, `.env`), picks the
brand and exits 1 on any error:

- `NEXT_PUBLIC_STOREFRONT_BRAND_CODE` unknown (any env) or unset (production).
  Unset outside production is a warning and checks as Swiss Arabian.
- A value is malformed (hostname with a scheme, return URL not http(s),
  booleans other than `true` / `false`).
- Production: a setting in the brand's `requiredInProduction` is empty.
- Any env: a setting that moved to the integrations switchboard or the admin
  (`REMOVED_ENV_KEYS`) is still set (it would do nothing; the value is never printed).
- Any env: storefront host or return URL host listed under another brand.
- Production: brand has no `hosts.production`; storefront host or production
  return URL host not in the brand's production hosts. Staging: storefront
  host must be a production or staging host. Dev / local: mismatch is a warning.

Example (Sapil production build with leftovers):

```
Brand config check: SAPIL / NEXT_PUBLIC_APP_ENV=production
  ✖ NEXT_PUBLIC_INSIDER_ACCOUNT_ID is no longer read: analytics, Insider's website tag, Tabby / Tamara promos and Google Maps are set per market in the admin (Settings → Integrations). Remove it from this deployment.
  ✖ NEXT_PUBLIC_STOREFRONT_HOST="uae.swissarabian.com" is a Swiss Arabian (SWISS_ARABIAN) host, not Sapil (SAPIL).
  ✖ Sapil (SAPIL) has no production hosts in src/lib/brand/brands/*.ts …
```

### CI

Wired in (2026-11-13), right before `next build` with the same env as the build:

- `.github/workflows/storefront-ci.yml`, job `build`: `npm run check:brand`
  then `npm run build` (env sets `NEXT_PUBLIC_STOREFRONT_BRAND_CODE=SWISS_ARABIAN`).
- `Dockerfile`, builder stage: `RUN npm run check:brand && npm run build` after
  the `ENV` lines, so it sees the build args. The image takes
  `NEXT_PUBLIC_STOREFRONT_BRAND_CODE` (default `SWISS_ARABIAN`) and
  `NEXT_PUBLIC_STOREFRONT_HOST` as build args. Today's dev deployment
  (`NEXT_PUBLIC_APP_ENV=dev`, Swiss Arabian values) passes.

The `build` script itself is unchanged on purpose: making
`next build` fail for every existing deployment (e.g. a Sapil preview built
with `NEXT_PUBLIC_APP_ENV=production` before Sapil has production hosts) should
be a deliberate switch, one pipeline at a time.
