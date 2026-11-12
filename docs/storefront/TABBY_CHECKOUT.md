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

## Settings

Nothing Tabby-specific is needed for checkout: keys come from the backend per brand and market.
The product-page "Pay in 4" card still reads `NEXT_PUBLIC_ENABLE_TABBY`,
`NEXT_PUBLIC_TABBY_PUBLIC_KEY` and `NEXT_PUBLIC_TABBY_MERCHANT_CODE`.

## Not done yet

- Tabby promo on the cart page (the product page has the "Pay in 4" card).
- Official Tabby logo asset — the option uses the same wordmark as the product page.
- Arabic for the rest of checkout (only Tabby's own messages and the return page are bilingual).
