# CMS Homepage Seed Content

## Manifest

- **Id:** `swiss-arabian-homepage-v1`
- **Path:** `swiss-arabian-backend/src/modules/content/seed/manifests/swiss-arabian-homepage-v1.ts`
- **Scope:** Brand `SWISS_ARABIAN` · Zone `UAE` · Locale `en` only

## Admin

**WEBSITE → Pages → Homepage → Seed Content** (permission `content.seed`)

Flow: Dry run → review → type `REPLACE` if Draft nonempty → Replace Draft.

Published snapshots are never modified by seed.

## API

`POST /admin/content/home/seed?zoneCode=&locale=`

Body:

```json
{
  "mode": "DRY_RUN" | "REPLACE_DRAFT",
  "expectedDraftRevision": 3,
  "confirmReplace": true,
  "manifestId": "swiss-arabian-homepage-v1"
}
```

Global regions (separate):

`POST /admin/content/global/announcement-bar/seed`  
`POST /admin/content/global/footer/seed`

## Seeded Homepage sections (order)

1. HERO_SLIDER  
2. TRUST_INDICATORS (no third-party dossier images)  
3. FEATURED_COLLECTION best-sellers  
4. COLLECTION_SHOWCASE (PRIMARY_NAV collection doors)  
5. TRENDING_PRODUCTS (IDs from `trending` collection)  
6. BUNDLE_PROMOTION_SHOWCASE  
7. TESTIMONIALS (`verifiedBuyer: false`)  
8. BRAND_STORY  
9. SUBSCRIPTION_PLANS_SHOWCASE (`editorialPricingOnly: true`)

## Unsupported (reported, not seeded)

- Fragrance Notes (`LandingNotes`) — merchandising module  
- Shopable Reel (`LandingReel`) — Shopable Video module  

## IAM

- Permission: `content.seed` (high risk)  
- Seeded to SUPER_ADMIN (`*`) and MARKET_ADMIN  
- Not granted to CATALOG_MANAGER by default  

Re-run identity RBAC seed after deploy so `content.seed` exists in the target DB.
