# Swiss Arabian — Storefront Reviews Frontend Integration Guide

> **Audience:** Customer storefront frontend + Cursor/AI agent.  
> **Purpose:** Wire **product reviews** against existing Nest APIs (Judge.me replacement).  
> **Source of truth:** running backend + Swagger at `/api/docs`. Never invent fields.  
> **Scope:** public PDP reviews + customer write/edit + helpful votes.  
> **Prerequisite:** Auth Phase 1 + catalog PDP live. Wishlist / Phase 2 already wired — do not redo them.  
> **Short handoff:** [`STOREFRONT_REVIEWS_FE_HANDOFF.md`](./STOREFRONT_REVIEWS_FE_HANDOFF.md)  
> **FE status as of 2026-09-07:** **wired.** PDP + `/account/reviews` call Nest. See [`STOREFRONT_REVIEWS_FE_STATUS.md`](./STOREFRONT_REVIEWS_FE_STATUS.md) for backend.

---

## 0. Golden rules

1. Unwrap the global envelope — business payload is `data`.
2. No `/api/v1` prefix.
3. Public read: no JWT. Write / edit / delete / helpful: **strict customer JWT**.
4. **No guest write.** Guest taps “Write a review” or “Helpful” → `/login?returnTo=…`.
5. Public list + summary show **APPROVED** reviews only. `PENDING` / `REJECTED` / `HIDDEN` / `DELETED` are never public.
6. Create and edit set/reset status to **`PENDING`**. Show “Submitted — visible after approval.” Do not expect the new review on the PDP list immediately.
7. **One review per customer per product.** Duplicate create → `409`.
8. Write requires a **verified purchase** (eligible order line). No purchase → `422`. Do not fake a review.
9. `verifiedPurchase` and `status` are **server-set**. Never send them on create/update.
10. Send the same market context as PDP: `zoneCode=UAE&salesChannelCode=platform_uae` on public + create calls.
11. Hide the stars block when `reviewCount === 0`. Never invent ratings.
12. Never invent fields — Swagger tag **Storefront Product Reviews**.

**Stop rule:** Do not pull wishlist, returns, support, recently-viewed, preferences, coupons, or checkout `customerAddressId` into this PR.

---

## 1. Environment

| Item            | Value                                              |
| --------------- | -------------------------------------------------- |
| Public read     | No auth                                            |
| Write / helpful | `Authorization: Bearer <accessToken>`              |
| Swagger         | `customer-bearer` · **Storefront Product Reviews** |
| Context         | `zoneCode` + `salesChannelCode` (same as catalog)  |

Hidden / not-visible product in this zone → public reviews **404**.

---

## 2. Endpoints

### 2.1 Summary (PDP stars) — public

```http
GET /storefront/catalog/products/:productIdOrSlug/reviews/summary
  ?zoneCode=UAE&salesChannelCode=platform_uae
```

`:productIdOrSlug` = catalog UUID **or** slug (same as PDP).

**Success `data`:**

```ts
interface StorefrontReviewSummaryView {
  productId: string;
  averageRating: number; // 0 if none; one decimal when count > 0
  reviewCount: number; // APPROVED only
  ratingBreakdown: {
    "1": number;
    "2": number;
    "3": number;
    "4": number;
    "5": number;
  };
  verifiedPurchaseCount: number;
}
```

**UX:** If `reviewCount === 0`, hide stars / “No reviews yet”. Else show average + count. Optional histogram from `ratingBreakdown`.

### 2.2 List (PDP) — public

```http
GET /storefront/catalog/products/:productIdOrSlug/reviews
  ?zoneCode=UAE&salesChannelCode=platform_uae
  &sort=newest
  &limit=20
  &offset=0
```

| Query    | Default  | Notes                                                  |
| -------- | -------- | ------------------------------------------------------ |
| `sort`   | `newest` | `newest` \| `rating_high` \| `rating_low` \| `helpful` |
| `limit`  | `20`     | Max `50`                                               |
| `offset` | `0`      | Not page                                               |

