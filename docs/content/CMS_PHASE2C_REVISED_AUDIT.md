# CMS Phase 2C Revised — Homepage Audit Matrix

**Live URL audited:** https://ca-swissarabian-website-dev.greenbush-d5b07575.uaenorth.azurecontainerapps.io/  
**Storefront repo:** `swiss-arabian-website`  
**Audit date:** 2026-10-08  

## 1. Deployed vs local composition (critical)

| Surface | What renders today |
|---|---|
| **Azure Dev website** | Matches **LegacyHomeFallback** (hardcoded landing): East Meets West hero, trust USP cards, best sellers, reviews, story, subscription plans, etc. |
| **Local website (this branch)** | `CmsHomePageView` → if CMS published sections exist, CMS registry; else **same LegacyHomeFallback** (`NEXT_PUBLIC_CMS_HOME_LEGACY_FALLBACK` default true). |
| **Local CMS Admin Draft** | Can contain Hero / Category / Trending / Featured sections that are **not** what Azure shows until website Phase 2C is deployed **and** a full Homepage is published. |

**Conclusion:** Two “versions” are not two storefront codebases — they are **legacy hardcoded landing** vs **partial CMS publish** (local). Azure has not deployed the CMS homepage renderer yet (or CMS returns empty → fallback).

**Risk:** Publishing a thin CMS Homepage (e.g. one TEXT_BLOCK) replaces the entire legacy composition and makes the site look broken. Migration of the full approved Homepage into Draft → review → Publish is mandatory before turning off legacy fallback.

---

## 2. Global regions (not Homepage DnD)

| Region | Component / file | Data source | Scope | CMS today | Required work |
|---|---|---|---|---|---|
| Announcement / ticker | `TopbarTicker` ← `TOPBAR_TICKER` in `chromeNav.ts`; also unused-looking `AnnouncementBar.tsx` | Hardcoded strings | Global | None | **Global Content → Announcement Bar** (new model or website settings) |
| Header chrome | `Navbar*` / `SiteHeader` | Brand assets + markets API | Global | N/A | Keep out of CMS (search/cart/account) |
| Main navigation | `useNavigation` / WEBSITE → Navigation | Admin website menus API | Global | Existing module | **Reuse — do not recreate in CMS** |
| Fragrance notes strip | `LandingNotes` + merchandising API | Admin fragrance notes | Home section but domain-owned | None as CMS type | Prefer existing Fragrance Notes module; optional CMS “include section” flag later |
| Shopable video reel | `LandingReel` + shopable video API | Admin Shopable Video | Home section / merch | None | Prefer existing Shopable Video module |
| Footer + newsletter form | `SiteFooter.tsx` | Hardcoded links + i18n copy; newsletter submit stub | Global | None | **Global Content → Footer** (+ newsletter copy only) |
| Newsletter (standalone) | `NewsletterSection.tsx` (used on story/blog, not home legacy) | Hardcoded | Page-level | None | `NEWSLETTER_SIGNUP` if placed on Homepage; footer newsletter stays global |

---

## 3. Homepage sections — DOM order (LegacyHomeFallback / Azure Dev)

| # | Observed section | Component | Source file | Data source | Commerce? | Existing CMS type | Gap |
|---|---|---|---|---|---|---|---|
| 1 | Hero + image slider | `LandingHero` + `HeroSwiper` | `landing/LandingHero.tsx`, `HeroSwiper.tsx`, `constants/heroSlides.ts` | Hardcoded copy + `HERO_SLIDES` images | No | `HERO_BANNER` (single) | Need **`HERO_SLIDER`** (multi-slide) + wire renderer to HeroSwiper |
| 2 | Trust / USP indicators | `LandingFeatureCards` | `landing/LandingFeatureCards.tsx`, `landingContent.FEATURE_CARDS` | Hardcoded; **third-party dossier.eu images** | No | — | Need **`TRUST_INDICATORS`**; replace third-party assets |
| 3 | Best Sellers strip | `LandingProductsBand` | `landing/LandingProductsBand.tsx` | Collection slug `best-sellers` via catalog | Yes (ATC) | `PRODUCT_CAROUSEL` / `FEATURED_COLLECTION` | Batch A: map CMS products → same strip UI; heading/View All CMS |
| 4 | Shop by Categories | `LandingCollections` | `landing/LandingCollections.tsx` | Navigation chrome links (not taxonomy CMS) | Nav | `CATEGORY_GRID` / `CATEGORY_CAROUSEL` | Extend tiles (image/CTA); stop depending only on nav doors for CMS path |
| 5 | Fragrance notes | `LandingNotes` | `landing/LandingNotes.tsx` | Fragrance notes merch API | Filter PLP | — | Keep merch module; optional Homepage slot later |
| 6 | Trending Now | `LandingTrending` | `landing/LandingTrending.tsx` | Collection `trending` | Yes | `TRENDING_PRODUCTS` | Batch A: CMS manual products → same UI |
| 7 | Bundle / campaign | `LandingBundles` | `landing/LandingBundles.tsx` | Static campaign art + `useLandingProducts` slice | Interactive panel | `IMAGE_BANNER` insufficient | Need **`BUNDLE_PROMOTION_SHOWCASE`**; prices from catalog only |
| 8 | Shopable video reel | `LandingReel` | `landing/LandingReel.tsx` | Shopable video API | Yes | — | Prefer Shopable Video admin module |
| 9 | Testimonials | `LandingReviews` | `landing/LandingReviews.tsx`, `REVIEWS` const | **Editorial mock** (“Verified buyer” labels hardcoded) | No | — | Need **`TESTIMONIALS`**; do not invent verification |
| 10 | Brand story | `LandingStory` | `landing/LandingStory.tsx` | Hardcoded copy + CDN image | No | `IMAGE_WITH_TEXT` partial | Prefer **`BRAND_STORY`** or IMAGE_WITH_TEXT variant |
| 11 | Subscription plans | `LandingPlans` | `landing/LandingPlans.tsx`, `PLANS` const | **Static mock AED prices** | CTA links only | — | Need **`SUBSCRIPTION_PLANS_SHOWCASE`** only if subscription domain is real; else flag blocker |

