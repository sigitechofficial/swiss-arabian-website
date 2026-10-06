# Storefront enterprise plan

This plan raises the Swiss Arabian storefront (`swiss-arabian-website`) to an enterprise component structure. The feature folders and thin App Router pages are already the right shape. The work is to finish that shape inside the screens that are still one file.

Date: 6 October 2026.

## 1. What “enterprise” means here

A route file loads one page component. That page component loads data and arranges sections. A section owns one job and stays small enough for one person to review. Shared controls exist only when two features render the same control. Styling stays in the existing Tailwind class modules.

The storefront is already a production commerce frontend: feature modules, public `index.ts` barrels, route groups, and a home page that only composes sections. Account is split the same way. The gap is the three screens a shopper spends the most time on, plus a header that is already split into functions but still lives in one file.

## 2. Scope

In scope:

- Split the product page, the product listing, and checkout into section components.
- Move the header’s existing inner functions into their own files.
- Add a shared control only after a split shows the same control in two features.
- Keep every public import going through a feature `index.ts` for new code.

Out of scope for this plan:

- Tests. Those are a later pass.
- Placeholder pages that are waiting on a backend: Our story, blog, blog article, stores, gift cards, gift box, subscriptions, and account subscription. They stay on `FeaturePlaceholder`.
- Rewriting `src/styles/*Chrome.ts` into a component library.
- Visual redesign. Each phase must look and behave as it does today on desktop, tablet, and phone.
- Admin panel and backend.

## 3. Current state

### Already in the target shape

Home (`src/features/home/components/HomePageView.tsx`) only renders landing sections:

- `LandingHero`, `LandingFeatureCards`, `LandingProductsBand`, `LandingCollections`, `LandingNotes`, `LandingTrending`, `LandingBundles`, `LandingReel`, `LandingReviews`, `LandingStory`, `LandingPlans`

Account is a shell plus one view per screen: profile, addresses, security, rewards, orders, wishlist, payments. Shared pieces already exist: `AccountPageShell`, `AccountTabNav`, `AccountCard`, `AccountSectionHeading`.

Routes are thin and grouped:

| Group | Examples |
| --- | --- |
| `(shop)` | `/`, `/products`, `/products/[slug]`, `/collections`, `/cart`, `/search`, `/faq` |
| `(auth)` | `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify` |
| `(account)` | `/account`, `/account/orders`, `/account/profile`, `/account/rewards` |
| `(checkout)` | `/checkout`, payment success and cancel, order confirmation |
| `(lp)` | `/lp/[id]` |

Feature modules with a public `index.ts`: account, auth, cart, catalog, checkout, collections, faq, home, landing-pages, markets, merchandising, navigation, orders, payments, promotions, search, subscriptions, tracking, wishlist.

Shared UI today (`src/components/ui`): `SideSheet`, `PhoneNumberField`, `PageLoading`, `Toaster`, `ForbiddenView`, `ShopUnavailableView`. Layout lives in `src/components/layout`. Guards live in `src/components/guards`.

Styling lives in class-string modules, not in a design-system package:

- `src/styles/siteChrome.ts`
- `src/styles/landingChrome.ts`
- `src/styles/shopChrome.ts`
- `src/styles/pdpChrome.ts`
- `src/styles/cartChrome.ts`
- `src/styles/checkoutChrome.ts`
- `src/styles/productCard.ts`
- `src/features/catalog/catalogChrome.ts`

`src/app/globals.css` stays. It holds the Tailwind entry, Benton font faces, design tokens, keyframes, base rules, flag icons, and Google Places popup styles. Those are not component CSS.

### The files this plan changes

| File | Lines | Problem |
| --- | ---: | --- |
| `src/features/catalog/components/ProductDetailPageView.tsx` | 1,105 | Gallery, buy box, composition, and related rails are one component. `CompItem` and `RelatedCard` are private functions at the bottom of the file. |
| `src/features/catalog/components/ProductCatalogView.tsx` | 918 | Hero, filters, toolbar, grid, and `CatalogProductCard` are one component. |
| `src/features/checkout/components/CheckoutPageView.tsx` | 821 | Delivery, shipping, billing, payment, and order summary are one component. |
| `src/components/layout/navbar/Navbar.tsx` | 604 | Already split into functions (`NavbarTopbar`, `NavbarBrand`, `NavbarPrimary`, `NavbarMobile`, and the icon helpers). They still share one file. |

Pieces that already exist and must stay separate:

