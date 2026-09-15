# Storefront catalog Filter-by — Frontend guide

**As of:** 2026-09-15  
**Audience:** Storefront FE  
**Surfaces:** `/products`, `/collections/{slug}`, `/categories/{slug}`  
**UI:** left rail **Filter by** — Price · Concentration · Collection · Featured note  
**Swagger:** `/api/docs` → **Storefront Catalog**

Once this is live on Azure Dev, stop client-side title/tag guessing (`toCatalogProduct` regex). Bind the rail to `data.facets` + query params.

---

## 1. Golden rules

1. Unwrap the envelope; facets live on **`data`** of the **same listing** response (`facets` next to `products` / `filters` / `pagination`).
2. Market-scoped like the rest of catalog (`zoneCode`, `salesChannelCode`, …).
3. Filter **server-side**. Send query params; render `products` + `facets` returned. Do not re-classify SKUs in the browser.
4. Facet counts are **Shopify-style**: each group’s counts respect all other active filters, but **not** its own dimension. Price `min`/`max` ignore the current thumb values.
5. Empty facet group (empty array) → hide that group. Backend omits options with `count: 0`.
6. Public, no JWT. Same as PLP.
7. **Do not** map Shopify tags or product name regex to this rail.
8. `houseCollection` is the **brand house** (Heritage / Shaghaf), **not** the URL merchandising collection (`new-launches`, etc.).

---

## 2. Endpoints (unchanged paths)

```http
GET /storefront/catalog/products
GET /storefront/catalog/collections/{slug}/products
GET /storefront/catalog/categories/{slug}/products
```

Market context: `zoneCode`, `salesChannelCode`, `languageCode`, `currencyCode`.

Prefer real pagination (`limit=24`) once filters are server-side — do not keep `limit=100` client filter.

---

## 3. Product card fields

Each `data.products[]` card may include:

| Field | Codes | Notes |
|-------|--------|--------|
| `concentration` | `extrait` \| `edp` \| `null` | From platform `metadata.custom.concentration` (admin) |
| `houseCollection` | `heritage` \| `shaghaf` \| `null` | Live from curated collection membership |
| `featuredNote` | `oud` \| `rose` \| `vanilla` \| `patchouli` \| `tobacco` \| `incense` \| `null` | From `metadata.custom.featured_note` (admin) |

`null` / omitted → product does not contribute to that facet’s option counts (still included under **All** via `pagination.total`).

Price remains `priceSummary.price` + currency from context / summary.

Full note pyramid stays on **PDP only** (`pdpMetafields`) — not on PLP cards.

---

## 4. `data.facets`

```typescript
type StorefrontCatalogFacets = {
  price: { min: string; max: string; currencyCode: string } | null;
  concentration: Array<{ code: 'extrait' | 'edp'; label: string; count: number }>;
  houseCollection: Array<{ code: string; label: string; count: number }>;
  featuredNote: Array<{ code: string; label: string; count: number }>;
};
```

Example:

```json
{
  "facets": {
    "price": { "min": "110", "max": "900", "currencyCode": "AED" },
    "concentration": [
      { "code": "extrait", "label": "Extrait de Parfum", "count": 15 },
      { "code": "edp", "label": "Eau de Parfum", "count": 15 }
    ],
    "houseCollection": [
      { "code": "heritage", "label": "Heritage", "count": 2 },
      { "code": "shaghaf", "label": "Shaghaf", "count": 18 }
    ],
    "featuredNote": [
      { "code": "oud", "label": "Oud", "count": 21 }
    ]
  }
}
```

- **All (N)** for each group = `pagination.total` for the current filtered listing.
- Slider bounds = `facets.price.min` / `max` (listing context after taxonomy + sellability; before thumb params).
- Feature-detect: if `facets` is present, drive the rail from it; otherwise keep legacy client heuristics only as temporary fallback.

`data.filters` remains the **echo of request params** (unchanged). Do not confuse it with `facets`.

---

## 5. Query params

| Param | Example | Meaning |
|-------|---------|---------|
| `minPrice` | `110` | Inclusive, listing currency |
| `maxPrice` | `900` | Inclusive |
| `concentration` | `edp` | `extrait` \| `edp` |
| `houseCollection` | `shaghaf` | House code |
| `featuredNote` | `oud` | Note code |
| `onlySellable` | `true` | Keep as today |
| `page` / `limit` | `1` / `24` | Server pagination |
| `sort` | `newest` \| `price_asc` \| … | Existing sorts |

Omit a facet param = “All” for that group.

Do **not** overload `collectionSlug` for Heritage/Shaghaf — that scopes taxonomy membership for search / collection PLP URL.

Invalid facet codes are ignored (treated as All).

---

## 6. What not to use

| Source | Why |
|--------|-----|
| `tags[]` | Promo / ops noise |
| `badges` | Sellability, not merch facets |
| `pdpMetafields` | PDP only |
| Collection URL slug | Page context, not Collection filter group |
| Client regex on `name` | Stops the day this API ships |

---

## 7. Data fill (backend / merch)

| Facet | Populated how |
|-------|----------------|
| Price | Sellability snapshots (already) |
| House collection | Live from `heritage` / `shaghaf` collection assignments |
| Concentration | Admin PATCH `customMetafields.concentration` |
| Featured note | Admin PATCH `customMetafields.featured_note` |

Until merch fills concentration / featured note, those groups may be empty arrays → hide them. House + price should work earlier when membership/prices exist.

---

## 8. FE switchover checklist

- [ ] Read `data.facets` on products / collection / category listing responses
- [ ] Send `minPrice` / `maxPrice` / `concentration` / `houseCollection` / `featuredNote` on click
- [ ] Use `pagination.total` for All (N); paginate instead of `limit=100`
- [ ] Remove `toCatalogProduct` name/slug facet guessing
- [ ] Hide empty facet groups
- [ ] Confirm collection PLP facets are smaller than full catalog for the same market

---

## 9. Related

| Doc | Relation |
|-----|----------|
| [`STOREFRONT_CATALOG_SEARCH_FE_GUIDE.md`](./STOREFRONT_CATALOG_SEARCH_FE_GUIDE.md) | Search shares card shape; may also return `facets` via same listing pipeline |
| [`STOREFRONT_PDP_METAFIELDS_FE_GUIDE.md`](./STOREFRONT_PDP_METAFIELDS_FE_GUIDE.md) | Notes pyramid on PDP only |
| Swagger **Storefront Catalog** | Paths / query params |
