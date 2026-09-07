# Storefront FE — reviews status for backend

**Date:** 2026-09-07  
**Audience:** NestJS backend  
**Repo:** `swiss-arabian-website`  
**Guide we wired against:** `STOREFRONT_REVIEWS_FE_GUIDE.md` (Swagger tag **Storefront Product Reviews**)  
**Purpose:** Confirm **product reviews are implemented on FE** and live against `/storefront/*`. This is not a request for new review endpoints.

**Status: done on FE.** Public PDP summary + list, write/edit, helpful votes, and `/account/reviews` are calling Nest. Home marketing “reviews” block is still static (not this API).

---

## What FE now does

| Surface                    | Behaviour                                                                                                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PDP `/products/[slug]`     | `GET …/reviews/summary` + `GET …/reviews`. Stars/histogram only if `reviewCount > 0`. Never fake ratings.                                                         |
| Write / edit on PDP        | JWT `POST /storefront/customer/reviews` or `PATCH …/:reviewId`. Toast: **Submitted — visible after approval.** New review is **not** appended to the public list. |
| Guest write / helpful      | `/login?returnTo=` current PDP. No guest POST.                                                                                                                    |
| Helpful                    | JWT `POST` / `DELETE /storefront/catalog/reviews/:reviewId/helpful`. `alreadyMarked` is treated as success.                                                       |
| Account `/account/reviews` | JWT list (filter PENDING / APPROVED / REJECTED), edit (back to PENDING), delete with confirm. Also linked from profile + account tab nav.                         |
| Order detail               | **No** “Write a review” — order lines still lack `productId` / slug.                                                                                              |

**Public path key:** catalog **`productId` UUID**, not slug. On current Nest, `GET …/products/:slug/reviews/summary` returned **404 Product not found**; the same call with UUID returned 200 (`reviewCount: 0` for an empty product). Please keep UUID working; slug support is optional.

**Context** (public + create), same as catalog:

```
zoneCode=UAE
salesChannelCode=platform_uae
languageCode=en
currencyCode=AED
```

Public GETs use `skipAuth` (no Bearer) so a 401 cannot log a guest out. Write / helpful / my-reviews send Bearer.

FE never sends `status` or `verifiedPurchase` on create/update.

---

## Contracts FE relies on

| HTTP              | When                          | FE UX                                                             |
| ----------------- | ----------------------------- | ----------------------------------------------------------------- |
| `200` create/edit | Status `PENDING`              | Toast pending. PDP public list unchanged until APPROVED           |
| `409` create      | Already reviewed this product | “You already reviewed this product” → load own review → edit form |
| `422` create      | No eligible purchase          | “You can only review products from your completed orders.”        |
| `404` public      | Hidden product / bad id       | No fake stars                                                     |
| `404` helpful     | Review not approved / missing | “This review is no longer available.”                             |

One review per customer per product. Verified purchase is server-side.

---

## APIs FE calls (reviews)

```
# Public (no JWT)
GET    /storefront/catalog/products/:productId/reviews/summary
GET    /storefront/catalog/products/:productId/reviews
       ?zoneCode=UAE&salesChannelCode=platform_uae
       &sort=newest|rating_high|rating_low|helpful
       &limit=20&offset=0

# Helpful (JWT)
POST   /storefront/catalog/reviews/:reviewId/helpful
DELETE /storefront/catalog/reviews/:reviewId/helpful

# Customer (JWT)
POST   /storefront/customer/reviews?zoneCode=UAE&salesChannelCode=platform_uae
GET    /storefront/customer/reviews?limit=20&offset=0[&status=]
GET    /storefront/customer/reviews/:reviewId
PATCH  /storefront/customer/reviews/:reviewId
DELETE /storefront/customer/reviews/:reviewId
```

Create body: `{ productId, rating, title?, body?, displayName?, variantId? }`.  
`rating` 1–5. No `status` / `verifiedPurchase`.

---

## Not this work

Preferences, checkout `customerAddressId`, coupons, newsletter, markets, returns, support — unchanged. Reviews PR did not touch them.

---

## Asks for backend

1. Confirm Azure Dev Nest matches Swagger **Storefront Product Reviews** and the list above.
2. Confirm public summary/list work with **product UUID** in `zoneCode=UAE` + `salesChannelCode=platform_uae`. Slug 404 is OK if UUID is the contract.
3. Confirm create → `PENDING`, public list stays APPROVED-only, `409` duplicate, `422` no purchase.
4. Confirm helpful `alreadyMarked` / `removed: false` are 200, not errors.

---

## Slack one-liner

> FE 2026-09-07: **product reviews are live** — PDP public summary/list (UUID, no JWT), JWT write/edit/delete, helpful votes, `/account/reviews`. Create stays PENDING until you approve. Confirm Azure Dev matches Swagger Storefront Product Reviews. Detail: `docs/storefront/STOREFRONT_REVIEWS_FE_STATUS.md`.
