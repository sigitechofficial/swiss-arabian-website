# Swiss Arabian — Storefront merch rails Frontend Integration Guide

> **Audience:** Customer storefront frontend + Cursor/AI agent.  
> **Purpose:** Wire **You may also like**, **Layer your scents**, **Don’t miss this**, and **More from {collection}** against **existing** Nest APIs.  
> **Source of truth:** running backend + Swagger at `/api/docs`. Never invent fields.  
> **Short handoff:** [`STOREFRONT_MERCH_RAILS_FE_HANDOFF.md`](./STOREFRONT_MERCH_RAILS_FE_HANDOFF.md)  
> **Cart ATC:** [`STOREFRONT_CART_FE_HANDOFF.md`](./STOREFRONT_CART_FE_HANDOFF.md)  
> **Checkout refresh:** [`STOREFRONT_CHECKOUT_AND_ORDERS_FE_GUIDE.md`](./STOREFRONT_CHECKOUT_AND_ORDERS_FE_GUIDE.md)  
> **Ops bootstrap:** `npm run ops:merch:rails:uae -- --apply`  
> **UI note:** Screens already exist as static/hardcoded rails — **replace with API data**, do not redesign.

---

## 0. Golden rules

1. Unwrap the global envelope — business payload is `data`.
2. No `/api/v1` prefix. Paths start `/storefront/...`.
3. **Public** merch + catalog GETs. No JWT required for rails. Guest ATC uses `guestToken` like the rest of cart.
4. Always send the **same market context as the bag**: `zoneCode`, `salesChannelCode`, `languageCode`, `currencyCode`. Mixing AED rail prices with a QAR bag is a bug.
5. Locale query is **`languageCode`**, not `locale`.
6. Hide the rail on **404**, empty `products`, or all cards filtered out. Do **not** keep mock SKUs.
7. Show only `isSellable === true` (and `isVisible !== false`). Unsellable → omit or disable Add.
8. Filter out the **current PDP `productId`** and SKUs **already in the cart**.
9. Add uses existing `POST /storefront/cart/items` (`sku` preferred, else `variantId`). Quantity `1`.
10. Do **not** paint “Free” / GWP / free-shipping remaining unless the cart/checkout API returns that line or field. Those are **not** in this phase.
11. Never invent a recommendations endpoint. Recently viewed is JWT-only and is **not** this rail.

**Stop rule:** Do not pull Rebuy, coupons, samples, or CMS homepage banners into this phase.

---

## 1. Have / don’t have (honest)

| UI | Backend today | FE work |
|----|---------------|---------|
| You may also like | Collection `you-may-also-like` via merch GET | Fetch + ATC |
| Layer your scents | Collection `layer-your-scents` | Fetch + ATC |
| Don’t miss this / add-ons | Collection `dont-miss-this` | Fetch + ATC + refresh checkout |
| More from the O1 collection | PDP `collections[]` + catalog collection products | Dynamic slug from PDP, not a global slug |
| Personalized recs (Rebuy) | **None** (UAE-G17 OPEN) | Do not fake |
| Free samples auto-add | **None** | Do not fake Free lines |
| Spend X more for free shipping | Threshold on **zone delivery methods** at checkout fee only | Do not invent cart progress |

---

## 2. Environment

| Item | Value |
|------|--------|
| Auth (rails) | Public |
| ATC | Optional JWT **or** `guestToken` (same as cart) |
| Swagger | **Storefront Merchandising** · **Storefront Catalog** · **Storefront — Cart** |
| UAE context | `zoneCode=UAE` · `salesChannelCode=platform_uae` |

---

## 3. Slug map

| Placement | UI title | Collection slug |
|-----------|----------|-----------------|
| PDP | You may also like | `you-may-also-like` |
| Cart drawer | Layer your scents | `layer-your-scents` |
| Checkout | Don’t miss this / Add-ons | `dont-miss-this` |
| PDP (below) | More from {collection name} | **From PDP** `collections[].slug` (prefer featured / name matching the product, e.g. O1) |

Checkout add-ons reuse `dont-miss-this`. Do not call a second API.

Admin/ops: create those three collections, assign products, enable UAE visibility. Script:

```bash
npm run ops:merch:rails:uae
npm run ops:merch:rails:uae -- --apply --assign-limit=8
```

`--assign-limit` fills from **existing** zone-visible products (bootstrap only). Merch should curate later in admin.

---

## 4. Endpoints

### 4.1 Named rail — merchandising collection

