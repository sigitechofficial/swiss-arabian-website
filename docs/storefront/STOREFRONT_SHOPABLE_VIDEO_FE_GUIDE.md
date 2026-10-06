# Storefront Watch & Shop (Shopable Video) — FE guide

> **Audience:** Customer storefront frontend.  
> **Purpose:** Render the **Watch & Shop!** carousel when the current market has curated slides.  
> **Admin:** [`../frontend/ADMIN_SHOPABLE_VIDEO_BACKEND.md`](../frontend/ADMIN_SHOPABLE_VIDEO_BACKEND.md)  
> **Pattern:** Same as navigation — market-scoped; hide when unavailable.  
> **Auth:** Public (no customer JWT). Never call `/admin/*`.

---

## 1. Golden rules

1. Unwrap envelope `data`.
2. Always pass the **same market context** as catalog/nav/cart (`zoneCode`, `salesChannelCode`, `languageCode`, `currencyCode`).
3. If `available === false` or `slides.length === 0` → **do not render** the section (no hardcoded demo slides).
4. On market switch → refetch.
5. Cache short TTL per `zoneCode` (30–60s), like nav.

---

## 2. Endpoint

```http
GET /storefront/merchandising/shopable-video
  ?zoneCode=UAE
  &salesChannelCode=platform_uae
  &languageCode=en
  &currencyCode=AED
```

| Query | Required | Notes |
|-------|----------|--------|
| `zoneCode` (or other context that resolves the market) | Yes | Same as other storefront GETs |
| `salesChannelCode` | Recommended | Match bag/market |
| `languageCode` | Recommended | Product names |
| `currencyCode` | Recommended | Match bag |

Swagger tag: **Storefront Merchandising**.

---

## 3. Response

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
    "sectionTitle": "Watch & Shop!",
    "collection": {
      "id": "…",
      "code": "shopable-video",
      "slug": "shopable-video",
      "name": "Shopable Video"
    },
    "slides": [
      {
        "productId": "…",
        "variantId": "…",
        "sku": "ROS1109701",
        "slug": "rose-01-hair-mist",
        "name": "ROSE 01 - HAIR MIST",
        "image": "https://…/thumb.jpg",
        "video": {
          "url": "https://…/pr.mp4",
          "name": "pr.mp4"
        },
        "priceSummary": {
          "price": "199",
          "currencyCode": "AED",
          "hasValidPrice": true
        },
        "isSellable": true,
        "isVisible": true,
        "sortOrder": 0
      }
    ],
    "metadata": {
      "generatedAt": "2026-09-23T00:00:00.000Z",
      "slideCount": 1
    }
  }
}
```

| Field | Use |
|-------|-----|
| `available` | Gate for rendering the section |
| `sectionTitle` | Default “Watch & Shop!” (FE may keep static copy) |
| `slides[].video.url` | Vertical video source (https) |
| `slides[].image` | Product thumbnail in the bottom bar |
| `slides[].name` | Product title |
| `slides[].priceSummary` | Current price (`price`, `currencyCode`) |
| `slides[].slug` / `productId` | PDP link / ATC |

Slides without a market `pr_video` are omitted by the API. Prefer `isSellable === true` for ATC; still show video if visible but not sellable (optional FE choice — disable Add).

---

## 4. When is it available?

Admin (per market) must:

1. Create/enable collection slug `shopable-video` for that zone  
2. Assign products  
3. Set zone `pr_video` on each product  

Then this endpoint returns `available: true` with slides. Other markets without curation get `available: false`.

`collection.code` may be `shopable-video` or zone-suffixed (`shopable-video-ksa`); **slug** stays `shopable-video`. FE should not hardcode collection id.

---

## 5. Suggested FE flow

```text
Layout / homepage for zoneCode
  → GET /storefront/merchandising/shopable-video?zoneCode=…
  → if !data.available → skip section
  → else render carousel from data.slides
```

Do **not** use `GET /storefront/merchandising/collections/shopable-video` for this carousel — that path does not attach zone `pr_video` on cards.

---

## 6. Smoke

| # | Check |
|---|--------|
| S1 | Market with curated slides → `available: true`, `slides.length > 0`, each slide has `video.url` https |
| S2 | Market without section → `available: false`, empty slides, UI hidden |
| S3 | Market switch UAE → KSA → refetch; lists differ when admin curated differently |
