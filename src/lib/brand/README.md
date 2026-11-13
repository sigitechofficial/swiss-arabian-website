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
  publicEnv.ts      reads + validates the per-brand NEXT_PUBLIC_* ids
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
brand.integrations.analytics.gtmId;    // instead of process.env.NEXT_PUBLIC_GTM_ID
brand.integrations.payments.tabby;

brandIntegrations().insider;           // just the integration ids (parsed once per brand)
brandDisplayName(locale);              // "Swiss Arabian" / "سابيل" …
```

Callers (all moved off `env.ts` / `process.env`, 2026-11-13 review):

| Integration | Read in |
| --- | --- |
| GTM / GA4 | `components/layout/AnalyticsScripts.tsx` |
| Insider | `app/[locale]/layout.tsx` (head tag), `components/layout/InsiderScripts.tsx`, `lib/insider.ts` |
| Tabby keys, Tabby / Tamara / Paymob switches | `features/catalog/utils/instalments.ts`, `features/cart/components/CartTabbyPromo.tsx`, `features/checkout/utils/paymentMethod.ts` |
| Google Maps | `lib/google/GooglePlacesProvider.tsx` |
| Catalog media base | `features/catalog/utils/resolveCatalogImageUrl.ts` (`next.config` image patterns still read the env var at build time) |
| Storefront host, brand code | `lib/storefront/brand.ts`, `lib/api/storefrontHost.ts` (via `readProcessPublicEnv`; `@/lib/brand` imports them) |
| SEO indexing | `app/[locale]/layout.tsx`, `app/robots.ts` |
| Site name, icons, default description | `app/[locale]/layout.tsx`, `lib/seo/brandIdentity.ts` (fallback when the API has no identity) |
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
5. `ownedIds`: the brand's own public GTM / GA4 / Insider / Tabby / Maps map ids.
   No API keys. These are what stops another brand from shipping them.
6. `requiredInProduction`: settings that must be set for a production build.
7. Register it in `registry.ts` (`BRANDS`).
8. Optional local alias: `NEXT_PUBLIC_LOCAL_STOREFRONTS=sp=SAPIL@sapil.test,ac=ACME_PERFUMES@acme.test`.
9. Deployment env: `NEXT_PUBLIC_STOREFRONT_BRAND_CODE=<CODE>`,
   `NEXT_PUBLIC_STOREFRONT_HOST=<shop host>` and the brand's ids (below).
10. `npm run check:brand` with that env, then `npx vitest run src/lib/brand`.

## Per-brand settings (`BRAND_ENV_KEYS` in `types.ts`)

| Setting | Group in `brand.integrations` |
| --- | --- |
| `NEXT_PUBLIC_STOREFRONT_BRAND_CODE` | (selects the brand) |
| `NEXT_PUBLIC_STOREFRONT_HOST` | `storefrontHost` |
| `NEXT_PUBLIC_STAGING_RETURN_URL`, `NEXT_PUBLIC_PRODUCTION_RETURN_URL` | `returnUrls` |
| `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_GA4_ID` | `analytics` |
| `NEXT_PUBLIC_INSIDER_ENABLED`, `_ACCOUNT_ID`, `_SCRIPT_HOST` | `insider` |
| `NEXT_PUBLIC_TABBY_PUBLIC_KEY`, `NEXT_PUBLIC_TABBY_MERCHANT_CODE` | `tabby` |
| `NEXT_PUBLIC_ENABLE_PAYMOB`, `_TABBY`, `_TAMARA` | `payments` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | `googleMaps` |
| `NEXT_PUBLIC_CATALOG_MEDIA_BASE_URL` | `catalogMediaBaseUrl` |
| `NEXT_PUBLIC_SEO_INDEXING_ENABLED` | `seoIndexingEnabled` (production only) |

Shared / technical settings (API base URLs, `NEXT_PUBLIC_APP_ENV`, MFA, OAuth,
password reset, verification UI, dev session, master OTP, CMS home switches,
local return URLs, `NEXT_PUBLIC_LOCAL_STOREFRONTS`) stay in
`src/lib/config/env.ts`. Stripe has no front-end switch: its publishable key
comes from the backend per market.

Malformed values are dropped at runtime (no broken or foreign tag loads).
Insider: an empty account id uses the brand's `integrationDefaults` (Swiss
Arabian's UAT account) or, for brands without one, leaves Insider off.
`src/lib/config/env.ts` no longer holds any per-brand setting (and no Insider
default). One difference from the old `env.ts`: an Insider account set to an
empty string now also falls back to the brand default (before, only an unset
one did); deployments always pass a value (Dockerfile / Key Vault defaults).

## Build-time check: `npm run check:brand`

Loads env the same way `next build` does (`process.env`, then
`.env.production.local`, `.env.local`, `.env.production`, `.env`), picks the
brand and exits 1 on any error:

- `NEXT_PUBLIC_STOREFRONT_BRAND_CODE` unknown (any env) or unset (production).
  Unset outside production is a warning and checks as Swiss Arabian.
- A value is malformed (GTM / GA4 / Insider id format, hostname with a scheme,
  return URL not http(s), booleans other than `true` / `false`).
- Production: a setting in the brand's `requiredInProduction` is empty; Tabby
  switched on without its public key + merchant code (warning on staging).
- Any env: a GTM / GA4 / Insider / Tabby / Maps map id that is in another
  brand's `ownedIds`, or an empty Insider account while Insider is on when the
  brand's own `integrationDefaults` point at another brand's account.
- Any env: storefront host or return URL host listed under another brand.
- Production: brand has no `hosts.production`; storefront host or production
  return URL host not in the brand's production hosts. Staging: storefront
  host must be a production or staging host. Dev / local: mismatch is a warning.

Keys (`*_KEY`) are masked in the output.

Example (Sapil production build with Swiss Arabian leftovers):

```
Brand config check: SAPIL / NEXT_PUBLIC_APP_ENV=production
  ✖ NEXT_PUBLIC_INSIDER_ACCOUNT_ID="10015366" belongs to Swiss Arabian (SWISS_ARABIAN), not Sapil (SAPIL).
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
