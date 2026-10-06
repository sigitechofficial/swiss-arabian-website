# Product images — frontend check (storefront + admin)

> **Audience:** Storefront and admin frontend.  
> **Purpose:** Confirm product (and collection) images load on **live** and **local**.  
> **Platform rule:** After cutover, **platform owns media**. End-state URLs are **Azure Blob HTTPS**, not Shopify CDN.  
> **Related:** [`ADMIN_PRODUCT_DETAIL_MEDIA_FE_GUIDE.md`](./ADMIN_PRODUCT_DETAIL_MEDIA_FE_GUIDE.md) · [`ADMIN_CATALOG_MEDIA_UPLOAD_FE_GUIDE.md`](./ADMIN_CATALOG_MEDIA_UPLOAD_FE_GUIDE.md) · [`../storefront/STOREFRONT_IMPLEMENTATION_STATUS.md`](../storefront/STOREFRONT_IMPLEMENTATION_STATUS.md)

---

## One rule

Render the URL the API already returned.

| URL shape in JSON | What it is | What FE should do |
|-------------------|------------|-------------------|
| `https://….blob.core.windows.net/catalog-images/…` | Azure Blob (live + local) | Use **as-is**. Do **not** prefix with the API origin. |
| `https://cdn.shopify.com/…` | Migration leftover | Use as-is for now. Do **not** use for new uploads. |
| `/catalog/media/files/{zone}/{productId}/{file}` | Local scrape file served by Nest | Prefix with **API origin** only (see helper below). |
| `data:…` or `blob:http…` | Browser preview | **Never** persist. Admin save → **400**. |

Envelope: `{ success, data, meta }`. Image fields live **inside `data`**.

---

## Helper (copy into storefront + admin)

```ts
const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_CATALOG_MEDIA_BASE_URL ||
  ''
).replace(/\/+$/, '');

export function catalogImageSrc(url: string | null | undefined): string | null {
  const trimmed = url?.trim() || '';
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed; // blob or CDN
  if (trimmed.startsWith('/catalog/media/files/')) {
    return API_ORIGIN ? `${API_ORIGIN}${trimmed}` : trimmed;
  }
  return trimmed;
}
```

`NEXT_PUBLIC_API_BASE_URL` = Nest origin, e.g. `http://localhost:3000` locally, live API host in Azure. **Not** the Next.js origin.

### Next.js `<Image>`

Allow the blob host in `images.remotePatterns` (hostname from the URL in the API, do not invent). Typical pattern:

```js
{
  protocol: 'https',
  hostname: '*.blob.core.windows.net',
  pathname: '/catalog-images/**',
}
```

Also allow the API host if you still receive relative `/catalog/media/files/…` URLs.

---

## Storefront — which fields

Always pass context: `zoneCode=UAE` (or `zoneId` / `salesChannelCode` / `countryCode`).

| Screen | Endpoint | Image fields |
|--------|----------|----------------|
| PLP / search / category / collection products | `GET /storefront/catalog/products` · `…/search` · `…/categories/:id/products` · `…/collections/:id/products` | `image` (primary), `images[].url`, `images[].altText` |
| PDP | `GET /storefront/catalog/products/:productIdOrSlug` | `media[].url`, `media[].altText`, `media[].sortOrder`, `media[].isPrimary` (also card `image` / `images` if present) |
| Collection list / detail | `GET /storefront/catalog/collections` · `…/collections/:idOrSlug` | `image`, `imageAlt` |
| Merch rails | `GET /storefront/merchandising/collections` | Product cards: `image` / `images[]`. Collection: `image` / `imageAlt` |
| Cart | `GET /storefront/cart` · `POST /storefront/cart/items` | `items[].image`, `items[].images[].url` |
| Reviews (product snippet) | public reviews on catalog | `product.image` |

**Do not** invent a `shopifyImage` / CDN rewrite. **Do not** use `cdn.shopify.com` when `image` is already a blob URL.

---

## Admin — which fields

Auth: admin JWT / API key. Market: `zoneCode=UAE`. Permission: `catalog.read` / `catalog.write`.

| Screen | Endpoint | Image fields |
|--------|----------|----------------|
| Product list | `GET /admin/catalog/products?zoneCode=UAE` | `imageThumbnailUrl` |
| Product detail / gallery | `GET /admin/catalog/products/:productId?zoneCode=UAE` | `imageThumbnailUrl`, `media[].url`, `media[].altText`, `media[].isPrimary` |
| Collection list / detail | `GET /admin/catalog/collections*` | `imageUrl` === `imageThumbnailUrl`, `media[].url` |
| Inventory list (thumb) | inventory admin list | `imageThumbnailUrl` |

