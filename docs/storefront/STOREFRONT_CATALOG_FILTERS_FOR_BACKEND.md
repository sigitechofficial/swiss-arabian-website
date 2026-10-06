# Storefront catalog filters — contract for backend

**Date:** 2026-09-15  
**Audience:** Backend  
**From:** Storefront FE  
**Surfaces:** `/products`, `/collections/{slug}`, `/categories/{slug}`  
**UI:** left rail **Filter by** — Price · Concentration · Collection · Featured note  

FE will **not** keep guessing these from product name/tags. Once this contract is live on listing APIs, FE can bind the rail to your fields and drop client-side derivation.

---

## 1. What FE does today (why this is needed)

Listing calls already used:

```http
GET /storefront/catalog/products
GET /storefront/catalog/collections/{slug}/products
GET /storefront/catalog/categories/{slug}/products
```

Market context: `zoneCode`, `salesChannelCode`, `languageCode`, `currencyCode`.  
FE pulls **one page, `limit=100`**, then filters **in the browser**.

Cards have **no** concentration / house-collection / featured-note attributes. FE invents them from:

| Facet | Current FE hack |
|-------|-----------------|
| Price | `priceSummary.price` on the 100 rows (slider min/max = min/max of that page) |
| Concentration | Regex on title (`edp` / `eau de parfum` → EDP, else **Extrait**) |
| Collection | Title contains `heritage` / `shaghaf` |
| Featured note | Title contains `oud` / `rose` / `vanilla` / `patchouli` / `tobacco` / `incense` |

Counts in the screenshot (All 30, Heritage 2, Oud 21, …) are **wrong for live catalog** — they are this guesswork, not merchandising truth. Tags such as `perfume`, `a-grade`, `New Launches` must **not** drive this rail.

**Do not** ask FE to map Shopify tags to these filters.

---

## 2. Golden rules

1. Unwrap envelope; facets live on **`data`** of the **same listing** response (or an agreed sibling). Do not add a second round-trip unless you document it.
2. Market-scoped like the rest of catalog. UAE listing = UAE sellable/visible prices.
3. Filter **server-side**. FE will send query params and render `products` + `facets` you return. Client must not re-classify SKUs.
4. Counts are for the **current listing context** (e.g. already inside `new-launches`) **before** the shopper’s other facet clicks — or document that counts are *after* all selected filters (faceted search). Pick one; FE will follow.
5. Empty facet group → FE hides that group (same as empty merch rails). Do not send dummy options with count `0` for unused houses unless they are real catalog values.
6. Public, no JWT. Same as PLP.

---

## 3. Product fields FE will read (per card)

Add on each listing card (same shape as today’s `products[]`):

```typescript
type StorefrontProductCard = {
  // …existing: productId, slug, sku, name, image, priceSummary, tags, isSellable, …
  concentration?: "extrait" | "edp" | null;
  houseCollection?: "heritage" | "shaghaf" | null; // code, not display name
  featuredNote?: "oud" | "rose" | "vanilla" | "patchouli" | "tobacco" | "incense" | null;
};
```

| Field | Allowed codes | UI label |
|-------|----------------|----------|
| `concentration` | `extrait` | Extrait de Parfum |
| | `edp` | Eau de Parfum |
| `houseCollection` | `heritage` | Heritage |
| | `shaghaf` | Shaghaf |
| `featuredNote` | `oud` `rose` `vanilla` `patchouli` `tobacco` `incense` | Oud, Rose, … |

- `null` / omitted = product does **not** appear in that facet’s counts (except **All**).
- Do **not** invent `cpo` / `edt` on this rail until product adds a third row. Oils/incense with no EDP/extrait stay `concentration: null`.
- House collection is **not** the merchandising collection of the URL (`new-launches`). It is the **brand house** (Heritage vs Shaghaf). A product on `/collections/new-launches` can still be `houseCollection: "shaghaf"`.
- Featured note is **one** primary note for the rail, not the full pyramid (`pdpMetafields` stays PDP-only).
- Price remains `priceSummary.price` + `currencyCode` (AED for UAE).

If you already store more houses/notes, **do not silently add new codes**. Send them in `facets` with `code` + `label`; FE can render unknown codes from that list. Until then, stick to the table so the live rail matches the design.

