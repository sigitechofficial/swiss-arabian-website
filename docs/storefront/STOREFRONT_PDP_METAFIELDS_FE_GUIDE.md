# Storefront PDP metafields — Frontend guide

**As of:** 2026-08-31  
**Audience:** Storefront frontend  
**Backend:** UAE-G04 — Shopify fragrance notes/size imported into `Product.metadata.custom`  
**Swagger:** `/api/docs` → **Storefront Catalog**

This is **not** a new endpoint. The PDP API already returns `pdpMetafields`. Backend now **fills** those keys from Shopify (read-only import). Your job is to **render** them on the product detail page and handle empty products.

---

## 1. Golden rules

1. Unwrap the global envelope — use `data` only.
2. Always send storefront context: `zoneCode=UAE` and `salesChannelCode=platform_uae`.
3. Read notes from **`data.pdpMetafields`**, not from `data.metadata` and not from listing cards.
4. **PLP / cards do not include `pdpMetafields`.** Only `GET /storefront/catalog/products/:productIdOrSlug`. PLP cards **do** include `tags: string[]`.
5. Keys may be missing. Never invent pineapple/rose text. Hide the pyramid block if empty.
6. Do **not** call the admin Shopify import from the website. That is a backend/admin job.
7. Do **not** expect `video_url`, offer banners, or `filter_by` — they are **0% filled** in Shopify today.

---

## 2. What changed (backend)

| Before | After |
|--------|--------|
| `pdpMetafields` existed but was usually `{}` | Import fills empty keys from Shopify `custom/*` (then `d365/*` fallback) |
| Admin could PATCH metafields | Still can. Admin value **wins** — import will not overwrite |

About **248** active Shopify products: **162** have fragrance notes/size. **86** (accessories, some gifts/incense) have none — PDP stays empty. That is correct.

---

## 3. Endpoint (no new route)

```http
GET /storefront/catalog/products/{productIdOrSlug}?zoneCode=UAE&salesChannelCode=platform_uae
```

- Public — no JWT.
- `{productIdOrSlug}` = platform UUID **or** slug.
- Hidden products → `404`.

---

## 4. TypeScript — what you read

```typescript
/** data.pdpMetafields — all keys optional */
type StorefrontPdpMetafields = {
  top_note?: string;
  middle_note?: string;
  base_note?: string;
  fragrance_family_text?: string;
  fragrance_notes?: string;
  size?: string;
  ingredient_heading?: string;
};

type StorefrontProductDetail = {
  productId: string;
  productCode: string | null;
  slug: string | null;
  name: string;
  shortDescription: string | null;
  description: string | null;
  brandCode: string | null;
  brandName: string | null;
  pdpMetafields?: StorefrontPdpMetafields;
  // plus variants / price / media from the existing PDP payload
};
```

### UI mapping

| Key | Show as | Example |
|-----|---------|---------|
| `top_note` | Top notes | `Apple, Grapes` |
| `middle_note` | Heart / middle notes | `White woods, Patchouli, Iris` |
| `base_note` | Base notes | `Caramel, Amber, Peru Balsam, Musk, Suede` |
| `fragrance_family_text` | Family / olfactive family | `Fruity, Woody, Amber` |
| `fragrance_notes` | Longer notes blurb (if you have a “Notes” section) | multi-line text |
| `size` | Size / format | `EDP - 100ML` or `CPO - 15ML` |
| `ingredient_heading` | Notes section heading | usually `Notes` |

Suggested render:

```text
if any of top_note / middle_note / base_note exist
  → show Fragrance pyramid
else
  → hide the whole block (do not show empty labels)
```

Use `ingredient_heading` as the section title when present; otherwise `"Notes"`.

---

## 5. Example — product **with** notes (CASABLANCA)

After backend import + SKU match, `GET` PDP `data` includes something like:

