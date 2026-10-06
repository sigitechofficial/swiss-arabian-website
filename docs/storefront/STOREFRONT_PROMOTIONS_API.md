# Storefront promotions API (P1 coupons)

**Audience:** Storefront FE  
**Status:** P1 live — one coupon per cart. Automatic campaigns, stacking, BXGY, free shipping, gift cards, and loyalty are out of scope.  
**Contracts:** [CHECKOUT_DISCOUNT_APPLY_CONTRACT.md](../improvements/promotions/CHECKOUT_DISCOUNT_APPLY_CONTRACT.md) · [PROMOTION_SNAPSHOT_V1_SCHEMA.md](../improvements/promotions/PROMOTION_SNAPSHOT_V1_SCHEMA.md) · [ERROR_CODES_AND_FE_COPY.md](../improvements/promotions/ERROR_CODES_AND_FE_COPY.md)

Replace the hard-coded `SA10` (−100 AED) demo. The server is the only money authority.

## Rules

1. Render `data.promotions` and cart/checkout totals as sent. Never compute discount math on the client.
2. One coupon per cart. Applying a second code replaces the first.
3. Guest + optional JWT: same ownership as cart (`guestToken` query or `Authorization: Bearer`).
4. Default evaluation brand is `SA`. Brand+zone is enforced server-side (`metadata.allowedBrandZonePairs`).
5. Ignore internal ids in the snapshot (`couponId`, `campaignId`, `redemptionId`). Safe to render: `applied[].label`, `code`, `amount`, `totals.discountTotal`.

## Endpoints

Auth: `OptionalCustomerJwtAuthGuard`. Zone context: `zoneCode`, `salesChannelCode`, `guestToken` query (same as other cart routes).

| Method | Path | Body | Success |
|--------|------|------|---------|
| `POST` | `/storefront/cart/:cartId/coupons` | `{ "code": "EID10" }` | Full cart payload including `promotions` |
| `DELETE` | `/storefront/cart/:cartId/coupons/:code` | — | Full cart payload; coupon released |

Pilot codes (dev seed `npm run seed:promotions-pilot`): `EID10` (10% cap 100), `SAVE25` (AED 25 off, min 150), `WELCOME15` (first order, login required).

## Cart payload

`GET /storefront/cart` and every cart mutation now include:

```json
{
  "discountEstimate": "20.00",
  "totalEstimate": "180.00",
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
    "totals": { "discountTotal": "20.00" },
    "rejected": []
  }
}
```

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

## Lifecycle (do not invent extra calls)

1. Apply on cart → redemption `RESERVED`.
2. Checkout from cart re-quotes (does not trust stale cart money).
3. Place order confirms inside the order transaction (`CONFIRMED`).
4. Checkout cancel / session expiry / order cancel → `RELEASED` (code can be used again if limits allow).

## Out of P1

Do not call admin coupon CRUD, gift-card, loyalty, or automatic-offer endpoints — they are not shipped.
