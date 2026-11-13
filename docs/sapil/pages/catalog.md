# Sapil catalog: listings, price edit, search, product card

Design: v9 `sapil-v9-shop.html`, `sapil-v9-collection.html`, `sapil-v9-under-99.html` (pixel-exact); search is built from the shop page (design system).

## Routes and components

| Route | `@brand-ui` name | Sapil component |
|---|---|---|
| `/products` (+ `/products/p/[page]`) | `ProductsListing` | `pages/catalog/SapilListings.tsx` → `SapilShopView` / `SapilShopViewFromUrl` |
| `/products?under=<tier>` | (same) | price edit inside `SapilShopView` (`PriceEditView`) |
| `/collections/[handle]` (+ `/p/[page]`) | `CollectionListing` | `SapilCollectionView` / `…FromUrl`, `SapilCollectionSeoText` |
| `/categories/[handle]` (+ `/p/[page]`) | `CategoryListing` | `SapilCategoryView` / `…FromUrl` (collection layout) |
| `/search?q=` | `SearchPageView` | `pages/catalog/SapilSearchPage.tsx` |

**How the view is swapped.** `src/features/catalog/routes/listingRoutes.tsx` keeps all server work (first page of products, 404 / redirects, JSON-LD, metadata, ISR) and now takes an optional `view` (a `ListingViewPair`: `View` for the prerendered page, `FromUrl` for the same view reading `?sort/?maxPrice/?page` in the browser; collections also `SeoText`). Swiss Arabian passes nothing (its views are the defaults). Sapil's `SapilProductsListing` etc. pass Sapil's pair, so no data loading is duplicated.

**Parts** (`src/brands/sapil/components/catalog/`):

| Part | v9 |
|---|---|
| `ListingToolbar` | `.toolbar`, `.fbar`, `.fdd`, `.fmenu`, `.fm-opt`, `.fpills`, `.count` (`filterUI()`) |
| `ProductGrid` (+ `GridSkeleton`, `GridMessage`) | `.grid`, `.empty`; loading skeletons on the pastels |
| `ShopHero`, `BottleTrio` | `.shop-hero`, `.imgs` |
| `CollectionHero`, `CollectionNotes` | `.coll-hero`, `.ch-*`, `.coll-notes` |
| `PriceEditHero`, `TierTabs` | `.u99s.u99-hero`, `.sticker`, `.pchips`, `.shelf`, `.sb`, `.ptag`, `.tier-tabs` |
| `KeepExploring`, `RailButtons` | `.shop-more`, `.ccard`, `.ctrack`, `.promo-tile`, `.rail-ctrl` |
| `InfiniteMore` | (infinite scroll + "More products" link to `?page=N+1` for crawlers) |
| `useSapilListing`, `listingModel` | facets, sorts, price bands, URL patches |
| `CatalogRoot`, `CatalogCopy` | Sapil tokens + fonts, Sapil messages (see "Until the shell is merged") |

## Product card container

`src/brands/sapil/components/product/` (import from `@/brands/sapil/components/product`):

```tsx
<WishlistStatusScope>                                   {/* one wishlist status request per grid */}
  <SapilProductCard product={p} imagePriority={i === 0 ? "high" : i < 4 ? "eager" : "lazy"} />
</WishlistStatusScope>
```

| Prop | |
|---|---|
| `product` | any shared `ProductSummary` (`CatalogProduct`, merch-rail cards, search results) |
| `imagePriority` | `"high"` (likely LCP), `"eager"` (rest of the first row), `"lazy"` (default) |
| `imageSizes` | `sizes` of the image (default: the shop grid) |
| `highlightTags` | navy tags instead of kind + gender (v9 note-search hits) |
| `wishlist`, `quickView` | default `true` |
| `headingLevel`, `className` | |

