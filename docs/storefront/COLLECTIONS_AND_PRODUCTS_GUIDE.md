# Collections & Products — Storefront Guide

Complete reference for how **collections (categories)** and **products** work on the Swiss Arabian website: frontend routes, backend APIs, context query params, images, and wiring rules.

> **Source of truth for slugs:** always load collections from the API list first. Never invent a slug from a display name (e.g. `"Best Sellers"` → do **not** guess `best-sellers` without confirming the API `slug`).

**Last synced against Azure Dev collections list:** 2026-08-07 (109 collections, zone `UAE`).

---

## 1. Quick map

| What | Frontend URL | API |
|------|--------------|-----|
| All collections | `/collections` | `GET /storefront/catalog/collections` |
| One collection + products grid | `/collections/{slug}` | `GET …/collections/{slug}` + `GET …/collections/{slug}/products` |
| Product detail (PDP) | `/products/{slug}` | SKU list → detail → search (see §5) |
| Legacy `/products` shop index | redirects → `/collections/bundles` | — |

**Default market context (all catalog calls):**

```
zoneCode=UAE&languageCode=en&currencyCode=AED
```

Built by `storefrontContextQuery()` in `src/lib/storefront/context.ts`.  
Zone comes from `MarketProvider` (`marketId`), falling back to `DEFAULT_ZONE_CODE = "UAE"`.

---

## 2. API base URL

| Env | Base |
|-----|------|
| Azure Dev (default) | `https://ca-swissarabian-backend-dev.greenbush-d5b07575.uaenorth.azurecontainerapps.io` |
| LAN local | `NEXT_PUBLIC_LOCAL_API_BASE_URL` when `NEXT_PUBLIC_USE_LOCAL_API=true` |

No `/api` or `/api/v1` prefix. Paths start at `/storefront/...`.

Optional image override:

```env
NEXT_PUBLIC_CATALOG_MEDIA_BASE_URL=<absolute-base-without-trailing-slash>
```

If unset, relative images resolve against `apiBaseUrl`.

---

## 3. Frontend routes & files

### 3.1 Collections index

| Item | Value |
|------|--------|
| Route | `/collections` |
| Page | `src/app/(shop)/collections/page.tsx` |
| View | `src/features/collections/components/CollectionsPageView.tsx` |
| Hook | `fetchCollections(zoneCode)` |
| Card link | `/collections/{collection.slug}` |

### 3.2 Collection detail (category products)

| Item | Value |
|------|--------|
| Route | `/collections/[slug]` |
| Page | `src/app/(shop)/collections/[slug]/page.tsx` |
| View | `src/features/collections/components/CollectionDetailPageView.tsx` |
| Meta | `fetchCollectionBySlug(slug)` |
| Products | Infinite scroll via `fetchCollectionProducts(slug, …)` |
| Card UI | `ProductCard` → navigates to `/products/{product.slug}` |

### 3.3 Product detail (PDP)

| Item | Value |
|------|--------|
| Route | `/products/[slug]` |
| Page | `src/app/(shop)/products/[slug]/page.tsx` |
| View | `src/features/catalog/components/ProductDetailPageView.tsx` |
| Data | `fetchProductBySlug(slug)` |

### 3.4 `/products` (no slug)

`src/app/(shop)/products/page.tsx` **redirects** to `/collections/bundles`.

---

## 4. Backend API endpoints

Replace `{API}` with the active base URL. Always append context query params.

### 4.1 List collections

```http
GET {API}/storefront/catalog/collections?zoneCode=UAE&languageCode=en&currencyCode=AED
```