### Upload (admin only)

1. User picks a file → show local preview only (`blob:` / `data:` is OK **in the UI**).
2. Upload multipart — **do not** PUT preview URLs into product JSON.

```http
POST /admin/catalog/products/:productId/media/upload
Content-Type: multipart/form-data
```

Fields: `file` (required), `reason` (required, min 3), optional `isPrimary`, `sortOrder`, `altText`.

Or:

```http
POST /admin/catalog/media/upload   → data.url  (HTTPS blob)
POST /admin/catalog/products/:productId/media
```

```json
{ "zoneCode": "UAE", "url": "https://….blob.core.windows.net/catalog-images/…", "reason": "Add hero" }
```

Limits: jpeg / png / webp / gif, max **15 MB**. Missing Azure on API host → **503**.

---

## QA checklist (do this on local **and** live)

Use one product that has media. Open DevTools → Network → Img (or the JSON response).

### A. JSON is healthy

- [ ] `data.image` / `data.imageThumbnailUrl` / `data.media[0].url` is **not** empty for a known imaged SKU.
- [ ] Preferred: URL starts with `https://` and contains `blob.core.windows.net` and `catalog-images`.
- [ ] If URL starts with `/catalog/media/files/`, FE prefixes **API** origin; opening that full URL in a new tab returns an image (not JSON, not 404).
- [ ] URL is **not** `data:` or `blob:`.

### B. Storefront UI

- [ ] PLP cards show the primary image.
- [ ] PDP gallery: primary first, then `sortOrder`; `altText` on `<img>`.
- [ ] Collection tile / hero uses `image` (not a hard-coded asset).
- [ ] Cart line item uses `item.image` (same product as PDP).
- [ ] Search results show images.
- [ ] Merch rail cards show images.
- [ ] Switching local ↔ live: **blob HTTPS still loads** (no rewrite to localhost).

### C. Admin UI

- [ ] Product list thumbnail = `imageThumbnailUrl`.
- [ ] Product detail gallery = `media[].url`.
- [ ] Upload a new image → list/detail refresh → URL is blob HTTPS → thumbnail loads.
- [ ] Saving product **without** re-upload does not wipe images.
- [ ] Preview `blob:` URL is **not** sent on save.

### D. Common FE bugs (if image is broken)

| Symptom | Likely cause |
|---------|----------------|
| Broken image, URL is `/catalog/media/files/…` | FE treated it as a Next.js path. Prefix API origin. |
| Broken image, URL is `http://localhost:3001/catalog/…` | Prefixed the **frontend** origin. Use Nest API origin. |
| Broken image, URL is `https://localhost:3000https://….blob…` | Double-prefix. Never prefix `https://`. |
| Next.js Image error / hostname not configured | Add `*.blob.core.windows.net` to `remotePatterns`. |
| Empty `image: null` | Product has no `ProductMedia` (backend/data). Placeholder OK; do not invent Shopify CDN. |
| Admin save 400 mentioning `data:` / `blob:` | Upload via multipart first, then persist returned HTTPS URL. |
| Admin upload 503 | API host missing Azure blob env — backend/ops, not FE. |

---

## Local vs live (expected)

| | Live | Local |
|--|------|--------|
| Preferred URL | Public Azure Blob HTTPS | **Same blob HTTPS** (browser loads Azure) |
| Fallback URL | Unusual | `/catalog/media/files/…` → `{API}/catalog/media/files/…` |
| Admin new upload | Blob HTTPS immediately | Same, if API has Azure credentials |

If local JSON already has blob HTTPS and the `<img>` is still empty, the bug is FE (wrong field, Next Image domains, or rewriting the URL) — not missing local files.

---

## Minimal curl (sanity)

Replace origin + a known slug/id.

```http
GET /storefront/catalog/products?zoneCode=UAE&limit=5
GET /storefront/catalog/products/{slugOrId}?zoneCode=UAE
GET /storefront/cart?zoneCode=UAE
GET /admin/catalog/products?zoneCode=UAE&limit=5
GET /admin/catalog/products/{productId}?zoneCode=UAE
```

In the JSON, copy `image` / `media[0].url` / `imageThumbnailUrl` into a new browser tab. If that tab shows the photo and the app does not, fix FE mapping.
