# Storefront — Collection SEO & metafields

**As of:** 2026-09-01  
**Audience:** Storefront frontend  
**Scope:** Additive fields on collection **detail** only. Membership unchanged.

---

## Endpoint

```http
GET /storefront/catalog/collections/:collectionIdOrSlug?zoneCode=UAE&salesChannelCode=platform_uae
```

### New optional fields on `data.item` (detail)

| Field | Type | Notes |
|-------|------|--------|
| `seoTitle` | string \| null | From collection translation |
| `seoDescription` | string \| null | From collection translation |
| `customMetafields` | object | Merchandising keys from `metadata.custom` |

List endpoint stays lean (no requirement to use SEO/metafields on cards).

### Example metafield keys

`seo_content`, `collection_banner`, `collection_mobile_banner`,  
`collection_banner_arabic`, `collection_mobile_banner_arabic`,  
`collection_name`, `collection_description`

Banner values may be JSON strings: `{ "url": "...", "name": "file.jpg" }`.

---

## Membership

Collection products still come from:

```http
GET /storefront/catalog/collections/:idOrSlug/products?...
```

Backend materializes automated rules into assignments. **Do not** call admin condition APIs from the storefront.

---

## Checklist

- [ ] Collection PDP/PLP page uses `seoTitle` / `seoDescription` when present
- [ ] Render banners from `customMetafields` when URL present; hide empty
- [ ] No dependency on product tags on storefront for membership (admin-side only)
