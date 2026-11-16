# Sapil design system (v9)

Tailwind v4 tokens, fonts and presentational React components for the Sapil storefront,
built to match the approved **v9** design (`sapil-v9-*.html`, `assets/sapil-v9.css`).
Self-contained so it can move into a monorepo package: nothing here imports from Swiss Arabian code.

```
src/brands/sapil/
  theme.css      Tailwind entry: scoped tokens, @theme inline, breakpoints, keyframes, scoped base
  fonts.ts       next/font/google: Gloock, Fraunces (opsz, roman + italic), Poppins 300–700
  ui/            components (index.ts exports everything except SapilRoot)
  kit/           SapilKit, the visual reference rendered at /sapil-kit (dev only)
scripts/sapil-visual-diff.mjs   v9 HTML vs kit screenshot diff
```

## Using it on a page

```tsx
import "@/brands/sapil/theme.css";               // once per Sapil route/layout
import { SapilRoot } from "@/brands/sapil/ui/SapilRoot";
import { ProductCard, SectionHead, Wrap } from "@/brands/sapil/ui";
import Link from "next/link";

<SapilRoot>                                       {/* data-brand="sapil" + font variables */}
  <Wrap as="section" className="py-[104px] max-900:py-[72px]">
    <SectionHead eyebrow="New arrivals" title="Just landed," accent="still fizzing." />
    <ProductCard LinkComponent={Link} … />
  </Wrap>
</SapilRoot>
```

- Everything must sit inside `<SapilRoot>`; tokens do not exist outside it.
- Components render plain `<a>` by default. Pass `LinkComponent={Link}` (or a locale-aware link) where links matter.
- `ProductCard.image` accepts a URL (plain `<img>`) or an element (e.g. `next/image` with `fill`), so image optimisation stays the page's choice.
- Components are presentational: state comes in via props (`open`, `value`, `pressed`, `added`…), events go out via callbacks. No fetching, no cart logic.
- Use the `max-*` breakpoint variants below (desktop-down like v9), not Tailwind's `sm:`/`md:`.

## How the tokens are scoped (Swiss Arabian unaffected)

`theme.css` is a **separate Tailwind entry**, imported only by Sapil routes. `src/app/globals.css` and `src/theme/` are untouched.

1. Raw tokens are custom properties on `[data-brand="sapil"]` (`--sapil-paper`, `--sapil-accent`, …), so they exist only inside a Sapil subtree; `:root` is never written.
2. `@theme inline` maps them to Tailwind names, all prefixed `sapil-` (`bg-sapil-paper`, `font-sapil-serif`, `shadow-sapil-lg`). `inline` compiles each utility straight to `var(--sapil-…)`, so `@theme` emits nothing on `:root`. The prefix also avoids Swiss Arabian's own `--color-ink`, `--color-sand`, `--color-paper`.
3. `@import "tailwindcss/utilities.css" source(none)` + `@source "./"`: this entry only generates classes used in `src/brands/sapil/`, and the `max-*` variants and `sapil-*` keyframes exist only in this stylesheet.
   The utilities go into their own cascade layer, `sapil-utilities`, declared after `utilities`. The host's global sheet also emits the arbitrary classes used here (it scans the repo); when Next loads it after this sheet (seen in production builds), its unprefixed copies would otherwise override the `max-*` variants (e.g. the checkout grid stayed two columns on phones).
4. Scoped base rules (`[data-brand="sapil"]` body font, h1–h3, focus ring, reduced motion) live in `@layer base`, so utilities always win, exactly as v9's component classes beat its element rules.

