# Promotions & discounts — what the storefront actually implements

**Date:** 2026-09-28  
**Audience:** storefront FE, backend, QA  
**Scope:** customer website only. Admin campaign CRUD is not in this repo.  
**Contracts:** [`PROMOTIONS_DISCOUNTS_FE_GUIDE.md`](./PROMOTIONS_DISCOUNTS_FE_GUIDE.md), [`STOREFRONT_PROMOTIONS_API.md`](./STOREFRONT_PROMOTIONS_API.md), [`STOREFRONT_PROMOTIONS_API (1).md`](./STOREFRONT_PROMOTIONS_API%20(1).md)

The Sept 14 status note ([`STOREFRONT_PROMOTIONS_FE_STATUS.md`](./STOREFRONT_PROMOTIONS_FE_STATUS.md)) is older than the code. Gift cards are wired, and the free-shipping bar now shows remaining-to-threshold. This file is the current implementation.

---

## 1. Rule the UI follows

The server is the money authority.

- Coupon, automatic, BXGY, and free-shipping **amounts** come from the cart or checkout payload. The client does not compute percent-off, “3 for 2”, or a new order total.
- Gift-card tender is payment, not a merchandise discount. The client never subtracts a gift card from the total. It shows `totals.amountPayable` when the server sends it.
- The only client math is the **free-shipping progress bar**: remaining = threshold − merchandise subtotal, and the bar fills as a percentage. The discount itself still comes from the quote.

Hard-coded demo coupon `SA10` (−100 AED) is gone. A hard-coded AED 250 free-shipping bar is gone. The bar threshold is read from the applicable-promotions payload (see §6).

---

## 2. What is live vs not

| Area | Status |
|------|--------|
| Coupon apply / replace / remove | Live |
| Coupon error copy, including login-required re-apply | Live |
| Automatic campaigns and BXGY rows (`AUTOMATIC`) | Live — render only, no extra apply call |
| Free-shipping row (`FREE_SHIPPING`) + shipping-discount line | Live |
| Free-shipping progress bar (cart page, drawer, checkout) | Live |
| Stacking note when offers conflict (`PROMOTION_CONFLICT`) | Live — informational, not an error toast |
| Near-miss copy for a non-shipping offer that needs a higher subtotal | Live |
| Gift card apply, remove, balance check | Live on cart and checkout |
| Checkout rebuild when coupon, discount, shipping discount, or gift cards change | Live |
| Order confirmation and account order detail discount line | Live — one “Discount” row from order totals |
| Product-page free-shipping sentence from catalog `shippingPromise` | Live — separate from the promotions engine |
| Admin coupon / campaign CRUD | Not in this app |
| Loyalty / rewards points | Static account page only. Not connected to promotions |
| Complimentary gift samples in the bag | Paused. `COMPLIMENTARY_SAMPLES` is an empty list |
| Product-card “30% off” badges or strike-through sale prices | Not rendered. Catalog tags like `30%` are ignored on purpose |
| Buying a gift card as a product | Not implemented |

---

## 3. Where the code lives

| Path | Role |
|------|------|
| `src/features/promotions/` | Types, applicable-offers query, coupon UI, gift-card UI, applied rows, money summary, unlock / shipping bar |
| `src/features/promotions/types/promotions.ts` | Snapshot v1, gift-card tender, render helpers |
| `src/features/promotions/api/promotions.service.ts` | `GET /storefront/promotions/applicable`, gift-card balance |
| `src/features/cart/api/cart.service.ts` | Coupon and gift-card cart endpoints |
| `src/features/cart/hooks/useCouponMutations.ts` | Apply / remove coupon, then write the new cart into the store |
| `src/features/promotions/hooks/useGiftCardMutations.ts` | Apply / remove gift card on cart or checkout, plus balance check |
| `src/features/checkout/api/checkout.service.ts` | Checkout gift-card apply / remove |
| `src/features/checkout/hooks/useCheckout.ts` | Rebuilds the checkout session when the promo signature changes |
| `src/stores/useCartStore.ts` | Holds `promotions` and money totals from the last cart response |
| `src/styles/v5-cart.css`, `src/styles/v5-chrome.css`, `src/styles/v5-checkout.css` | Promo field, applied rows, shipping bar, unlock animation |

