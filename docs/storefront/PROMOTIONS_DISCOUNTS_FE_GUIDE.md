# Promotions & discounts — full FE module guide

**Audience:** Storefront FE and Admin FE (and Cursor/AI agents wiring those UIs).  
**Send this file** when a developer needs the whole discounts module: campaigns, coupons, BXGY, automatic offers, gift-card tender, money fields, and endpoints.  
**Status:** Backend live — P1 coupons, P2 automatic campaigns (BXGY + free shipping), P3 admin CRUD, P4 customer gift cards.  
**Date:** 2026-09-23  
**Swagger:** `/api/docs` — tags `Storefront — Cart` · `Storefront — Promotions` · `Storefront — Gift cards` · `Storefront — Checkout` · `Admin — Promotions`.

Shorter packets (same module, different audience):

| File | Use |
|------|-----|
| This guide | Whole module for any FE |
| [`STOREFRONT_PROMOTIONS_FE_HANDOFF.md`](./STOREFRONT_PROMOTIONS_FE_HANDOFF.md) | Storefront-only wiring |
| [`ADMIN_PROMOTIONS_API.md`](./ADMIN_PROMOTIONS_API.md) | Admin CRUD + RBAC |
| [`ERROR_CODES_AND_FE_COPY.md`](../improvements/promotions/ERROR_CODES_AND_FE_COPY.md) | User-facing copy map |

---

## 0. How to use this document

1. **Envelope.** Every JSON route (except coupon CSV export) wraps success in `{ success, statusCode, code, message, data, error, errors, meta }`. Business payload = **`data`**. Branch failures on `error.code` (and `error.context.reason` / `error.details.reason`).
2. **No `/api/v1` prefix.** Paths are absolute: `/storefront/cart/:cartId/coupons`.
3. **Money is decimal strings.** `"150.00"` — use a Decimal library, not `parseFloat`.
4. **Server is the only money authority.** FE never computes % off, BXGY “3 for 2”, remaining-to-unlock, or payable. Render what the API sent.
5. **Bag = cart.** Automatic campaigns run on cart lines. There is no separate “bag” table.
6. **D365 owns perfume list price (VAT-inclusive).** Promotions adjust the commerce total after that price. Admin campaign save does **not** write D365 prices.
7. **Brand+zone.** Storefront evaluation brand is **`SA`**. Campaigns must be scoped with `allowedBrandZonePairs` (e.g. `{ brandCode: "SA", zoneCode: "UAE" }`). Do not call `GET /admin/brands`.
8. **Loyalty is out of scope.** Employee gift cards are not storefront. There is no “buy a gift card” PDP.

---

## 1. Module map (what exists)

Three customer-facing instruments, plus admin that creates them:

```text
Admin FE                         Storefront FE
────────                         ─────────────
Campaign CRUD  ──activate──►     Automatic quote (no code)
Coupon CRUD    ──customer types──► Coupon apply
Gift-card issue──customer types──► Gift-card tender (not a discount)
                                 Cart quote → Checkout re-quote → Place order
```

| Instrument | Customer action | Money bucket | `applied[].kind` |
|------------|-----------------|--------------|------------------|
| **Coupon** | Types a code | Merchandise discount | `COUPON` |
| **Automatic campaign** | None — cart qualifies | Merchandise **or** shipping fee | `AUTOMATIC` or `FREE_SHIPPING` |
| **Gift card** | Types issued code | **Tender** (reduces payable) | not in `applied[]` — see `giftCards[]` |

**Campaign** = the offer definition (10% Eid, Buy 2 Get 1, free shipping over 300).  
**Coupon** = a typed code that may stand alone or hang off a campaign (`requiresCoupon`).  
**Automatic** = campaign with `isAutomatic: true` (cannot also be `requiresCoupon`).

---

## 2. Discount types (engine)

`discountType` on campaign/coupon:

