# Swiss Arabian — Storefront Wishlist Frontend Integration Guide

> **Audience:** Customer storefront frontend + Cursor/AI agent.  
> **Purpose:** Wire **logged-in wishlist / saved items** against existing Nest APIs.  
> **Source of truth:** running backend + Swagger at `/api/docs`. Never invent fields.  
> **Scope:** `/storefront/customer/wishlist*` only.  
> **Prerequisite:** Phase 1 auth + Phase 2 account (same Bearer client).  
> **Short handoff:** [`STOREFRONT_WISHLIST_FE_HANDOFF.md`](./STOREFRONT_WISHLIST_FE_HANDOFF.md)  
> **UI note:** `/account/wishlist` and `/account/saved` already exist as placeholders — **wire APIs, do not redesign**. Both pages use the **same** wishlist API.

---

## 0. Golden rules

1. Unwrap the global envelope — business payload is `data`.
2. No `/api/v1` prefix. Path is `/storefront/customer/wishlist`.
3. **Strict customer JWT.** No `guestToken`. Guest wishlist is **not implemented**.
4. Ownership is JWT only. Never send `customerId`.
5. Wishlist item key is **`productId` (platform UUID)** from catalog PDP/PLP. **Not** slug. **Not** SKU. **Not** Shopify id.
6. List/add should send the same market context as catalog: `zoneCode=UAE&salesChannelCode=platform_uae` (plus `languageCode` / `currencyCode` if you already send them).
7. Duplicate add is **idempotent** (`alreadyPresent: true`). Missing remove is a **no-op** (`removed: false`). Do not toast those as failures.
8. Cap is **100** products. Over cap → `422` — show the API `message`.
9. `/account/saved` = same API as `/account/wishlist`. Do not invent a second saved-items backend.
10. Never invent fields — Swagger wins (`Storefront Wishlist`).

**Stop rule:** Do not pull reviews, returns, support, recently-viewed, or coupons into this phase.

---

## 1. Environment

| Item | Value |
|------|--------|
| Auth | `Authorization: Bearer <accessToken>` |
| Swagger | `customer-bearer` · tag **Storefront Wishlist** |
| Guest | No API. Redirect to `/login?returnTo=…` |
| Context (list + add) | `zoneCode` + `salesChannelCode` query params |

Unauthenticated → `401`. Reuse Phase 1 refresh → login.

---

## 2. Endpoints

Base: `/storefront/customer/wishlist`

| Method | Path | Auth | Use |
|--------|------|------|-----|
| GET | `/storefront/customer/wishlist` | JWT | Account list |
| GET | `/storefront/customer/wishlist/status` | JWT | Heart state on PLP/PDP |
| POST | `/storefront/customer/wishlist/items` | JWT | Add (idempotent) |
| DELETE | `/storefront/customer/wishlist/items/:productId` | JWT | Remove one (no-op if missing) |
| DELETE | `/storefront/customer/wishlist/items` | JWT | Clear all |

### 2.1 List — `GET /storefront/customer/wishlist`

```http
GET /storefront/customer/wishlist
  ?zoneCode=UAE
  &salesChannelCode=platform_uae
  &languageCode=en
  &currencyCode=AED
  &limit=20
  &offset=0
```

| Query | Required | Notes |
|-------|----------|--------|
| `zoneCode` / `salesChannelCode` | Yes for useful cards | Hidden-in-zone products are **dropped from `items`** |
| `limit` | No | Default `20`, max `50` |
| `offset` | No | Default `0` (not page) |

**Success `data`:**

```ts
interface StorefrontWishlistListView {
  items: StorefrontWishlistItemView[];
  total: number;   // stored count, including zone-hidden ids
  limit: number;
  offset: number;
}

interface StorefrontWishlistItemView {
  productId: string;
  addedAt: string; // ISO
  product: StorefrontWishlistProductSummaryView | null;
}

interface StorefrontWishlistProductSummaryView {
  productId: string;
  slug: string | null;
  name: string;
  image: string | null;
  currency: string | null;
  priceSummary: Record<string, unknown> | null;
  isVisible: boolean;
  isSellable: boolean;
  sellabilityStatus: string | null;
  variantId: string | null;
  sku: string | null;
}
```

**FE notes**

- Render `item.product` like a PLP card. Link with `product.slug`.
- Add-to-cart: use `product.sku` (preferred) or `product.variantId` — same as catalog ATC.
- If `product` is missing / `isSellable === false`, show the card but disable ATC.
- `total` can be **higher** than `items.length` on the page because zone-hidden products are excluded from `items` but still counted in `total`. Do not treat that as a bug.
- Empty list → empty state, not an error.

### 2.2 Status — `GET /storefront/customer/wishlist/status`

Use this on PLP / PDP / collection hearts. **Do not** fetch the full list just to paint hearts.

