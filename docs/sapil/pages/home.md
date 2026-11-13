# Sapil home (v9 "Note by Note")

Area: `home`. Page: `src/brands/sapil/pages/home/SapilHomePage.tsx` (`HomePageView`). Sections: `src/brands/sapil/components/home/`. Wording: `i18n/messages/{en,ar}/home.json`.

## How it renders

`SapilHomePage` reads the market's published CMS homepage with `usePublishedHome(initial)` (extracted from Swiss Arabian's `CmsHomePageView`; the route already loads `initial` on the server). States: skeleton on the pastel tile while loading, "We couldn't load the home page / Try again" on error, a "Coming soon" panel (link to the shop) when the market has no published home — never Swiss Arabian's legacy home.

`cmsSections.ts` types and parses every section defensively (`planHome`); unknown, empty or malformed sections render nothing. The first section becomes the hero when its type has a hero layout. Shapes follow the backend contract on `feat/sapil-cms` (`docs/frontend/SAPIL_STOREFRONT_DATA_HANDOFF.md`, `docs/content/CMS_SAPIL_SECTIONS.md`).

| # | v9 section | Component | CMS section / data |
|---|---|---|---|
| 1 | Hero, gallery doors | `HeroGallery` | `HERO_GALLERY` (first): `headingParts`, `rooms[]` (`titleParts`, `wallColor`, `collection`, `product`), `initialRoomIndex`, `autoAdvance`. Stats line: listing `pagination.total` + `facets.price.min` (`useCatalogPlp`) |
| 1 | Hero, video | `HeroVideo` | `SHOPABLE_VIDEO_SHOWCASE` first → `useShopableVideo()` (3 films) |
| 1 | Hero, campaign | `HeroCampaign` | `HERO_SLIDER` / `HERO_BANNER` first: slides, mobile image (`<picture>` via `getImageProps`), dots, autoplay interval |
| 1 | Hero, promo | `HeroPromo` | `BUNDLE_PROMOTION_SHOWCASE` first: offer card + "add the bundle"; side tiles = market price edit + the offer's secondary link |
| 2 | New arrivals rail | `ProductRail` | `PRODUCT_CAROUSEL` / `FEATURED_COLLECTION` `products[]` |
| 2b | Under AED 99 shelf | `PriceEditShelf` | market `priceEditTiers` (`useMarketSettings`, middle tier) + listing `maxPrice` (`useCatalogPlp`): count, from-price facet, price bands, shelf. Placed after the first new-arrivals rail (not a CMS section). Hidden without tiers or products |
| 3 | Collections scroll story | `CollectionsStory` | `COLLECTION_SHOWCASE` tiles + `summary { productCount, minPrice, currencyCode, images[≤3] }` |
| 4 | Top sellers rail | `ProductRail` | `TRENDING_PRODUCTS` (`BEST_SELLING` or collection) `products[]` |
| 4b | Mood wheel | `MoodWheel` | `MOOD_PICKER` `moods[]` (name, colour, line, notes, products); "add all" via the cart hook |
| 5 | Shop by note | `NotesRail` | `FRAGRANCE_NOTES_SHOWCASE` slot → `useFragranceNotes()`; links `fragranceNotesPlpHref` |
| 5b | Bundles | `HomeBundles` | consecutive `BUNDLE_PROMOTION_SHOWCASE` sections share one row; + adds every bottle (`useAddToCart`); the saving is the cart's promotions |
| 6 | Instagram reels | `HomeReels` | `SHOPABLE_VIDEO_SHOWCASE` slot → `useShopableVideo()`; plays muted only in view (IntersectionObserver ≥35 %) and never with reduced motion; posters; `preload="none"` except the first; sound toggle; hands over on end |
| 7 | About + facts | `AboutBlock` | `BRAND_STORY` (`paragraphs`, `statistics`, image, CTA) |
| – | Newsletter | `HomeNewsletter` | `NEWSLETTER_SIGNUP` → `useNewsletterSignup` (provider not connected, same as Swiss Arabian) |

