# Storefront catalog search — Frontend guide

**As of:** 2026-09-02  
**Audience:** Storefront frontend (web already has a search bar / `/search` shell)  
**Backend:** Existing public catalog API — **no new endpoint**  
**Swagger:** `/api/docs` → **Storefront Catalog** → `GET /storefront/catalog/search`

Wire the header search bar and `/search` page to this API. Do **not** invent a client-side catalog scan or call admin catalog.

---

## 1. Golden rules

1. Unwrap the global envelope — use `data` only (`response.data.data`).
2. Always send storefront market context: `zoneCode` + `salesChannelCode` (UAE: `UAE` + `platform_uae`).
3. Search is **market-scoped**. UAE results only include products **visible** in the UAE zone. Other markets’ visibility / prices are not returned.
4. Public — **no JWT**. Same client as PLP.
5. Prefer `onlySellable=true` for “can buy” results. Without it you may still see visible but unbuyable cards (depending on stock filters).
6. Reuse the same product **card** UI as PLP (`GET /storefront/catalog/products`). Same card shape.
7. Debounce the input (≈300ms). Do not fire on every keystroke without a minimum query length (recommend ≥2 chars).
8. Empty `q` → empty state or redirect to PLP. Do not call search with a blank query for a full catalog dump (use products list instead).

---

## 2. Endpoint

```http
GET /storefront/catalog/search
  ?zoneCode=UAE
  &salesChannelCode=platform_uae
  &languageCode=en-AE
  &currencyCode=AED
  &q=oud
  &onlySellable=true
  &page=1
  &limit=20
  &sort=newest
```

| Param | Required | Notes |
|-------|----------|--------|
| `zoneCode` | Preferred | Market (e.g. `UAE`). Or `zoneId` / `countryCode` / channel codes that resolve context |
| `salesChannelCode` | Recommended | e.g. `platform_uae` |
| `q` | Yes for search | Search text. Alias: `search` |
| `languageCode` | Recommended | Locale for names/slugs |
| `currencyCode` | Recommended | Display currency |
| `page` / `limit` | No | Default page `1`, limit `20` (max `100`) |
| `sort` | No | `newest` \| `price_asc` \| `price_desc` \| `name_asc` \| `name_desc` \| `availability` \| `sort_order` |
| `onlySellable` | Recommended `true` | Only buyable products |
| `includeOutOfStock` | No | Default `false` — keep false for search UX |
| `brand` / `minPrice` / `maxPrice` | No | Optional filters |
| `categoryId` / `categorySlug` / `collectionId` / `collectionSlug` | No | Scope search inside taxonomy |

**Also works:** same query params on `GET /storefront/catalog/products&search=oud` — search route is the dedicated alias for the search bar / `/search` page.

---

## 3. Market isolation (what you get)

| Rule | Behavior |
|------|----------|
| Visibility | Only `ZoneProductVisibility` for the resolved zone: enabled + visible + not manually disabled |
| Sellability | Driven by that zone’s sellability snapshots / stock policy |
| Other markets | Not mixed in. Read-only. No KSA (etc.) rows in UAE search |
| Shared catalog | Product name/media may be shared master data; **listing membership + price** are zone-scoped |

If context cannot be resolved → business error (not a global product dump).

---

## 4. Response shape (`data`)

```typescript
type StorefrontSearchResponse = {
  products: StorefrontProductCard[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  context: {
    zoneId: string;
    zoneCode: string;
    salesChannelCode?: string | null;
    legalEntityCode?: string | null;
    currencyCode?: string | null;
    languageCode?: string | null;
    // …other resolved context fields
  };
  filters: Record<string, unknown> | null;
  sort: { field: string; direction: string } | null;
  warnings?: string[];
};

/** Same card as PLP — includes `tags`, not `pdpMetafields` */
type StorefrontProductCard = {
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
  /** Platform product tags */
  tags: string[];
  priceSummary: Record<string, unknown> | null;
  inventorySummary: Record<string, unknown> | null;
  isVisible: boolean;
  isSellable: boolean;
  sellabilityStatus: string | null;
  blockReasons: string[];
  badges: string[] | null;
  metadata?: { locale?: string | null } | null;
};
```