Mapping (`productCardModel.ts`, tested): tile = API `tileColor` when it is one of the nine pastels, else `sand` (v9's neutral tile); `−N%` from `compareAtPrice`; tags = kind (`EDP` / `Extrait` from `concentration`) + gender (`Women` / `Men` / `Unisex` from catalog tags); "Out of stock" pill when not buyable; gift sets show the whole box. Add to bag (the phone + button and the quick view) uses `useAddToCart` (bag opens). The wishlist heart (`SapilWishlistButton`) and quick view (`SapilQuickView`, v9 `dialog .qv`) sit at the tile's top-end corner: shown on hover/focus on hover screens (always while saved), always on touch screens.

## Data

| What | Source |
|---|---|
| Products, facets, pages | `useCatalogPlp` (`GET /storefront/catalog/products`, `…/collections/:slug/products`, `…/categories/:slug/products`), server first page via `listingRoutes` |
| Filters in the address | `useUrlListingQuery` (read), `useListingNavigation` (write; new shared hook) |
| Collection / category text and image | `useMarketDocument` + `fetchCollectionBySlug` / `fetchCategoryBySlug` (as Swiss Arabian) |
| Collections rail ("keep exploring") | `useCollectionSummaries` (new) ← `GET /storefront/merchandising/collections?includeSummary=true` (count, from-price, 3 bottle images) |
| Price tiers, free-delivery threshold | `useMarketMerchSettings` (new) ← `GET /storefront/markets` `priceEditTiers`, `delivery` |
| Tier tab counts | `facets.priceTiers [{ maxPrice, count }]` on the listing (tiers with 0 products are hidden, as v9) |
| Card tint | `tileColor` on listing cards (mapped in `catalog.service.ts`) |
| Was-price | `priceSummary.compareAtPrice` (mapped when sent; shown only when above the price) |
| Search | `useCatalogSearch` (infinite), `useNewLaunchesPreview` ("New in" when nothing matched) |

Toolbar facets: **Collection** (`houseCollection`), **Fragrance family** (`fragranceFamily`), **Notes** (`featuredNote`), **Type** (`concentration`), **Price** (bands from the market tiers: under 50, 50–99, 99–199, over 199, kept to the listing's price range). One option per facet (the API filters by one code). Sorts: Featured, Newest, Price low→high, high→low (the API has no name sort for listings; search has name sorts).

## Price edit URL (decision)

**`/products?under=<tier>`**, tiers from the market setting `priceEditTiers` (default `[50, 99, 199]`). The view caps every request at the tier (`maxPrice`), sorts by price, shows the tier tabs and the price-edit banner; the price chips are four even bands up to the tier (v9 `priceOptions()`). Why: it is a listing with `maxPrice`, works with today's API and routes (no new route, no fake collection in the backend), and the shared route keeps prerendering `/products`. A dedicated `/under-99` (or Shopify-style `/collections/under-99`) can later be a rewrite/redirect onto it. The server prerenders the plain `/products` page; the price edit appears once the browser reads `?under=` (the server's first page is never reused for it).

## States

Loading (pastel skeleton cards), empty with filters ("Nothing matches these filters" + browse link), empty listing ("No bottles here yet"), load error (`loadFailed` → "We couldn’t load these bottles" + Try again → `retry`), out of stock (card pill, no + button), signed-in vs guest (wishlist heart: guests go to sign in).

## Until the shell is merged

`CatalogRoot` (SapilRoot + `theme.css`) and `CatalogCopy` (SapilCopyProvider with the route language's messages) wrap the catalog pages so they are correct on this branch. Both are harmless inside the Sapil shell; remove them once it provides the same.

## Hooks extracted (shared, tested, Swiss Arabian unchanged)

- `features/catalog/hooks/useListingNavigation` (from `ProductCatalogView`): push / patch / clear listing filters in the address; `keep` extra params.
- `features/collections/hooks/useCatalogCollections` (from `CollectionsPageView`).
- `features/wishlist/hooks/useWishlistToggle` (from `WishlistHeartButton`).
- `features/markets/hooks/useMarketMerchSettings` + `utils/marketMerchSettings` (new; reads `priceEditTiers`, `delivery`).
- `features/merchandising/hooks/useCollectionSummaries` (new).

## Design-system fix (theme.css)

The `max-*` breakpoint variants now also require a Sapil ancestor (`&:is([data-brand="sapil"] *)`). In production the host's global stylesheet (which re-emits plain utilities such as `grid-cols-4` because it scans the whole repo) loads after `theme.css`, so its base rules beat the breakpoint rules: on phones the grid stayed at 4 columns and the heroes at 2. The extra attribute of specificity fixes it everywhere (`theme.test.ts` checks it).

## Checked locally

Sapil build against the backend branch API (:3012, demo seed: 85 products, 14 collections), `next start -p 3032`: `/products` (24 cards server-rendered, "24 of 85", infinite scroll), `/products?under=99` (tier tabs 52 / 74 / 84, "74 real perfumes from AED 15"), `/collections/juicy-pleasures`, `/products/berry-crush` (AED 63 ~~AED 90~~ in rails, notes, perks from market delivery incl. pay on delivery), `/search?q=vanilla`, `/ar/products` (right-to-left, Arabic copy); 390 / 1440 px, no horizontal scroll. Swiss Arabian build: `/products` and a product page render Swiss Arabian's views as before.

## Visual diff

`node scripts/sapil-visual-diff.mjs --only=shop-toolbar,shop-grid,shop-hero` against `/sapil-kit/catalog` (fixture page, `src/brands/sapil/kit/CatalogKit.tsx`: the real components with the v9 mock products). Results (same run as `product.md`): toolbar 0.00% at all widths; grid 0.14 / 0.04 / 0.05 / 0.05%; shop hero 0.55 / 0.28 / 0.16 / 0.18% (390 / 768 / 1280 / 1440). Use `REF_PORT` other than 3022 if another session is running the diff.

## Known differences from v9

- **No "For" (gender) facet and no "Highlights" (best sellers / new):** the platform has no gender attribute (backend decision D3: model "for her / him" as collections, e.g. `for-her`, filtered by `collectionSlug`; `best-sellers` and `new-arrivals` are collections). Gender on cards reads catalog tags (`Women`/`Men`/`Unisex`); the demo data has none, so cards show the kind tag only. The Sapil demo also has no `houseCollection` / `featuredNote` facets, so the toolbar shows Fragrance family, Type and Price.
- **One option per facet** (v9 allows several): the API filters by one code per facet.
- **Kind tags:** only `EDP` / `Extrait` (the API's `concentration`); v9's `EDT`, "Set of 4" have no data.
- **Collection colour** (heroes, collection cards) is a stable pastel per handle: collections have no colour field yet.
- **Collection tagline** = the store's page heading when it differs from the name; v9's "story" = collection description.
- **Promo tiles:** Under {tier}, New arrivals, Every bottle (v9's Bundles / Gift sets have no data yet).
- **Price chips** inside a price edit have no counts (the API counts per tier, not per band).
- **Sticker / delivery note** on the price edit only when the market has a free-delivery threshold.
- **Search** has a sort-only toolbar (search has no facets).

## Open questions

- Gender / highlights as collections (D3): add `collectionSlug` to the shared listing query and a "For" facet built from those collections.
- A collection colour field (heroes, cards).
- Band counts for the price chips.
- Final price-edit URL (`/under-99` rewrite or `/collections/under-99`).

## Review 2 (2026-11-13)

- Grid cards are `h2` (they sat directly under the page `h1`; Lighthouse heading-order). Visually identical.
- "Keep exploring" collection cards: no `aria-label` (the visible count / price / name / line is the name).
- Rail arrows and the price-chip scroll honour reduced motion.
- Live checks: filters / sort through the URL (`sort=price_asc`, `price_desc`), price edit
  `?under=99`, infinite scroll, API failure on the client (`We couldn’t load these bottles` + Try
  again), empty search, en + ar at 390 / 768 / 1280 with no horizontal scroll.
- Visual diff re-run: toolbar 0.00; grid 0.33 / 0.26 / 0.24 / 0.28 and gallery 0.31 / 0.18 / 0.21 / 0.24
  (was 0.14 / 0.04 / …): the kit's `sapil.com` images now go through next/image (resampled), which
  is the production path.
- Lighthouse (median of 3): shop 64, collection 66, a11y 100 (was 46 / 55 and 95); see PERFORMANCE.md.
