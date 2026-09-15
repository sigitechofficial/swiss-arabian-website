# Storefront promotions API (P1 coupons + P2 automatic)

**Audience:** Storefront FE  
**Status:** P1 coupons live. P2 automatic campaigns, BXGY, free shipping, and stacking are live. Gift cards and loyalty are still out of scope.  
**Contracts:** [CHECKOUT_DISCOUNT_APPLY_CONTRACT.md](../improvements/promotions/CHECKOUT_DISCOUNT_APPLY_CONTRACT.md) · [PROMOTION_SNAPSHOT_V1_SCHEMA.md](../improvements/promotions/PROMOTION_SNAPSHOT_V1_SCHEMA.md) · [ERROR_CODES_AND_FE_COPY.md](../improvements/promotions/ERROR_CODES_AND_FE_COPY.md)

Replace the hard-coded `SA10` (−100 AED) demo. The server is the only money authority.

## Rules

1. Render `data.promotions` and cart/checkout totals as sent. Never compute discount math on the client.
2. One coupon per cart. Applying a second code replaces the first.
3. Automatic campaigns apply with no code on every cart quote. Unknown `applied[].kind` values: skip the row, do not crash.
4. Guest + optional JWT: same ownership as cart (`guestToken` query or `Authorization: Bearer`).
5. Default evaluation brand is `SA`. Brand+zone is enforced server-side.
6. Ignore internal ids (`couponId`, `campaignId`, `redemptionId`). Safe to render: `applied[].label`, `code`, `amount`, `totals.discountTotal`, `totals.shippingDiscount`.

## Endpoints

Auth: `OptionalCustomerJwtAuthGuard`. Zone context: `zoneCode`, `salesChannelCode`, `guestToken` query (same as other cart routes).

| Method | Path | Body | Success |
|--------|------|------|---------|
| `POST` | `/storefront/cart/:cartId/coupons` | `{ "code": "EID10" }` | Full cart payload including `promotions` |
| `DELETE` | `/storefront/cart/:cartId/coupons/:code` | — | Full cart payload; coupon released |
| `GET` | `/storefront/promotions/applicable?cartId=` | — | `{ promotions, offers[] }` for the current bag |

Pilot coupons: `EID10` (10% cap 100), `SAVE25` (AED 25 off, min 150), `WELCOME15` (first order, login required).  
Pilot automatic campaigns (seed): `EID_AUTO10` (10% order), `BXGY_3FOR2` (buy 2 get 1), `SHIP_FREE_300` (free shipping over AED 300).

`applied[].kind` in P2: `COUPON` | `AUTOMATIC` | `FREE_SHIPPING`.

`totals.shippingDiscount` is **not** merchandise line discount. Cart `shippingEstimate` stays the quoted fee; `totalEstimate` already subtracts `shippingDiscount`. Show a shipping-discount row from `applied` where `kind === "FREE_SHIPPING"` (or from `totals.shippingDiscount`) — do not subtract it again.

Stacking: product + order + shipping can combine. Two order-level discounts (coupon + automatic order campaign) do not stack unless both are stackable — then the engine keeps the better order discount. The other lands in `promotions.rejected[]` with `PROMOTION_CONFLICT` (informational; not a 422). Pilot `EID10` is not stackable, so it wins over `EID_AUTO10`.

BXGY `BXGY_3FOR2` needs **3 units** in the bag (buy 2 get 1). `SHIP_FREE_300` only applies once shipping is quoted and merchandise subtotal ≥ AED 300.

## Cart payload

`GET /storefront/cart` and every cart mutation now include:

```json
{
  "discountEstimate": "20.00",
  "shippingEstimate": "30.00",
  "totalEstimate": "190.00",
  "promotions": {
    "v": 1,
    "computedAt": "2026-09-14T12:00:00.000Z",
    "context": {
      "brandCode": "SA",
      "zoneCode": "UAE",
      "currencyCode": "AED",
      "salesChannelCode": "platform_uae"
    },
    "applied": [
      {
        "kind": "COUPON",
        "code": "EID10",
        "label": "Eid Sale 10% off",
        "discountType": "PERCENTAGE",
        "discountValue": "10.0000",
        "level": "ORDER",
        "amount": "20.00"
      }
    ],
    "lineAllocations": [{ "ref": "cart-item-uuid", "sku": "GPAC007036", "amount": "20.00" }],
    "totals": { "discountTotal": "20.00", "shippingDiscount": "0.00" },
    "rejected": []
  }
}
```

`GET /storefront/promotions/applicable?cartId=` returns the same snapshot plus `offers[]` (campaign code, title, `selected`, optional `rejected` near-miss such as `MIN_ORDER`). Use it for “add AED X to unlock free shipping” — do not invent remaining amounts; use `rejected.minOrderAmount` when present.

Checkout session `promotionSnapshot` is the same v1 shape after `rebuildSnapshots`. Order copies it at place.

## Errors

Standard envelope. Branch on `error.code` (and `error.context.reason` for `COUPON_NOT_APPLICABLE`). Copy map: [ERROR_CODES_AND_FE_COPY.md](../improvements/promotions/ERROR_CODES_AND_FE_COPY.md).

| code | HTTP | FE action |
|------|------|-----------|
| `COUPON_NOT_FOUND` | 422 | Inline field error |
| `COUPON_INACTIVE` | 422 | Inline |
| `COUPON_NOT_STARTED` | 422 | Inline |
| `COUPON_EXPIRED` | 422 | Inline |
| `COUPON_USAGE_LIMIT_REACHED` | 422 | Inline |
| `COUPON_ALREADY_USED_BY_CUSTOMER` | 422 | Inline |
| `COUPON_REQUIRES_LOGIN` | 401 | Prompt sign-in, keep the code, re-apply after login (`WELCOME15`) |
| `COUPON_NOT_APPLICABLE` | 422 | Use `context.reason`: `MIN_ORDER`, `BRAND_ZONE_MISMATCH`, `CURRENCY`, `FIRST_ORDER_ONLY`, `CUSTOMER_MISMATCH`, `NO_ELIGIBLE_DISCOUNT`, `SCOPE`, `CHANNEL` |
| `PRICING_CHANGED` | 409 | Re-quote; do not place the order |
| `REDEMPTION_EXPIRED` | 409 | Re-apply / refresh totals |

`MIN_ORDER` includes `context.minOrderAmount` (decimal string).

`PROMOTION_CONFLICT` on quote is **not** an HTTP error — it appears in `promotions.rejected[]` when an automatic campaign lost stacking. Do not toast it as a coupon failure.

## Lifecycle (do not invent extra calls)

1. Apply on cart → redemption `RESERVED`. Automatic campaigns re-evaluate on every cart quote (no extra apply call).
2. Checkout from cart re-quotes (does not trust stale cart money).
3. Place order confirms inside the order transaction (`CONFIRMED`).
4. Checkout cancel / session expiry / order cancel → `RELEASED` (code can be used again if limits allow).

## Out of P2

Do not call admin coupon CRUD, gift-card, or loyalty endpoints — they are not shipped.
