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

Each deployment's bundle contains only that brand's UI.

**Client route files** (`error.tsx`, `not-found.tsx`) import from `@brand-ui/client`. That entry may only export client-safe components, never anything that imports `next/headers`.

**Swiss Arabian's `brand-ui.ts`** re-exports the existing components (58 names). It defines the contract.

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

## Building and running a brand locally

```bash
NEXT_PUBLIC_STOREFRONT_BRAND_CODE=SAPIL NEXT_PUBLIC_STOREFRONT_HOST=sapil.test npm run build
```

- **Dev server:** the UI alias is fixed when the server starts. To switch a dev server between Swiss Arabian and Sapil, restart it with the other brand code.
- **Local `*.localhost` aliases** still pick the brand's *data* (`X-Storefront-Host`), but not its UI.
- **In a git worktree:** set `TURBOPACK_ROOT=<main checkout>`, because `node_modules` there is a junction.