Public exports are in `src/features/promotions/index.ts`.

---

## 4. Data the UI reads

Every cart response can include `promotions` (`PromotionSnapshotV1`). Checkout uses the same shape on `promotionSnapshot`.

```ts
{
  v: 1,
  computedAt,
  context: { brandCode, zoneCode, currencyCode, salesChannelCode },
  applied: [{ kind, code, label, discountType, discountValue, level, amount }],
  lineAllocations: [{ ref, sku, amount }],
  totals: { discountTotal, shippingDiscount?, amountPayable? },
  rejected: [{ code, reason, message, minOrderAmount }],
  giftCards?: [{ usageId, maskedCode, amount, remainingBalance, currencyCode, status }]
}
```

Safe fields the UI shows: `kind`, `label`, `code`, `amount`, `totals.discountTotal`, `totals.shippingDiscount`, `totals.amountPayable`, gift-card `maskedCode` / `amount`. Internal ids (`couponId`, `campaignId`, `redemptionId`) are ignored.

`lineAllocations` are typed and stored. No screen draws a per-line discount breakdown.

Unknown `applied[].kind` values are skipped so a new kind cannot crash the summary.

Cart money fields the summary uses (all decimal strings from the API):

| UI line | Source |
|---------|--------|
| Subtotal | `subtotalEstimate` (checkout: `totalsEstimate.subtotal`) |
| Discount | `discountEstimate` — merchandise only, not shipping |
| Shipping | `shippingEstimate`. Shown as “Free” when the number is 0. Not reduced again on the client |
| Shipping discount | `promotions.totals.shippingDiscount`, else the `FREE_SHIPPING` row `amount` |
| Tax | `taxEstimate` (checkout). Cart page does not pass tax today |
| Gift card | each tender row, labelled with the masked code |
| Total | `totalEstimate` (already includes shipping discount) |
| Amount due | `amountPayable` only when it differs from Total |

Until the first cart quote arrives, the cart page falls back to a flat shipping display of AED 25 (`SHIP_FLAT`). That fallback is not a promotion.

Zustand persists bag **lines** only (`sa-cart-v2`). Promotions and totals are not written to localStorage; they return with the next cart GET.

---

## 5. Endpoints the storefront calls

Every call sends the same cart context: `zoneCode`, `salesChannelCode`, `languageCode`, `currencyCode`, plus `guestToken` when there is no JWT.

| Method | Path | When |
|--------|------|------|
| `POST` | `/storefront/cart/:cartId/coupons` | Apply `{ code }`. A second apply replaces the first; the server decides stacking |
| `DELETE` | `/storefront/cart/:cartId/coupons/:code` | Remove the applied coupon |
| `GET` | `/storefront/cart` (and other cart mutations) | Read `promotions` on the cart payload. No separate “apply automatic” call |
| `GET` | `/storefront/promotions/applicable?cartId=` | Unlock copy and the free-shipping bar. Cached 15s, keyed by cart id + `promotions.computedAt`. A 404 is not retried |
| `POST` | `/storefront/cart/:cartId/gift-cards` | Apply `{ code }` (optional `amount` is supported by the client, unused by the form) |
| `DELETE` | `/storefront/cart/:cartId/gift-cards` | Remove **all** gift cards on the cart |
| `POST` | `/storefront/gift-cards/balance` | Check balance `{ code }` — does not apply the card |
| `POST` | `/storefront/checkout/:sessionId/gift-cards` | Apply a card once checkout exists |
| `DELETE` | `/storefront/checkout/:sessionId/gift-cards/:usageId` | Remove one card by `usageId` |
| `POST` | `/storefront/checkout/from-cart` | Rebuild checkout after the bag **or** a promo change |