| Type | What it does | Needs `discountValue`? | Typical use |
|------|----------------|------------------------|-------------|
| `PERCENTAGE` | `%` of eligible subtotal (optional `maxDiscountAmount` cap) | Yes, e.g. `"10.0000"` | Eid 10% |
| `FIXED_AMOUNT` | Flat AED off (clamped to subtotal) | Yes, e.g. `"25.0000"` | AED 25 off |
| `FIXED_PRICE` | Eligible SKU unit becomes this price | Yes, e.g. `"75.0000"` | “Now AED 75” |
| `BUY_X_GET_Y` | Pay `buyQty`, discount `getQty` units | No — uses `bxgy` | Buy 2 get 1 free |
| `FREE_SHIPPING` | Waives quoted shipping fee | No | Free ship over 300 |

Rounding: 2 decimal places, HALF_UP. Discount never exceeds line/subtotal. Order total never goes negative.

Golden examples (AED):

| Config | Cart | Discount |
|--------|------|----------|
| 10% | subtotal 200 | `"20.00"` |
| 10% cap 150 | subtotal 2000 | `"150.00"` |
| Fixed 50 | subtotal 40 | `"40.00"` (clamped) |
| Fixed price 75 on SKU unit 100 × 2 | | `"50.00"` |
| Fixed price 120 on unit 100 | | `"0.00"` → not applied (`NO_ELIGIBLE_DISCOUNT`) |

---

## 3. Buy X Get Y (BXGY) in detail

Admin UI: **Customer buys (qty)** = `buyQty`, **Customer gets (qty)** = `getQty` (required ≥ 1), **Free** = `percentOff: 100`. Empty get-qty cannot save (`PROMOTION_BXGY_INVALID`).

Payload:

```json
{
  "discountType": "BUY_X_GET_Y",
  "isAutomatic": true,
  "bxgy": {
    "buyQty": 2,
    "getQty": 1,
    "getScope": "CHEAPEST",
    "percentOff": 100
  }
}
```

| Field | Meaning |
|-------|---------|
| `buyQty` | Units paid at full price per set |
| `getQty` | Units that receive `percentOff` per set |
| `getScope` | `CHEAPEST` (default) = cheapest units in the eligible set. `SAME_SKU` = apply per SKU group |
| `percentOff` | 1–100. `100` = free |

**Units needed for one set = `buyQty + getQty`.**  
Buy 2 get 1 free → customer must have **3** bottles, not 2.

Engine:

```text
discountedUnits = floor( eligibleUnits / (buyQty + getQty) ) × getQty
```

Then those units (cheapest first if `CHEAPEST`) get `unitPrice × percentOff / 100`.

| Config | 2 units | 3 units | 6 units |
|--------|---------|---------|---------|
| buy 2 get 1 free | no deal | 1 cheapest 100% off | 2 cheapest free |
| buy 1 get 1 free | 1 cheapest free | 1 free (floor(3/2)×1) | 3 free |

Storefront **does not send `bxgy`**. It only renders `promotions.applied[]` when the quote applied.

Two-SKU example (not a special “150 bag”):

| Line | Qty | unitPrice | lineSubtotal |
|------|-----|-----------|--------------|
| Perfume X | 1 | `"200.00"` | `"200.00"` |
| Perfume Y | 1 | `"150.00"` | `"150.00"` |

BOGO (buy 1 get 1 free) → cheapest **150** off. FE still shows both lines at list price; discount row comes from `applied` / `lineAllocations`. Same SKU qty 2 at 150 → one cart line, two units; one unit free.

Pilot seed `BXGY_3FOR2`: buy 2 get 1 free, `CHEAPEST`, 100% — needs **3 units**.

---

## 4. How the cart (bag) is quoted

```text
Add / qty change / remove / apply coupon / apply gift card
        ↓
D365 unit prices on lines (VAT already in price)
        ↓
Promotion engine quotes cart lines + zone/brand/currency
        ↓
Writes line discounts + Cart.promotionSnapshot
        ↓
Same cart JSON returned (items + totals + promotions)
```

| Line field | Meaning |
|------------|---------|
| `unitPriceEstimate` | D365 list unit (VAT-inclusive) |
| `lineSubtotalEstimate` | `unitPrice × qty` **before** promo |
| `quantity` | Decimal string |

Cart items do **not** currently echo per-line `discountAmount`. Optional strike-through: join `promotions.lineAllocations[].ref` === `items[].cartItemId`.

Qty 3 → 2 on BXGY_3FOR2 drops the deal on the **next** quote. No extra FE call. Automatics need **no apply endpoint**.

