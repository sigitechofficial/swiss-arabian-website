# Sapil performance (reviewer 2, 2026-11-13)

Method: same as `docs/performance/BASELINE-2026-11-13.md`: Lighthouse 12.8.2, mobile preset
(simulated slow 4G, 4× CPU), 3 runs per page, **median**. Sapil production build
(`next build` + `next start -p 3042`, `NEXT_PUBLIC_STOREFRONT_BRAND_CODE=SAPIL`) against the shared
Sapil backend on :3012 (demo seed: 85 products, 14 collections, 10-section home). Chromium 1217.
Lighthouse warned that the machine's CPU is slower than it expects, so absolute timings are
pessimistic; compare before/after, which ran on the same machine.

## Lighthouse (median of 3)

| Page | Perf | A11y | Best pr. | SEO* | FCP | LCP | TBT | CLS | JS (transfer) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Home `/` — before | 41 | 97 | 100 | 61 | 1.8 s | 9.4 s | 2,913 ms | 0.106 | 770 KB |
| Home `/` — **after** | **65** | **100** | 100 | 61 | 1.7 s | 6.7 s | **439 ms** | **0.001** | **409 KB** |
| Shop `/products` — before | 46 | 95 | 100 | 69 | 1.7 s | 8.5 s | 2,068 ms | 0.105 | 770 KB |
| Shop `/products` — **after** | **64** | **100** | 100 | 69 | 1.4 s | 5.6 s | **501 ms** | **0.000** | **409 KB** |
| Collection `/collections/juicy-pleasures` — before | 55 | 95 | 100 | 69 | 1.7 s | 6.5 s | 1,128 ms | 0.105 | 770 KB |
| Collection — **after** | **66** | **100** | 100 | 69 | 1.4 s | 5.7 s | **481 ms** | **0.000** | **409 KB** |
| Product `/products/berry-crush` — before | 42 | 97 | 96 | 69 | 1.7 s | 8.7 s | 2,845 ms | 0.105 | 770 KB |
| Product — **after** | **68** | **100** | 96 | 69 | 1.4 s | 6.5 s | **369 ms** | **0.000** | **409 KB** |

\* SEO: `is-crawlable` fails by design locally (noindex). Home also fails `meta-description`:
the Sapil market's Brand identity has no description in the admin (data; the route falls back to
it). Best practices 96 on the product page = console 404 of the `you-may-also-like` merch rail
(Swiss Arabian slug; Sapil has no such rail yet — same as the Swiss Arabian baseline).

Against the budgets (`BASELINE-2026-11-13.md`):

| Budget | First target | Sapil now | |
|---|---|---|---|
| Lighthouse performance | ≥ 70 | 64–68 | close; LCP is the gap |
| LCP | ≤ 4.0 s | 5.6–6.7 s | **over** (see below) |
| TBT | ≤ 400 ms | 369–501 ms | at the line |
| CLS | ≤ 0.05 | 0.000–0.001 | ✅ |
| JS transferred per page | ≤ 450 KB | 409 KB (catalog), 448 KB bag, 752 KB checkout | ✅ except checkout (Stripe / Paymob / Maps) |
| Fonts | ≤ 200 KB | 8 files / 204 KB | at the line (Gloock, Fraunces variable roman + italic, Poppins 300–700) |
| Accessibility | ≥ 95 | 100 | ✅ |

## Home JS, before and after (the coordinator's question)

Measured with a cold browser context per page at 390 px (`performance` resource entries;
"decoded" = uncompressed JS the browser parses):