```http
GET /storefront/merchandising/collections/{slug}
  ?zoneCode=UAE
  &salesChannelCode=platform_uae
  &languageCode=en
  &currencyCode=AED
  &includeProducts=true
  &productLimit=12
```

| Query | Required | Notes |
|-------|----------|--------|
| `zoneCode` / `salesChannelCode` | Yes for useful cards | Hidden-in-zone collection → **404** |
| `languageCode` | Recommended | Names/slugs |
| `currencyCode` | Recommended | Must match cart |
| `includeProducts` | Yes (`true`) | Default is true on this route |
| `productLimit` | No | Default `12`, max `24` |
| `sort` | No | Same catalog sort tokens if needed |

**Success `data`:**

```ts
interface StorefrontHomepageContextView {
  zoneId: string | null;
  zoneCode: string | null;
  salesChannelCode: string | null;
  languageCode: string | null;
  currencyCode: string | null;
  legalEntityCode: string | null;
}

interface StorefrontProductCard {
  productId: string;
  variantId: string | null;
  sku: string | null;
  slug: string | null;
  name: string;
  shortDescription: string | null;
  image: string | null;
  images: Array<{
    url: string;
    altText: string | null;
    sortOrder: number | null;
    mediaType: string | null;
  }>;
  priceSummary: Record<string, unknown> | null;
  inventorySummary: Record<string, unknown> | null;
  isVisible: boolean;
  isSellable: boolean;
  sellabilityStatus: string | null;
  blockReasons: string[];
  badges: string[] | null;
}

interface StorefrontMerchandisingDetailView {
  context: StorefrontHomepageContextView;
  item: {
    id: string;
    code: string;
    slug: string | null;
    name: string;
    description: string | null;
    sortOrder: number;
    productCount: number | null;
    image: string | null;
    imageAlt: string | null;
  };
  products: StorefrontProductCard[];
}
```

Price display: reuse the same `priceSummary` formatting as PLP. Typical fields include an amount + `currencyCode` (confirm on a live card in Swagger). **Never** hardcode `AED` if `context.currencyCode` is `QAR`.

**404 / error:** hide the rail. Do not toast.

### 4.2 More from collection — catalog PLP

PDP `GET /storefront/catalog/products/:productIdOrSlug` returns `collections`:

```ts
collections: Array<{
  collectionId: string;
  code: string;
  name: string | null;
  slug: string | null;
  isFeatured: boolean;
}>;
```

Pick the collection for the heading (“More from the O1 collection”):

1. Prefer `isFeatured === true` with a slug.
2. Else first collection whose `name`/`slug`/`code` is not a merch-rail slug (`you-may-also-like`, `layer-your-scents`, `dont-miss-this`).
3. Else first collection with a slug.
4. If none → hide the rail.

```http
GET /storefront/catalog/collections/{slug}/products
  ?zoneCode=UAE
  &salesChannelCode=platform_uae
  &languageCode=en
  &currencyCode=AED
  &onlySellable=true
  &page=1
  &limit=12
```

**Success `data`:** `{ products, pagination, context, filters, sort, warnings }` — not `{ items }`.

“See all” → storefront collection PLP route using that slug (existing catalog collections page).

### 4.3 Add to bag

```http
POST /storefront/cart/items?zoneCode=UAE&salesChannelCode=platform_uae&guestToken={uuid}
Authorization: Bearer {accessToken}   # logged-in only; then omit guestToken
Content-Type: application/json

{ "sku": "…", "quantity": 1 }
```

or `{ "variantId": "<uuid>", "quantity": 1 }` if `sku` is null.

Then `GET /storefront/cart` (or use the add response `data`) to refresh the drawer.

**Checkout:** after a successful add, call `POST /storefront/checkout/from-cart` with the same `cartId` so the session **rebuilds snapshots**. Do not keep a stale checkout summary.

---

## 5. Frontend implementation (do this)

### 5.1 Shared `ProductRail`

One component for the three named rails.

```ts
const MERCH_RAIL_SLUGS = {
  pdpAlsoLike: 'you-may-also-like',
  cartLayer: 'layer-your-scents',
  checkoutDontMiss: 'dont-miss-this',
} as const;

const MERCH_RAIL_SLUG_SET = new Set(Object.values(MERCH_RAIL_SLUGS));

function isRailCardShown(
  card: StorefrontProductCard,
  excludeProductIds: Set<string>,
  excludeSkus: Set<string>,
): boolean {
  if (!card.isSellable) return false;
  if (card.isVisible === false) return false;
  if (excludeProductIds.has(card.productId)) return false;
  if (card.sku && excludeSkus.has(card.sku)) return false;
  return true;
}
```

