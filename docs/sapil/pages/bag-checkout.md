# Sapil: bag drawer, bag page, checkout, payment screens

v9 source: the bag drawer markup on every page (`.drawer`, rendered by `renderBag()` in
`sapil-v9.js`), `sapil-v9-checkout.html` and `assets/sapil-v9.css` (CHECKOUT block, Bag
drawer blocks). Every number in the v9 JavaScript is mock (`totals()`, `DELIVERY`, `PROMOS`,
COD fee, VAT, free-delivery threshold, orders in localStorage); here the cart, checkout,
promotions and markets APIs own all of them.

## Routes and components

| Where | `@brand-ui` name / export | Sapil component |
|---|---|---|
| Bag drawer (every page) | `SapilBagDrawer` (rendered by the Sapil shell) | `components/bag/SapilBagDrawer.tsx` → `SapilBagDrawerView.tsx` |
| `/cart` | `CartPageView` | `pages/checkout/SapilCartPage.tsx` |
| `/checkout` | `CheckoutPageView` | `pages/checkout/SapilCheckoutPage.tsx` (+ `components/checkout/CheckoutParts.tsx`) |
| `/checkout/payment/paymob`, `/stripe`, `/success`, `/cancel`, `/payments/tabby/return`, `/payments/telr/return` | `PaymobPaymentFormView`, `StripePaymentFormView`, `PaymentSuccessView`, `PaymentCancelView`, `TabbyReturnView`, `TelrReturnView`, `CheckoutStateShell`, `CheckoutSpinnerState` | `pages/checkout/SapilPaymentScreens.tsx` |

### Using the drawer (shell agent)

```tsx
import { SapilBagDrawer } from "@/brands/sapil/components/bag/SapilBagDrawer";
// inside <SapilRoot> + <SapilCopyProvider>, once per page:
<SapilBagDrawer />
```

It opens and closes with `useUiStore().cartOpen` (the header bag button calls
`setCartOpen(true)`; add-to-bag opens it). It needs no props. The shell should also keep
mounting `GiftChoiceHost` (free-gift chooser, still Swiss-styled) and must not mount
`CartSideSheet`.

## Data sources (shared hooks only)

| Part | Source |
|---|---|
| Lines, quantities, remove, amount due, checkout blocking | `useBag()` (cart store + optimistic cart API) |
| Line prices / was-prices | cart line unit price × quantity, minus the quote's line allocation (`lineMerchandiseDiscount`) |
| Bundle tags | `setBundleLineLabel` → `bundleTags()` |
| Free-delivery card, checkout trust chip | `useMarketDelivery()` → `GET /storefront/markets` `delivery.freeDeliveryThreshold` vs the bag's net subtotal; falls back to a free-shipping promotion (`useFreeShippingBar`); hidden when the market has neither |
| Promotion progress line | `useApplicablePromotions().data.progress` (server sentence) |
| Free gifts | `useGiftAwards()` (notices, "choose your gift", awarded gifts with catalog data) |
| Promo code | `useCouponForm()` |
| Checkout: contact, address, saved-address prefill, session, totals, Tabby pre-score, submit | `useCheckoutForm()` (wraps `useCheckout`) |
| Delivery methods (name, ETA days, fee) | `GET …/delivery-methods` via `useCheckout` |
| Payment methods (card / wallets / Tabby / COD / redirect) | `GET …/payment-methods` via `usePaymentOptions()`; COD only when the API lists it, **no COD fee** (the platform has none) |
| Card / wallet forms, Tabby widget | `InlineMethodPayment`, `TabbyCheckoutCard` (provider logic untouched) |
| Bag page totals, validation before checkout | `useBagPage()` |

## Hooks extracted (Swiss Arabian components now use them, no visible change)

| Hook / util | Swiss Arabian component |
|---|---|
| `features/cart/hooks/useBag.ts` (`useBag`, `isRemoteLine`), `utils/bundleTags.ts` | `CartSideSheet` |
| `features/cart/hooks/useBagPage.ts` | `CartPageView` |
| `features/promotions/hooks/useGiftAwards.ts` | `GiftWithPurchase` |
| `features/promotions/hooks/useCouponForm.ts` | `CouponForm` |
| `features/checkout/hooks/useCheckoutForm.ts` (+ `applyGooglePlace`, `EMPTY_ADDRESS`) | `CheckoutPageView` (the CTA wording stays in the view: `ctaKind`) |
| `features/checkout/hooks/usePaymentOptions.ts`, `utils/paymentOptions.ts` (rows now carry `kind`, `method`, `tabbyState`) | `CheckoutPayment` |
| `CheckoutStateUiProvider` slot in `CheckoutStateShell.tsx` | all payment screens (default = Swiss frame) |
| `features/markets/hooks/useMarketDelivery.ts`, market `delivery` / `priceEditTiers` types | new (Sapil) |

Tests: `useBag.spec.ts`, `paymentOptions.spec.ts` (payment rows, order confirmation
details), `brands/sapil/components/bag/bag.test.tsx` (free-delivery mapping, drawer view).

## Checkout flow

- One `<form id="checkout-form">` holds both v9 steps (provider forms submit it by id):
  **Delivery** (Contact, Delivery address, Delivery method) → "Continue to payment"
  checks the fields client-side (inline message under each field, focus moves to the first
  problem) → **Payment** (review with Change, payment cards, billing address) → place order
  through `submitCheckout` (address → validate → place → pay; Stripe / Paymob forms,
  hosted redirects and COD exactly as Swiss Arabian).