- Product: `PdpReviews`, `PdpScentFamily`, `PdpOffersPanel` (promotions), `ProductCompanions` (promotions)
- Listing: `useCatalogPlp`, `CatalogPagination`, `CatalogInfiniteSentinel`, `CatalogEmptyState`
- Checkout: `useCheckout`, `StripePaymentFormView`, `CheckoutStateShell`, `PaymentSuccessView`, `PaymentCancelView`, `OrderConfirmationView`

`CatalogEmptyState` is the market-level “no products found” view. The listing’s “No fragrances here yet” block is a different empty state. Do not merge them.

## 4. Target shape

```
src/app/(shop)/products/[slug]/page.tsx     loads ProductDetailPageView
src/features/catalog/components/
  ProductDetailPageView.tsx                 data + layout only
  pdp/PdpGallery.tsx
  pdp/PdpBuyBox.tsx
  pdp/PdpComposition.tsx
  pdp/PdpRelatedRail.tsx
  pdp/PdpRelatedCard.tsx

src/app/(shop)/products/page.tsx            loads the catalog view
src/features/catalog/components/
  ProductCatalogView.tsx                    query + layout only
  catalog/CatalogHero.tsx
  catalog/CatalogFilters.tsx
  catalog/CatalogToolbar.tsx
  catalog/CatalogGrid.tsx
  catalog/CatalogProductCard.tsx

src/app/(checkout)/checkout/page.tsx        loads CheckoutPageView
src/features/checkout/components/
  CheckoutPageView.tsx                      useCheckout + layout only
  checkout/CheckoutDelivery.tsx
  checkout/CheckoutShippingMethod.tsx
  checkout/CheckoutBilling.tsx
  checkout/CheckoutPayment.tsx
  checkout/CheckoutSummary.tsx

src/components/layout/navbar/
  Navbar.tsx                                composes the pieces below
  NavbarIcons.tsx
  NavbarTopbar.tsx
  NavbarBrand.tsx
  NavbarSearchField.tsx
  NavbarPrimary.tsx
  NavbarMobile.tsx
  NavbarSearchDropdown.tsx                  already its own file
```

A page view after this work should read like `HomePageView`: a short function that places sections. A section file should stay under about 250 lines. If a section passes that while it is being extracted, split it again before the phase is called done.

## 5. Rules for every phase

1. Move markup. Do not restyle it. Class names keep coming from the existing `*Chrome.ts` modules.
2. The page view owns server and cart state. A section owns state that no sibling reads.
3. Pass data and callbacks as props. Do not reach into another section’s DOM.
4. New imports from another feature go through that feature’s `index.ts`. Existing deep imports stay until the file that contains them is edited for a real reason.
5. Do not export a section from the feature barrel unless a route or another feature renders it. Page views stay the public surface.
6. Dynamic inline styles stay where they are data: price-slider fill, note-bar width, hero object position, animation delay.
7. After each phase, check the screen on desktop, a tablet width, and a phone width. Open the real interactions, not only the first paint.

## 6. Phase 1 — Product page

Source: `src/features/catalog/components/ProductDetailPageView.tsx`.

`ProductDetailPageView` keeps:

- Product query, zone, metafields, and `ProductDetailContent`
- Related-product query (`moreFromFeed`) and the `related` / `youMayAlsoLike` memos
- Loading and missing-product branches (the two early returns around the `PageLoading` and not-found sections)
- Cart line lookup (`cartLineForProduct`) and the add-to-bag mutation
- The page wrapper and the order of sections

It stops rendering gallery, buy-box, composition, and related markup itself.

### `pdp/PdpGallery.tsx`

Takes the stage column (`pdpStage`, about lines 574–648).

Owns:

- `activeImage`
- Failed image URLs
- Thumbnail scroll and the next-image control

Props: `images`, `title`, and the empty-bottle fallback. The parent does not need the active index.

### `pdp/PdpBuyBox.tsx`

Takes the panel column (`pdpPanel`, about lines 650–835).

Renders, in the current order:

- Title, format, rating link to `#pdp-reviews`
- Description
- Note chips
- Price, quantity, add to bag, wishlist
- Status line
- `PdpOffersPanel`
- `PdpScentFamily`

Owns quantity, the local “added” status, the offers open flag, and the wishlist pressed state. Those values are not read by the gallery or the composition block.

Props: `product`, `formatLabel`, review summary, description, chips, cart line, `onAdd`, scent-family inputs, and the offers product id.