```json
{
  "productId": "<platform-uuid>",
  "productCode": "CASA104301",
  "slug": "casablanca",
  "name": "CASABLANCA",
  "pdpMetafields": {
    "top_note": "Apple, Grapes",
    "middle_note": "White woods, Patchouli, Iris",
    "base_note": "Caramel, Amber, Peru Balsam, Musk, Suede",
    "fragrance_family_text": "Fruity, Woody, Amber",
    "fragrance_notes": "<text if present>",
    "size": "EDP - 100ML",
    "ingredient_heading": "Notes"
  }
}
```

Other SKUs that should have notes once matched + imported:

| SKU | Title | Size |
|-----|-------|------|
| `CASA104301` | CASABLANCA | EDP - 100ML |
| `AAAA099601` | AMAALI | CPO - 15ML |
| `AGHU099001` | ATTAR AL GHUTRA | EDP - 100ML |

`size` should look like `EDP - 100ML` / `CPO - 15ML`, not `- 3ML`.

---

## 6. Example — product **without** notes

Accessories / some gifts: `pdpMetafields` is `{}` or omitted.

```json
{
  "pdpMetafields": {}
}
```

**Do not** invent notes. Hide the pyramid.

---

## 7. What you will **not** get (do not build UI that depends on these)

| Field | Why |
|-------|-----|
| `filter_by` | 0% filled in Shopify |
| `sort_description` | 0% filled |
| `video_url` | 0% filled — no PDP video from this import |
| `offer_banner_image` / Arabic | 0% filled |
| `perfumer` | Shopify value is `NA` — not imported |
| Collection banners | Different work — not this ticket |
| `pdpMetafields` on PLP / home cards | Not in the list API |

---

## 8. Frontend test checklist

Backend must have run the import (`apply: true`) on the env you test. If every PDP is `{}`, ask backend whether import ran and whether that product is SKU-matched.

### 8.1 PDP with notes

1. Open a product known to have notes (Casablanca / Amaali / Attar Al Ghutra) or search by SKU.
2. `GET /storefront/catalog/products/{idOrSlug}?zoneCode=UAE&salesChannelCode=platform_uae`
3. Confirm `data.pdpMetafields.top_note` (and middle/base/family/size) are non-empty.
4. UI shows pyramid + size. No crash if `fragrance_notes` is missing.

### 8.2 PDP without notes

1. Open an accessory / gift with no notes.
2. `pdpMetafields` empty.
3. UI does **not** show empty “Top note:” rows.

### 8.3 Context required

1. Call PDP **without** `zoneCode` / `salesChannelCode` → expect 400, not a blank PDP.
2. Wrong zone → product may 404.

### 8.4 Listing vs detail

1. `GET /storefront/catalog/products?zoneCode=UAE&salesChannelCode=platform_uae` — cards have **no** `pdpMetafields`.
2. Only the detail route has notes.

### 8.5 No `woo/` keys

If you log `pdpMetafields`, there must be no `woo/...` keys.

---

## 9. Admin (only if you own admin catalog UI)

Storefront FE does **not** call this.

```http
POST /admin/catalog/shopify-metafield-import/import
```

Auth: admin JWT / API key + `catalog.write`.

Default is dry-run (`apply: false`). Apply:

```json
{
  "sourceScope": "shopify_uae",
  "apply": true,
  "reason": "UAE-G04 notes import"
}
```

To **edit** one product after import:

```http
PATCH /admin/catalog/products/{productId}?zoneCode=UAE
```

Body includes `reason` + `customMetafields: { "top_note": "..." }`. Admin value is kept on the next import.

---

## 10. Out of scope for this FE ticket

- Collection page banners (EN/AR)
- Shopify video / offer banners
- Filter chips from `filter_by`
- Calling Shopify or the import job from the browser
- Changing cart / checkout / payment

---

## 11. Done when (FE)

- [ ] PDP reads `data.pdpMetafields` only on the detail page
- [ ] Pyramid + size render when keys exist
- [ ] Empty products hide the block
- [ ] Casablanca / Amaali (or equivalent) verified on the env after backend import
- [ ] No UI built for `video_url` / offer banners / `filter_by` as if they were live