- Focus moves to the new step's heading on every step change; the tracker marks the
  current step with `aria-current="step"`; "Bag" (done) reopens the drawer.
- Summary: lines with compact steppers (changes rebuild the checkout session), free gifts,
  promo code, subtotal / discount / delivery / delivery discount / VAT / gift cards, grand
  total `<small>AED</small> 79`, "Includes … VAT" when prices include it. Folds behind
  "Show order summary" at ≤900px.
- States: loading skeleton (before the bag rehydrates), empty bag, unavailable item,
  not-orderable lines, API error with "Try again", "Loading delivery / payment options".

## Visual diff (v9 vs `/sapil-kit/commerce`, % pixels differing)

`node scripts/sapil-visual-diff.mjs --only=drawer,drawer-empty,co-head,co-method,co-summary,co-review,co-empty`
with the kit served by a Sapil build (the kit routes (`page.dev.tsx`) exist only in `next dev`, in a Sapil build, or in a build made with `SAPIL_KIT=1` (a build-time rule in `next.config.ts`: a Swiss Arabian production build has no kit route and ships none of its code); a production server also needs `SAPIL_KIT=1` at runtime, else the page 404s. In practice: build **and** start the Sapil build with `SAPIL_KIT=1`). Fixtures copy the v9 mock values
(Berry Crush AED 63 / was AED 90, free over AED 100, standard AED 16).

| element (v9 source) | 390 | 768 | 1280 | 1440 |
|---|---|---|---|---|
| Bag drawer, Berry Crush ×1 (`#drawer`) | 0.10 | 0.09 | 0.09 | 0.09 |
| Bag drawer, empty | 0.16 | 0.16 | 0.16 | 0.16 |
| Checkout heading + tracker (`#coHead`) | 1.02 | 0.52 | 0.56 | 0.56 |
| Delivery method fieldset (`#shipOpts`) | 0.00 | 0.00 | 0.00 | 0.00 |
| Order summary (`#summary`, opened on phones) | 0.69 | 0.15 | 0.18 | 0.16 |
| Review (`#review`, payment step) | 0.00 | 0.00 | 0.00 | 0.00 |
| Empty bag (`#coEmpty`) | 17.18* | 6.50* | 6.12* | 5.40* |
| (design system, re-checked) Contact fieldset / pay radio cards / steps | 1.62† / 1.26† / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |

\* intended: one CTA instead of v9's demo "Add a sample bag" button (at 390px v9's two
buttons wrap onto two lines, so the card is also 58px taller).
† the host's 16px input font at <768px (design-system known difference).
Heading at 390: sub-pixel glyph placement of the Gloock title only.
Run on the production Sapil build (`next start`), Chromium 1217, 2026-11-13.

## Known differences from v9

- **Express checkout row** (Apple Pay / Google Pay / tabby buttons above the form) is not
  shown: in v9 they only toast; real wallets are Stripe surfaces in the payment step.
- **Newsletter checkbox** in Contact and **Notes for the courier** are not shown: checkout
  has no consent or courier-notes field yet (needs backend support).
- **Empty bag**: one CTA ("Shop all fragrances"); v9's "Add a sample bag" is a demo.
- **Promo message**: no "First order? Try SAPIL10" (mock); shows the applied code or the
  error. Trust chips: "Secure checkout" + "Free delivery over …" from the market; v9's
  "Easy 7-day returns" / "Order updates on WhatsApp" are promises Sapil hasn't confirmed.
- **Delivery ETA**: "1–3 working days" from the method's min/max days; v9's computed
  "arrives by Tue 17 Nov" is not shown (no business calendar in the API).
- **Drawer delivery row**: "At checkout" until the cart quote carries a fee (the method is
  chosen at checkout); "Free" once the threshold is reached. v9 adds a mock fee to the
  total; we never add numbers in the browser.
- Drawer has no "Layer your scents" rail, quick-add or confetti (Swiss Arabian extras).
- Tiles use the neutral `sand` pastel until the API sends `tileColor` (`feat/sapil-cms`).
- Payment screens: the **return screens** (`/checkout/payment/success`, `/cancel`,
  `/payments/tabby/return`, `/payments/telr/return`) are Sapil's own views with Sapil wording
  (`checkout.pay*`, English + Arabic) on the shared hooks `useSettlePayment` /
  `usePaymentRetry` (`features/checkout/hooks/usePaymentReturn.ts`, extracted in the review
  pass; Swiss Arabian's views use them with no visible change). Tabby refusals keep Tabby's
  required wording. Telr's transaction ids (Swiss Arabian's `MetaNote`) are not shown.
  The **card forms** (`/checkout/payment/paymob`, `/stripe`) still render the shared
  provider screens inside Sapil's shell and spinner: their inner copy and styling are Swiss
  Arabian's English (Paymob Pixel / Stripe Elements logic is inline there; extract before
  restyling). Sapil UAE's local methods: Stripe card / Apple Pay / Google Pay, Paymob card,
  Telr (hosted), cash on delivery.
- Phone field shows the market's dial code (+971) and stores E.164.

## Open questions

- Card provider and Apple Pay provider for Sapil UAE (the page renders whatever the API
  lists).
- Should the drawer show the standard delivery fee from `GET /storefront/markets` as an
  estimate (it would not be part of the API total)?
- Courier notes and newsletter consent at checkout (backend fields).
