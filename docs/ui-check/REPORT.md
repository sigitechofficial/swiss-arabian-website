# Final UI check — Swiss Arabian + Sapil (2026-11-13)

Branch `review/ui` (from `feat/multibrand-sapil` @ `6c2ef47`). Production builds (`next build` +
`next start`), headless Chrome (puppeteer-core from the npx cache), English and Arabic, widths
390 / 768 / 1280 / 1440. The scripts were throwaway (not committed): a page sweep (status,
horizontal scroll, broken images, console errors and 4xx, hydration warnings, layout shift,
`lang` / `dir`, Latin-only text on `/ar`, the other brand's name, full-page screenshot) and a
current-vs-baseline screenshot + visible-text compare for Swiss Arabian.

## API outage during the check (re-run since)

The shared API on :3012 stopped for part of the session (it was not restarted by this agent).
Every check that hit the outage was re-run once it was back:
- the Sapil sweep on the final build, with data
- Sapil Lighthouse after the fixes
- the Swiss Arabian catalog / blog / CMS compare against the baseline, with data

A first Swiss Arabian compare (chrome, forms, empty and error states) ran with the API down on
**both** sides, so it is still a like-for-like comparison. Its results are kept below.

## Sapil

Two sweeps, 152 page loads each:
- **before:** the pre-fix build, with the API up
- **after:** the final build, with the API up

Before the fixes:
- no horizontal scroll at any width
- no broken images
- no hydration warnings
- `lang` / `dir` right on every `/ar` page except the signed-out account redirect
- no "Swiss Arabian" text anywhere

| Page | en | ar | Findings → fix |
|---|---|---|---|
| Home | ✅ | ✅ | ar: hero stat read "15 AED، ابتداءً من" → **fixed** (uses the language's currency sign). Menu and footer labels, collection taglines, mood names and mood taglines are English **CMS data** |
| Products | ✅ | ✅ | ar: screen readers heard the English "was" before was-prices → **fixed** (`wasLabel`). LCP image = shop-hero bottle from `uae.sapil.com`, served full size (300 KB PNG) → **fixed** (host allowlisted, image optimised) |
| Collection, product | ✅ | ✅ | swept after the fixes (with data): no overflow, no broken images, rtl right. Product page: `you-may-also-like` rail 404 (Swiss Arabian slug, data) |
| Search | ✅ | ✅ | console 404 / 422 from the `new-launches` merchandising rail (Swiss Arabian slug; known data gap) |
| Bag | ✅ | ✅ | CLS 0.077 at 768: the loading skeleton was 252px wide in the flex `<main>` → **fixed** (`Wrap` is `w-full`) |
| Checkout | ✅ | ✅ | same skeleton shift (CLS 0.056) → **fixed**. `dont-miss-this` rail 404 (data) |
| Card payment (Stripe, Paymob) | ✅ | ✅ | showed Swiss Arabian copy and styling → **new Sapil views**. Checked after the fix: no overflow at 390 / 1280, rtl correct |
| Order confirmation | ✅ | ✅ | CLS 0.25 at 768: the error state shrank sideways → **fixed** (`Wrap`). Now 0.15 at 768 (unknown order): the spinner → error change and the footer columns loading; a real order isn't affected the same way |
| Track | ✅ | ✅ | `/track?_rsc` prefetch **404'd from every `/ar` page** → **fixed** (links now go to `/ar/track`) |
| Login, register, forgot password | ✅ | ✅ | links from `/ar` went to the English pages → **fixed**. Reset email was in the URL → **fixed** |
| Account (signed out) | ✅ | ❌ → ✅ | `/ar/account` redirected to the English `/login` → **fixed**: now `/ar/login?returnTo=%2Far%2Faccount` |
| FAQ | ✅ | ✅ | ar: CLS 0.117 at 768 (see "Arabic font" below) |
| Blog | ✅ | ✅ | Sapil has no published posts (data), so there was no post page to check |
| CMS / policy page | — | — | Sapil has no CMS pages yet; `/pages/privacy-policy` shows the 404 view, which is correct |
| 404 | ✅ | ⚠️ | ar: CLS 0.42 at 768 and 0.17 at 1280 (Arabic font; see below). The content-width part of the shift is **fixed** (`Wrap`) |
| Announcement bar | ✅ | ✅ | had no pause control and announced every change through `aria-live` → **fixed** (pause / play, no live region) |

**After the fixes** (final Sapil build, API up):
- Every page: status 200, `lang` / `dir` right, no horizontal scroll, no broken images, and no
  console errors except the known data 404s (merchandising slugs, the unknown order).
- No hydration errors on the home page: the mood wheel's mismatch is fixed.
- The bag / checkout skeleton shift is gone.
- `/ar/account` → `/ar/login?returnTo=%2Far%2Faccount`.
- The `/track` prefetch 404s are gone.
- Every transactional link on `/ar/login`, `/ar/register`, `/ar/forgot-password`, `/ar/cart`,
  `/ar/track` and `/ar` keeps `/ar`.
- The card screens render in both languages without overflow.
- **Still open:** the Arabic 404 shift (font) and FAQ ar CLS 0.117 at 768.
- **Mood wheel:** the server and the browser drew its SVG with different last digits
  (hydration mismatch, found by the coordinator in `next dev`). Coordinates are now rounded to 3
  decimals.

**Lighthouse (mobile, median of 3)**, before → after. Full table in `docs/sapil/PERFORMANCE.md`:

| Page | Perf | LCP |
|---|---|---|
| Home | 63 → 64 | 7.5 → 6.2 s |
| Shop | 65 → 72 | 5.6 → 6.4 s |
| Collection | 66 → 75 | 5.7 → 5.6 s |
| Product | 68 → 74 | 6.5 → 5.9 s |

Accessibility stays 100. The LCP image is now optimised: about 7 KB instead of 36 KB, loading in
about 0.2 s. LCP is now set by render delay (fonts and hydration), which is not fixed here.

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

### With data (API up)

The baseline was rebuilt in a throwaway worktree and removed afterwards. Each comparison is the
first screen plus the visible text, en + ar, at 4 widths, on:
- home, `/products`, `/collections/best-sellers`, `/products/rasheeqa-edp`, `/search?q=oud`
- `/blog`, `/blog/best-oud-perfumes-mwd8fbmx`
- `/pages/privacy-policy`, `/our-story`, `/stores`, `/faq`

| Page | Result |
|---|---|
| Product, search, blog, blog post (en), CMS page, our story, stores, FAQ | identical: 0 % pixels, same text, en + ar |
| Listing, collection | ≤ 0.17 % pixels, same text (image anti-aliasing) |
| Home | same text; pixels 0.3–0.65 %, and 2.6 % at 390. The hero sits 0–1px lower depending on the run: the probe measured 130 / 131px on the current build and 130px on the baseline, so this is load timing, not a layout change. This branch changes no Swiss Arabian styles |
| `/ar/blog/<English-only post>` | **changed, better** (the program's 404 work, reviewer 1): the baseline drew the 404 inside a second, nested chrome (two "Skip to content", two headers); now one chrome |

No horizontal scroll and no new console errors on the current build.

### Without data (API down on both sides)

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
- The market cookie stays `sa-zone-code`. Other brands now use their own cookie, and before the
  markets load only this site's own saved market is used. A zone written by another brand on the
  same host can no longer make the first load ask the API for that brand's market.
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
