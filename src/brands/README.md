# Brands: one codebase, one UI per brand

The storefront runs several brands (Swiss Arabian, Sapil, more later) from one codebase. Each brand gets its own deployment. Brands share all shop logic (API calls, hooks, stores, i18n, SEO, analytics). The look and the page components are per brand.

| Piece | Where | Per brand? |
|---|---|---|
| Settings: name, hosts, logo, IDs, feature flags | `src/lib/brand/brands/<brand>.ts` (see `src/lib/brand/README.md`) | yes |
| Design system: tokens, fonts, components | `src/brands/<theme>/` (Sapil: `theme.css`, `fonts.ts`, `ui/`) | yes |
| Page components for every route | `src/brands/<theme>/brand-ui.ts` (+ `brand-ui.client.ts`) | yes |
| Routes, data loading, SEO metadata | `src/app/[locale]/**` | shared |
| API calls, hooks, stores | `src/features/*/api`, `src/features/*/hooks`, `src/stores` | shared |

## The brand UI contract (`@brand-ui`)

Routes never import a brand's components directly. They import from `@brand-ui`:

```ts
import { ProductDetailPageView, StorefrontShell } from "@brand-ui";
```

At build time `@brand-ui` points at the active brand's `brand-ui.ts`:
- **The brand** comes from `NEXT_PUBLIC_STOREFRONT_BRAND_CODE`.
- **Its theme** is `themeKey` in the brand config.
- **Next (Turbopack):** `turbopack.resolveAlias` in `next.config.ts`.
- **TypeScript:** `tsconfig.json` `paths` points at Swiss Arabian's file. It is the reference contract.
- **Vitest:** `vitest.config.ts`. Set `BRAND_UI_THEME=sapil` to test another brand.

Each deployment's bundle contains only that brand's UI. What still crosses over (checked in `.next` on 2026-11-13):
- The brand **configs** (`src/lib/brand/brands/*.ts`: names, hosts, logo paths, public ids) of every brand ship to the browser, because the host → brand lookup needs them. No UI code.
- **CSS:** `src/app/globals.css` does not scan `src/brands/sapil` (`@source not`), so Swiss Arabian pages don't carry Sapil utilities. A Sapil build's global stylesheet still contains the utilities of the Swiss Arabian views that live in `src/features/*/components` (shared folders are scanned).
- **Dev routes:** `src/app/[locale]/(dev)/**/page.dev.tsx` (Sapil kit / preview) are routes only in `next dev`, in a Sapil build, or with `SAPIL_KIT=1` at build time (`pageExtensions` in `next.config.ts`). A Swiss Arabian production build has no such route.

**Client route files** (`error.tsx`, `not-found.tsx`) import from `@brand-ui/client`. That entry may only export client-safe components, never anything that imports `next/headers`.

**404s:** an address no route matches is answered by `src/app/global-not-found.tsx` (server-rendered: the brand's `StorefrontShell` + `NotFoundView` from `@brand-ui/client`, in the address's language, status 404). `notFound()` inside a page renders `[locale]/not-found.tsx`; Next.js 16 cannot server-render that boundary under a root layout that lives in `[locale]`, so the status is 404 but the view is drawn after hydration.

**Swiss Arabian's `brand-ui.ts`** re-exports the existing components (60 names). It defines the contract.

