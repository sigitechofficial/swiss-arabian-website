# Storefront promotions — FE status for backend

**Date:** 2026-09-14  
**Audience:** Backend  
**FE repo:** customer storefront  
**Contracts used:**
- `docs/storefront/STOREFRONT_PROMOTIONS_API.md` (P1 coupons)
- `docs/storefront/STOREFRONT_PROMOTIONS_API (1).md` (P1 + P2 automatic / BXGY / free shipping / stacking)

Hard-coded demo coupon `SA10` (−100 AED) is **gone**. Server `promotions` + cart/checkout totals are the money authority. FE does **not** compute discount math.

---

## Status summary

| Area | FE |
|------|----|
| P1 coupon apply / remove | **Done** |
| P1 coupon errors (inline + login re-apply) | **Done** |
| Cart / checkout render `promotions.applied` | **Done** |
| P2 automatic / BXGY rows (`AUTOMATIC`) | **Done** |
| P2 free shipping row + `totals.shippingDiscount` | **Done** |
| P2 stacking `rejected[]` `PROMOTION_CONFLICT` | **Done** (informational copy, not a 422 toast) |
| `GET /storefront/promotions/applicable` unlock copy | **Done** (uses `offers[].rejected.minOrderAmount` as sent) |
| Gift cards / loyalty / admin CRUD | **Not called** (out of P2) |

FE has not run a full backend smoke matrix on P2 pilots in this pass. Please confirm seed + zone visibility on the env the storefront points at.

---

## Endpoints FE calls

Same cart context on every call: `zoneCode`, `salesChannelCode`, `languageCode`, `currencyCode`, plus `guestToken` when there is no JWT.

| Method | Path | When |
|--------|------|------|
| `POST` | `/storefront/cart/:cartId/coupons` | Apply `{ "code" }` |
| `DELETE` | `/storefront/cart/:cartId/coupons/:code` | Remove applied coupon |
| `GET` | `/storefront/cart` (and other cart mutations) | Read `promotions` on the cart payload |
| `GET` | `/storefront/promotions/applicable?cartId=` | Unlock / near-miss `offers[]` |
| `POST` | `/storefront/checkout/from-cart` | Rebuild checkout after bag **or** promo change |

No extra apply call for automatic campaigns. FE expects them on every cart quote.

---

## What FE renders

Safe fields only: `applied[].kind`, `label`, `code`, `amount`, `totals.discountTotal`, `totals.shippingDiscount`. Internal ids (`couponId`, `campaignId`, `redemptionId`) are ignored.

| `applied[].kind` | UI |
|------------------|----|
| `COUPON` | Promo field: label + code + amount; **Remove** |
| `AUTOMATIC` | Summary row (BXGY / auto %); no remove |
| `FREE_SHIPPING` | Summary row + **Shipping discount** line from `totals.shippingDiscount` (fallback: row `amount`) |
| Unknown kind | **Skipped** (no crash) |

**Totals (as sent):**
- Subtotal = `subtotalEstimate` / checkout `totalsEstimate.subtotal`
- Discount = `discountEstimate` (merchandise; not shipping)
- Shipping = quoted `shippingEstimate` / checkout shipping — **not** reduced again on the client
- Shipping discount = `promotions.totals.shippingDiscount` (separate row)
- Total = `totalEstimate` (already includes shipping discount)

**Unlock copy:** only when applicable `offers[]` has `selected !== true` and `rejected.reason === MIN_ORDER` with `rejected.minOrderAmount`. Copy is `Spend {minOrderAmount} to unlock {title}` — FE does **not** invent remaining (`threshold − subtotal`). Hardcoded AED 250 free-shipping bar is removed.

**Stacking:** `PROMOTION_CONFLICT` on `promotions.rejected[]` is a quiet note. Not treated as coupon apply failure.

**One coupon:** second apply is a new `POST`; FE expects the server to replace the first.

---

## Errors FE handles

Branch on envelope `error.code` (and `error.context.reason` for `COUPON_NOT_APPLICABLE`).

| code | HTTP | FE |
|------|------|-----|
| `COUPON_NOT_FOUND` / `INACTIVE` / `NOT_STARTED` / `EXPIRED` / `USAGE_LIMIT_REACHED` / `ALREADY_USED_BY_CUSTOMER` | 422 | Inline on the promo field |
| `COUPON_NOT_APPLICABLE` | 422 | `MIN_ORDER` uses `context.minOrderAmount`; also `BRAND_ZONE_MISMATCH`, `CURRENCY`, `FIRST_ORDER_ONLY`, `CUSTOMER_MISMATCH`, `NO_ELIGIBLE_DISCOUNT`, `SCOPE`, `CHANNEL` |
| `COUPON_REQUIRES_LOGIN` | 401 | **Not** treated as session death. Code stashed, shopper sent to `/login?returnTo=…`, re-`POST` after login (`WELCOME15`) |
| `PRICING_CHANGED` / `REDEMPTION_EXPIRED` | 409 | Re-GET cart; checkout rebuilds; order is **not** placed |

---

## Surfaces

- Cart page `/cart` — unlock note, applied campaigns, coupon field, totals
- Cart drawer — free-shipping applied / unlock note from applicable (no invented remaining)
- Checkout `/checkout` — same + session `promotionSnapshot`; bag or promo change triggers `from-cart`

---

## Please confirm on backend (blockers for a green P2 demo)

1. **Pilot seed** on the storefront’s API env: coupons `EID10`, `SAVE25`, `WELCOME15`; automatic `EID_AUTO10`, `BXGY_3FOR2`, `SHIP_FREE_300`; UAE / `platform_uae` visibility.
2. **`GET /storefront/promotions/applicable?cartId=`** shape: `{ promotions, offers[] }` with `offers[].title` (or `label`), `selected`, `rejected.reason`, `rejected.minOrderAmount`.
3. Cart mutations always return `promotions.applied[]` + `totals.discountTotal` + `totals.shippingDiscount`.
4. Checkout `promotionSnapshot` after `from-cart` matches cart v1 (including `FREE_SHIPPING` / `shippingDiscount`).
5. `BXGY_3FOR2` only after **3 units**; `SHIP_FREE_300` only after shipping is quoted and merchandise subtotal ≥ 300.
6. `EID10` not stackable with `EID_AUTO10` → auto in `rejected[]` with `PROMOTION_CONFLICT`, HTTP still 200.

---

## Out of scope (FE will not call)

Admin coupon CRUD · gift cards · loyalty · invented remaining-to-free-shipping math · Rebuy.

---

## FE code (for tracing)

| Path | Role |
|------|------|
| `src/features/promotions/` | Types, applicable GET, coupon UI, applied rows, unlock copy |
| `src/features/cart/api/cart.service.ts` | `POST`/`DELETE` coupons + shared cart query (`guestToken` / zone) |
| `src/stores/useCartStore.ts` | Persists `promotions` from cart payload |
| `src/features/checkout/hooks/useCheckout.ts` | Rebuilds session when coupon **or** shipping-discount signature changes |