**Not in LegacyHomeFallback order but present elsewhere / older components:**  
`ShopByGenderSection`, `NewLaunchesSection`, `BestSellersSection`, `ShaghafSection`, `NewsletterSection`, `HeroSection`/`HeroCarousel` — older alternate homepage pieces; confirm unused on current home path.

---

## 4. Gap matrix (CMS coverage)

| Existing / required section | Existing CMS support | Required extension | Backend | Admin | Storefront |
|---|---|---|---|---|---|
| Hero single banner | `HERO_BANNER` | Keep | — | Typed editor exists | Map to hero chrome (not only generic) |
| Hero multi-slide | Partial (HeroSwiper hardcoded) | **`HERO_SLIDER`** | Enum + schema + snapshot | Slide list editor | Drive `HeroSwiper` from CMS |
| Trust indicators | None | **`TRUST_INDICATORS`** | Enum + schema | Item editor | Drive `LandingFeatureCards` |
| Category tiles | `CATEGORY_GRID` / `CATEGORY_CAROUSEL` | Tile image/CTA fields | Schema extend | Form fields | Drive collection-card UI |
| Best sellers / product strip | `PRODUCT_CAROUSEL`, `FEATURED_COLLECTION` | Presentation variant + View All | Optional | Heading/CTA | Reuse `LandingProductsBand` UI |
| Trending | `TRENDING_PRODUCTS` | — | — | Exists | Reuse `LandingTrending` UI with CMS products |
| Image banner / campaign | `IMAGE_BANNER` | Optional eyebrow fields | Schema | Form | Banner layout |
| Bundle promotion | None | **`BUNDLE_PROMOTION_SHOWCASE`** | Enum + resolve products | Editor | Drive `LandingBundles` |
| Image with text / editorial | `IMAGE_WITH_TEXT` | Variant or **`BRAND_STORY`** | Maybe | Form | Drive `LandingStory` |
| Testimonials | None | **`TESTIMONIALS`** | Enum + editorial model | Editor | Drive `LandingReviews` |
| Subscription plans | None | **`SUBSCRIPTION_PLANS_SHOWCASE`** | Blocked if no plan API | — | — |
| Newsletter (home) | None (footer form only) | Global footer copy **or** `NEWSLETTER_SIGNUP` | TBD | Global Content | Footer / section |
| Announcement ticker | None | **Global region** | New settings or content region | Pages → Global Content | `TopbarTicker` |
| Footer | None | **Global region** | Link groups / copy | Reuse nav patterns | `SiteFooter` |
| Fragrance notes / shopable reel | Merch modules | Do **not** duplicate in CMS | — | Existing WEBSITE items | Keep as-is or “slot” flags |

---

## 5. Batch plan (per prompt)

### Batch A — Existing section coverage (next)
- Map `HERO_BANNER`, `IMAGE_BANNER`, `TEXT_BLOCK`, `CATEGORY_*`, `PRODUCT_CAROUSEL`, `TRENDING_PRODUCTS`, `FEATURED_COLLECTION`, `IMAGE_WITH_TEXT` to **real** landing presentation components (prop-driven).
- Stop Admin publish from looking “ineffective”: document that Azure needs website deploy; local must publish a **full** Homepage or keep legacy until migration.
- Add storefront tests for registry mapping.

