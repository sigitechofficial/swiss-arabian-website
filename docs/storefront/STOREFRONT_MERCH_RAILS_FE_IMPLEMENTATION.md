# Storefront merch rails — FE implementation

> **Source guide:** [`STOREFRONT_MERCH_RAILS_FE_GUIDE.md`](./STOREFRONT_MERCH_RAILS_FE_GUIDE.md)  
> **Repo:** customer storefront (`swiss-ui-with-landing-pages`)  
> **Purpose:** Record what was wired from that guide: named merch collections + PDP “More from {collection}”.  
> **UI rule:** Existing rails kept; static/hardcoded product lists replaced with API data. No redesign.

---

## 1. What shipped

| Placement | UI copy | Collection slug | FE |
|-----------|---------|-----------------|----|
| PDP | You may also like | `you-may-also-like` | Live merch GET + ATC |
| Cart drawer | Layer your scents | `layer-your-scents` | Live merch GET + ATC |
| Cart page | Don’t miss this | `dont-miss-this` | Same merch GET as checkout |
| Checkout | Don’t miss this + Add-ons | `dont-miss-this` | One fetch; add-ons = first 3 cards |
| PDP (below also-like) | More from {collection name}. | From PDP `collections[]` | Catalog collection products, not a global merch slug |

Checkout add-ons **do not** call a second API.

---

## 2. Endpoints used

### Named rails

```http
GET /storefront/merchandising/collections/{slug}
  ?zoneCode=…
  &salesChannelCode=…
  &languageCode=…
  &currencyCode=…
  &includeProducts=true
  &productLimit=12
```

- Public (`skipAuth: true`). No JWT for the GET.
- Market query is the same helper as catalog/cart: `storefrontContextQuery()` (`zoneCode`, `salesChannelCode`, `languageCode`, `currencyCode`).
- Envelope `{ success, data }` is unwrapped by `apiClient`. Business payload is `data`.
- **404** (hidden / unknown in zone) → treat as empty, **hide the rail**, no toast.
- Cards may appear on `data.products` or nested `data.item.products`; the client merges both.

### More from {collection}

PDP detail already returns `collections[]`. Pick order:

1. Featured collection with a slug that is **not** a merch-rail slug.
2. Else first collection with a slug that is not a merch-rail slug.
3. Else first collection with a slug.
4. Else hide the rail.

Merch-rail slugs skipped: `you-may-also-like`, `layer-your-scents`, `dont-miss-this`.

```http
GET /storefront/catalog/collections/{slug}/products
  ?…market context…
  &onlySellable=true
  &page=1
  &limit=12
```

- “See all” (more from) → `/collections/{slug}`
- “See all” (also like) → `/collections/you-may-also-like`

### Add to bag

Existing cart path only:

```http
POST /storefront/cart/items
```

Body: `{ sku, quantity: 1 }` preferred, else `{ variantId, quantity: 1 }`.  
Guest token / JWT is the same as the rest of cart (`useAddToCart` / `addItemOptimistic`).  
**No local-only mock lines** from these rails (no SKU → no add).

Checkout totals: after the bag changes, existing `useCheckout` rebuilds via `POST /storefront/checkout/from-cart`. Rails do not add a separate checkout client.

---

## 3. Code map

### Feature: `src/features/merchandising/`

| Path | Role |
|------|------|
| `constants.ts` | `MERCH_RAIL_SLUGS`, `MERCH_RAIL_SLUG_SET` |
| `types/merch.ts` | `StorefrontProductCard`, merch detail + context views |
| `api/merch.service.ts` | `fetchMerchCollectionRail(slug)` |
| `api/merch.keys.ts` | Query key: slug + zone + currency |
| `hooks/useMerchRail.ts` | Fetch, filter, map to `CatalogProduct` |
| `utils/isRailCardShown.ts` | Sellable / visible / exclude productId / exclude SKU |
| `utils/merchCardToSummary.ts` | `priceSummary` → PLP-style price + `currencyCode` |
| `utils/pickMoreFromCollection.ts` | PDP collection picker |
| `index.ts` | Public exports |

There is **no** new shared `ProductRail` visual component. Existing markup is reused:

- PDP: `.pdp-related` + `RelatedCard`
- Cart drawer: `.cart-rec`
- Cart page / checkout: `MissThisSwiper`, `CheckoutAddonRow`

