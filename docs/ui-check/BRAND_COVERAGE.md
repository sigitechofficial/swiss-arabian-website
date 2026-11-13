# Brand design coverage — Swiss Arabian + Sapil (2026-11-13)

Branch `fix/brand-design-coverage` (from `feat/multibrand-sapil` @ `fd5450c`). Goal: every route of
both storefronts renders in its **own** design system, and neither is missing pages.

**How it was checked**
- Production builds of both brands (`next build` + `next start`, local API `:3012`): Sapil on
  `:3060` (`SAPIL`, `sapil.test`), Swiss Arabian on `:3061`, and the pre-program Swiss Arabian
  baseline (`5a55282`, throwaway worktree) on `:3062`.
- `scripts/brand-coverage-sweep.mjs`: every route under `src/app/[locale]` except `(dev)`, English
  and `/ar`, at 1280 then 390 px (headless Chrome via `puppeteer-core` from the npx cache). Per page:
  status, final address, `lang` / `dir`, horizontal scroll, broken images, same-origin 4xx,
  console errors, and brand checks:
  - **Sapil:** visible content outside the `[data-brand="sapil"]` root, the text "Swiss Arabian",
    Swiss Arabian assets (logo, loading bottle gif), Swiss Arabian fonts (Benton Sans, GE SS,
    Cormorant) in use.
  - **Swiss Arabian:** any Sapil root or `sapil-` class, the text "Sapil", Sapil fonts in use.
- Swiss Arabian now vs `5a55282`: `--compare` (visible text equality + % of differing pixels per
  viewport screenshot).
- `src/brands/sapil/brandCoverage.test.ts` (unit): Sapil's `brand-ui.ts` re-exports no visible
  Swiss Arabian view except those of sections Sapil has switched off.
- Signed-in account pages were not swept (no test customer was created); signed out they redirect to
  the brand's sign-in page, which was checked. Sapil's signed-in account views are Sapil's own
  (`brandCoverage.test.ts` + the earlier review).

Screenshots of the new Sapil views: `docs/ui-check/brand-coverage/`.

## Gaps found and fixed

| # | Gap | Fix |
|---|---|---|
| 1 | Brand `features` were never enforced: Sapil served `/stores`, `/subscriptions/**`, rewards, membership, employee benefits in Swiss Arabian's design | `src/lib/brand/features.ts` (switch → routes), proxy 404 for switched-off sections (server-rendered, brand chrome, status 404, also for sign-in-only pages), `requireBrandFeature()` in every page of those sections, links filtered (CMS menus, account tabs + tiles, mobile menu, `/pages` → `/stores` redirect, sitemap). New switch `employeeBenefits` (Swiss Arabian on, Sapil off). Sapil `blog: true` (v9 blog design). |
| 2 | `/pages/[handle]`, `/policies/[handle]` drew Swiss Arabian's `SitePageView` on Sapil | `SitePageRouteBase` (shared logic) + each brand's `SitePageRoute`; Sapil: `SapilSitePageRoute` (Sapil view + Sapil preview band) |
| 3 | `/preview/home` drew Swiss Arabian's `CmsSectionList` on Sapil | shared `loadCmsPreviewHome()`; Sapil: `SapilCmsPreviewHome` (`SapilHomeSections`, state panels) |
| 4 | `/review/[token]` and `/offers/[code]` were Swiss Arabian's | hooks `useReviewRequest` / `useReviewRequestCard`, `useOfferShop` (Swiss Arabian unchanged); Sapil views `SapilReviewRequestPage`, `SapilOfferPage` (copy `review.json`, `offers.json`, en + ar). Contract `OfferShop` → `OfferPageView`. |
| 5a | `PageLoading` drew Swiss Arabian's perfume-bottle medallion (terra ring) on Sapil — also the account sign-in check | `SapilPageLoading` (pastel tiles, own Sapil root, page language); the account layout passes the brand's `PageLoading` to `AuthGuard` |
| 5b | `FeaturePlaceholder` and `FooterSeoText` were Swiss Arabian-styled; `/our-story` fallback showed **Swiss Arabian's brand history** on Sapil | `SapilFeaturePlaceholder`, `SapilFooterSeoText` (shared `useCollapsibleText`), contract `OurStoryFallbackView` (Sapil: own words) |
| 5c | `MarketSeoTextSlot`, `CatalogJsonLd` | brand-neutral (a path-based slot, a JSON-LD script): kept shared |
| 6 | (sweep) Shared `GiftChoiceHost` opened Swiss Arabian's free-gift modal on Sapil | `useGiftChoiceDialog`; host takes the brand's dialog; `SapilGiftChoiceDialog` (v9 `Dialog`) |
| 7 | (sweep) Every Sapil `/ar` page: buttons and fields used Swiss Arabian's Arabic font stack ("GE SS", from `globals.css`) | `theme.css`: inside the Sapil root they inherit Sapil's font |
| 8 | (sweep) Sign-in-only pages of switched-off sections answered 200 (their `notFound()` sits behind the client `AuthGuard`) | the proxy gate above |