`PdpScentFamily` and `PdpOffersPanel` stay in their current files. The buy box only places them.

### `pdp/PdpComposition.tsx`

Takes the composition section (about lines 840–939), including `CompItem`.

Owns `activeTab` and `tabsPaused`. The tab list is story, notes, details, wear, shipping, and authenticity.

Props: `content`, notes rows, metafields, format label, collection label, and product code. Notes data is computed in the page today; keep that computation in the page and pass the rows in, so the section does not grow a second data layer.

`CompItem` moves into this file. It is only used here. If the file crosses 250 lines, move `CompItem` to `pdp/PdpCompositionItem.tsx`.

### `pdp/PdpRelatedRail.tsx` and `pdp/PdpRelatedCard.tsx`

The page already builds two rails: “you may also like” and “more from {collection}” (about lines 512–548). One rail component receives `id`, `heading`, and `products`. The page renders it twice.

`RelatedCard` moves to `pdp/PdpRelatedCard.tsx`. It keeps using `ProductCardTags`.

The hover-image preload effect stays in the page view, next to the memos that produce the two lists.

### Done when

- `ProductDetailPageView.tsx` is a composer: load, branch, place sections.
- No section file is over about 250 lines.
- Gallery, quantity, add to bag, wishlist, offers drawer, scent family, composition tabs, reviews, companions, and both related rails behave as they do now.
- Breadcrumb, product name, and the reviews anchor still match.

## 7. Phase 2 — Product listing

Source: `src/features/catalog/components/ProductCatalogView.tsx`.

`ProductCatalogView` keeps `useCatalogPlp` (and the local price and facet state that hook does not own), the campaign-tile index math (`offerTileAt`), and the decision between loading, empty collection, and the grid. It passes values and setters down.

Do not split `useCatalogPlp` in this phase. The view is the state owner. Sections are renderers.

### `catalog/CatalogHero.tsx`

The collection header (about lines 434–465): breadcrumb, hero image, eyebrow, title, intro.

Props: `meta`, `heroAlt`. No state.

### `catalog/CatalogFilters.tsx`

The filter rail (about lines 498–728): backdrop, close, price range, fragrance family, and Apply.

The price fill percentages (`fillLeft`, `fillRight`) can be computed inside this component from `priceMin` and `priceMax`. The view keeps the numbers and the apply handler, because Apply writes the listing query.

Props: open flag, price bounds, currency, family options, selected family, and callbacks `onClose`, `onPriceChange`, `onFamilyChange`, `onApply`.

### `catalog/CatalogToolbar.tsx`

The toolbar (about lines 731–763): Filters button, “Showing N of M”, sort select.

Props: `filtersOpen`, `onToggleFilters`, `shown`, `total`, `sort`, `onSort`, `serverFiltered`.

### `catalog/CatalogGrid.tsx`

The product list (about lines 765–803), including the “no products match” line, `WishlistStatusScope`, and `PromotionCampaignTile` insertion.

Props: `products`, `collectionSlug`, campaign tiles, and a badge lookup. The grid calls `offerTileAt`. That helper moves into this file with the grid.

`CatalogInfiniteSentinel` stays where the view renders it, under the grid, because the view owns `onLoadMore`.

### `catalog/CatalogProductCard.tsx`

Move the exported `CatalogProductCard` (from about line 819) into this file. Update its imports. It is a catalog component, not a shared card. Home keeps `src/features/home/components/ProductCard.tsx`.

### Empty collection

The “Coming soon / No fragrances here yet” block (about lines 476–494) moves into `catalog/CatalogCollectionEmpty.tsx`. Leave `CatalogEmptyState.tsx` alone. They are different screens.

### Done when

- The listing view reads as layout plus the existing hook.
- Filters open and close on phone, Apply updates the query, sort changes the list, infinite load still fires, and an empty collection still shows the coming-soon block.
- `CatalogProductCard` is no longer declared inside the page file.

## 8. Phase 3 — Checkout

Source: `src/features/checkout/components/CheckoutPageView.tsx`.

`CheckoutPageView` keeps `useCheckout`, the email and address field state, Google Places binding (`applyGooglePlace`), the optimistic add-from-checkout helper, submit, and the three top-level modes: form, done, empty bag.

The breadcrumb and “Checkout” heading (about lines 337–360) can stay in the page view. They are short.

`GooglePlacesProvider` stays wrapped around the fields that use it. The page view owns that wrapper so delivery and billing share one provider.

### `checkout/CheckoutDelivery.tsx`