**Note:** Listing uses `products` (not `items`) so pagination / context stay on the payload.

---

## 5. Wire the existing search bar

### Header search

1. User types → debounce → navigate to `/search?q=…` (or call API in-place for a typeahead dropdown).
2. Always append current market context from storefront config (same as PLP).
3. Card click → PDP: `/products/{slug}` (or `productId`), still with zone context on PDP fetch.

### `/search` page

```ts
// Pseudocode — reuse Phase 1 apiGet + catalog context helpers
const data = await apiGet<StorefrontSearchResponse>('/storefront/catalog/search', {
  zoneCode,
  salesChannelCode,
  languageCode,
  currencyCode,
  q: query.trim(),
  onlySellable: true,
  page,
  limit: 20,
  sort: 'newest',
});

renderProductGrid(data.products);
renderPagination(data.pagination);
```

### Empty / error UX

| Case | UI |
|------|-----|
| `q` too short / empty | Prompt to type; don’t call API |
| `products.length === 0` | “No products found” + clear / browse CTA |
| Context missing (400/422) | Fix config — do not hide zoneCode |
| Network / 5xx | Retry toast; keep last good results if any |

---

## 6. What the backend matches

DB `contains` (case-insensitive), not Algolia/Elasticsearch:

- Product `defaultName`, `brandName`
- Translation `name`, `shortDescription`
- Variant `sku`

No typo tolerance / synonym ranking yet. Exact-ish substrings work (`oud`, SKU fragments).

---

## 7. Example calls

```http
### UAE — fragrance keyword
GET /storefront/catalog/search?zoneCode=UAE&salesChannelCode=platform_uae&languageCode=en-AE&currencyCode=AED&q=oud&onlySellable=true&limit=20

### UAE — SKU fragment
GET /storefront/catalog/search?zoneCode=UAE&salesChannelCode=platform_uae&q=AMAA&onlySellable=true

### Page 2
GET /storefront/catalog/search?zoneCode=UAE&salesChannelCode=platform_uae&q=oud&page=2&limit=20&onlySellable=true
```

Smoke check from [`STOREFRONT_FRONTEND_SMOKE_TEST_PLAN.md`](./STOREFRONT_FRONTEND_SMOKE_TEST_PLAN.md):

- [ ] `GET …/storefront/catalog/search?zoneCode=UAE&q=oud` → 200  
- [ ] Results only include UAE-visible products  
- [ ] With `onlySellable=true`, cards have `isSellable: true`  
- [ ] Missing context → error, not mixed-market results  

---

## 8. Out of scope (this guide)

- Admin catalog search (`GET /admin/catalog/products`)
- Elasticsearch / Algolia / synonym engines
- Search analytics UI (backend may emit `catalog_search_performed` — FE does not call a separate analytics search API)
- Changing market visibility / sellability (admin)

---

## 9. Related docs

| Doc | Why |
|-----|-----|
| [`STOREFRONT_IMPLEMENTATION_STATUS.md`](./STOREFRONT_IMPLEMENTATION_STATUS.md) § Search | FE `/search` was stub — wire this API |
| [`STOREFRONT_FRONTEND_SMOKE_TEST_PLAN.md`](./STOREFRONT_FRONTEND_SMOKE_TEST_PLAN.md) | Catalog smoke checklist |
| [`STOREFRONT_PDP_METAFIELDS_FE_GUIDE.md`](./STOREFRONT_PDP_METAFIELDS_FE_GUIDE.md) | PDP after card click |
| Swagger **Storefront Catalog** | Live query schema |

---

## 10. FE checklist

- [ ] Header search submits / navigates with `q` + market context  
- [ ] `/search` calls `GET /storefront/catalog/search`  
- [ ] Envelope unwrap; render `data.products`  
- [ ] `onlySellable=true` (unless product wants browsable OOS)  
- [ ] Debounce + min query length  
- [ ] Empty / no-results / error states  
- [ ] Card → PDP with same zone context  
- [ ] No admin APIs from the website  
