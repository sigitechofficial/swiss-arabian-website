# Storefront Shop by Fragrance Notes — FE guide

> **Audience:** Customer storefront frontend.  
> **Purpose:** Render the **Shop by Fragrance Notes** homepage section for the current market, and deep-link tile clicks to PLP products in the same family.  
> **Admin:** [`../frontend/ADMIN_FRAGRANCE_NOTES_BACKEND.md`](../frontend/ADMIN_FRAGRANCE_NOTES_BACKEND.md)  
> **PLP filters:** [`STOREFRONT_CATALOG_FILTERS_FE_GUIDE.md`](./STOREFRONT_CATALOG_FILTERS_FE_GUIDE.md)  
> **Pattern:** Same as navigation / Shopable Video — market-scoped; hide when unavailable.  
> **Auth:** Public (no customer JWT). Never call `/admin/*`.

---

## 1. Golden rules

1. Unwrap envelope `data`.
2. Always pass the **same market context** as catalog/nav/cart (`zoneCode`, `salesChannelCode`, `languageCode`, `currencyCode`).
3. If `available === false` or `tiles.length === 0` → **do not render** the section (no hardcoded demo tiles).
4. On market switch → refetch.
5. Cache short TTL per `zoneCode` (30–60s), like nav / Shopable Video.
6. Tile click → PLP with `fragranceFamily={tile.fragranceFamily}` (server-side filter). Do **not** filter client-side from titles/tags.

---

## 2. Homepage section endpoint

```http
GET /storefront/merchandising/fragrance-notes
  ?zoneCode=UAE
  &salesChannelCode=platform_uae
  &languageCode=en
  &currencyCode=AED
```

| Query | Required | Notes |
|-------|----------|--------|
| `zoneCode` (or other context that resolves the market) | Yes | Same as other storefront GETs |
| `salesChannelCode` | Recommended | Match bag/market |
| `languageCode` | Recommended | Section title locale |
| `currencyCode` | Recommended | Match bag |

Swagger tag: **Storefront Merchandising**.

---

## 3. Section response

```json
{
  "success": true,
  "data": {
    "context": {
      "zoneId": "…",
      "zoneCode": "UAE",
      "salesChannelCode": "platform_uae",
      "languageCode": "en",
      "currencyCode": "AED",
      "legalEntityCode": "URD1"
    },
    "available": true,
    "sectionTitle": "Shop by Fragrance Notes",
    "collection": {
      "id": "…",
      "code": "shop-by-fragrance-notes",
      "slug": "shop-by-fragrance-notes",
      "name": "Shop by Fragrance Notes"
    },
    "tiles": [
      {
        "code": "woody",
        "name": "Woody",
        "imageUrl": "https://…/woody.jpg",
        "sortOrder": 0,
        "fragranceFamily": "woody"
      }
    ],
    "metadata": {
      "generatedAt": "2026-09-23T00:00:00.000Z",
      "tileCount": 1
    }
  }
}
```

| Field | Use |
|-------|-----|
| `available` | Gate for rendering the section |
| `sectionTitle` | Section heading |
| `tiles[].imageUrl` | Tile image (https) |
| `tiles[].name` | Display label |
| `tiles[].fragranceFamily` | PLP query value (`=== code`) |
| `tiles[].sortOrder` | Display order (already sorted) |

`collection.code` may be zone-suffixed (`shop-by-fragrance-notes-ksa`); **slug** stays `shop-by-fragrance-notes`.

---

## 4. Tile click → products (same family)

Navigate to your products PLP with the **same market context** plus:

```http
GET /storefront/catalog/products
  ?zoneCode=UAE
  &salesChannelCode=platform_uae
  &languageCode=en
  &currencyCode=AED
  &fragranceFamily=woody
  &page=1
  &limit=24
```

Also works on collection / category product listing endpoints that already honor Filter-by.

### Matching rule

- Source: `Product.metadata.custom.fragrance_family_text` only (comma-split).
- Example: `Amber, Vanilla, Oud` matches tiles / filters `amber`, `vanilla`, `oud`.
- **Not** PDP pyramid (`top_note` / `middle_note` / `base_note`).
- **Not** PLP `featuredNote` (allowlisted oud/rose/…).

### Product cards

Each listing card may include:

```json
{
  "fragranceFamilyCodes": ["amber", "vanilla", "oud"]
}
```

Use for active-filter UI / debugging. Filtering is **server-side**.

### Facets

`data.facets.fragranceFamily` is a **dynamic** group (codes present in the candidate set):

```json
{
  "fragranceFamily": [
    { "code": "woody", "label": "Woody", "count": 12 },
    { "code": "oud", "label": "Oud", "count": 8 }
  ]
}
```

Empty array → hide that filter group. Same Shopify-style counting as other facets. Candidate window is the existing Filter-by cap (500) — see filters guide.

Invalid / empty `fragranceFamily` is ignored (treated as All).

---

## 5. Suggested FE flow

```text
Homepage for zoneCode
  → GET /storefront/merchandising/fragrance-notes?zoneCode=…
  → if !data.available → skip section
  → else render tiles from data.tiles

Tile click (e.g. Woody)
  → navigate /products?fragranceFamily=woody (+ market context)
  → GET /storefront/catalog/products?fragranceFamily=woody&…
  → render data.products (same-family only)
```

---

## 6. Related

- Admin curation: [`../frontend/ADMIN_FRAGRANCE_NOTES_BACKEND.md`](../frontend/ADMIN_FRAGRANCE_NOTES_BACKEND.md)
- Watch & Shop pattern: [`STOREFRONT_SHOPABLE_VIDEO_FE_GUIDE.md`](./STOREFRONT_SHOPABLE_VIDEO_FE_GUIDE.md)
- Filter-by: [`STOREFRONT_CATALOG_FILTERS_FE_GUIDE.md`](./STOREFRONT_CATALOG_FILTERS_FE_GUIDE.md)
- Web config index: [`WEB_CONFIGURATION_GUIDE.md`](./WEB_CONFIGURATION_GUIDE.md)
