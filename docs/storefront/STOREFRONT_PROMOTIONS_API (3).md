# Storefront promotions API (P1–P4)

**Audience:** Storefront FE  
**Send to FE:** the full packet is [`STOREFRONT_PROMOTIONS_FE_HANDOFF.md`](./STOREFRONT_PROMOTIONS_FE_HANDOFF.md) (bag, coupons, automatic campaigns, BXGY, gift-card tender, totals, errors, wire checklist).

**Status:** P1 coupons, P2 automatic campaigns, and P4 customer gift-card tender are live. Loyalty is out of scope. Employee gift cards are not storefront.

**Contracts:** [CHECKOUT_DISCOUNT_APPLY_CONTRACT.md](../improvements/promotions/CHECKOUT_DISCOUNT_APPLY_CONTRACT.md) · [PROMOTION_SNAPSHOT_V1_SCHEMA.md](../improvements/promotions/PROMOTION_SNAPSHOT_V1_SCHEMA.md) · [ERROR_CODES_AND_FE_COPY.md](../improvements/promotions/ERROR_CODES_AND_FE_COPY.md)

Replace the hard-coded `SA10` (−100 AED) demo. The server is the only money authority.

## Rules (short)

1. Render `data.promotions` and cart/checkout totals as sent. Never compute discount or BXGY math on the client.
2. One coupon per cart. Applying a second code replaces the first.
3. Automatic campaigns apply with no code on every cart quote. Unknown `applied[].kind`: skip the row, do not crash.
4. Guest + optional JWT: same ownership as cart (`guestToken` query or `Authorization: Bearer`).
5. Default evaluation brand is `SA`. Brand+zone is enforced server-side.
6. Ignore internal ids except gift-card `usageId` when removing at checkout. Safe to render: `applied[].label`, `code`, `amount`, `totals.*`, `giftCards[].maskedCode`.
7. Gift cards are **tender**. Do not add `giftCardApplied` into `discountEstimate`. Charge `totals.amountPayable` / checkout `totalsEstimate.amountPayable`.

## Endpoints

Auth: `OptionalCustomerJwtAuthGuard`. Zone context: `zoneCode`, `salesChannelCode`, `guestToken` query (same as other cart routes).

| Method | Path | Body | Success |
|--------|------|------|---------|
| `POST` | `/storefront/cart/:cartId/coupons` | `{ "code": "EID10" }` | Full cart payload including `promotions` |
| `DELETE` | `/storefront/cart/:cartId/coupons/:code` | — | Full cart payload; coupon released |
| `POST` | `/storefront/cart/:cartId/gift-cards` | `{ "code": "AB3K7N2PQ9XM", "amount?": "50.00" }` | Full cart; `promotions.giftCards` + `totals.amountPayable` |
| `DELETE` | `/storefront/cart/:cartId/gift-cards` | — | Gift card released |
| `POST` | `/storefront/gift-cards/balance` | `{ "code": "AB3K7N2PQ9XM" }` | `{ maskedCode, remainingBalance, currencyCode, status, expiresAt }` |
| `POST` | `/storefront/checkout/:checkoutSessionId/gift-cards` | `{ "code", "amount?" }` | Checkout payload with tender applied |
| `DELETE` | `/storefront/checkout/:checkoutSessionId/gift-cards/:usageId` | — | Tender released |
| `GET` | `/storefront/promotions/applicable?cartId=` | — | `{ promotions, offers[] }` for the current bag |

Pilot coupons: `EID10` (10% cap 100), `SAVE25` (AED 25 off, min 150), `WELCOME15` (first order, login required).  
Pilot automatic campaigns: `EID_AUTO10` (10% order), `BXGY_3FOR2` (buy 2 get 1 — **3 units**), `SHIP_FREE_300` (free shipping over AED 300).

`applied[].kind`: `COUPON` | `AUTOMATIC` | `FREE_SHIPPING`.

BXGY `BXGY_3FOR2` needs **3 units** in the bag (buy 2 get 1). `SHIP_FREE_300` only applies once shipping is quoted and merchandise subtotal ≥ AED 300.

Bag, BXGY unit math, cart vs checkout totals, and the FE checklist live in the [FE handoff](./STOREFRONT_PROMOTIONS_FE_HANDOFF.md).