**Success `data`:**

```ts
interface StorefrontPublicReviewListView {
  productId: string;
  items: StorefrontPublicReviewView[];
  total: number;
  limit: number;
  offset: number;
}

interface StorefrontPublicReviewView {
  reviewId: string;
  rating: number; // 1–5
  title: string | null;
  body: string | null;
  displayName: string | null;
  verifiedPurchase: boolean;
  createdAt: string; // ISO
  helpfulCount: number;
  variant: {
    variantId: string;
    variantName: string | null;
    sku: string | null;
  } | null;
}
```

No email, phone, `customerId`, or moderation notes. Optional “Verified purchase” badge when `verifiedPurchase`.

### 2.3 Helpful — JWT

```http
POST   /storefront/catalog/reviews/:reviewId/helpful
DELETE /storefront/catalog/reviews/:reviewId/helpful
```

HTTP **200**.

**POST `data`:** `{ reviewId, helpfulCount, alreadyMarked }`  
**DELETE `data`:** `{ reviewId, helpfulCount, removed }`

| Case                  | UX                            |
| --------------------- | ----------------------------- |
| `alreadyMarked: true` | Keep heart on — not an error  |
| `removed: false`      | Heart off — not an error      |
| Guest                 | Login redirect                |
| `404`                 | Review not approved / missing |

### 2.4 Create — JWT

```http
POST /storefront/customer/reviews?zoneCode=UAE&salesChannelCode=platform_uae
```

```json
{
  "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "rating": 5,
  "title": "Great scent",
  "body": "Lasts all day.",
  "displayName": "Aisha"
}
```

| Field                            | Required     | Notes                                          |
| -------------------------------- | ------------ | ---------------------------------------------- |
| `productId` **or** `productSlug` | One required | Prefer `productId` UUID from PDP               |
| `rating`                         | Yes          | Integer 1–5                                    |
| `title`                          | No           | Max 120                                        |
| `body`                           | No           | Max 4000                                       |
| `displayName`                    | No           | Max 80 — **not** email/phone                   |
| `variantId`                      | No           | Must belong to the product                     |
| `orderId` / `orderLineId`        | No           | Optional hints; server still verifies purchase |

HTTP **200**. Success `data` is `StorefrontCustomerReviewView` with `status: "PENDING"`.

Do **not** send `status` or `verifiedPurchase`.

### 2.5 My reviews — JWT

```http
GET /storefront/customer/reviews?limit=20&offset=0
GET /storefront/customer/reviews/:reviewId
PATCH /storefront/customer/reviews/:reviewId
DELETE /storefront/customer/reviews/:reviewId
```

Optional list filter: `status=PENDING` \| `APPROVED` \| `REJECTED` \| `HIDDEN`.

**Customer view** (includes own non-public statuses):

```ts
interface StorefrontCustomerReviewView {
  reviewId: string;
  productId: string;
  variantId: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  displayName: string | null;
  status: string; // PENDING | APPROVED | REJECTED | HIDDEN | DELETED
  verifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
  product: {
    productId: string;
    slug: string | null;
    name: string | null;
    image: string | null;
  } | null;
  variant: {
    variantId: string;
    variantName: string | null;
    sku: string | null;
  } | null;
}
```

**PATCH body:** optional `rating`, `title`, `body`, `displayName`. Edit **resets to PENDING** — it leaves the public PDP until re-approved.

**DELETE `data`:** `{ reviewId, deleted: true }` (soft-delete). Other customer’s id → **404**.

---

## 3. Errors

| HTTP  | When                                                        | UX                                                             |
| ----- | ----------------------------------------------------------- | -------------------------------------------------------------- |
| `400` | Validation (rating not 1–5, bad UUID)                       | Field errors / toast `message`                                 |
| `401` | Write/helpful without JWT                                   | Refresh → login                                                |
| `404` | Hidden product, missing review, other user’s review         | Empty / not found                                              |
| `409` | Already reviewed this product                               | “You already reviewed this product” — offer edit of own review |
| `422` | No eligible purchase; missing productId/slug; bad variantId | “You can only review products from your completed orders.”     |