| Build | Home JS transferred | Home JS decoded |
|---|---:|---:|
| `feat/multibrand-sapil` before the review (one ~1 MB chunk with every Sapil page view, Stripe, Paymob, Google Maps, Swiss Arabian checkout code) | 770 KB | ≈ 2.9 MB (reviewer 1's measurement) |
| + `src/brands/sapil/package.json` `sideEffects` (Turbopack drops unused `@brand-ui` re-exports: the home page's client manifest lists only `SapilHomePage`) | 482 KB | — |
| + named re-exports in `brand-ui.ts` (no `export *` of Swiss Arabian's barrel, shared parts imported from their own modules) and reviewer 1's merge | **409 KB** | **1.34 MB** |

Why: `@brand-ui` is one barrel that the root layout imports (`StorefrontShell`, `BrandHead`). Without
side-effect information Turbopack keeps every module the barrel re-exports as a client reference of
every route, so each Sapil page shipped every other page's view. Removing only the
`export *` in `brand-ui.client.ts` did not help (reviewer 1); marking the brand folder side-effect
free did, and the named re-exports remove the Swiss Arabian barrel from the graph.

Other pages (same method): shop / collection / product 409 KB, bag 448 KB, sign-in 446 KB,
checkout 752 KB (card providers and address map, needed there).

## Render loops

React commits counted with a devtools-hook stub (`onCommitFiberRoot`) during load and during
10 s of idle afterwards, desktop width:

| Page | Commits during load | Commits in 10 s idle |
|---|---:|---:|
| Home `/` (and `/ar`) | 13 (15) | 5 — the announcement rotation (4.5 s) and the hero doors; no loop |
| Shop, collection, product | 10–14 | 3 |
| Bag, checkout | 8–9 | 3 |

No render loop (the Swiss Arabian wishlist loop fixed in the baseline would show hundreds).

## Images and video

- Only the first image is eager (hero door / first card row with `fetchPriority="high"` on the
  first card); everything else is lazy with `sizes`.
- The demo catalog's images are on `sapil.com/cdn/shop/files`, which was not on the image
  allowlist, so every product image was served full size (Lighthouse "properly size images":
  485 KB on home, 560 KB on the product page). Added to `REMOTE_IMAGE_PATTERNS` (Sapil's Shopify
  files, like Swiss Arabian's). Home images: 584 → 372 KB.
- Videos: `preload="none"` (first reel `metadata`), play only in view, never with reduced motion
  (no curated Sapil video locally, so not measured).

## Layout shift

The announcement and "Shop by" rows load in the browser once the market is known; they pushed
the page down by ~95 px (CLS 0.105 on every page). The chrome now holds their height (server
HTML included) until the data answers, and collapses only if the market has neither. Bag and
checkout reserve 70vh while the bag rehydrates (empty-bag CLS at 390 px: 0.14 → 0.05).

## LCP — final UI check (2026-11-13)

Re-measured on the same machine and method (Sapil build of `6c2ef47`, :3012 demo data, median of 3):

| Page | Perf | A11y | FCP | LCP | TBT | CLS | LCP element |
|---|---:|---:|---:|---:|---:|---:|---|
| Home `/` | 63 | 100 | 1.7 s | 7.5 s | 490 ms | 0.001 | hero "door" bottle `<img>` from `uae.sapil.com` |
| Shop `/products` | 65 | 100 | 1.5 s | 5.6 s | 485 ms | 0.000 | shop-hero bottle `<img>` from `uae.sapil.com` |
| Collection, product | — | — | — | — | — | — | not measured: the API (:3012) went down mid-run; reviewer 2's 5.7 s / 6.5 s stand |

**What the HTML actually showed** (the earlier diagnosis was wrong):
- Catalog cards **are** server-rendered: the listing route renders the view with the server's
  first page as the Suspense fallback, and the first card is `loading="eager" fetchPriority="high"`.
- The product page's main image **is** server-rendered and preloaded
  (`<link rel="preload" as="image" imageSrcSet … fetchPriority="high">`).
- The real cause on home / shop / collection: most demo product images are on
  **`uae.sapil.com`/cdn/shop/files**, which was not on the image allowlist (only `sapil.com` was).
  `MediaImage` therefore rendered them `unoptimized`: the LCP bottle was a **300 KB PNG**, no
  `srcset`. Lighthouse's breakdown for `/products`: load delay 0.8 s, **load time 4.4 s (63 %)**,
  render delay 1.3 s.

**Fix:** `uae.sapil.com` added to `REMOTE_IMAGE_PATTERNS` (`src/lib/images/remoteImagePatterns.ts`),
so these images go through `/_next/image` (WebP/AVIF at the card / hero size, ~15–30 KB). No
route change was needed, nothing changes for Swiss Arabian (its hosts are untouched).

**After:** not measured. The API was down for the rest of the session and was not restarted (brief).
Expected: the image load phase drops from ~4.4 s to well under 1 s on the simulated 4G link, i.e.
shop / collection LCP ≈ 2.5–3.5 s and home ≈ 4 s (home also waits for the hero data, which loads
in the browser). Re-run `lighthouse` on `/`, `/products`, `/collections/juicy-pleasures`,
`/products/berry-crush` once :3012 is up.

## Still open

- **LCP**: measure after the image fix (above). The home hero gallery and the "Shop by" row are
  client-rendered (market data in the browser); server-rendering them needs the market on the server.
- **TBT ~450 ms**: hydration of the shell + page; `framer-motion` and `zod` still come with shared
  providers.
- Checkout JS 752 KB.