Product cards: the shared `SapilProductCard` (`components/product`, see `catalog.md`) on every rail. `homeProduct()` puts the section card's `tileColor` and was-price (`priceSummary.compareAtPrice`, only when above the price) on the product, so the card shows the pastel tile, struck price and −% badge, the "Out of stock" pill, wishlist heart and quick view exactly like the shop grid. The mood band passes `tile="var(--sapil-card)"` (white tiles on the coloured band) and no quick view. (`HomeProductTile` was removed in the review pass.)

## Hooks extracted (Swiss Arabian unchanged, with tests)

- `features/cms/hooks/usePublishedHome.ts` (+ `publishedHomeState`) from `CmsHomePageView`.
- `features/markets/hooks/useMarketSettings.ts` (new; `priceEditTiers`, `delivery` added to `StorefrontMarket` as optional fields).
- `features/wishlist/hooks/useWishlistToggle.ts` from `WishlistHeartButton`.
- `features/newsletter/hooks/useNewsletterSignup.ts` from `NewsletterSection`.

## Performance

- Only the hero's first visible image is preloaded (`preload`, eager); everything else lazy with `sizes`.
- Videos: `preload="none"` (first reel `metadata`), play only in view.
- No polling; the wheel and doors use CSS transitions / one `animationend`.

## Visual diff

See `docs/sapil/pages/shell.md` for the table (hero intro and section heads).

## Known differences from v9

- No "hero layout switcher" demo bar or "Concept 09" text (admin setting = which section is first).
- Hero title is a paragraph, not an `<h1>`: the page's one H1 is the SEO title (route rule).
- Reveal-on-scroll (`.rv`) is not reproduced (content is visible immediately; no CLS).
- Door stats show only what the API knows (fragrances, rooms, from-price); the "rooms" count follows the CMS.
- Bundles: v9's "Save AED X" chip and struck full price are not shown — the saving is computed by cart promotions, not known on the home page. Section accent reads "and easier." (v9 "and cheaper.") for the same reason.
- About: v9's bottle tile over the photo is not shown (no CMS field for it).
- Note cards show no "N bottles" count (not in the fragrance-notes API).
- Mood cards: the v9 smaller quick-buy pill inside mood cards is the standard one.
- CMS section headings show as the eyebrow; the v9 headline (e.g. "Just landed, *still fizzing.*") stays as translated Sapil wording, because the CMS headings are short labels ("New arrivals").
- Price-edit shelf chips (price bands with counts) show only when every product under the ceiling is loaded (first listing page); otherwise the count line and the shelf show without chips. `facets.priceTiers` could drive tier chips once the shared listing type parses it (catalog area).
- Gift sets use the bottle zoom (1.62) on cards: the card summary has no product kind yet (`.card.gift` needs it).
- Price-edit links (shelf CTA, other tiers, bundles promo tile, "Shop by" chip) open the price edit `/products?under=N`. The shelf's price-band chips stay plain `minPrice` / `maxPrice` filters.

## Local data

Backend branch instance `http://127.0.0.1:3012` (demo seed: Sapil UAE `SAPIL_URD1`, 85 products, 14 collections, published 10-section home). Fragrance notes and shoppable video are not curated for Sapil yet: those two sections render nothing. The header menu has no children yet (menus not bound by the seed), so the "Shop by" chips are empty.

## Review 2 (2026-11-13)

- Cards: `HomeProductTile` removed; rails, mood band (white tiles via `tile`), search use `SapilProductCard`.
- Accessibility: collection-story cards and price-edit shelf tags have names that include their
  visible text (Lighthouse `label-content-name-mismatch`); home a11y 97 → 100.
- Checked live (390 / 768 / 1280, en + ar): no horizontal scroll, RTL mirrored (doors, rails, arrows,
  price tags), no console errors; React commits: 5 in 10 s idle (announcement rotation + doors), no loop.
- Performance: see `docs/sapil/PERFORMANCE.md` (home JS 770 → 409 KB, TBT 2.9 s → 0.44 s, CLS 0.106 → 0.001).
