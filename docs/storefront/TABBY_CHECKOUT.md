# Tabby (pay in 4) — storefront

Backend contract: `swiss-arabian-backend/docs/storefront/TABBY_FE_GUIDE.md` and
`docs/payments/TABBY_PROVIDER_CONTRACT.md`. Tabby works like Telr: a hosted page the shopper is
redirected to, then a return page that polls the platform.

## What the storefront does

| Step | Where | Notes |
|------|-------|-------|
| List the method | `paymentGroups` → `CheckoutPayment` (Swiss Arabian), `CheckoutSections` (Sapil) | Shown only when the backend lists `providerCode: "tabby"` (UAE/AED, KSA/SAR, and the brand has its own Tabby account). Tabby's approved name (`TABBY_METHOD_TITLE`: "Pay later with Tabby" / "ادفع لاحقًا مع تابي"), the official logo (`TabbyLogo`, `public/assets/payments/tabby/tabby-logo.svg`) and **no plan caption**. Hidden for a bag Tabby declined (`offeredPaymentMethods`). |
| Pre-scoring | `useTabbyPrescore` → `POST storefront/checkout/:id/payment-methods/tabby/prescore` | Runs when checkout opens and when email, phone or total changes (debounced). Rejected → the row is disabled with Tabby's message and the selection moves to another method. A failed request never hides Tabby. |
| Checkout snippet | `TabbyCheckoutCard` | Tabby's `tabby-card.js`, loaded from `metadata.tabby.snippetScriptBase` with `publicKey` / `merchantCode` from the same metadata. Falls back to Tabby's standard text if the script can't load. |
| Start payment | `startPayment` | `returnUrl` and `cancelUrl` are both `/payments/tabby/return?lang=<checkout language>`; the backend adds `result=success|cancel|failure` and keeps `lang` on all three. `locale` is sent too (saved on the order; Tabby session `lang`). Redirect is a full navigation in the same window. |
| Rejected at start | `PaymentRejectedError` | Initiate returns `metadata.tabbyRejectionReason`: show `tabbyRejectionMessage[lang]`, keep the order, let the shopper pick another method. |
| Return page | `/payments/tabby/return` → `TabbyReturnView` / `SapilTabbyReturn` | Served in the `?lang=` language (`localeRouting`; the address stays fixed). `result` is a hint only. Polls `GET storefront/orders/:id/payment-status`; PAID → order confirmation. Cancel / not-approved use Tabby's required wording. Their button (`useReturnToCheckout`) calls `POST storefront/orders/:id/payment/release-to-cart`: the unpaid order is cancelled and its bag reopened, then checkout opens. Cancelled → Tabby still offered; declined → Tabby hidden for that bag. Still pending → "we're confirming your payment". |
| Product page, cart, mini cart | `TabbyPromoSnippet` (`tabby-promo.js`) | Tabby's official snippet, both brands, with the market's keys (`paymentPromos.tabby`); nothing where checkout has no Tabby. Our own "Pay in 4" card lists Tamara only. |

## Rules from Tabby (do not change)

- The cancel and not-approved messages in `utils/tabby.ts` are Tabby's wording.
- Never treat the return link as proof of payment.
- One hosted session per click; never reuse a `redirectUrl`.
- Snippet container ids must not be `TabbyCard` / `TabbyPromo`.
- Same price as every other method — no surcharge.

## Settings

Nothing Tabby-specific is needed for checkout: keys come from the backend per brand and market.
The product-page "Pay in 4" card and the cart promo show only where the market's
checkout offers Tabby; the merchant code / public key come from the market's Tabby
account on the integrations switchboard (ADR-005 phase E,
`docs/multibrand/SITE_INTEGRATIONS.md`). The old `NEXT_PUBLIC_ENABLE_TABBY` /
`NEXT_PUBLIC_TABBY_*` build settings are removed (the build check refuses them).

## Tabby QA (Nov 2026)

Tabby re-tested the UAE dev site and asked, before live keys, for: cancel / failure back to checkout
with the bag (no Tabby after a failure), Arabic return messages and `lang=ar`, the real
`order.items[].category`, the official logo, no "Pay in 4" caption, the Arabic method name, official
snippets on the product page, cart and mini cart (pop-up with `merchant_code` and `public_key`), and
no Tabby on Qatar. All of these are covered above (backend: `tabby-category.util.ts`,
release-to-cart, `locale` on payment start).

## Not done yet

- Arabic for the rest of Swiss Arabian checkout (Tabby's wording, the method name and the return page are bilingual).
- Sapil has no Tabby merchant of its own yet (dev uses a copy of Swiss Arabian's test keys).