---

## 6. Instruments

### 6.1 Coupon (`kind: COUPON`)

Component: `CouponForm`. Surfaces: cart summary and checkout summary. The drawer does not have a coupon field.

Behaviour:

1. Shopper types a code and submits Apply.
2. `POST` coupons. On success the returned cart replaces store lines, totals, and `promotions`.
3. The applied row shows `label` (or the code), the code, and `−amount` when amount &gt; 0, plus Remove.
4. The field stays available with placeholder “Replace with another code” and a Replace button. One coupon is expected; the next `POST` is how a code is swapped.
5. Remove calls `DELETE` for that code.

Login-only codes (`COUPON_REQUIRES_LOGIN`, HTTP 401):

- This is **not** treated as a dead session.
- The code is stashed in `sessionStorage` (`sa-pending-coupon`).
- The shopper is sent to `/login?returnTo=/cart` or `/checkout` (any other path falls back to `/cart`).
- After auth bootstraps, `CouponForm` reads the stash once and re-`POST`s the code.

Inline errors (`couponErrorMessage`), branched on `error.code` and `error.context.reason`:

| Code | Copy |
|------|------|
| `COUPON_NOT_FOUND` | That code isn’t valid. |
| `COUPON_INACTIVE` | That code isn’t available right now. |
| `COUPON_NOT_STARTED` | That code isn’t active yet. |
| `COUPON_EXPIRED` | That code has expired. |
| `COUPON_USAGE_LIMIT_REACHED` | This code has reached its usage limit. |
| `COUPON_ALREADY_USED_BY_CUSTOMER` | You’ve already used this code. |
| `COUPON_REQUIRES_LOGIN` | Sign in to use this code. (Also triggers the redirect above.) |
| `COUPON_NOT_APPLICABLE` + `MIN_ORDER` | Spend {minOrderAmount} to use this code. |
| `BRAND_ZONE_MISMATCH` | This code isn’t valid in your region. |
| `CURRENCY` | This code isn’t valid for this currency. |
| `FIRST_ORDER_ONLY` | This code is for a first order. |
| `CUSTOMER_MISMATCH` | This code isn’t for this account. |
| `NO_ELIGIBLE_DISCOUNT` | Nothing in your bag qualifies for this code. |
| `SCOPE` | This code doesn’t apply to the items in your bag. |
| `CHANNEL` | This code isn’t valid on this site. |
| `PRICING_CHANGED` / `REDEMPTION_EXPIRED` | Bag is re-fetched. Order is not placed. Inline copy still shows. |

`PRICING_CHANGED` and `REDEMPTION_EXPIRED` (409) refresh the cart before the inline message.

### 6.2 Automatic and BXGY (`kind: AUTOMATIC`)

No customer action and no apply endpoint. If the cart qualifies, the row is already on `promotions.applied`.

`AppliedCampaigns` lists every known kind except `COUPON` (the coupon has its own field). Each row shows the label, or the code, or “Offer”, plus `−amount`. A zero amount shows “Applied”. There is no Remove control.

BXGY (for example buy 2 get 1) is just an `AUTOMATIC` row. The client does not count units.

### 6.3 Free shipping (`kind: FREE_SHIPPING`)

Two different displays:

**Quoted discount.** `AppliedCampaigns` shows a “Free shipping” (or the API label) row. `MoneySummary` adds a separate **Shipping discount** line from `totals.shippingDiscount`. Shipping itself stays the quoted fee. Total already includes the waiver.

**Progress bar.** `PromotionUnlockNote` + `useFreeShippingBar` + `freeShippingProgress`.

Threshold is taken from the first match:

1. An applicable offer whose code, campaign, title, or label matches `ship` or `deliver`, using `rejected.minOrderAmount`.
2. A code like `SHIP_FREE_300` / `ship_free_300` (the number in the code).
3. A title like “over AED 300” (`over` + amount).
4. The same patterns on `promotions.rejected`.