### Call sites

| File | Hook / fetch |
|------|----------------|
| `src/features/catalog/components/ProductDetailPageView.tsx` | `useMerchRail(pdpAlsoLike)` + `fetchCollectionProducts(..., { onlySellable: true })` |
| `src/features/cart/components/CartSideSheet.tsx` | `useMerchRail(cartLayer)` (max 6) |
| `src/features/cart/components/CartPageView.tsx` | `useMerchRail(checkoutDontMiss)` (max 4) |
| `src/features/checkout/components/CheckoutPageView.tsx` | `useMerchRail(checkoutDontMiss)` (4 + 3 add-ons) |

### Catalog helper change

`fetchCollectionProducts` in `src/features/catalog/api/catalog.service.ts` accepts `onlySellable?: boolean` and sends `onlySellable=true` when set. Query keys include `sellable` vs `all`.

---

## 4. Card filtering (client)

A merch card is shown only if:

- `isSellable === true`
- `isVisible !== false`
- `productId` is not the current PDP product
- `sku` (and cart `variantId` / `slug`) is not already in the bag
- mapped card has a valid price (`priceSummary.hasValidPrice` / amount)
- card has a slug (needed for PDP links)

Empty after filter → section is not rendered (`null`).  
Static `CATALOG_PRODUCTS` / `STATIC_PRODUCTS` are **not** used as fallback for these four placements.

Price currency comes from `priceSummary.currencyCode`, then merch `context.currencyCode`, then selected market. Client does **not** convert currencies.

---

## 5. Guide rules followed

1. Paths start `/storefront/...` (no `/api/v1`).
2. Public merch + catalog GETs.
3. Same market context as the bag.
4. Locale query is `languageCode`, not `locale`.
5. Hide on 404 / empty / all cards filtered out. No mock SKUs.
6. Unsellable cards omitted; add disabled when there is no `sku`/`variantId`.
7. ATC quantity `1` through existing cart API.
8. No Rebuy / invented recommendations endpoint.
9. Recently viewed (JWT-only) is not this rail.

---

## 6. Out of scope / leftover UI

These were **not** part of the merch-rails wiring. Some still exist elsewhere in the storefront:

| Item | Guide | This work |
|------|--------|-----------|
| Rebuy / personalized recs | Do not fake | Not added |
| Auto-add free samples | Do not fake | Not added; checkout still has older complimentary-sample **UI** |
| Cart “spend X more for free shipping” | Do not invent from merch | Not added; older cart/checkout progress **UI** may still show |
| Admin collection membership | Ops/backend | FE does not call `/admin/...` |
| Homepage CMS `PRODUCT_RAIL` | Later | Not this phase |

Ops bootstrap (backend repo, not this UI repo):

```bash
npm run ops:merch:rails:uae
npm run ops:merch:rails:uae -- --apply --assign-limit=8
```

If a named rail is empty, the collection is missing, hidden in the zone, or has no sellable products — the storefront hides the block.

---

## 7. Verification checklist

- [ ] UAE `platform_uae`: each named rail shows cards **or** is hidden
- [ ] ATC from PDP / drawer / cart page / checkout updates bag qty and totals
- [ ] Checkout add-on add rebuilds session totals (bag signature → `from-cart`)
- [ ] PDP “More from …” heading matches a real `collections[].name` (not hardcoded “01”)
- [ ] Guest PDP / cart / checkout rails work without JWT
- [ ] Rail prices use the same currency as the bag
- [ ] These four placements do not fall back to hardcoded mock SKUs

---

## 8. Related docs

- [`STOREFRONT_MERCH_RAILS_FE_GUIDE.md`](./STOREFRONT_MERCH_RAILS_FE_GUIDE.md) — API contract and rules
- [`STOREFRONT_CART_FE_HANDOFF.md`](./STOREFRONT_CART_FE_HANDOFF.md) — ATC / guest token
- [`STOREFRONT_CHECKOUT_AND_ORDERS_FE_GUIDE.md`](./STOREFRONT_CHECKOUT_AND_ORDERS_FE_GUIDE.md) — `from-cart` rebuild
- [`STOREFRONT_MARKETS_FE_GUIDE.md`](./STOREFRONT_MARKETS_FE_GUIDE.md) — `zoneCode` / catalog context