Fetch helper (Phase 1 client):

```ts
export async function getMerchCollectionRail(slug: string, ctx: MarketCtx) {
  const data = await api.get(
    `/storefront/merchandising/collections/${encodeURIComponent(slug)}`,
    { ...ctx, includeProducts: true, productLimit: 12 },
  );
  return data as StorefrontMerchandisingDetailView;
}
```

On 404 → `products: []` and hide.

### 5.2 PDP (R.1 + R.2)

**You may also like**

- Fetch `you-may-also-like`.
- Exclude current PDP `product.productId`.
- `+` → cart add → refresh cart.
- “See all” optional → collection PLP for that slug.

**More from {name}**

- Title: `More from ${collection.name}.` (use API name, do not hardcode “O1”).
- Fetch catalog collection products; exclude current `productId`.
- “See all” → `/collections/{slug}` (or your existing collection route).

### 5.3 Cart — Layer your scents (R.3)

- Fetch `layer-your-scents` with **cart** context (`zoneCode` / `currencyCode` from cart response).
- Exclude SKUs / productIds already in bag.
- `+` → `POST /storefront/cart/items` with the same `cartId` / guest / JWT as the drawer.

### 5.4 Checkout — Don’t miss this + add-ons (R.4)

- Same fetch as cart but slug `dont-miss-this`.
- Add-ons row in the summary can render the **same** product list (or the first N cards). One API.
- After add: refresh cart **and** `POST /storefront/checkout/from-cart` so totals match.
- Do not show “SELECTED FREE SAMPLE” unless a cart line comes back with a zero unit price from the API (it will not, in this phase).

### 5.5 Currency / empty (R.5)

- `context.currencyCode` on the merch payload must match cart `currencyCode`. If they differ, you passed the wrong query — fix context, do not convert client-side.
- Empty rail → `return null`.
- Do not use static `homeContent` SKUs for these three placements.

---

## 6. Copy-paste agent prompt (storefront repo)

```text
Wire collection merch rails per docs/storefront/STOREFRONT_MERCH_RAILS_FE_GUIDE.md in swiss-arabian-backend.

1. Shared ProductRail: GET /storefront/merchandising/collections/{slug} with the same zoneCode, salesChannelCode, languageCode, currencyCode as catalog/cart. Unwrap data. Hide on 404/empty.
2. PDP “You may also like” → slug you-may-also-like; exclude current productId; ATC via POST /storefront/cart/items.
3. PDP “More from …” → PDP collections[] (skip merch-rail slugs); GET /storefront/catalog/collections/{slug}/products?onlySellable=true; See all → collection PLP.
4. Cart “Layer your scents” → layer-your-scents; exclude bag SKUs; ATC same guestToken/JWT as cart.
5. Checkout “Don’t miss this” / add-ons → dont-miss-this; after ATC POST /storefront/checkout/from-cart to rebuild snapshots.
6. Render priceSummary in context currency only. No fake Free samples. No Rebuy. No free-shipping progress bar.
```

---

## 7. Errors

| HTTP | Meaning | FE |
|------|---------|-----|
| 404 | Collection hidden / unknown in zone | Hide rail |
| 422 | Context not resolved | Fix zone/channel query; do not dump global catalog |
| 401 on ATC | Logged-in token expired | Existing refresh → login |
| ATC 422 | Not sellable / business rule | Show API `message`; keep rail |

---

## 8. Verification

- [ ] UAE `platform_uae`: each named rail returns cards **or** is hidden
- [ ] ATC from each rail updates bag qty/totals
- [ ] PDP “More from …” heading matches a real `collections[]` name
- [ ] Guest PDP/cart/checkout rails work without JWT
- [ ] Rail prices use the same currency as the bag
- [ ] No Free sample lines, no Rebuy calls, no hardcoded mock SKUs

---

## 9. Admin (optional)

Maintain membership in existing collection editor:

- `POST /admin/catalog/collections`
- `POST /admin/catalog/collections/:id/products`
- `POST /admin/catalog/collections/:id/zone-visibility`

No new “placement slot” admin screen.

---

## 10. Later (not this guide)

- UAE-G17 Rebuy-like recommendations
- Placement CMS / homepage `PRODUCT_RAIL`
- Cart “amount remaining for free shipping”
- Auto-add samples / promotions engine
