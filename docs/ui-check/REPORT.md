# Final UI check — Swiss Arabian + Sapil (2026-11-13)

Branch `review/ui` (from `feat/multibrand-sapil` @ `6c2ef47`). Production builds (`next build` +
`next start`), headless Chrome (puppeteer-core from the npx cache), English and Arabic, widths
390 / 768 / 1280 / 1440. The scripts were throwaway (not committed): a page sweep (status,
horizontal scroll, broken images, console errors and 4xx, hydration warnings, layout shift,
`lang` / `dir`, Latin-only text on `/ar`, the other brand's name, full-page screenshot) and a
current-vs-baseline screenshot + visible-text compare for Swiss Arabian.

## The local API went down during the check

The shared API on **:3012** (and **:3002**) stopped answering at about 10:40, when the earlier
session was interrupted. Per the brief, neither was restarted. So:

- **Sapil:** the full sweep (19 pages, en + ar, 4 widths) ran **with the API up**, on the
  pre-fix build. Its findings are below. After the fixes, only what renders without data was
  re-checked: the language of links and redirects, the card-payment screens, and the empty bag and
  checkout.
- **Swiss Arabian:** the current build and the pre-program baseline were compared **with the API
  down on both sides**. The baseline is `5a55282`, built in a throwaway worktree that has since been
  removed. That covers the chrome, static pages, forms, and empty and error states. Product,
  collection, PDP, blog-post and CMS-page content could not be compared.
- **Lighthouse after the fix** could not be measured for Sapil: with no data, there is nothing to
  render. `docs/sapil/PERFORMANCE.md` has the before numbers and explains what the fix changes.

**To re-run once :3012 is back:** `/collections/*`, `/products/*`, a blog post and a CMS page
for both brands, plus Sapil's four Lighthouse pages.

## Sapil

The sweep covered 152 page loads on the pre-fix build, with the API up:
- no horizontal scroll at any width
- no broken images
- no hydration warnings
- `lang` / `dir` right on every `/ar` page except the signed-out account redirect
- no "Swiss Arabian" text anywhere

| Page | en | ar | Findings → fix |
|---|---|---|---|
| Home | ✅ | ✅ | ar: hero stat read "15 AED، ابتداءً من" → **fixed** (uses the language's currency sign). Menu and footer labels, collection taglines, mood names and mood taglines are English **CMS data** |
| Products | ✅ | ✅ | ar: screen readers heard the English "was" before was-prices → **fixed** (`wasLabel`). LCP image = shop-hero bottle from `uae.sapil.com`, served full size (300 KB PNG) → **fixed** (host allowlisted, image optimised) |
| Collection, product | ⚠️ | ⚠️ | not re-swept: the shell mangled the sweep's URLs, and the API was down for the re-run. Reviewer 2 checked both on the same build |
| Search | ✅ | ✅ | console 404 / 422 from the `new-launches` merchandising rail (Swiss Arabian slug; known data gap) |
| Bag | ✅ | ✅ | CLS 0.077 at 768: the loading skeleton was 252px wide in the flex `<main>` → **fixed** (`Wrap` is `w-full`) |
| Checkout | ✅ | ✅ | same skeleton shift (CLS 0.056) → **fixed**. `dont-miss-this` rail 404 (data) |
| Card payment (Stripe, Paymob) | ✅ | ✅ | showed Swiss Arabian copy and styling → **new Sapil views**. Checked after the fix: no overflow at 390 / 1280, rtl correct |
| Order confirmation | ✅ | ✅ | CLS 0.25 at 768: the error state shrank sideways → **fixed** (`Wrap`) |
| Track | ✅ | ✅ | `/track?_rsc` prefetch **404'd from every `/ar` page** → **fixed** (links now go to `/ar/track`) |
| Login, register, forgot password | ✅ | ✅ | links from `/ar` went to the English pages → **fixed**. Reset email was in the URL → **fixed** |
| Account (signed out) | ✅ | ❌ → ✅ | `/ar/account` redirected to the English `/login` → **fixed**: now `/ar/login?returnTo=%2Far%2Faccount` |
| FAQ | ✅ | ✅ | ar: CLS 0.117 at 768 (see "Arabic font" below) |
| Blog | ✅ | ✅ | Sapil has no published posts (data), so there was no post page to check |
| CMS / policy page | — | — | Sapil has no CMS pages yet; `/pages/privacy-policy` shows the 404 view, which is correct |
| 404 | ✅ | ⚠️ | ar: CLS 0.42 at 768 and 0.17 at 1280 (Arabic font; see below). The content-width part of the shift is **fixed** (`Wrap`) |
| Announcement bar | ✅ | ✅ | had no pause control and announced every change through `aria-live` → **fixed** (pause / play, no live region) |

**After the fixes** (Sapil build, API down):
- Every transactional link on these pages now keeps `/ar`: `/ar/login`, `/ar/register`,
  `/ar/forgot-password`, `/ar/cart`, `/ar/track` and `/ar`.
- There are no 404 RSC prefetches and no hydration errors.
- The card screens render in both languages without overflow.

**Screenshots** (in this folder):
- `sapil-card-stripe-en-1280.jpg`: a fake stored session. Stripe can't load with it, so the page
  shows the error and the loading frame.
- `sapil-card-paymob-ar-390.jpg`: the red box is Paymob Pixel's own error for the fake key.
- `sapil-home-ar-390-top.jpg`: taken before the fix, so it still shows the "AED" stat.

**v9 fidelity:** markup changed in only four places:
- `Wrap` gains `w-full`, which gives it the same box as v9's block `.wrap`.
- `Price` and `ProductCard` change only their screen-reader text.
- The announcement gets its control only when there are two or more messages.
- The card screens are new pages (no v9 design), built only from v9 tokens and components.

The kit's visual diff was not re-run: it needs the kit server and the design folder, and no
visual change is expected outside the announcement control.

**Arabic font (open, design decision):**
- Sapil sets Poppins, Fraunces and Gloock for every language. None has Arabic glyphs, so Arabic
  falls back to the system font.
- When the Latin fonts load, the line boxes change. That causes the CLS on short Arabic pages at
  tablet width.
- Decision 7 ("the platform's Arabic font") is not implemented: Swiss Arabian's `"GE SS"` is not
  served by the site either.
- Options: pick an Arabic web font and put it before Poppins under `:lang(ar)`, or accept the
  shift.

## Swiss Arabian: current build vs the pre-program baseline `5a55282`

Both builds were served with `next start` against the same (down) API. Each comparison is the
first screen (900px tall) plus the page's visible text. That makes 15 addresses × en / ar × 4
widths = 120 pairs.

| Page | en | ar | Result |
|---|---|---|---|
| Home | ✅ 0.1–0.5 % pixels | ✅ 0 % | en: under 0.5 % at every width, text identical. ar: the visually hidden page heading reads "سويس أرابيان \| …" instead of "Swiss Arabian \| …". That is the brand-identity fallback, which comes from the brand config since reviewer 1; it only shows while the API is down |
| Products | ✅ identical | ✅ identical | |
| Login, register, forgot password | ✅ identical | ✅ identical | |
| Track | ✅ identical | ✅ identical | |
| Cart (empty) | ✅ identical | ✅ identical | |
| Checkout (empty) | ✅ identical | ✅ identical | |
| Card payment (Stripe, Paymob), expired session | ✅ identical | ✅ identical | the markup and sentences of these views are unchanged by the hook extraction (checked in the diff) |
| FAQ, blog, stores | ✅ identical | ✅ identical | |
| 404 | ✅ identical | ✅ identical | |
| Account (signed out) | ✅ identical | **changed (intended)** | `/ar/account` now goes to the Arabic `/ar/login?returnTo=%2Far%2Faccount`. The baseline sent the shopper to the English `/login` (4–7 % of pixels differ: Arabic vs English page) |

The current build showed no horizontal scroll and no console errors other than the failed API
calls (the same on both sides).

**Swiss Arabian changes from this branch:**
- Arabic shoppers keep `/ar` through checkout, sign-in, tracking and the confirmation, including
  the Stripe / Paymob return URLs. English addresses are unchanged.
- Forgot password no longer puts the email in the address. The reset form is filled from session
  storage right after hydration; before, it was in the server HTML.
- Insider reads page types from the bare path, so `/ar/products/x` counts as a product page.
- Anything else looks the same.

## Language through checkout (both brands)

What changed:
- `localizeHref` no longer leaves these paths unprefixed: `/checkout`, `/login`, `/register`,
  `/forgot-password`, `/reset-password`, `/verify`, `/track`, `/order-confirmation`.
- `useLocaleRouter` and `checkoutHref` do the same for programmatic navigation, the auth guard,
  and the Stripe / Paymob return URLs.

What stays as it was:
- `/payments/tabby|telr/return` stay unprefixed (backend contract).
- English addresses are unchanged: the default language has no prefix.

The `[locale]` routes exist for all these pages, and the proxy passes `/ar/…` through unchanged
(`localeRouting`: "next").