### Batch B — Missing Homepage types
Only after Batch A: `HERO_SLIDER`, `TRUST_INDICATORS`, `COLLECTION_SHOWCASE` (if category types insufficient), `TESTIMONIALS`, `BRAND_STORY`, `BUNDLE_PROMOTION_SHOWCASE`, subscription/newsletter as justified by audit.

### Batch C — Global Content
Announcement Bar + Footer under **WEBSITE → Pages → Global Content** (not Homepage DnD). Reuse Navigation.

### Batch D — Visual preview + migration + UAT
Secure storefront visual preview (not Admin-only list), migrate approved legacy content into Draft, publish, Azure verification.

---

## 6. Explicit blockers / flags

1. **Azure Dev website ≠ CMS-driven yet** for Homepage body.  
2. **FEATURE_CARDS** uses third-party `dossier.eu` images — do not promote to production CMS as-is.  
3. **REVIEWS** are editorial mocks with “Verified buyer” labels — not an authoritative review system.  
4. **PLANS** are static mock prices — subscription checkout authority not verified in this audit.  
5. **Bundle** interactive panel uses generic landing products, not a promotions/bundle engine.  
6. Admin modal preview is Draft-structure preview; **true storefront visual preview** still required for Batch D.

---

## 7. Batch A status (implemented locally)

Existing nine CMS types now drive real landing presentation:

| CMS type | Storefront mapping |
|---|---|
| `HERO_BANNER` | `LandingHero` (static CMS image; no forced carousel) |
| `IMAGE_BANNER` | `CmsImageBanner` |
| `TEXT_BLOCK` | `CmsTextBlock` |
| `CATEGORY_GRID` / `CATEGORY_CAROUSEL` | `LandingCollections` |
| `PRODUCT_CAROUSEL` / `FEATURED_COLLECTION` | `LandingProductsBand` |
| `TRENDING_PRODUCTS` | `LandingTrending` |
| `IMAGE_WITH_TEXT` | `LandingStory` |

Additive optional config fields (backward compatible): hero eyebrow/CTAs, category subtitle, product View All link/label, story eyebrow/CTA label.

**Still required for full Homepage coverage:** Batch B (new section types), Batch C (Announcement/Footer globals), Batch D (storefront visual preview + migration publish + Azure UAT).

## 8. Batch B status (implemented locally)

New `ContentSectionType` values + typed schemas + Admin editors + storefront renderers:

| Type | Admin | Storefront |
|---|---|---|
| `HERO_SLIDER` | Slide list editor | `LandingHero` + `HeroSwiper` |
| `TRUST_INDICATORS` | Indicator list | `LandingFeatureCards` |
| `COLLECTION_SHOWCASE` | Tile list | `LandingCollections` |
| `TESTIMONIALS` | Editorial list (no auto-verify) | `LandingReviews` |
| `BRAND_STORY` | Paragraphs + stats | `LandingStory` |
| `BUNDLE_PROMOTION_SHOWCASE` | Banner + product IDs | `LandingBundles` (catalog prices) |
| `SUBSCRIPTION_PLANS_SHOWCASE` | Editorial plan cards | `LandingPlans` (prices non-authoritative) |
| `NEWSLETTER_SIGNUP` | Copy fields | `NewsletterSection` (consent stub unchanged) |

Prisma migration: `20261008160000_content_cms_phase2c_section_types`.

## 9. Batch C status (implemented locally)

| Region | Admin | Storefront |
|---|---|---|
| Announcement Bar | WEBSITE → Pages → Global Content · Announcement Bar (own publish) | `TopbarTicker` reads `GET /storefront/content/regions/announcement-bar` |
| Footer | WEBSITE → Pages → Global Content · Footer (own publish) | `SiteFooter` reads newsletter/copyright/payment badge flags from region API |
| Navigation | Unchanged | Reuse WEBSITE → Navigation |

Content page types: `ANNOUNCEMENT_BAR`, `FOOTER` (separate from Homepage DnD).

## 10. Remaining (Batch D)

| Item | Status |
|---|---|
| Secure storefront visual Draft preview (not Admin-only list) | Partial — handoff routes exist; full UAT pending |
| Full Homepage content migration into Draft → Publish | Not done |
| Azure Dev website demonstrates published CMS Homepage | Blocked on deploy + migration |
| Responsive + multi-zone UAT checklist (§28) | Pending |

## 11. Known blockers

1. Azure Dev website still serves legacy Homepage until website + migration deploy.
2. Subscription plans are editorial-only (no verified subscription billing API).
3. Testimonials are curated editorial content — do not auto-label Verified Buyer.
4. Trust indicator third-party dossier.eu assets must not ship to production CMS.
5. Run DB migration before Admin can persist new section types.