Contract names that hold a whole route with shared logic take the brand's pieces instead of importing a view:
- `SitePageRoute` (`/pages/[handle]`, `/policies/[handle]`): each brand binds `SitePageRouteBase` (`features/site-pages/sitePageRouteBase.tsx`: loading, redirect, metadata, breadcrumbs) to its own `SitePageView` and admin preview notice.
- `CmsPreviewHomeView` (`/preview/home`): shared `loadCmsPreviewHome()`, the brand draws the Draft with its own home sections.
- `OfferPageView` (`/offers/[code]`, was `OfferShop`) and `ReviewRequestPageView` (`/review/[token]`): shared `useOfferShop`, `useReviewRequest` / `useReviewRequestCard`.
- `OurStoryFallbackView`: `/our-story` before the market publishes a story page (a brand never shows another brand's history).
- `PageLoading`: also passed to the account `AuthGuard` by the layout, so the sign-in check draws the brand's loading state.
- Shared hosts that open a dialog take the brand's dialog (e.g. `GiftChoiceHost Modal={…}`).

`src/brands/sapil/brandCoverage.test.ts` fails if Sapil re-exports a visible Swiss Arabian view other than those of sections it has switched off.

## Feature switches (brand `features`)

A brand switches whole sections of the site off in its config (`features` in `src/lib/brand/brands/<brand>.ts`). `src/lib/brand/features.ts` maps each switch to its routes:

| Switch | Routes |
|---|---|
| `storeLocator` | `/stores` |
| `blog` | `/blog`, `/blog/[slug]` |
| `loyalty` | `/account/rewards`, `/account/membership` |
| `subscriptions` | `/subscriptions/**`, `/account/subscription/**` |
| `giftBox` | `/gift-box` |
| `employeeBenefits` | `/account/employee-benefits` |

When a switch is off:
- **The route answers "not found":** the page (and its `generateMetadata` when that fetches) starts with `requireBrandFeature("<switch>")`. This runs on the server before any view renders, so a brand does not need its own view for a section it has switched off (the contract still needs the name; re-export the reference view and list it in the brand's coverage test).
- **Nothing links to it:** `brandLinkEnabled(href)` filters the CMS header / footer menus (`useNavigation`), account tabs and dashboard tiles, the mobile menu, the `/pages/… → /stores` redirect and the sitemap. Use it for any new link into a switchable section; a brand's own static navigation should simply leave those links out.
- Switches follow the deployment's brand code (`NEXT_PUBLIC_STOREFRONT_BRAND_CODE`, the same brand as the UI), so server and browser agree.

**Adding a switch:** add it to the `features` schema in `src/lib/brand/types.ts` and to every brand config, list its routes in `FEATURE_ROUTES`, call `requireBrandFeature` in each of its pages, and extend `src/lib/brand/features.spec.ts` (the "gated routes" list). `/gift-cards` has no switch: it answers "not found" for every brand until the feature is built.

**Every other brand:**
- Starts with `export * from "../swiss-arabian/brand-ui"`, so a new brand works immediately.
- Then exports its own component under the same name for each page it redesigns. An explicit export always wins over `export *`.
- `src/brands/contract.check.ts` fails typecheck if a brand is missing a name or a component's props don't fit.

## Adding a brand

1. **Settings:** add `src/lib/brand/brands/<brand>.ts` and register it in `src/lib/brand/registry.ts`, with a new `themeKey`, or an existing one to reuse a design system.
2. **New design system:**
   1. Add `src/brands/<theme>/` with `theme.css` (tokens scoped to `[data-brand="<theme>"]`, prefixed Tailwind names), `fonts.ts` and `ui/`.
   2. Add `brand-ui.ts` and `brand-ui.client.ts` starting with `export * from "../swiss-arabian/…"`.
   3. Add a line to `contract.check.ts`.
   4. Add the theme key to `THEME_KEYS` in `src/lib/brand/types.ts`.
3. **Deployment env:**
   - `NEXT_PUBLIC_STOREFRONT_BRAND_CODE`
   - `NEXT_PUBLIC_STOREFRONT_HOST`
   - the brand's integration IDs
   - `NEXT_PUBLIC_SHOP_LOCALES`

   Run `npm run check:brand` before `npm run build`.
4. **Pages:** replace pages one by one in the brand's `brand-ui.ts`. Build them with the brand's design system on top of the shared hooks; never call the API from a brand component.
5. **Sections:** set the brand's `features`. Switched-off sections need no views of their own (see "Feature switches").
6. **Check coverage:** `node scripts/brand-coverage-sweep.mjs --base=<running build> --brand=<theme>` opens every route (en + `/ar`, 1280 + 390 px) and flags pages drawn outside the brand's root, the other brand's text / fonts / assets, 404s, scroll and broken images (see `docs/ui-check/BRAND_COVERAGE.md`).

## Building and running a brand locally

```bash
NEXT_PUBLIC_STOREFRONT_BRAND_CODE=SAPIL NEXT_PUBLIC_STOREFRONT_HOST=sapil.test npm run build
```

- **Dev server:** the UI alias is fixed when the server starts. To switch a dev server between Swiss Arabian and Sapil, restart it with the other brand code.
- **Local `*.localhost` aliases** still pick the brand's *data* (`X-Storefront-Host`), but not its UI.
- **In a git worktree:** set `TURBOPACK_ROOT=<main checkout>`, because `node_modules` there is a junction.
- **Sapil kit against `next start`:** build with `SAPIL_KIT=1` (or as Sapil) so the `page.dev.tsx` routes exist, then start with `SAPIL_KIT=1`.