The Delivery box (about lines 391–498): email, full name, phone, address lines, city, region, postal code.

Props: field values, `onChange` or the existing bind helpers, and Places input props. The section does not call the checkout API.

### `checkout/CheckoutShippingMethod.tsx`

The Shipping method box (about lines 499–538).

Props: `methods`, `selectedId`, `onSelect`, `status`. The loading and “no options” copy stays inside this section.

### `checkout/CheckoutBilling.tsx`

The Billing information box (about lines 540–606), including the “same as delivery” checkbox and the extra address fields.

Props: `sameAsDelivery`, billing fields, region list, and setters.

### `checkout/CheckoutPayment.tsx`

The Payment method box (about lines 607 through the place-order button and legal line, before the summary aside).

Props: payment methods, selected id, notes, CTA label, submit state, and `onSelect`. `StripePaymentFormView` stays a sibling that this section renders when the selected method is Stripe. Do not fold Stripe into this file.

### `checkout/CheckoutSummary.tsx`

The aside “Your order” (about lines 690–784).

Props: lines, subtotal, promo snapshot, summary open flag, and the handlers the aside already uses. It renders `PromotionProgressRail` with `surface="checkout"`. That surface string is required. The cart page and the bag drawer pass their own surfaces.

### Empty and done

The done and empty sections at the bottom of the file (about lines 786–821) are small. Leave them in `CheckoutPageView` unless the page file is still long after the five extractions. If it is, move them to `checkout/CheckoutDone.tsx` and `checkout/CheckoutEmpty.tsx` without changing copy.

### Done when

- Changing delivery, shipping, billing, or payment still updates `useCheckout` the way it does now.
- Google Places still fills the address fields.
- The summary rail uses `surface="checkout"`.
- Place order, the empty bag, and the done state still render.
- `StripePaymentFormView` is unchanged except for where it is mounted.

## 9. Phase 4 — Header files

`Navbar.tsx` is already a set of functions. This phase only gives each function its own file. No behavior change.

| New file | Moves |
| --- | --- |
| `NavbarIcons.tsx` | `CaretIcon`, `SearchIcon`, `AccountIcon`, `BagIcon`, `HeartIcon` |
| `NavbarTopbar.tsx` | `NavbarTopbar` |
| `NavbarBrand.tsx` | `NavbarBrand` |
| `NavbarStart.tsx` | `NavbarStart` |
| `NavbarBoutiqueActions.tsx` | `NavbarBoutiqueActions` |
| `NavbarActions.tsx` | `NavbarActions` |
| `NavbarSearchField.tsx` | `NavbarSearchField` |
| `NavbarPrimary.tsx` | `NavbarPrimary` |
| `NavbarMobile.tsx` | `NavbarMobile` |
| `Navbar.tsx` | `NavbarShell` and the exported `Navbar` |

`NavbarSearchDropdown.tsx` stays as it is.

Do this after the three screens. The header is already componentized in spirit. The commerce screens are not.

### Done when

`Navbar.tsx` only composes the pieces. Desktop mega menu, search, bag, account, and the phone menu still match, including the in-header mobile menu (`chrome.mobileOpen`). `MobileNav.tsx` stays unused by the header and is not revived in this phase.

## 10. Phase 5 — Shared controls, only after repetition is real

Do this last, and only for a control that the finished splits actually duplicate.

Candidates to look for, in this order:

| Control | Where it might repeat | Action |
| --- | --- | --- |
| Copper text button | Add to bag, place order, filter apply, empty-state CTA | Extract `src/components/ui/Button.tsx` only if two features would otherwise copy the same button markup. Map the existing class string onto a `variant` prop. |
| Text field with a label | Checkout delivery and billing, and the auth fields if the markup matches | Extract `src/components/ui/TextField.tsx` only when the label, input, and error pattern are the same. Auth already has `AuthFormControls`. Prefer extending that pattern over a third field style. |
| Checkbox | Auth remember-me, checkout billing-same | Extract only if both can share one control without changing the auth SVG checkmark. |

Rules:

- A control used by one feature stays in that feature. Account’s `AccountCard` is the model.
- Do not generate components for every export in `pdpChrome.ts`, `checkoutChrome.ts`, or `siteChrome.ts`.
- `SideSheet`, `PhoneNumberField`, `PageLoading`, and `Toaster` stay the shared set until a new control earns a place beside them.
- Export any new control from `src/components/ui/index.ts`.

### Done when

The shared folder gained a component only because two features render it, and the screens that adopted it are unchanged visually.