---

## 5. Automatic campaign rules (qualify then math)

Evaluated when campaign is **ACTIVE**, `isAutomatic: true`, `deletedAt` null.

**Qualify (all must pass):**

| # | Rule | Fail |
|---|------|------|
| 1 | Status ACTIVE | ignored |
| 2 | Date window (`startsAt`/`endsAt`, timezone default `Asia/Dubai`) | not started / expired |
| 3 | **Brand + zone pair** matches cart (`SA` + e.g. `UAE`) | `BRAND_ZONE_MISMATCH` |
| 4 | Currency allow-list (pilot `AED`) | `CURRENCY` |
| 5 | Optional sales-channel list | `CHANNEL` |
| 6 | Audience `REGISTERED_CUSTOMERS` | guest → login required |
| 7 | `firstOrderOnly` | guest → login; prior orders → `FIRST_ORDER_ONLY` |
| 8 | Product scope `ALL_PRODUCTS` or `SPECIFIC_SKUS` (+ `allowedSkus`) | `NO_ELIGIBLE_DISCOUNT` / `SCOPE` |
| 9 | Optional `minOrderAmount` vs merchandise **subtotal** | `MIN_ORDER` + `minOrderAmount` |

Then type math (percentage / BXGY / free shipping). Zero result → `NO_ELIGIBLE_DISCOUNT` (e.g. BXGY with 2 units, or free shipping with shipping still `0`).

Failed automatics are **HTTP 200** in `promotions.rejected[]` / `offers[].rejected`. Do not toast as coupon failure.

`GET /storefront/promotions/applicable?cartId=` is for chips (“add AED X to unlock free shipping”). Use `rejected.minOrderAmount`. Do not invent remaining. `selected`/`applied` true → already on the bag.

Free shipping: `shippingEstimate` stays the quoted fee; `totalEstimate` already subtracts `shippingDiscount`. Show a shipping row from `kind === "FREE_SHIPPING"`. Do not subtract twice. Pilot `SHIP_FREE_300` also needs shipping **quoted** and subtotal ≥ 300.

---

## 6. Stacking

Three **classes**. Product + order + shipping can combine. Two of the **same** class do not, unless every candidate in that class is `isStackable`.

| Class | Examples |
|-------|----------|
| `PRODUCT` | BXGY, SKU-scoped % |
| `ORDER` | Order % coupon `EID10`, automatic `EID_AUTO10` |
| `SHIPPING` | `SHIP_FREE_300` |

If any candidate in the class is **not** stackable, engine keeps **one** (higher `priority`, then larger amount). Loser → `rejected[]` with `PROMOTION_CONFLICT` (not HTTP 422).

Pilot: `EID10` is not stackable → it **wins** over `EID_AUTO10`.

Gift cards do **not** stack as discounts. They apply after promotions as tender.

---

## 7. Money map

### Cart (`GET /storefront/cart` and every cart mutation)

| Field | Meaning |
|-------|---------|
| `subtotalEstimate` | Merchandise before discounts |
| `discountEstimate` | Coupon + automatic **merchandise** only. Not gift card. Not free shipping |
| `shippingEstimate` | Quoted shipping **before** waiver |
| `taxEstimate` | Usually `0` — VAT already in perfume prices |
| `totalEstimate` | `subtotal − discount + tax + shipping − shippingDiscount` |
| `promotions.totals.shippingDiscount` | Waived shipping (already in `totalEstimate`) |
| `promotions.totals.giftCardApplied` | Tender |
| `promotions.totals.amountPayable` | Customer still pays (`totalEstimate − giftCardApplied`) |

### Checkout (`GET /storefront/checkout/:id` and checkout mutations)

Checkout **re-quotes**. Do not reuse stale cart money after `from-cart`.

| Field | Meaning |
|-------|---------|
| `totalsEstimate.subtotal` | Merchandise |
| `totalsEstimate.discount` | Merchandise promotions |
| `totalsEstimate.shipping` | Quoted fee |
| `totalsEstimate.total` | After discounts, **before** gift card |
| `totalsEstimate.giftCardApplied` | Tender |
| `totalsEstimate.amountPayable` | **Charge this** (Paymob / Stripe) |