## Route × brand

Legend: ✅ = drawn in the brand's own design system, no other-brand markup / text / font / asset,
no horizontal scroll at 1280 or 390. "404-view" = the page's own `notFound()` (drawn after
hydration). SA vs `5a55282`: % of differing pixels in the viewport screenshot at 1280 / 390, and
whether the visible text is identical.

**Summary** (60 routes × 2 languages per brand, each at 1280 and 390 px):
- **Sapil:** every page is drawn inside the Sapil root, with Sapil fonts, no Swiss Arabian text,
  logo, loading gif or font, no horizontal scroll, no broken image. Switched-off sections
  (`/stores`, rewards, membership, subscriptions ×5, employee benefits, `/gift-box`) answer **404**
  with Sapil's 404 view; `/gift-cards` is 404 for both brands (not built). Sapil has no blog posts,
  CMS pages or offers in the local data, so `/blog/[slug]`, `/pages/*`, `/policies/*` and
  `/offers/[code]` show Sapil's 404 (their filled views are covered by unit tests). (`/policies/privacy-policy` was flagged once
  while the client-side 404 view was swapping in; it passed on a re-check.)
- **Swiss Arabian:** the only ❌ is `/ar/cart` scrolling sideways at 390 px, the same on `5a55282`.
  No Sapil markup, text or font anywhere. Visible text is identical to the
  pre-program build `5a55282` on every page except: `/products/p/2` and `/collections/*/p/2`
  (404 before; pagination routes added by the program), in-page 404s (the program's newer 404
  layout: same words, shorter block — none of this branch's files), and the product page's
  "Details" panel content (see "Still open"). The remaining pixel differences have identical text
  and come from animation timing (hero fade, carousels, sign-in redirect mid-swap).
- **Sapil v9 visual diff** (`scripts/sapil-visual-diff.mjs`, Sapil build with the kit, 390 / 1280):
  card, buttons, subnav, announcement, section head, steps, crumbs, shop toolbar, PDP pyramid
  0.00 %; shop grid 0.88 / 0.77, shop hero 0.60 / 0.22, PDP gallery 0.31 / 0.21, PDP buy row
  0.09 / 0.06, fields 1.62 / 0, radio cards 1.26 / 0 (the known 16 px input rule at < 768 px),
  shell header 0.27 / 1.45, footer 7.46 / 5.54 (intended copy), hero intro 20.2 / 10.1 (real
  data and font wrap) — the same picture as the earlier reviews; nothing this branch touched
  moved.

| Route | Swiss Arabian view | SA result (en / ar) | SA vs `5a55282` (px diff 1280/390) | Sapil view | Sapil design | Sapil result (en / ar) |
|---|---|---|---|---|---|---|
| `/` | HomePageView | ar ✅ 200<br>en ✅ 304 | ar 1.27/0% text =<br>en 0/12.16% text = | SapilHomePage | v9 ✅ (note-by-note) | ar ✅ 200<br>en ✅ 304 |
| `/products` | ProductsListing | ar ✅ 200<br>en ✅ 304 | ar 0/0% text =<br>en 0.15/0% text = | SapilProductsListing | v9 ✅ (shop) | ar ✅ 200<br>en ✅ 304 |
| `/products/p/2` | ProductsListing | ar ✅ 200<br>en ✅ 200 | ar 50.37/57.66% text ≠<br>en 50.38/56.05% text ≠ | SapilProductsListing | v9 ✅ (shop) | ar ✅ 200<br>en ✅ 200 |
| `/products/{product}` | ProductDetailPageView | ar ✅ 200<br>en ✅ 200 | ar 0/0% text ≠<br>en 0/0% text ≠ | SapilProductRoute | v9 ✅ (product) | ar ✅ 200<br>en ✅ 200 |
| `/collections` | CollectionsPageView | ar ✅ 200<br>en ✅ 200 | ar 3.41/0% text =<br>en 3.59/0% text = | SapilCollectionsPage | v9 system | ar ✅ 200<br>en ✅ 200 |
| `/collections/{collection}` | CollectionListing | ar ✅ 200<br>en ✅ 200 | ar 0.07/0% text =<br>en 0/0% text = | SapilCollectionListing | v9 ✅ (collection) | ar ✅ 200<br>en ✅ 200 |
| `/collections/{collection}/p/2` | CollectionListing | ar ✅ 200<br>en ✅ 200 | ar 64.51/62.02% text ≠<br>en 64.46/61.1% text ≠ | SapilCollectionListing | v9 ✅ (collection) | ar ✅ 200<br>en ✅ 200 |
| `/categories/{category}` | CategoryListing | ar ✅ 404<br>en ✅ 404 | ar 22/21.07% text ≠<br>en 22.62/23.3% text ≠ | SapilCategoryListing | v9 ✅ (collection) | ar ✅ 200<br>en ✅ 200 |
| `/categories/{category}/p/2` | CategoryListing | ar ✅ 404<br>en ✅ 404 | ar 0/0% text =<br>en 0/0% text = | SapilCategoryListing | v9 ✅ (collection) | ar ✅ 200<br>en ✅ 200 |
| `/search?q=oud` | SearchPageView | ar ✅ 200<br>en ✅ 200 | ar 0.01/0% text =<br>en 3.81/0% text = | SapilSearchRoute | v9 system (shop grid) | ar ✅ 200<br>en ✅ 200 |
| `/cart` | CartPageView | ar ❌ 200 (h-scroll)<br>en ✅ 200 | ar 0/0% text =<br>en 0.1/0% text = | SapilCartPage | v9 system | ar ✅ 200<br>en ✅ 200 |
| `/checkout` | CheckoutPageView | ar ✅ 200<br>en ✅ 200 | ar 0/0% text =<br>en 2.84/0% text = | SapilCheckoutPage | v9 ✅ (checkout) | ar ✅ 200<br>en ✅ 200 |
| `/checkout/payment/cancel` | PaymentCancelView | ar ✅ 200<br>en ✅ 200 | ar 0.02/17.96% text =<br>en 0/0% text = | SapilPaymentCancel | v9 system | ar ✅ 200<br>en ✅ 200 |
| `/checkout/payment/success` | PaymentSuccessView | ar ✅ 200<br>en ✅ 200 | ar 2.82/0% text =<br>en 3.19/0% text = | SapilPaymentSuccess | v9 system | ar ✅ 200<br>en ✅ 200 |
| `/checkout/payment/paymob` | PaymobPaymentFormView | ar ✅ 200<br>en ✅ 200 | ar 0/0% text =<br>en 0/0% text = | SapilPaymobPaymentForm | v9 system | ar ✅ 200<br>en ✅ 200 |
| `/checkout/payment/stripe` | StripePaymentFormView | ar ✅ 200<br>en ✅ 200 | ar 0/0% text =<br>en 3.54/0% text = | SapilStripePaymentForm | v9 system | ar ✅ 200<br>en ✅ 200 |
| `/order-confirmation/00000000-0000-0000-0000-000000000000` | OrderConfirmationView | ar ✅ 200<br>en ✅ 200 | ar 0/0% text =<br>en 0/0% text = | SapilOrderConfirmationPage | v9 ✅ (order) | ar ✅ 200<br>en ✅ 200 |
| `/payments/tabby/return` | TabbyReturnView | ar ✅ 200<br>en ✅ 200 | ar 0/0% text =<br>en 0/0% text = | SapilTabbyReturn | v9 system | ar ✅ 200<br>en ✅ 200 |
| `/payments/telr/return` | TelrReturnView | ar ✅ 200<br>en ✅ 200 | ar 0/0% text =<br>en 0/0% text = | SapilTelrReturn | v9 system | ar ✅ 200<br>en ✅ 200 |
| `/track` | TrackLookupView | ar ✅ 200<br>en ✅ 200 | ar 0/0% text =<br>en 0.46/17.76% text = | SapilTrackLookupPage | v9 system | ar ✅ 200<br>en ✅ 200 |
| `/track/UNKNOWN-1` | GuestTrackingPageView | ar ✅ 200<br>en ✅ 200 | ar 0/0% text =<br>en 0/0% text = | SapilGuestTrackingPage | v9 system (order view) | ar ✅ 200<br>en ✅ 200 |
| `/login` | LoginPageView | ar ✅ 200<br>en ✅ 200 | ar 24.11/0% text =<br>en 0/0% text = | SapilLoginPage | v9 system | ar ✅ 200<br>en ✅ 200 |
| `/register` | RegisterPageView | ar ✅ 200<br>en ✅ 200 | ar 31.09/0% text =<br>en 29.68/0% text = | SapilRegisterPage | v9 system | ar ✅ 200<br>en ✅ 200 |
| `/verify` | VerifyPageView | ar ✅ 200<br>en ✅ 200 | ar 18.69/0% text =<br>en 0/0% text = | SapilVerifyPage | v9 system | ar ✅ 200<br>en ✅ 200 |
| `/forgot-password` | ForgotPasswordPageView | ar ✅ 200<br>en ✅ 200 | ar 0/0% text =<br>en 28.94/0% text = | SapilForgotPasswordPage | v9 system | ar ✅ 200<br>en ✅ 200 |
| `/reset-password` | ResetPasswordPageView | ar ✅ 200<br>en ✅ 200 | ar 0/0% text =<br>en 0.05/0% text = | SapilResetPasswordPage | v9 system | ar ✅ 200<br>en ✅ 200 |
| `/account` | AccountPageView | ar ✅ 200<br>en ✅ 200 | ar 23.05/3.53% text =<br>en 23.59/0% text = | SapilAccountPage | v9 system | ar ✅ 200<br>en ✅ 200 |
| `/account/addresses` | AccountAddressesPageView | ar ✅ 200<br>en ✅ 200 | ar 4.68/3.53% text =<br>en 0/0% text = | SapilAccountAddressesPage | v9 system | ar ✅ 200<br>en ✅ 200 |
| `/account/orders` | PurchaseHistoryPageView | ar ✅ 200<br>en ✅ 200 | ar 7.24/3.53% text =<br>en 5.26/0% text = | SapilOrdersPage | v9 ✅ (your orders) | ar ✅ 200<br>en ✅ 200 |
| `/account/orders/x` | AccountOrderDetailPageView | ar ✅ 304<br>en ✅ 304 | ar 4.72/3.53% text =<br>en 0/0% text = | SapilOrderDetailPage | v9 system (order view) | ar ✅ 304<br>en ✅ 304 |
| `/account/payments` | PaymentsPageView | ar ✅ 200<br>en ✅ 200 | ar 4.68/3.53% text =<br>en 0/0% text = | SapilPaymentsPage | v9 system | ar ✅ 200<br>en ✅ 200 |
| `/account/profile` | AccountProfilePageView | ar ✅ 200<br>en ✅ 200 | ar 10.69/3.53% text =<br>en 7.78/0% text = | SapilAccountProfilePage | v9 system | ar ✅ 200<br>en ✅ 200 |
| `/account/returns` | AccountAfterSalesPageView | ar ✅ 200<br>en ✅ 200 | ar 4.68/3.53% text =<br>en 0/0% text = | SapilAccountAfterSalesPage | v9 system | ar ✅ 200<br>en ✅ 200 |
| `/account/reviews` | AccountReviewsPageView | ar ✅ 200<br>en ✅ 200 | ar 4.68/3.53% text =<br>en 25.41/0% text = | SapilAccountReviewsPage | v9 system | ar ✅ 200<br>en ✅ 200 |
| `/account/saved` | AccountWishlistPageView | ar ✅ 200<br>en ✅ 200 | ar 24.89/3.53% text =<br>en 4.15/0% text = | SapilAccountWishlistPage | v9 system | ar ✅ 200<br>en ✅ 200 |
| `/account/security` | AccountSecurityPageView | ar ✅ 200<br>en ✅ 200 | ar 29.86/3.53% text =<br>en 0/0% text = | SapilAccountSecurityPage | v9 system | ar ✅ 200<br>en ✅ 200 |
| `/account/wishlist` | AccountWishlistPageView | ar ✅ 200<br>en ✅ 200 | ar 30.92/3.53% text =<br>en 0/0% text = | SapilAccountWishlistPage | v9 system | ar ✅ 200<br>en ✅ 200 |
| `/account/rewards` | AccountRewardsPageView | ar ✅ 200<br>en ✅ 200 | ar 4.68/3.53% text =<br>en 4.29/0% text = | — (loyalty off → 404) | 404 | ar ✅ 404<br>en ✅ 404 |
| `/account/membership` | AccountPlaceholderPageView | ar ✅ 200<br>en ✅ 200 | ar 4.68/3.53% text =<br>en 0/0% text = | — (loyalty off → 404) | 404 | ar ✅ 404<br>en ✅ 404 |
| `/account/subscription` | AccountSubscriptionsPageView | ar ✅ 200<br>en ✅ 200 | ar 6.22/3.53% text =<br>en 25.98/0% text = | — (subscriptions off → 404) | 404 | ar ✅ 404<br>en ✅ 404 |
| `/account/subscription/x` | AccountSubscriptionDetailPageView | ar ✅ 200<br>en ✅ 200 | ar 12.3/3.53% text =<br>en 0/0% text = | — (subscriptions off → 404) | 404 | ar ✅ 404<br>en ✅ 404 |
| `/account/employee-benefits` | AccountEmployeeBenefitsPageView | ar ✅ 200<br>en ✅ 200 | ar 4.68/3.53% text =<br>en 0/0% text = | — (employeeBenefits off → 404) | 404 | ar ✅ 404<br>en ✅ 404 |
| `/blog` | BlogPageView | ar ✅ 200<br>en ✅ 200 | ar 46.07/1.8% text =<br>en 0/0% text = | SapilBlogPage | v9 ✅ (blog) | ar ✅ 200<br>en ✅ 200 |
| `/blog/{post}` | BlogArticlePageView | ar ✅ 404<br>en ✅ 200 | ar 21.12/20.35% text ≠<br>en 0/0% text = | SapilBlogArticlePage | v9 system | ar ✅ 404<br>en ✅ 404 |
| `/faq` | FaqPageView / SitePageView | ar ✅ 200<br>en ✅ 200 | ar 0/0% text =<br>en 0.45/14.02% text = | SapilFaqPage / SapilSitePage | v9 system | ar ✅ 200<br>en ✅ 200 |
| `/our-story` | SitePageView / OurStoryFallbackView | ar ✅ 200<br>en ✅ 200 | ar 32.73/0% text =<br>en 5.05/29.91% text = | SapilSitePage / SapilOurStoryFallback | v9 system | ar ✅ 200<br>en ✅ 200 |
| `/stores` | SitePageView / FeaturePlaceholder | ar ✅ 200<br>en ✅ 200 | ar 0/0% text =<br>en 0/0% text = | — (storeLocator off → 404) | 404 | ar ✅ 404<br>en ✅ 404 |
| `/gift-box` | — (not built) | ar ✅ 404<br>en ✅ 404 | ar 21.12/20.35% text ≠<br>en 21.57/21.98% text ≠ | — (giftBox off → 404) | 404 | ar ✅ 404<br>en ✅ 404 |
| `/gift-cards` | — (not built) | ar ✅ 404<br>en ✅ 404 | ar 20.64/20.35% text ≠<br>en 21.57/21.98% text ≠ | — (not built) | 404 | ar ✅ 404<br>en ✅ 404 |
| `/pages/{page}` | SitePageRoute | ar ✅ 200<br>en ✅ 200 | ar 0/0% text =<br>en 6.11/0% text = | SapilSitePageRoute | v9 system | ar ✅ 404<br>en ✅ 404 |
| `/policies/{policy}` | SitePageRoute | ar ✅ 200<br>en ✅ 200 | ar 0/0% text =<br>en 3.02/0% text = | SapilSitePageRoute | v9 system | ar ✅ 404<br>en ✅ 404 |
| `/preview/home` | CmsPreviewHomeView | ar ✅ 200<br>en ✅ 200 | ar 0/0% text =<br>en 4.36/0% text = | SapilCmsPreviewHome | v9 system (home sections) | ar ✅ 200<br>en ✅ 200 |
| `/review/sweep-token` | ReviewRequestPageView | ar ✅ 200<br>en ✅ 200 | ar 0/0% text =<br>en 3.91/0% text = | SapilReviewRequestPage | v9 system | ar ✅ 200<br>en ✅ 200 |
| `/offers/{offer}` | OfferPageView | ar ✅ 404<br>en ✅ 404 | ar 51.72/24.35% text ≠<br>en 21.04/21.98% text ≠ | SapilOfferPage | v9 system | ar ✅ 404<br>en ✅ 404 |
| `/subscriptions` | SubscriptionsPageView | ar ✅ 200<br>en ✅ 200 | ar 1.31/0% text =<br>en 0/0% text = | — (subscriptions off → 404) | 404 | ar ✅ 404<br>en ✅ 404 |
| `/subscriptions/{plan}` | SubscriptionsPageView | ar ✅ 200<br>en ✅ 200 | ar 0/0% text =<br>en 0/0% text = | — (subscriptions off → 404) | 404 | ar ✅ 404<br>en ✅ 404 |
| `/subscriptions/{plan}/checkout` | SubscriptionCheckoutPageView | ar ✅ 200<br>en ✅ 200 | ar 0/0% text =<br>en 3.3/0% text = | — (subscriptions off → 404) | 404 | ar ✅ 404<br>en ✅ 404 |
| `/lp/sweep-id` | (landing pages, own layout) | ar ✅ 404<br>en ✅ 404 | ar 2.5/0% text =<br>en 0/0% text = | (landing pages, own layout) | n/a | ar ✅ 404<br>en ✅ 404 |
| `/shop-unavailable` | ShopUnavailableView | ar ✅ 200<br>en ✅ 200 | ar 0/0% text =<br>en 0/0% text = | SapilShopUnavailableView | v9 system | ar ✅ 200<br>en ✅ 200 |
| `/no-such-page-sweep` | NotFoundView (global-not-found) | ar ✅ 404<br>en ✅ 404 | ar 0/0% text =<br>en 0/0% text = | SapilNotFoundView | v9 system | ar ✅ 404<br>en ✅ 404 |

## Still open (not fixed here, with the reason)

- **Sapil announcement links to `/shop?maxPrice=99`** (CMS data from the Sapil demo seed): there
  is no `/shop` route, so every Sapil page prefetches two 404s and the link 404s. Fix the
  announcement in the admin (→ `/products?under=99`); not changed here because it is content.
- **Swiss Arabian product page "Details" panel** (family, perfumer, format, collection, origin) shows
  no rows in this build where `5a55282` showed them. This branch does not touch the product page;
  it comes from earlier program work or the data. Needs a look by whoever owns the PDP.
- **Swiss Arabian `/ar/cart` scrolls sideways at 390 px** — the same on `5a55282` (pre-existing).
- **Signed-in account pages** were not swept (no test customer created); Sapil's account views are
  its own (unit-checked), and the switched-off ones 404 before sign-in.
- **No Sapil data** for blog posts, CMS pages, offers, a filled Draft preview or a review token: those
  Sapil views are covered by unit tests (`SapilReviewOfferPages.test.tsx`,
  `SapilCmsPreviewHome.test.tsx`, `sitePageRouteBase.test.tsx`) but were not seen with real data.
  The offer and review pages have no v9 design: design review needed.
- **Still Swiss Arabian inside Sapil checkout** (known, unchanged): the inline card / wallet forms
  (`InlineMethodPayment`), `TabbyCheckoutCard` and the Paymob 3-D Secure overlay sentence.
- **`PageLoading` labels:** routes pass English labels ("Loading wishlist…"); Sapil shows the
  generic "Loading…" in the page's language instead. Swiss Arabian still shows the English label
  on `/ar` (unchanged).
- **Arabic web font for Sapil** (decision 7) is still open: Arabic glyphs use the system font.