Then:

- `isFree` when shipping discount &gt; 0 **or** subtotal ≥ threshold (even if shipping is not quoted yet, for example reason `SHIPPING_NOT_QUOTED`).
- Otherwise the copy is `Spend {remaining} to unlock free shipping` and the track width is `subtotal / threshold`.
- When it flips from not-free to free, the bar plays a short “whoop” (check mark, fill, shine) for about 1.1s. `prefers-reduced-motion` disables the motion in CSS.
- The cart drawer also flashes the panel and bursts confetti the first time the bag crosses the threshold. Opening a drawer that is already free does not replay it.

If there is no shipping threshold and shipping is not already free, the bar is hidden.

### 6.4 Other near-miss offers

If the shipping bar is hidden, and `GET /promotions/applicable` has an offer with `selected !== true`, `rejected.reason === MIN_ORDER`, and a `minOrderAmount`, and that offer is **not** a shipping offer, the note says:

`Spend {minOrderAmount} to unlock {title or label}.`

That amount is the threshold the API sent, not “how much is left”.

### 6.5 Stacking conflicts

`promotions.rejected[]` entries with `reason === PROMOTION_CONFLICT` render as a quiet note under the bar:

API `message`, or “Another offer didn’t combine with the one already on your bag.”

This is not a 422 and not a toast. Example the contract describes: coupon `EID10` not stackable with automatic `EID_AUTO10` — HTTP 200, auto campaign listed in `rejected`.

### 6.6 Gift cards (tender)

Component: `GiftCardForm`. On the cart page it uses the cart. On checkout, once a session exists, apply and remove go to the checkout endpoints and the page adopts the returned session (and refreshes the cart).

- Applied cards list masked code, “Applied as payment”, and `−amount`.
- Cart remove clears every gift card (no per-card id on that DELETE).
- Checkout remove deletes one `usageId`.
- “Check balance” calls the balance endpoint and shows `{maskedCode} · {remaining} remaining`. It does not apply the card.
- Summary rows are separate from Discount. If `amountPayable` is present and different from Total, an **Amount due** line appears.
- Snake_case fields (`masked_code`, `usage_id`, `remaining_balance`, `appliedAmount`, `giftCardApplied`) are accepted when parsing.

Gift-card errors (`giftCardErrorMessage`):

| Code | Copy |
|------|------|
| `GIFT_CARD_NOT_FOUND` | That gift card isn’t valid. |
| `GIFT_CARD_INACTIVE` | That gift card isn’t available right now. |
| `GIFT_CARD_EXPIRED` | That gift card has expired. |
| `GIFT_CARD_ALREADY_APPLIED` | This gift card is already on your order. |
| `GIFT_CARD_INSUFFICIENT_BALANCE` | This gift card doesn’t have enough balance. |
| `GIFT_CARD_NOT_APPLICABLE` | This gift card doesn’t apply to your bag. |
| `GIFT_CARD_REQUIRES_LOGIN` | Sign in to use this gift card. (Inline only — no login stash.) |
| `GIFT_CARD_USAGE_LIMIT_REACHED` | This gift card has reached its usage limit. |
| `PRICING_CHANGED` / `REDEMPTION_EXPIRED` | Same refresh behaviour as coupons. |

---

## 7. Screens

| Screen | What shows |
|--------|------------|
| `/cart` | Shipping bar, applied automatic / free-shipping rows, promo code, gift card, full money summary including amount due |
| Cart drawer | Shipping bar only (with confetti on unlock). Footer uses amount due when the server sent it, otherwise subtotal. No coupon or gift-card form |
| `/checkout` | Same bar (`checkout-ship`), applied rows, promo code, gift card bound to the checkout session, money summary including tax |
| Order confirmation | One Discount row when `totals.discount` &gt; 0. No campaign names, no shipping-discount row, no gift-card rows |
| Account order detail | Same single Discount row |
| Stripe payment step | Discount row from checkout totals when &gt; 0 |
| Product detail | “Free shipping over {amount}” from catalog `shippingPromise.freeDeliveryThreshold`, plus delivery-day copy. This is the delivery-method promise, not `promotions.applied` |