Checkout JSON currently does **not** include the full `promotions` object. Render coupon/campaign rows from the last **cart** snapshot (`GET /storefront/cart`). Gift-card chip: checkout `giftCardApplied` + cart `promotions.giftCards[]`.

**Never** add `giftCardApplied` into `discountEstimate`.  
**Never** charge `total` / `totalEstimate` when a gift card is on the bag.

100% gift-card coverage is **not** supported (Paymob 0-amount). Backend leaves about AED `0.01` payable.

---

## 8. Promotion snapshot v1 (cart)

On `GET /storefront/cart` and cart mutations:

```json
{
  "discountEstimate": "150.00",
  "shippingEstimate": "30.00",
  "totalEstimate": "230.00",
  "promotions": {
    "v": 1,
    "computedAt": "2026-09-23T09:00:00.000Z",
    "context": {
      "brandCode": "SA",
      "zoneCode": "UAE",
      "currencyCode": "AED",
      "salesChannelCode": "platform_uae"
    },
    "applied": [
      {
        "kind": "AUTOMATIC",
        "code": "BXGY_3FOR2",
        "campaignCode": "BXGY_3FOR2",
        "label": "Buy 2 Get 1 Free",
        "discountType": "BUY_X_GET_Y",
        "discountValue": "100.0000",
        "level": "LINES",
        "amount": "150.00"
      }
    ],
    "lineAllocations": [
      { "ref": "cart-item-uuid", "sku": "GPAC007036", "amount": "150.00" }
    ],
    "giftCards": [],
    "totals": {
      "discountTotal": "150.00",
      "shippingDiscount": "0.00",
      "giftCardApplied": "0.00",
      "amountPayable": "230.00"
    },
    "rejected": []
  }
}
```

**Render:** `applied[].label`, `code`, `amount`, `totals.*`, `giftCards[].maskedCode`.  
**Ignore:** `couponId`, `campaignId`, `redemptionId`. Use `giftCards[].usageId` only to `DELETE` checkout gift card.  
**Unknown `kind`:** skip the row, do not crash.

`level`: `ORDER` | `LINES` | `SHIPPING`.

---

## 9. Storefront endpoints

Auth: `OptionalCustomerJwtAuthGuard`. Query (same as cart): `zoneCode`, `salesChannelCode`, `guestToken` when no Bearer. JWT `customerId` wins over query/body.