```http
GET /storefront/customer/wishlist/status?productIds={uuid1},{uuid2}
```

| Query | Required | Notes |
|-------|----------|--------|
| `productIds` | Yes | Comma-separated UUIDs, **max 50** |
| Zone context | No | Status does not need catalog context |

**Success `data`:**

```ts
{ items: Array<{ productId: string; inWishlist: boolean }> }
```

**Errors:** empty `productIds` or >50 or non-UUID → `422`.

Logged-out: skip this call; hearts are empty / prompt login.

### 2.3 Add — `POST /storefront/customer/wishlist/items`

```http
POST /storefront/customer/wishlist/items?zoneCode=UAE&salesChannelCode=platform_uae
```

```json
{ "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6" }
```

`productId` must be a UUID (`@IsUUID()`). Sending a slug → `400`.

**Success `data`:**

```ts
{ productId: string; addedAt: string; alreadyPresent: boolean }
```

| Case | UX |
|------|-----|
| `alreadyPresent: false` | Heart on + optional toast |
| `alreadyPresent: true` | Heart stays on — not an error |
| `404` Product not found | Toast API message |
| `422` cap 100 | “Wishlist is limited to 100 products” |

HTTP status is **200** (not 201).

### 2.4 Remove one — `DELETE /storefront/customer/wishlist/items/:productId`

**Success `data`:** `{ productId: string; removed: boolean }`

`removed: false` = id was not on the list. Treat as success (heart off).

### 2.5 Clear — `DELETE /storefront/customer/wishlist/items`

**Success `data`:** `{ cleared: true; itemCount: number }`

`itemCount` is how many were cleared. Confirm in UI before calling.

---

## 3. Errors

| HTTP | When | UX |
|------|------|-----|
| `400` | Invalid UUID body / validation | Toast `message` |
| `401` | No/expired JWT | Refresh → login |
| `404` | Customer missing, or add unknown `productId` | Toast / empty |
| `422` | Cap 100, bad `productIds` csv | Show `message` |

---

## 4. Suggested FE flows

### A — PDP / PLP heart (logged in)

```
On card/PDP mount (≤50 ids):
  GET /wishlist/status?productIds=…
  → paint hearts from inWishlist

Tap empty heart:
  POST /items { productId }
  → optimistic heart on; revert on 4xx

Tap filled heart:
  DELETE /items/:productId
  → optimistic heart off
```

### B — Guest heart

```
Tap → /login?returnTo=currentUrl
After login, call status again. Do not keep a guest localStorage wishlist.
```

### C — Account `/account/wishlist` and `/account/saved`

```
GET /wishlist?zoneCode=UAE&salesChannelCode=platform_uae&limit=20&offset=0
→ cards
Remove → DELETE /items/:productId → refetch
ATC → existing cart API with sku / variantId from product
```

---

## 5. Suggested API module

Reuse Phase 1 `apiGet` / `apiPost` / `apiDelete` + envelope unwrap.

```ts
wishlistApi.list(ctx)                    // GET /
wishlistApi.status(productIds: string[]) // GET /status?productIds=a,b
wishlistApi.add(productId, ctx)          // POST /items
wishlistApi.remove(productId)            // DELETE /items/:productId
wishlistApi.clear()                      // DELETE /items
```

---

## 6. Acceptance checklist

- [ ] Guest heart never calls wishlist APIs; login redirect only
- [ ] PDP/PLP hearts use `/status` (batched), not full list
- [ ] Add uses catalog **`productId` UUID**
- [ ] Duplicate add and missing remove are silent success
- [ ] Account wishlist page lists cards with image / price / ATC when `isSellable`
- [ ] `/account/saved` uses the same endpoints
- [ ] Clear-all confirms, then `DELETE /items`
- [ ] 100-item cap shows backend message
- [ ] No reviews / returns / recently-viewed in this PR

---

## 7. Explicitly not this phase

| Topic | Why |
|-------|-----|
| Guest wishlist | Not built |
| Recently viewed | Separate controller — next optional wave |
| Reviews / returns / support | Later customer modules |
| Checkout `customerAddressId` | Phase 2 close-out (already documented) — do in a tiny PR, not here |

---

## 8. Agent prompt (paste into Cursor)

```
You are wiring Swiss Arabian storefront wishlist against the NestJS backend.
Read docs/storefront/STOREFRONT_WISHLIST_FE_GUIDE.md
Reuse the existing Phase 1 apiClient (envelope unwrap, Bearer, refresh).
JWT only. No guest wishlist. No /api/v1 prefix.
productId = catalog UUID, never slug/SKU.
Wire: status hearts, add/remove toggle, account list + ATC + optional clear.
/account/saved uses the same API as /account/wishlist.
Do not invent fields. Swagger tag: Storefront Wishlist.
Do not wire reviews, returns, support, or recently-viewed in this PR.
```