**Response shape (envelope):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "…",
        "code": "shopify-coll-shaghaf",
        "slug": "shaghaf",
        "name": "shaghaf",
        "description": null,
        "sortOrder": 0,
        "productCount": 7
      }
    ]
  }
}
```

Use **`slug`** for every frontend URL and follow-up API call.

### 4.2 Collection by slug

```http
GET {API}/storefront/catalog/collections/{slug}?zoneCode=UAE&languageCode=en&currencyCode=AED
```

Example:

```http
GET …/storefront/catalog/collections/shaghaf?zoneCode=UAE&languageCode=en&currencyCode=AED
```

### 4.3 Collection products (paginated)

```http
GET {API}/storefront/catalog/collections/{slug}/products?zoneCode=UAE&languageCode=en&currencyCode=AED&page=1&limit=24
```

- Default page size in FE: **`CATALOG_PAGE_SIZE = 24`**
- Infinite scroll loads `page=2`, `page=3`, …

Example:

```http
GET …/storefront/catalog/collections/shaghaf/products?zoneCode=UAE&languageCode=en&currencyCode=AED&page=1&limit=24
```

### 4.4 Full product catalog (paginated)

```http
GET {API}/storefront/catalog/products?zoneCode=UAE&languageCode=en&currencyCode=AED&page=1&limit=24
```

Used by:

- Catalog infinite feed
- **Fallback** for `minis` / `bundles` (see §6)

### 4.5 Product by SKU / slug / search

`fetchProductBySlug` tries, in order:

1. `GET …/products?…&sku={slug}&limit=1`
2. `GET …/products/{slug}?…`
3. `GET …/search?…&q={slug}&limit=5`

### 4.6 Product image / media

API `image` field may be:

| Kind | Example | FE handling |
|------|---------|-------------|
| Absolute CDN | `https://cdn.shopify.com/s/files/…/….webp` | Used as-is |
| Relative media | `/catalog/media/files/uae/{productId}/{file}.webp` | Prefixed with `catalogMediaBaseUrl \|\| apiBaseUrl` |

Resolver: `src/features/catalog/utils/resolveCatalogImageUrl.ts` (called from `mapProduct`).

Media is served from the API host:

```http
GET {API}/catalog/media/files/uae/{productId}/{file}.webp
```

If the file is missing, API returns JSON `"Media not found"` — ProductCard falls back to **Image coming soon**.

---

## 5. Product card → PDP flow

```
Collections list  →  /collections/{slug}
        ↓
Collection products API
        ↓
ProductCard (image, title, price, Add)
        ↓  click card / title
PDP  →  /products/{product.slug}
```

**Mapped fields** (`mapProduct` in `catalog.service.ts`):

| API field | FE field |
|-----------|----------|
| `productId` | `id` |
| `slug` | `slug` (also used in `/products/{slug}`) |
| `name` | `title` / card `name` |
| `shortDescription` / `sku` | `subtitle` / card `family` |
| `image` | `imageUrl` (resolved) |
| `priceSummary.price` | `price` |
| `priceSummary.currencyCode` | `currency` |
| `variantId` | `variantId` (cart) |
| `isSellable` + price | `isSellable` (ATC enabled) |
| inventory | `inStock` / `availableQty` |

---

## 6. Special FE rules

### 6.1 Catalog product fallback slugs

Defined in `collectionHero.ts`:

```ts
COLLECTION_PRODUCT_FALLBACK_SLUGS = ["minis", "bundles"]
```

For these slugs, the collection page:

1. Still may load collection meta if API has the slug
2. **Does not** call `/collections/{slug}/products`
3. Instead loads the **full catalog** via `/storefront/catalog/products`

On Azure Dev (2026-08-07), **`minis` and `bundles` are not in the collections list**. Visiting `/collections/bundles` (via `/products` redirect) relies on this fallback so the page still shows products.

### 6.2 Static heroes (not from API)

Preset hero art/copy exists for:

`minis`, `bundles`, `new-launches`, `best-sellers`, `perfumes`, `perfume-oils`, `incense`

Any other slug gets a generated title from the API name or slug.

File: `src/features/collections/constants/collectionHero.ts`

### 6.3 Home vs collection page

| Surface | Data source |
|---------|-------------|
| Home Shaghaf section | **Hardcoded** `shaghafSpotlight` in home content |
| `/collections/shaghaf` | **Live API** collection products |