Eligible purchase ≈ order not draft/checkout/cancelled/failed, and status/fulfillment is delivered, shipped, in transit, or similar completed path. Payment-pending only is **not** enough.

---

## 4. Suggested FE flows

### A — PDP (everyone)

```
Load PDP
  → GET …/reviews/summary   (stars)
  → GET …/reviews           (list)
  → Hide block if reviewCount === 0 and items empty
```

### B — Write a review (logged-in buyer)

```
PDP or order detail “Write review”
  → POST /storefront/customer/reviews { productId, rating, title?, body? }
  → Toast: pending approval
  → Do not append to public list
```

If `422` purchase failed: “Buy this product first” / link to `/account/orders`.  
If `409`: load own review (`GET /customer/reviews`) and offer edit.

### C — Guest

```
Write / Helpful → /login?returnTo=currentPdp
```

### D — Optional account page

```
GET /storefront/customer/reviews
Show PENDING / APPROVED / REJECTED badges
PATCH to edit (back to PENDING)
DELETE with confirm
```

There is no `/account/reviews` route in the 7 Sep FE status — add a small page or a block on profile/orders if you want Wave R.5.

---

## 5. Suggested API module

Reuse Phase 1 `apiGet` / `apiPost` / `apiPatch` / `apiDelete` + envelope unwrap.

```ts
reviewsApi.getSummary(productIdOrSlug, ctx)
reviewsApi.listPublic(productIdOrSlug, ctx)          // sort, limit, offset
reviewsApi.markHelpful(reviewId)
reviewsApi.removeHelpful(reviewId)
reviewsApi.create(dto, ctx)
reviewsApi.listMine({ status?, limit?, offset? })
reviewsApi.getMine(reviewId)
reviewsApi.update(reviewId, dto)
reviewsApi.remove(reviewId)
```

---

## 6. Acceptance checklist

- [ ] PDP summary + list use public endpoints (no JWT)
- [ ] Empty product: no fake stars
- [ ] Only APPROVED reviews on PDP
- [ ] After create, UI shows PENDING — not on public list
- [ ] Guest cannot POST review or helpful
- [ ] No-purchase → `422` message, no fake success
- [ ] Second review same product → `409`
- [ ] Edit returns to PENDING
- [ ] Helpful duplicate is silent success
- [ ] Context `zoneCode` + `salesChannelCode` on public + create
- [ ] No wishlist / returns / coupon work in this PR

---

## 7. Explicitly not this phase

| Topic                                | Why                                           |
| ------------------------------------ | --------------------------------------------- |
| Preferences `GET/PATCH /preferences` | FE leftover from Phase 2 — separate tiny PR   |
| Checkout `customerAddressId`         | FE leftover — separate tiny PR                |
| Dashboard recent order               | Already have `GET /customer/orders` — FE only |
| Returns / support / recently viewed  | Next modules after reviews                    |
| Coupons / newsletter / markets       | No customer API yet                           |

---

## 8. Agent prompt (paste into Cursor)

```
You are wiring Swiss Arabian storefront product reviews against the NestJS backend.
Read docs/storefront/STOREFRONT_REVIEWS_FE_GUIDE.md
Reuse the existing Phase 1 apiClient (envelope unwrap, Bearer, refresh).
Public: GET /storefront/catalog/products/:idOrSlug/reviews and /reviews/summary
JWT: POST /storefront/customer/reviews, own review CRUD, helpful votes.
New reviews are PENDING — do not show them on the public PDP list until approved.
Write requires verified purchase (422 if not). One review per product (409).
Guest write/helpful → login. No /api/v1. Never invent fields.
Swagger tag: Storefront Product Reviews.
Do not wire wishlist, returns, support, preferences, or checkout address in this PR.
```