### 9.1 Cart (already returns `promotions`)

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/storefront/cart` | Active cart + `promotions` |
| `POST` | `/storefront/cart` | Create / resume |
| `POST` | `/storefront/cart/items` | Add SKU — triggers auto quote |
| `PATCH` | `/storefront/cart/items/:cartItemId` | Qty change — re-quote |
| `DELETE` | `/storefront/cart/items/:cartItemId` | Remove — re-quote |
| `DELETE` | `/storefront/cart/items` | Clear |
| `POST` | `/storefront/cart/validate` | Sellability / price |

You do **not** call a separate “apply automatic” API.

### 9.2 Coupons

`POST /storefront/cart/:cartId/coupons`

```json
{ "code": "EID10" }
```

Success: full cart. One coupon per cart; second code **replaces** the first.

`DELETE /storefront/cart/:cartId/coupons/:code` — release, full cart.

Pilot coupons:

| Code | Rule |
|------|------|
| `EID10` | 10% order, cap AED 100, not stackable vs other order % |
| `SAVE25` | AED 25 off, min subtotal 150 |
| `WELCOME15` | 15% first order — **login required** |

Guest + `WELCOME15` → `401 COUPON_REQUIRES_LOGIN`. Keep the typed code, sign in, re-apply.

### 9.3 Automatic offers (optional chips)

`GET /storefront/promotions/applicable?cartId={uuid}`

```json
{
  "promotions": { "v": 1, "applied": [], "rejected": [], "totals": {} },
  "offers": [
    {
      "campaignCode": "SHIP_FREE_300",
      "title": "Free shipping over AED 300",
      "discountType": "FREE_SHIPPING",
      "applied": false,
      "amount": null,
      "selected": false,
      "rejected": {
        "code": "SHIP_FREE_300",
        "errorCode": "COUPON_NOT_APPLICABLE",
        "reason": "MIN_ORDER",
        "minOrderAmount": "300.0000"
      }
    }
  ]
}
```

### 9.4 Gift cards (tender)

One card per bag. Optional `amount` (decimal string). Omit → max allowed by balance + coverage. Never persist the full code after submit; render `maskedCode`.

| Method | Path | Body |
|--------|------|------|
| `POST` | `/storefront/gift-cards/balance` | `{ "code": "AB3K7N2PQ9XM" }` |
| `POST` | `/storefront/cart/:cartId/gift-cards` | `{ "code", "amount?" }` |
| `DELETE` | `/storefront/cart/:cartId/gift-cards` | — |
| `POST` | `/storefront/checkout/:checkoutSessionId/gift-cards` | `{ "code", "amount?" }` |
| `DELETE` | `/storefront/checkout/:checkoutSessionId/gift-cards/:usageId` | — |

Balance success:

```json
{
  "maskedCode": "••••PQ9XM",
  "remainingBalance": "100.00",
  "currencyCode": "AED",
  "status": "ACTIVE",
  "expiresAt": "2027-01-01T00:00:00.000Z"
}
```

Balance does **not** attach the card. Employee cards look like not-found / `GIFT_CARD_EMPLOYEE_UNSUPPORTED` — do not distinguish in copy.

There is **no** storefront gift-card purchase product.

### 9.5 Checkout / pay (promotion-related)

| Method | Path | Promotion note |
|--------|------|----------------|
| `POST` | `/storefront/checkout/from-cart` | Re-quotes; promotions re-validated into session |
| `GET` | `/storefront/checkout/:checkoutSessionId` | `totalsEstimate.amountPayable` |
| `POST` | `/storefront/orders/from-checkout` | Confirms coupon + gift card in the same DB tx as the order |

Payment initiation must use **`amountPayable`**.

---

## 10. Lifecycle

```text
QUOTE (every cart mutation)     automatics: nothing extra persisted
  APPLY coupon / gift card      redemption / usage RESERVED (TTL ~ checkout)
    CHECKOUT from-cart          re-quote, pricingHash includes discounts
      PLACE ORDER               CONFIRMED in same tx; gift-card balance decremented
      CANCEL / session expire   RELEASED — coupon reusable if limits allow; GC restored