Checkout session signature (so a promo change rebuilds `from-cart`):

`lines | coupon code | merchandise discount | shipping discount | gift-card ids and amounts`

Changing any of those cancels the stale session and creates a new one. The shopper’s delivery and payment choices are re-applied after rebuild.

---

## 8. Discount types the engine can send

The client does not branch on `discountType` to do math. It prints `label` and `amount`. These are the types the backend guide defines, all of which arrive as `AUTOMATIC`, `COUPON`, or `FREE_SHIPPING`:

| `discountType` | Meaning |
|----------------|---------|
| `PERCENTAGE` | Percent of eligible subtotal, optional cap |
| `FIXED_AMOUNT` | Flat amount off, clamped to subtotal |
| `FIXED_PRICE` | Eligible unit price becomes a fixed price |
| `BUY_X_GET_Y` | Pay for X, discount Y units |
| `FREE_SHIPPING` | Waives the quoted shipping fee |

Pilot codes called out in the contract (must be seeded on the API the storefront points at): coupons `EID10`, `SAVE25`, `WELCOME15`; automatic `EID_AUTO10`, `BXGY_3FOR2`, `SHIP_FREE_300`; visible for UAE / `platform_uae`.

---

## 9. Related UI that is not the promotions engine

**Product detail shipping promise.** `src/features/catalog/utils/pdpShipping.ts` reads `shippingPromise` on the PDP payload and can show “Free shipping over AED 300” before anything is in the bag. Listing cards do not get this field. The cart bar uses promotions applicable-offers, not this PDP field. The two thresholds can disagree if the two APIs disagree.

**Product badges.** `shopperBadgeFromTags` only emits “New” and “Best Seller”. A tag such as `30%` is listed as a promo leftover and is not drawn. There is no compare-at / strike-through price on cards.

**Rewards page.** `AccountRewardsPageView` uses local dummy points and redeem offers. Redeeming does not call promotions, coupons, or gift cards.

**Complimentary samples.** Cart and checkout map `COMPLIMENTARY_SAMPLES`, which is currently `[]` until backend gift lines exist.

**Mega-menu “promo” blocks** are merchandising creatives (image, copy, CTA), not discount campaigns.

---

## 10. Tests

| File | Covers |
|------|--------|
| `src/features/promotions/utils/freeShippingBar.spec.ts` | Bar fills to 50% at 150 / 300; unlocks when subtotal crosses the threshold even if shipping is not quoted |
| `src/features/promotions/types/promotions.spec.ts` | Gift-card row parsing, empty objects skipped, `amountPayable` used as sent, gift-card signature `usageId:amount` |

---

## 11. QA checklist

1. Apply `EID10` on `/cart`. Discount row and coupon chip match the cart payload. Remove clears both.
2. Apply a second code. The first coupon is replaced. No client-side “only one coupon” error.
3. `WELCOME15` while logged out goes to login and reapplies after sign-in.
4. Invalid, expired, wrong-region, and below-minimum codes show the inline copy in §6.1 and do not change the total.
5. Add items until `BXGY_3FOR2` qualifies. An automatic row appears with no Remove button. The client does not count the units.
6. Below the free-shipping threshold, the bar shows remaining and a partial fill on the cart page, the drawer, and checkout. Crossing it shows “You’ve unlocked free shipping”, then a shipping-discount line once shipping is quoted.
7. `EID10` together with `EID_AUTO10` stays HTTP 200 and shows the conflict note.
8. Apply a gift card. Discount stays the merchandise figure. A gift-card line and, when sent, Amount due appear. Check balance does not change the total. Remove clears it.
9. Change the coupon or gift card on checkout. The session rebuilds (`from-cart`) and the summary matches the new snapshot.
10. Placed order confirmation shows Discount only when `totals.discount` &gt; 0.
