# Sapil product page

Design: v9 `sapil-v9-product.html` (pixel-exact for the v9 parts). The notes journey and sticky bar are v9's "version B" extras (`sapil-v11.css` styles), rebuilt with the v9 tokens.

## Route and components

`/products/[handle]` → `@brand-ui` `ProductDetailPageView` = `SapilProductRoute` (`pages/catalog/SapilListings.tsx`) → `SapilProductPage` (`pages/catalog/SapilProductPage.tsx`). The route itself is shared and unchanged: metadata, Open Graph product tags, product + breadcrumb JSON-LD (`CatalogJsonLd`), 404 / redirect.

| Section | Component (`components/product-page/`) | v9 |
|---|---|---|
| Breadcrumbs | `Breadcrumbs` (design system) | `.crumbs` |
| Gallery | `PdpGallery` | `.gallery`, `.g-main`, `.g-thumbs` |
| Buy box | `PdpBuyBox` | `.p-info`: `.p-kicker`, `h1`, `.p-rate`, `.p-price`, `.desc`, `.buy-row`, `.p-h`, `.pyramid`, `.spec`, `.p-perks` |
| Pay in 4 | `PdpInstalments` | (not in v9; card under the buy row, design-system dialog) |
| Notes journey | `NotesJourney` | `.journey`, `.j-card` (version B) |
| Reviews | `PdpReviews` | `.reviews`, `.rv-*` |
| "More to fall for" | `PdpRelatedRail` | `.pdp-more`, `.rail`, `.rail-ctrl` |
| Sticky add to bag | `StickyBuyBar` | `.sticky-buy` (version B) |
| Product FAQ | — | renders nothing: no data source yet |

## Data

| What | Source |
|---|---|
| Product (server copy, or the shopper's market's) | `useProductDetailPage` (new shared hook, from `ProductDetailPageView`) → `useMarketDocument` + `fetchProductBySlug` |
| Price, was-price, stock | product detail (`compareAtPrice` mapped when the API sends it) |
| Tile colour | `tileColor` on the product detail (mapped in `catalog.service.ts`) |
| Kind / gender | `concentration`; gender from catalog tags (until a gender field exists) |
| Notes (top / heart / base) | `pdpMetafields.top_note`, `middle_note`, `base_note`; size and family from `size`, `fragrance_family_text` |
| Quantity, Add to bag, bag line | `useProductPurchase` (new shared hook, from `PdpBuyBar`) → `useAddToCart`, `setQuantityOptimistic` |
| Pay in 4 | `useInstalmentPlan` (new shared hook, from `PdpInstalments`): payments, Tabby pop-up URL, Tamara schedule |
| Delivery notes | product `shippingPromise` (free-delivery threshold, days), else market `delivery`; "Pay on delivery" only when the market's `cashOnDelivery.available` |
| Reviews | product `reviews` payload + `usePdpReviewList` (new shared hook, from `PdpReviews`) for more pages |
| Related | `useProductDetailPage`: merch rail "you may also like" + more from the product's collection (up to 8) |
| Insider product view, recently viewed | in `useProductDetailPage` (same as Swiss Arabian) |

## Hooks extracted (shared, tested, Swiss Arabian unchanged)

- `features/catalog/hooks/useProductDetailPage` (+ `cartLineForProduct`)
- `features/catalog/hooks/useProductPurchase`
- `features/catalog/hooks/useInstalmentPlan` + `utils/instalments` (`payInFour`, `tabbyPopupUrl` moved; `PdpInstalments` re-exports them)
- `features/catalog/hooks/usePdpReviewList`

## States

Loading (product fetched in the browser for another market), load failed (Try again), missing product, out of stock / unavailable (disabled button, no pay-in-4, no sticky bar), no reviews, signed-in vs guest ("Write a review" → account reviews, or sign in first).

## Visual diff

Kit: `/sapil-kit/catalog` (`src/brands/sapil/kit/CatalogKit.tsx`, real components with the v9 mock Berry Crush and the v9 shop's first eight cards). Run against a Sapil build on :3032 (the kit routes (`page.dev.tsx`) exist only in `next dev`, in a Sapil build, or in a build made with `SAPIL_KIT=1` (a build-time rule in `next.config.ts`: a Swiss Arabian production build has no kit route and ships none of its code); a production server also needs `SAPIL_KIT=1` at runtime, else the page 404s. In practice: build **and** start the Sapil build with `SAPIL_KIT=1`):

```
KIT_URL=http://localhost:3032/sapil-kit REF_PORT=3033 node scripts/sapil-visual-diff.mjs --only=shop-toolbar,shop-grid,shop-hero,pdp-gallery,pdp-pyramid,pdp-buyrow
```

Last run (Chromium 1217, % of pixels differing; reference = v9 with its live mock data):

| part (v9 source) | 390 | 768 | 1280 | 1440 |
|---|---|---|---|---|
| Listing toolbar (`#toolbar`, shop) | 0.00 | 0.00 | 0.00 | 0.00 |
| Card grid, first 8 cards (`#shopGrid`) | 0.14 | 0.04 | 0.05 | 0.05 |
| Shop hero (`#shopHero`) | 0.55 | 0.28 | 0.16 | 0.18 |
| Product gallery (`.gallery`, Berry Crush) | 0.00 | 0.00 | 0.01 | 0.01 |
| Notes pyramid (`.pyramid`) | 0.00 | 0.00 | 0.00 | 0.00 |
| Quantity + Add to bag (`.buy-row`) | 0.09 | 0.04 | 0.06 | 0.06 |

The toolbar fixture uses v9's facet titles (Collection, Highlights, Price, For, Fragrance family); the live toolbar shows the facets the API has. Card grid: two fixture cards differ in data only (v9's "Set of 4" / "EDT" kind tags have no API value). Hero: image resampling (next/image vs the CDN's `width=400`). Data-driven parts (spec rows, perks, reviews, rails) were compared side by side, not by pixels.

## Known differences from v9

- **Rating line** shows only when the product has enough real reviews (Admin setting); v9's numbers are mock.
- **No bundle box** ("Better together"): bundles are not in the catalog yet.
- **Spec rows:** Size, Collection, Fragrance family (no "Mood": no data).
- **Perks:** only those with data (free delivery threshold, delivery days, pay on delivery); v9's "Easy 7-day returns" is mock policy.
- **Reviews:** no city under the name (not collected); the variant name shows instead when there is one. "Write a review" goes to the account's reviews (the inline form is Swiss Arabian's component).
- **Pay in 4** card is new (not in v9), styled from the design system.
- **Notes journey / sticky bar** use v9 tokens with rounded cards (v11's version is square).
- **Out of stock:** no back-in-stock alert yet (Swiss Arabian's `StockAlertButton` has its logic inline; extract it when Sapil needs it).
- **FAQ:** no product FAQ data source (CMS or metafield) → nothing rendered.

## Open questions

- Gender field on products; product FAQ source; bundle data; review write flow on the page.