CONFIRMED ── refund ──►         gift-card REFUNDED (balance back)
```

Do not invent extra “confirm discount” calls. Payment capture does not re-confirm promotions.

---

## 11. Storefront errors

| code | HTTP | FE |
|------|------|----|
| `COUPON_NOT_FOUND` | 422 | Inline |
| `COUPON_INACTIVE` | 422 | Inline |
| `COUPON_NOT_STARTED` | 422 | Inline |
| `COUPON_EXPIRED` | 422 | Inline |
| `COUPON_USAGE_LIMIT_REACHED` | 422 | Inline |
| `COUPON_ALREADY_USED_BY_CUSTOMER` | 422 | Inline |
| `COUPON_REQUIRES_LOGIN` | 401 | Sign-in, keep code, re-apply |
| `COUPON_NOT_APPLICABLE` | 422 | `reason`: `MIN_ORDER`, `BRAND_ZONE_MISMATCH`, `CURRENCY`, `FIRST_ORDER_ONLY`, `CUSTOMER_MISMATCH`, `NO_ELIGIBLE_DISCOUNT`, `SCOPE`, `CHANNEL` |
| `PRICING_CHANGED` | 409 | Re-quote; do not place |
| `REDEMPTION_EXPIRED` | 409 | Re-apply / refresh |
| `GIFT_CARD_NOT_FOUND` | 422 / 404 balance | Inline; no employee vs missing copy |
| `GIFT_CARD_INACTIVE` | 422 | Inline |
| `GIFT_CARD_EXPIRED` | 422 | Inline |
| `GIFT_CARD_INSUFFICIENT_BALANCE` | 422 | `context.remainingBalance` |
| `GIFT_CARD_COVERAGE_EXCEEDED` | 422 | Remainder payment required |
| `GIFT_CARD_BRAND_MISMATCH` | 422 | Wrong store/brand |
| `GIFT_CARD_CURRENCY` | 422 | Inline |
| `GIFT_CARD_EMPLOYEE_UNSUPPORTED` | 422 | Do not offer employee cards |
| `GIFT_CARD_MIN_ORDER` | 422 | `context.minOrderAmount` |
| `GIFT_CARD_ALREADY_APPLIED` | 422 | One card per bag |

`MIN_ORDER` includes `minOrderAmount` (decimal string).  
`PROMOTION_CONFLICT` on snapshot is **not** an HTTP error.  
Unknown codes → “This code can't be applied right now.”  
Copy strings: [`ERROR_CODES_AND_FE_COPY.md`](../improvements/promotions/ERROR_CODES_AND_FE_COPY.md).

---

## 12. Admin endpoints (campaigns, coupons, reports, gift cards)

Auth: admin dual-mode JWT / API key. Missing permission → **403**. Campaign/coupon outside admin `allowedZoneCodes` → **404**.

Re-seed RBAC: `npm run seed:identity-rbac`.

| Action | Permission | Typical roles |
|--------|------------|---------------|
| List/detail campaigns, reports | `promotions.campaigns.read` | MARKETING_MANAGER, MARKET_ADMIN, FINANCE_MANAGER, SUPER_ADMIN |
| Create/update/activate/pause/expire/archive | `promotions.campaigns.manage` | MARKETING_MANAGER, MARKET_ADMIN, SUPER_ADMIN |
| List/export coupons | `promotions.coupons.read` | MARKETING_MANAGER, MARKET_ADMIN, FINANCE_MANAGER |
| Create/update/activate/disable/bulk | `promotions.coupons.manage` | MARKETING_MANAGER, MARKET_ADMIN |
| List/ledger gift cards | `promotions.gift_cards.read` | MARKETING_MANAGER, MARKET_ADMIN, FINANCE_MANAGER |
| Issue/cancel gift cards | `promotions.gift_cards.manage` | MARKETING_MANAGER, MARKET_ADMIN |

**Every create/update must send** `allowedBrandZonePairs: [{ "brandCode": "SA", "zoneCode": "UAE" }]`. Bare `allowedZoneCodes` → `422 PROMOTION_SCOPE_INVALID`.

List envelope: `{ success, data: [...], meta.pagination }`. Do not call `GET /admin/brands`.

### 12.1 Campaigns

| Method | Path |
|--------|------|
| `GET` | `/admin/promotions/campaigns` |
| `GET` | `/admin/promotions/campaigns/:campaignId` |
| `POST` | `/admin/promotions/campaigns` |
| `PATCH` | `/admin/promotions/campaigns/:campaignId` |
| `POST` | `/admin/promotions/campaigns/:campaignId/activate` |
| `POST` | `/admin/promotions/campaigns/:campaignId/pause` |
| `POST` | `/admin/promotions/campaigns/:campaignId/expire` |
| `POST` | `/admin/promotions/campaigns/:campaignId/archive` |

List query: `page`, `limit` (max 200), `q`, `status`, `campaignType`, `isAutomatic`, `zoneCode`, `includeDeleted`.

Create starts **DRAFT**. Activate to make automatics appear on storefront.

Create body (core):

| Field | Required | Notes |
|-------|----------|-------|
| `reason` | yes | min 3, audit |
| `campaignCode` | yes | unique, stored uppercase |
| `title` | yes | |
| `discountType` | yes | see §2 |
| `discountValue` | unless BXGY / free shipping | decimal string |
| `allowedBrandZonePairs` | yes | min 1 |
| `isAutomatic` | no | default false. Cannot be true with `requiresCoupon` |
| `requiresCoupon` | no | parent for typed coupons |
| `isStackable` | no | same-class stacking |
| `priority` | no | integer; higher wins |
| `productScopeType` | no | default `ALL_PRODUCTS`. Amount-off-products: `SPECIFIC_SKUS` + `allowedSkus` |
| `allowedSkus` / `excludedSkus` | no | |
| `bxgy` | if `BUY_X_GET_Y` | `{ buyQty, getQty, getScope, percentOff }` |
| `minOrderAmount` | no | e.g. `"300.0000"` |
| `maxDiscountAmount` | no | % cap |
| `firstOrderOnly` / `audienceType` | no | |
| `startsAt` / `endsAt` / `timezone` | no | default timezone `Asia/Dubai` |

Lifecycle body: `{ "reason": "…" }` (min 3).

Response may include `warnings[]` with `OVERLAPPING_CAMPAIGN` — does **not** block save.

Create example — automatic BXGY:

```json
{
  "reason": "Eid 3-for-2 UAE",
  "campaignCode": "BXGY_3FOR2",
  "title": "Buy 2 Get 1 Free",
  "discountType": "BUY_X_GET_Y",
  "isAutomatic": true,
  "allowedBrandZonePairs": [{ "brandCode": "SA", "zoneCode": "UAE" }],
  "bxgy": { "buyQty": 2, "getQty": 1, "getScope": "CHEAPEST", "percentOff": 100 }
}
```

Create example — automatic 10%:

```json
{
  "reason": "Eid auto 10",
  "campaignCode": "EID_AUTO10",
  "title": "Eid automatic 10% off",
  "discountType": "PERCENTAGE",
  "discountValue": "10.0000",
  "maxDiscountAmount": "100.0000",
  "isAutomatic": true,
  "isStackable": false,
  "allowedBrandZonePairs": [{ "brandCode": "SA", "zoneCode": "UAE" }]
}
```

### 12.2 Coupons

| Method | Path |
|--------|------|
| `GET` | `/admin/promotions/coupons` |
| `GET` | `/admin/promotions/coupons/:couponId` |
| `POST` | `/admin/promotions/coupons` |
| `PATCH` | `/admin/promotions/coupons/:couponId` |
| `POST` | `/admin/promotions/coupons/:couponId/activate` |
| `POST` | `/admin/promotions/coupons/:couponId/disable` |
| `POST` | `/admin/promotions/coupons/bulk` |
| `GET` | `/admin/promotions/coupons/export` |

**Field is `couponCode`, not `code`.** Stored uppercase/normalized.

Create starts **DRAFT** unless bulk-generated on an ACTIVE campaign (those are ACTIVE). Storefront apply still requires `ACTIVE`.

| Field | Required | Notes |
|-------|----------|-------|
| `reason` | yes | min 3 |
| `couponCode` | yes | |
| `campaignId` | no | inherit discount + pairs when set |
| `allowedBrandZonePairs` | if no campaign | |
| `discountType` / `discountValue` | if no campaign | |
| `maxTotalRedemptions` / `maxRedemptionsPerCustomer` | no | there is **no** `usageLimit` field |
| `isSingleUse` / `isStackable` / `firstOrderOnly` | no | |
| `assignedCustomerId` | no | locks code to one customer |
| `startsAt` / `endsAt` | no | |

Bulk: `{ "campaignId", "count": 1–1000, "prefix?", "reason" }` → `{ generated, codes[] }`.  
CSV: `GET /admin/promotions/coupons/export?campaignId=` — **raw CSV**, not the JSON envelope (`@SkipResponseWrap`).

### 12.3 Redemption reports

| Method | Path |
|--------|------|
| `GET` | `/admin/promotions/reports/redemptions` |
| `GET` | `/admin/promotions/reports/redemptions/summary` |

Query: `campaignId`, `couponId`, `status`, `zoneCode`, `from`, `to`, `page`, `limit`.  
Rows: `RESERVED` / `CONFIRMED` / `RELEASED`. Summary `confirmedDiscountTotal` is CONFIRMED only.

### 12.4 Gift cards (admin issue)

Customer gift cards are **tender**, not a promo line.

| Method | Path |
|--------|------|
| `GET` | `/admin/promotions/gift-cards` |
| `GET` | `/admin/promotions/gift-cards/:giftCardId` |
| `POST` | `/admin/promotions/gift-cards` |
| `POST` | `/admin/promotions/gift-cards/:giftCardId/cancel` |

Issue body (core): `reason`, `title`, `originalAmount` (`"100.00"`), `currencyCode`, `allowedBrandZonePairs`. Optional: `giftCardType` (`CUSTOMER_GIFT_CARD` default; `PROMOTIONAL_GIFT_CARD`; **`EMPLOYEE_GIFT_CARD` rejected**), `maxOrderCoveragePercent`, `minOrderAmount`, `startsAt`, `expiresAt`, `customerId`, `activateNow` (default true).

Create response includes plaintext **`code` once**. Show/copy to staff; later GET only `maskedCode`. Never log the full code. SA-UAE card will not redeem on another brand in the same zone.

Cancel: `{ "reason": "…" }`.

### 12.5 Admin errors

| code | HTTP | Meaning |
|------|------|---------|
| `PROMOTION_SCOPE_INVALID` | 422 | Missing brand+zone pairs |
| `PROMOTION_BXGY_INVALID` | 422 | Missing/invalid `bxgy` |
| `PROMOTION_FLAGS_INVALID` | 422 | `isAutomatic` + `requiresCoupon` |
| `PROMOTION_WINDOW_INVALID` | 422 | `endsAt` ≤ `startsAt` |
| `PROMOTION_DISCOUNT_INVALID` | 422 | Missing `discountValue` |
| `PROMOTION_NOT_EDITABLE` | 422 | Archived |
| `CONFLICT` | 409 | Duplicate campaign/coupon code |

---

## 13. Pilot data (UAE + SA + AED)

`npm run seed:promotions-pilot`

| Code | Kind | Customer effect |
|------|------|-----------------|
| `EID10` | Coupon | 10% off, cap 100 |
| `SAVE25` | Coupon | AED 25 off, min 150 |
| `WELCOME15` | Coupon | First order, login |
| `EID_AUTO10` | Automatic % | 10% if no conflicting coupon |
| `BXGY_3FOR2` | Automatic BXGY | Buy 2 get 1 free — **3 units** |
| `SHIP_FREE_300` | Automatic shipping | Free shipping, subtotal ≥ 300 + shipping quoted |

---

## 14. FE wire checklist

**Storefront**

- [ ] Drop hard-coded `SA10` (−100 AED)
- [ ] After every cart mutation, replace local cart with `data`
- [ ] Render `promotions.applied[]` as discount rows
- [ ] `discountEstimate` = merchandise promotions only
- [ ] Free shipping row from `FREE_SHIPPING` / `shippingDiscount`; do not subtract twice
- [ ] Coupon field → `POST …/coupons`; remove → `DELETE …/coupons/:code`
- [ ] Optional `GET …/applicable` for unlock chips; use `minOrderAmount`
- [ ] Gift-card apply/balance; one card; never store full code
- [ ] Pay `totalsEstimate.amountPayable`
- [ ] `409 PRICING_CHANGED` → refresh, do not place
- [ ] Do not invent BXGY unit math

**Admin**

- [ ] Always send `allowedBrandZonePairs` (brand `SA` + market zone)
- [ ] BXGY: require get qty; Free → `percentOff: 100`
- [ ] Create DRAFT → Activate for automatics
- [ ] Coupon field name `couponCode`
- [ ] Show gift-card `code` once on issue; thereafter `maskedCode`
- [ ] RBAC permissions in §12

---

## 15. Out of scope (do not build)

- Loyalty points
- Employee gift cards on storefront
- Gift-card **product** purchase / Shopify gift-card product
- 100% gift-card checkout (Paymob 0-amount)
- Shopify discount Admin APIs / write-back
- FE-side discount calculators
- `GET /admin/brands`

---

## 16. Related backend contracts

- Snapshot schema: [`PROMOTION_SNAPSHOT_V1_SCHEMA.md`](../improvements/promotions/PROMOTION_SNAPSHOT_V1_SCHEMA.md)
- Checkout apply lifecycle: [`CHECKOUT_DISCOUNT_APPLY_CONTRACT.md`](../improvements/promotions/CHECKOUT_DISCOUNT_APPLY_CONTRACT.md)
- Calculation fixtures: [`DISCOUNT_CALCULATION_GOLDEN_CASES.md`](../improvements/promotions/DISCOUNT_CALCULATION_GOLDEN_CASES.md)
- Cart FE: [`STOREFRONT_CART_FE_HANDOFF.md`](../storefront/STOREFRONT_CART_FE_HANDOFF.md)
- Checkout FE: [`STOREFRONT_CHECKOUT_AND_ORDERS_FE_GUIDE.md`](../storefront/STOREFRONT_CHECKOUT_AND_ORDERS_FE_GUIDE.md)