## 11. Import and folder rules after the split

Each feature keeps this layout:

```
src/features/<feature>/
  index.ts          public surface for routes and other features
  components/       page views and sections
  hooks/
  api/
  types/
  schemas/          when the feature has them
  utils/
```

Section folders (`pdp/`, `catalog/`, `checkout/`) are allowed inside `components/` so the page view stays easy to find. Do not create a new top-level `src/features` module for a section.

`src/features/catalog/index.ts` continues to export `ProductDetailPageView` and the catalog service functions. It does not start exporting `PdpGallery` or `CatalogFilters`.

When a phase edits a file that imports another feature by a deep path, switch that import to the barrel if the symbol is already exported. Do not run a separate cleanup of every deep import in the repo.

## 12. Order of work

| Step | Work | Why this order |
| --- | --- | --- |
| 1 | Product page | Largest file, and the sections are already visible in the JSX. |
| 2 | Listing | Same feature, so the catalog folder conventions settle before checkout. |
| 3 | Checkout | Payment and address state is the riskiest split. Doing it after the pattern is proven on catalog. |
| 4 | Header files | Mechanical move of functions that already exist. |
| 5 | Shared controls | Only what steps 1–3 proved is duplicated. |

One step ends before the next starts. A step is one pull request when the work is committed. Do not mix a product-page extraction with a checkout extraction.

## 13. Verification for every step

Check these on the running storefront. Appearance and behavior should match the screen before the extraction.

Product page:

- Load a sellable product. Gallery thumbs change the bottle. A broken image falls back.
- Change quantity and add to bag. The status line appears. The bag count updates.
- Open offers. Scent family renders when the product has one.
- Composition tabs switch story, notes, details, wear, shipping, and authenticity.
- Reviews anchor works. Both related rails render cards.
- Repeat the gallery, buy box, and tabs at about 390px wide and at about 768px wide.

Listing:

- `/products` shows the count, sort, and filters.
- Open filters on a phone, change price, apply, and confirm the list updates.
- A collection with no products shows “No fragrances here yet”, not the other empty state.
- Infinite scroll still requests the next page when the listing is server-filtered.

Checkout:

- Empty bag, a bag with lines, delivery fields, Places autofill, shipping methods, billing same-as-delivery, payment choice, summary totals, and the progress rail.
- Confirm the cart page and the bag drawer still use their own progress-rail surfaces.

Header, after phase 4:

- Desktop nav, search dropdown, bag button, account, and the phone hamburger menu.

## 14. Risks

- Product page state is easy to split in the wrong place. Gallery index and composition tab stay inside their sections. Cart mutations stay in the page.
- Checkout field bindings are shared across delivery and billing. The page keeps the state object. Sections receive slices and setters. Do not give each section its own copy of the address.
- `PromotionProgressRail` defaults and the explicit `surface` prop are load-bearing. Checkout must keep `surface="checkout"`. Cart must keep `surface="cart"`. The drawer must keep `surface="drawer"`.
- `CatalogProductCard` is exported from the listing file today. Grep for that export before moving it, and update every importer in the same step.
- Moving navbar functions can break a circular import if icons and menu components import each other. Icons stay in `NavbarIcons.tsx` and are imported one way.

## 15. Later, not this plan

These are real gaps. They are not part of making the component structure enterprise-level, and they wait until this plan is done or until they are asked for on their own.

| Item | Why it waits |
| --- | --- |
| Test suite | Already deferred. Add tests around the extracted sections after the files settle, starting with checkout field binding and listing filter apply. |
| Placeholder pages | Our story, blog, stores, gift cards, gift box, and subscriptions have no backend yet. |
| Pull-request checks | The repo workflow deploys. It does not lint or typecheck on pull requests. |
| Error reporting | There is no app `error.tsx` and no client error reporter. |
| Production API host | `src/lib/config/env.ts` falls back to the Azure dev API host when the public env var is missing. That is configuration, not structure. |

## 16. Definition of done for the whole plan

- `ProductDetailPageView`, `ProductCatalogView`, and `CheckoutPageView` are composers. Each section file is about 250 lines or under.
- `Navbar.tsx` composes files that match the functions it already has.
- Shared UI grew only where two features share a control.
- Routes, feature barrels, Tailwind class modules, and `globals.css` are unchanged in role.
- Desktop, tablet, and phone checks in section 13 passed for every phase.
- No placeholder page was rewritten, and no test suite was added as part of this plan.