CTA on home: `/collections/shaghaf`

### 6.4 Never invent slugs

Wrong:

```
display name "Best Sellers" → hardcode /collections/best-sellers
```

Right:

```
GET /collections → find item where name/intent matches → use item.slug
```

Azure Dev confirms `best-sellers` exists, but other markets may differ.

---

## 7. Example frontend URLs (local)

Assume site at `http://localhost:3000`.

| Page | URL |
|------|-----|
| Collections index | http://localhost:3000/collections |
| Shaghaf | http://localhost:3000/collections/shaghaf |
| Best sellers | http://localhost:3000/collections/best-sellers |
| New launches | http://localhost:3000/collections/new-launches |
| Heritage | http://localhost:3000/collections/heritage |
| Heritage (D365) | http://localhost:3000/collections/heritage-collection |
| Men / Women / Unisex | http://localhost:3000/collections/men · `/women` · `/unisex` |
| Incense | http://localhost:3000/collections/incense |
| Perfume oils | http://localhost:3000/collections/concentrated-perfume-oils |
| Product PDP (SKU slug) | http://localhost:3000/products/SOAS098501 |

---

## 8. Example API URLs (Azure Dev)

**List collections**

```
https://ca-swissarabian-backend-dev.greenbush-d5b07575.uaenorth.azurecontainerapps.io/storefront/catalog/collections?zoneCode=UAE&languageCode=en&currencyCode=AED
```

**Shaghaf products**

```
https://ca-swissarabian-backend-dev.greenbush-d5b07575.uaenorth.azurecontainerapps.io/storefront/catalog/collections/shaghaf/products?zoneCode=UAE&languageCode=en&currencyCode=AED&page=1&limit=24
```

**Best sellers products**

```
https://ca-swissarabian-backend-dev.greenbush-d5b07575.uaenorth.azurecontainerapps.io/storefront/catalog/collections/best-sellers/products?zoneCode=UAE&languageCode=en&currencyCode=AED&page=1&limit=24
```

**All products**

```
https://ca-swissarabian-backend-dev.greenbush-d5b07575.uaenorth.azurecontainerapps.io/storefront/catalog/products?zoneCode=UAE&languageCode=en&currencyCode=AED&page=1&limit=24
```

**Relative image (resolved by FE)**

```
{API}/catalog/media/files/uae/{productId}/{fileId}.webp
```

---

## 9. Featured / commonly used collections (Azure Dev)

Curated subset useful for nav, home, and QA. **Counts change over time** — re-fetch the list when unsure.

| Slug | Name (API) | ~Products | Notes |
|------|------------|-----------|--------|
| `shaghaf` | shaghaf | 7 | Home CTA |
| `best-sellers` | best sellers | 16 | Cart empty-state link |
| `new-launches` | New Launches | 4 | Hero preset |
| `new-launch` | New Launch | 2 | Different slug |
| `heritage` | Heritage | 11 | Shopify |
| `heritage-collection` | HERITAGE COLLECTION | 7 | D365 code |
| `men` | men | 11 | Gender |
| `women` | women | 11 | Gender |
| `unisex` | unisex | 42 | Gender |
| `perfume` | perfume | 9 | |
| `concentrated-perfume-oils` | CONCENTRATED PERFUME OILS | 42 | Oils |
| `incense` | incense | 8 | Hero preset |
| `oud-muattar` | oud muattar | 25 | |
| `sawalef` | sawalef | 27 | |
| `private-collection` | private collection | 16 | |
| `home-fragrances` | Home Fragrances | 7 | |
| `gifting` / `gift-sets` | gifting / gift sets | 3 / 4 | |
| `trending` | trending | 1 | |
| `minis` | — | — | **Not in API list**; FE catalog fallback |
| `bundles` | — | — | **Not in API list**; FE catalog fallback; `/products` redirects here |

---

## 10. Full collections index (Azure Dev, zone UAE)

