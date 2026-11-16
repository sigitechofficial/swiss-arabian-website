# Tabby (pay in 4) — storefront

Backend contract: `swiss-arabian-backend/docs/storefront/TABBY_FE_GUIDE.md` and
`docs/payments/TABBY_PROVIDER_CONTRACT.md`. Tabby works like Telr: a hosted page the shopper is
redirected to, then a return page that polls the platform.

## What the storefront does

| Step | Where | Notes |
|------|-------|-------|
| List the method | `CheckoutPayment` | Shown only when the backend lists `providerCode: "tabby"` (UAE/AED, KSA/SAR, and the brand has its own Tabby account). The "coming soon" Tabby row disappears once it is live. |
| Pre-scoring | `useTabbyPrescore` → `POST storefront/checkout/:id/payment-methods/tabby/prescore` | Runs when checkout opens and when email, phone or total changes (debounced). Rejected → the row is disabled with Tabby's message and the selection moves to another method. A failed request never hides Tabby. |
| Checkout snippet | `TabbyCheckoutCard` | Tabby's `tabby-card.js`, loaded from `metadata.tabby.snippetScriptBase` with `publicKey` / `merchantCode` from the same metadata. Falls back to Tabby's standard text if the script can't load. |
| Start payment | `startPayment` | `returnUrl` and `cancelUrl` are both `/payments/tabby/return`; the backend adds `result=success|cancel` and builds the failure URL. Redirect is a full navigation in the same window. |
| Rejected at start | `PaymentRejectedError` | Initiate returns `metadata.tabbyRejectionReason`: show `tabbyRejectionMessage[lang]`, keep the order, let the shopper pick another method. |
| Return page | `/payments/tabby/return` → `TabbyReturnView` | `result` is a hint only. Polls `GET storefront/orders/:id/payment-status`; PAID → order confirmation. Cancel / not-approved use Tabby's required wording (EN + AR). Still pending → "we're confirming your payment". |

## Rules from Tabby (do not change)

- The cancel and not-approved messages in `utils/tabby.ts` are Tabby's wording.
- Never treat the return link as proof of payment.
- One hosted session per click; never reuse a `redirectUrl`.
- Snippet container ids must not be `TabbyCard` / `TabbyPromo`.
- Same price as every other method — no surcharge.

## Tabby QA fixes (Nov 2026)

Tabby's integration team re-tested the UAE dev site and asked for these before live keys:

| Ask | Where |
| --- | --- |
| Cancel → back to checkout with the bag; failure → bag kept, Tabby not offered again | `TabbyReturnView` → `utils/returnToCheckout.ts` → `POST storefront/orders/:id/payment/release-to-cart` (backend re-checks Tabby, cancels the unpaid order, reopens its cart). Declined bag id kept in `sessionStorage` (`sa_tabby_declined_cart`); `offeredPaymentMethods` drops Tabby for it. |
| Arabic return page and Arabic Tabby page (`lang=ar`) | Proxy saves the last shop language in the `sa_lang` cookie (`lib/i18n/shopperLocale.ts`). `startPayment` sends `locale` and adds `?lang=` to the Tabby return links; the backend saves it on the order and sends it as `lang`. |
| Real `order.items[].category` | Backend (`tabby-category.util.ts`). |
| Official logo, no "Pay in 4" caption, Arabic method name | `components/payments/TabbyLogo.tsx`, `TABBY_METHOD_TITLE`, `paymentMethodNote`. |
| Official snippets on product, cart and mini cart; pop-up with merchant code + public key | `features/payments/tabby/TabbyPromoSnippet.tsx` (Tabby `tabby-promo.js`), used by `PdpInstalments`, `CartTabbyPromo`, `CartSideSheet`. |
| No Tabby on Qatar | Snippets read `GET storefront/markets/:zone/tabby-promo`, which is `available` only where checkout offers Tabby. |

## Settings

Nothing Tabby-specific is set on the storefront: checkout and the product / cart snippets get
the keys from the backend per brand and market. The old `NEXT_PUBLIC_ENABLE_TABBY`,
`NEXT_PUBLIC_TABBY_PUBLIC_KEY` and `NEXT_PUBLIC_TABBY_MERCHANT_CODE` are no longer read.

The official logo file goes at `public/assets/payments/tabby/tabby-logo.svg`, exactly as
downloaded from Tabby's brand pack (https://docs.tabby.ai/marketing/toolkit). Until it is
there, the checkout option shows no logo.

## Not done yet

- Official Tabby logo file (see Settings).
- Arabic for the rest of checkout (only Tabby's own wording, the method name and the return page are bilingual).