Swiss Arabian's navbar uses a bare `data-brand` attribute (logo wrapper) and has a rule `[data-scrolled=true] [data-brand] img`; it never sets the value `sapil`, so the scopes do not overlap, but don't nest a Sapil subtree inside the Swiss Arabian navbar. Side effects to know about: the host `globals.css` Tailwind build scans the whole repo, so arbitrary-value classes in these files (`h-[48px]`) also appear in the global stylesheet (harmless duplicates; `sapil-*` theme classes and `max-*` variants do not, because the global build doesn't know them). Never put `url(data:…)` inside a class name here: it broke the global build under webpack, so the select chevron is an inline style. Preflight is not imported (the host app provides it); a standalone Sapil app must add `@import "tailwindcss/preflight.css" layer(base);` to `theme.css`.

## Tokens

| v9 token | Tailwind | value |
|---|---|---|
| `--paper` `--sand` `--card` | `sapil-paper` `sapil-sand` `sapil-card` | #f7f3ee #efe8de #fffdfa |
| `--ink` `--ink-2` `--muted` | `sapil-ink` `sapil-ink-2` `sapil-muted` | #1e1b18 #4a443d #6f665b (v9 #7a7166, darkened to 4.5:1 on paper/sand/pastels; needs design sign-off) |
| `--line` `--line-2` | `sapil-line` `sapil-line-2` | #e4ddd2 #d6cdc0 |
| `--accent` `--accent-2` `--accent-soft` | `sapil-accent` `sapil-accent-2` `sapil-accent-soft` | #16305c #22447d #e7ebf3 |
| `--p-pink … --p-lime` (9) | `sapil-p-pink` `-peach` `-butter` `-mint` `-sky` `-lilac` `-sand` `-sage` `-lime` | #fbe5ee #fdebe1 #fff3d4 #dff3ea #e2edfb #eee6fb #f4ece1 #e9efe1 #f0f7d4 |
| `--ok` `--ok-2` `--ok-soft` | `sapil-ok` `sapil-ok-2` `sapil-ok-soft` | #1f7a4d #2bb58a #d9f2e6 |
| `--star` `--rose` `--rose-2` `--sale` `--on-dark` | `sapil-star` `sapil-rose` `sapil-rose-2` `sapil-sale` `sapil-on-dark` | #b8790f #a8476f #f2a7c4 #9a3b2a #cfc8bd |
| `#fff` (hard-coded in v9) | `sapil-white` | #fff |
| `--tile` `--mood` (per element) | `sapil-tile` `sapil-mood` (set `--sapil-tile` inline) | default peach / pink |
| `--serif` `--sans`, Gloock | `font-sapil-serif` `font-sapil-sans` `font-sapil-display` | Fraunces / Poppins / Gloock |
| `--r` `--r-sm` | `rounded-sapil` `rounded-sapil-sm` | 16px 10px |
| `--sh` `--sh-lg` | `shadow-sapil` `shadow-sapil-lg` | as v9 |
| `--ease` | `ease-sapil` (or `var(--sapil-ease)` in arbitrary transitions) | cubic-bezier(.2,.8,.2,1) |
| `--wrap` `--gut` | `max-w-sapil-wrap`, `px-sapil-gut` (`<Wrap>`) | 1440px, 24px → 16px at ≤900 |
| breakpoints | `max-1280:` `max-1100:` `max-900:` `max-760:` `max-749:` `max-600:` `max-480:` | `@media (max-width: Npx)`, inclusive like v9 |
| keyframes | `animate-sapil-bump` `-dprog` `-rise` `-swing` `-tick` `-prog` `-pop` `-ship-shine` | v9 timings; names prefixed `sapil-` |

Reduced motion: inside `[data-brand="sapil"]` all animations/transitions drop to .01ms (v9 rule, scoped).

## Components → v9 classes

| Component | replaces |
|---|---|
| `SapilRoot`, `Wrap` | `body` base styles, `.wrap` |
| `Button` (`dark` / `line` / `link` / `add`) | `.btn.btn-dark`, `.btn.btn-line`, `.link`, `.add` (+`.done`) |
| `IconButton` (`plain` / `outlined`, `badge`) | `.icon-btn`, `.rail-ctrl .icon-btn`, `.bag-count` |
| `Chip` (`pressed`, `count`, `dot`) | `.chip`, `.chip small`, `.mood-legend .chip i` |
| `SubnavChip`, `Subnav` | `.sn-chip` (`--c`), `.sn-sale`, `.subnav`, `.sn-label`, `.sn-info` |
| `AnnouncementBar` | `.announce` |
| `SectionHead`, `Eyebrow`, `Serif` | `.sec-head`, `.eyebrow`, `.serif` |
| `ProductCard` | `.card`, `.card-media`, `.card-off`, `.card-hit`, `.card-quick`, `.card-add`, `.card-tags`(`.hit`), `.card-fam`, `.card.gift`, `.card.deo` |
| `Price` | `.price`, `.price s` |
| `Stars` | `.stars` (`.p-rate`, `.reviews`, `.rv-card` sizes) |
| `Breadcrumbs` | `.crumbs` |
| `Fieldset`, `FieldGrid` | `.co fieldset` + `legend`, `.fgrid` |
| `Field` (`prefix`, `optional`, `error`, `wide`), `SelectField` | `.fld`, `.fld.wide`, `.fld.err em`, `.phone`, `.fld select` |
| `Checkbox` | `.check` |
| `RadioCardGroup`, `CardLogo` | `.opts`, `.opt`, `.o-body`, `.o-fee`, `.o-logos`, `.pay-panel`, `.cl.visa/.mc/.tb` |
| `Steps` | `.steps`, `.st-btn` |
| `QuantityStepper` (`default` / `big` / `tinted` / `compact`) | `.qty`, `.qty.big`, `.bline .qty`, `.co-lines .qty` |
| `Tabs`, `TabPanel` | `.tier-tabs`, `.tier-tab` |
| `Accordion` | `.mnav-links details/summary` |
| `Drawer`, `BagLine`, `FreeDeliveryCard`, `SummaryRow` | `.drawer`, `.scrim`, `.d-head`, `.bag-n`, `.ship`, `.d-body`, `.d-foot`, `.bline`, `.ship-card`, `.sum` |
| `Dialog` | `dialog`, `dialog.wide`, `.dlg-x` |
| `Toast` | `.toast`, `.toast-act` |

Accessibility beyond the v9 markup: field labels use `for`/`id` and errors are linked with `aria-describedby` + `aria-invalid`; the drawer is a labelled modal (`role="dialog"`, focus to close, Escape, focus return, `inert` when closed) instead of `aria-hidden`; in-page `Tabs` are a full ARIA tablist; `Stars` is one labelled image; was-prices read "was"; breadcrumbs mark `aria-current="page"`; the subnav is a labelled `<nav>`; `QuantityStepper` is a labelled group with a live count.

## Visual reference and diff

- `/sapil-kit` renders every component with v9 mock values (`?only=<id>` renders one alone). Availability: the kit routes (`page.dev.tsx`) exist only in `next dev`, in a Sapil build, or in a build made with `SAPIL_KIT=1` (a build-time rule in `next.config.ts`: a Swiss Arabian production build has no kit route and ships none of its code); a production server also needs `SAPIL_KIT=1` at runtime, else the page 404s. In practice: build **and** start the Sapil build with `SAPIL_KIT=1`.
- `node scripts/sapil-visual-diff.mjs [--only=card,steps] [--widths=390,1440]` with the kit on :3021 (`next dev --port 3021`). It serves the design folder on :3022, screenshots each reference element and the matching kit element at 390/768/1280/1440 (same width and sub-pixel offset), and prints the % of differing pixels; images go to `%TEMP%/sapil-visual-diff`. Driver: Playwright if installed, else `puppeteer-core` from the npx cache; Chromium from the Playwright cache or `CHROME_PATH`. No dependencies added.

Last run (Chromium 1217, % of pixels differing):

| component (v9 source) | 390 | 768 | 1280 | 1440 |
|---|---|---|---|---|
| ProductCard (shop grid, Berry Crush) | 0.10 | 0.03 | 0.04 | 0.03 |
| Button dark + line (home hero CTAs) | 0 | 0 | 0 | 0 |
| Subnav chips row | 0 | 0 | 0 | 0 |
| AnnouncementBar | 0 | 0 | 0 | 0 |
| SectionHead + outlined IconButtons (#new) | 0 | 0 | 0.03 | 0 |
| Fieldset + Field (+971 prefix) + Checkbox (checkout Contact) | 1.62* | 0 | 0 | 0 |
| RadioCardGroup + pay panel Fields + CardLogo (#payOpts) | 1.26* | 0 | 0 | 0 |
| Steps (checkout) | 0 | 0 | 0 | 0 |
| Breadcrumbs | 0 | 0 | 0 | 0 |

\* placeholder text is 16px instead of 15px at <768px because of the host's global input rule (below).

## Known differences from v9

- **Inputs under 768px are 16px, not 15px**: the host `globals.css` forces `font-size:16px !important` on inputs at ≤767px (iOS zoom guard) in `@layer base`, which no utility can beat. Matches v9 again once Sapil has its own app/globals. Arguably better on iOS; needs a decision.
- **No CLS-adjusted font fallback.** next/font adds a resized local-Arial "… Fallback" face (Turbopack in 16.3 emits it even with `adjustFontFallback: false`); glyphs Poppins lacks, like "→", then came from it and looked bigger than v9. `SapilRoot` therefore sets `--font-sapil-*` inline to the real family only, and `theme.css` appends v9's own fallbacks (`system-ui`, `Georgia`). Cost: a little more layout shift while fonts load, exactly as v9.
- **Placeholder colour** is pinned to Chrome's UA grey `#757575` (v9 relies on the browser default; Tailwind preflight would otherwise make it 50% of the text colour).
- **Hover** uses Tailwind's `hover:` which only applies on hover-capable devices (v9's `:hover` also fires on tap).
- Fraunces is loaded as the full variable font (`weight: "variable"` + `opsz`), as next/font requires for the opsz axis.

## Needs a decision (from v9 itself)

- `.card-fam` (family line) is `display:none` in v9; `ProductCard` hides it unless `showFamily`, styled after the later version as a placeholder.
- `.card-tags span` have padding but no fill or border in v9, so the "pills" read as plain text with odd spacing.
- `.sec-head p` also styles the eyebrow (12px top margin, ink-2 instead of muted). Kept to match; probably unintended.
- The product FAQ uses `<details>` with no v9 styles; `Accordion` borrows the mobile-menu folding style.
- "Tabs": v9 has no tab widget, only the price-tier links; the tablist mode reuses that look.
- `@keyframes prog` is defined in v9 but unused.