---

## 4. Facets block on the listing payload

```http
GET /storefront/catalog/products?zoneCode=UAE&salesChannelCode=platform_uae&onlySellable=true
GET /storefront/catalog/collections/{slug}/products?…
GET /storefront/catalog/categories/{slug}/products?…
```

`data.facets` (name can be `filters` if that already exists — then **extend** it; today’s `filters` is only the echo of request params):

```typescript
type StorefrontCatalogFacets = {
  price: {
    min: string; // e.g. "110"
    max: string; // e.g. "900"
    currencyCode: "AED";
  };
  concentration: Array<{ code: "extrait" | "edp"; label: string; count: number }>;
  houseCollection: Array<{ code: string; label: string; count: number }>;
  featuredNote: Array<{ code: string; label: string; count: number }>;
};
```

Example (numbers illustrative):

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
      { "code": "oud", "label": "Oud", "count": 21 },
      { "code": "rose", "label": "Rose", "count": 2 },
      { "code": "vanilla", "label": "Vanilla", "count": 1 },
      { "code": "tobacco", "label": "Tobacco", "count": 1 },
      { "code": "incense", "label": "Incense", "count": 1 }
    ]
  }
}
```

**All (N)** on each group = `pagination.total` for that listing (or sum of facet counts if you document exclusive buckets).

Price slider bounds = `facets.price.min` / `max` for the **unfiltered listing in this context**, not the current thumb values.

---

## 5. Query params FE will send

Same listing URLs. Additive; omit a param = “All” for that facet.

| Param | Example | Meaning |
|-------|---------|---------|
| `minPrice` | `110` | Inclusive, listing currency |
| `maxPrice` | `900` | Inclusive |
| `concentration` | `edp` | One of `extrait` \| `edp` |
| `houseCollection` | `shaghaf` | House code |
| `featuredNote` | `oud` | Note code |
| `onlySellable` | `true` | Keep as today |
| `page` / `limit` | `1` / `24` | Real pagination once filters are server-side |

Already used elsewhere: `collectionSlug` on **search** scopes taxonomy collection, **not** house. Do not overload `collectionSlug` for Heritage/Shaghaf.

Sort stays existing `sort=` (`newest`, `price_asc`, …). Ratings / bestselling sorts are **out of this ticket** unless you also send real `rating` / sales.

---

## 6. What not to use

| Source | Why |
|--------|-----|
| `tags[]` (`perfume`, `best sellers`, `a-grade`, `30%`, `sep25`) | Mixed ops + merch; already used only for Best Seller / New chips |
| `badges: ["SELLABLE"]` | Sellability, not a facet |
| `pdpMetafields` | PDP only; not on PLP |
| Collection URL slug | Page context, not the Collection filter group |
| Client regex on `name` | Stops the day this API ships |

---

## 7. Backend checklist

- [ ] Each listing card includes `concentration`, `houseCollection`, `featuredNote` (nullable)
- [ ] Listing `data.facets` (or extended `filters`) includes price min/max + three groups with **counts**
- [ ] Query params above actually filter the `products` array
- [ ] UAE `platform_uae` only; other zones get their own prices/counts
- [ ] Collection PLP (`/collections/new-launches`) facets are **within that collection**, not the whole catalog
- [ ] No admin/Shopify import APIs from the storefront

---

## 8. FE follow-up (after you ship)

When the payload is on Azure Dev, FE will:

1. Stop `toCatalogProduct` name/slug guessing  
2. Drive the rail from `facets` + query params  
3. Paginate instead of `limit=100` client filter  

Until then the rail stays best-effort and must not be treated as source of truth.

---

## 9. Related

| Doc | Relation |
|-----|----------|
| [`STOREFRONT_CATALOG_SEARCH_FE_GUIDE (1).md`](./STOREFRONT_CATALOG_SEARCH_FE_GUIDE%20(1).md) | `minPrice` / `maxPrice` / `brand` already on search |
| [`STOREFRONT_PDP_METAFIELDS_FE_GUIDE.md`](./STOREFRONT_PDP_METAFIELDS_FE_GUIDE.md) | Notes pyramid on PDP only |
| Swagger **Storefront Catalog** | Source of truth for paths |
