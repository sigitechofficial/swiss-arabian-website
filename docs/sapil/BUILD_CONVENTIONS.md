# Building Sapil pages: conventions

Read with:
- [`SAPIL_PAGES_PLAN.md`](./SAPIL_PAGES_PLAN.md): what each page contains and where its data comes from.
- [`src/brands/README.md`](../../src/brands/README.md): the brand UI contract.
- [`src/brands/sapil/README.md`](../../src/brands/sapil/README.md): design tokens and components.

**Design:** v9 in `Downloads/sapil/repo/sapil-Ahsan/`. Pages with a v9 design are pixel-exact. Every other page uses only the v9 design system.

## Where code goes

| What | Where |
|---|---|
| Sapil page components (one per route view) | `src/brands/sapil/pages/<area>/` (e.g. `pages/catalog/SapilProductPage.tsx`) |
| Sections and parts used by those pages | `src/brands/sapil/components/<area>/` |
| Design system (tokens, fonts, `ui/`) | `src/brands/sapil/theme.css`, `fonts.ts`, `ui/`. Fix bugs there, and say so in your report. Don't restyle it per page |
| Replacing a route's view for Sapil | `src/brands/sapil/brand-ui.ts`: `export { SapilX as XPageView } from "./pages/…";` (same name as in `swiss-arabian/brand-ui.ts`). Keep your lines inside your area's comment block |
| Sapil-only wording | `src/brands/sapil/i18n/messages/en/<area>.json` (+ `ar/<area>.json`), registered in `i18n/catalog.ts`. Read it with `useSapilCopy()` (client) or `sapilTranslator()` (server), keys `"<area>.<key>"` |
| Wording shared with Swiss Arabian | the existing `useShopCopy()` / `src/messages/*.json` keys. Don't duplicate them |

**The shell** (`StorefrontShell` override) renders:
- `<SapilRoot>` (`data-brand="sapil"` + fonts) and `import "@/brands/sapil/theme.css"`
- `SapilCopyProvider` with `loadSapilMessages(locale)`
- header, chip row, phone menu, search, bag drawer, footer

Pages render inside it and don't wrap themselves again.

## Logic stays shared

- Sapil components **never call the API** (`features/*/api`, `apiGet`, …). They use the shared hooks, stores and providers.
- **When a Swiss Arabian component has logic inline** (form submit, redirects, cart mutations, error handling):
  1. Move that logic into a hook in the feature (`src/features/<feature>/hooks/use<Thing>.ts`), with tests.
  2. Make the Swiss Arabian component use the hook **with no visible change**.
  3. Then use it from Sapil.
- Every business rule in the v9 JavaScript is **mock**: prices, was-prices, savings, promo codes, delivery fees and ETAs, cash-on-delivery fee, VAT, free-delivery threshold, orders in localStorage. Use the API's values.
- Product tint: the API's `tileColor` once the backend ships it (branch `feat/sapil-cms`), otherwise `tintValue()` from `ui/shared` with a neutral default.

## Quality bar for every page

- **Exactness:** for v9 pages, compare against the v9 HTML at 390 / 768 / 1280 / 1440 px with `scripts/sapil-visual-diff.mjs` (extend it for your page; see its header). Static parts should match within ~1%. For data-driven parts, compare structure and spacing side by side and note any intended differences in your area doc.
- **Languages:**
  - Every string comes from messages.
  - Right-to-left: use logical classes (`ms-/me-/ps-/pe-/start-/end-`, `rtl:` where needed).
  - Check `/ar/…` renders right-to-left without broken layout.
- **States:**
  - loading (skeletons on the pastel tile)
  - empty
  - error (`"We couldn't load … / Try again"`)
  - out of stock
  - signed-in vs guest
- **Accessibility:** at least as good as v9's markup (labels, roles, keyboard, focus, reduced motion).
- **Performance:**
  - server-render what can be server-rendered
  - images via `MediaImage` / `next/image` with `sizes`
  - only the first visible image eager / high priority
  - videos only start once scrolled into view or tapped
  - no polling, no render loops
- **Isolation:** no Swiss Arabian text, logos or IDs on Sapil pages. Swiss Arabian must look exactly as before.

## Checks before every commit

```bash
npx tsc --noEmit
npx eslint --max-warnings=0 <changed paths>
npx vitest run
BRAND_UI_THEME=sapil npx vitest run   # tests against Sapil's UI
TURBOPACK_ROOT=<main checkout> npm run build
TURBOPACK_ROOT=<main checkout> NEXT_PUBLIC_STOREFRONT_BRAND_CODE=SAPIL NEXT_PUBLIC_STOREFRONT_HOST=sapil.test npm run build
```

Running Sapil locally:
- **Command:** `NEXT_PUBLIC_STOREFRONT_BRAND_CODE=SAPIL NEXT_PUBLIC_STOREFRONT_HOST=sapil.test npx next dev -p <your port>` (with `TURBOPACK_ROOT` in a worktree).
- **Backend:** the local API is http://127.0.0.1:3002. Don't restart it. Its local DB has a Sapil UAE market (`sapil.test`).

## Docs

Each area keeps `docs/sapil/pages/<area>.md` up to date:
- routes and components
- data sources (endpoints, hooks)
- hooks extracted
- the visual-diff results
- known differences from v9
- open questions