Snapshot of all **slugs** returned by the collections list API (alphabetical). Prefer live API over this table when wiring production.

```
01, 01-15, 07, 07-15, 1000, 15, 15yes, 25-off, 250, 3, 30, 30-giftset, 30-off, 30f,
50, 50-eg110, 50-off, 500, 50f, 74, 95-eg110, a-grade, a-sweet-journey, accessories,
accessories-collection, air-perfume, all-product, all-products, aug50, b-grade, bakhoor,
basic-plan, best-sellers, cities, collection, concentrated-perfume-oils, cpo, d365-product,
d365-translation-added, dehn-el-oud, dukhoon, e-gift-cards, edge, eg40, experience,
experience-01, experience-07, experience-sets, father-s-day-sale-2026,
father-s-day-sale-2026-gift-sets, flash-sale, fusion, g10, gift-set, gift-sets, gifting,
gifting-collection, grade-c, hair-mist, hairmist, harmony, heritage, heritage-collection,
home-collection, home-fragrances, home-fragrances-collection, incense, love,
luxury-giveaways, malaki, membership, men, new-launch, new-launches, new-launches-nov,
not-for-sale, oud-muattar, perfume, perfume-best-sellers, perfume-oil-best-sellers,
pre-order, private, private-collection, ramadan-sale, ramadan-special, reed-diffusers,
refill, refill-01, refill-07, refill-set, sawalef, sawalef-gift-set, sawalef-incense,
sawalef-perfume-oil, scented-candles, sep25, sep50, shaghaf, shaghaf-oud-tonka, srd30,
srd50, stock-on-sale-2025, traditional-fragrance, trending, unisex, valentine, western,
wild, women
```

Total: **109** collections.

To refresh:

```bash
curl -sS "{API}/storefront/catalog/collections?zoneCode=UAE&languageCode=en&currencyCode=AED"
```

---

## 11. Code map (where to edit)

| Concern | Path |
|---------|------|
| API client + `mapProduct` | `src/features/catalog/api/catalog.service.ts` |
| Image URL resolve | `src/features/catalog/utils/resolveCatalogImageUrl.ts` |
| Product types | `src/features/catalog/types/product.ts` |
| Collections index UI | `src/features/collections/components/CollectionsPageView.tsx` |
| Collection products UI | `src/features/collections/components/CollectionDetailPageView.tsx` |
| Heroes + fallback slugs | `src/features/collections/constants/collectionHero.ts` |
| Product card | `src/features/home/components/ProductCard.tsx` |
| PDP | `src/features/catalog/components/ProductDetailPageView.tsx` |
| Context QS | `src/lib/storefront/context.ts` |
| Env / API base | `src/lib/config/env.ts` |
| Next Image hosts | `next.config.ts` |

---

## 12. QA checklist

- [ ] `/collections` lists API collections (not hardcoded)
- [ ] Click Explore → `/collections/{exact-api-slug}`
- [ ] Grid products match `…/collections/{slug}/products`
- [ ] Card opens `/products/{product.slug}`
- [ ] Absolute Shopify images render
- [ ] Relative `/catalog/media/…` resolve to `{apiBase}{path}` (or show placeholder if media 404)
- [ ] Infinite scroll loads page 2+
- [ ] Unknown slug (not in API, not fallback) → “Collection not found”
- [ ] `minis` / `bundles` still show catalog via fallback
- [ ] Context always includes `zoneCode`, `languageCode`, `currencyCode`

---

## 13. Common mistakes

1. **Hardcoding collection slugs** from English titles without calling the list API.
2. **Using collection `name` in the URL** instead of `slug`.
3. **Forgetting context query params** → empty or wrong-market data.
4. **Passing relative image paths to `next/image` without resolving** → hits `localhost` and breaks.
5. **Assuming `/products` is a catalog browse page** — it redirects to `/collections/bundles`.
6. **Treating home Shaghaf as API-backed** — home is still static; only `/collections/shaghaf` is live.
