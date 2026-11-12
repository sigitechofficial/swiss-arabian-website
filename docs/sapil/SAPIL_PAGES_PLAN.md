# Sapil storefront: page plan

**Design source:** v9 "Note by Note" (final), at `Downloads/sapil/repo/sapil-Ahsan/sapil-v9-*.html`, `assets/sapil-v9.css` and `assets/sapil-v9.js`.
**Rules:**
- Designed pages are pixel-exact, rebuilt in Tailwind.
- Pages without a design use only the v9 design system (tokens and components in `src/brands/sapil/`).
- Every business rule in the design's JavaScript is mock: prices, was-prices, bundle savings, promo codes, delivery fees and ETAs, cash-on-delivery fee, VAT, free-delivery threshold, and orders kept in the browser. The backend owns all of these.
- The site is multi-language from the start (en + ar now, more later). Right-to-left layout and per-script fonts are covered in the "Multi-language" section.

**Created:** 2026-11-13. **Status:** plan for review.

---

## 1. Routes

Sapil sells on Shopify today (`uae.sapil.com`), so keep **Shopify's URL shapes**. That preserves rankings at cutover, and the remaining old URLs get 301 redirects through the existing admin redirects feature.

| Route | Page | Design |
|---|---|---|
| `/` | Home ("Note by Note") | v9 ✅ |
| `/products` | Shop (all products, filters) | v9 shop ✅ |
| `/collections/[handle]` | Collection | v9 collection ✅ |
| `/under-50`, `/under-99`, `/under-199` (or `/collections/under-99`, see decisions) | Price edit | v9 under-99 ✅ |
| `/products/[handle]` | Product | v9 product ✅ |
| `/checkout` | Checkout (contact → delivery → payment) | v9 checkout ✅ |
| `/order-confirmation/[id]` | Order confirmed | v9 order ✅ |
| `/account/orders` | Your orders | v9 order ("Your orders" view) ✅ |
| `/blogs/news` (Shopify path) or `/blog` | Journal | v9 blog ✅ |
| `/blogs/news/[handle]` | Blog post | system ⚙️ |
| `/search` | Search results | system ⚙️ |
| `/cart` | Bag page (fallback; the drawer is the main bag) | system ⚙️ |
| `/login`, `/register`, `/verify`, `/forgot-password`, `/reset-password` | Sign in and account creation | system ⚙️ |
| `/account/*` | Profile, addresses, order detail, wishlist, rewards, returns, reviews, security | system ⚙️ |
| `/track`, `/track/[orderNumber]` | Track order | system ⚙️ (reuse the order view) |
| `/pages/[handle]`, `/policies/[handle]`, `/faq` | Content and legal | system ⚙️ |
| `/gift-cards` | Gift cards | system ⚙️ (if Sapil sells them) |
| `/lp/[id]`, `/offers/[code]` | CMS landing pages, offer links | system ⚙️ |
| 404, `/shop-unavailable` | Errors | system ⚙️ |

✅ = v9 design exists (pixel-exact). ⚙️ = built from the v9 design system.

---

## 2. Shared chrome (every page)

| Piece | Design | Data / logic |
|---|---|---|
| Announcement bar (link to a collection) | v9 `.announce` | CMS announcement region (exists, per market and language) |
| Header: logo, main menu, search, account, bag with count | v9 `.hdr` | Navigation API (exists, per brand and market); cart store |
| "Shop by" chip row (For Her, For Him, Unisex, Mood, Note, Bundles, Gift sets, Under AED 99) + info text ("Free delivery over AED 100 · Pay on delivery") | v9 `.subnav` | Chips come from a CMS navigation menu. The info text **must come from Sapil's market settings** (free-delivery threshold, cash on delivery), never hard-coded |
| Phone menu | v9 `.mnav` | Same navigation data |
| Search dialog | v9 search | Existing search API |
| Bag drawer (free-delivery bar, lines, quantity, totals) | v9 `.drawer` | Existing cart API and promotions; free-delivery progress from market settings |
| Quick-view dialog, toast | v9 `dialog`, `.toast` | Existing product API |
| Footer: newsletter, Shop / Discover / Help links, legal | v9 `footer` | CMS footer menu; newsletter → existing CRM / Insider consent (Sapil's own CRM account) |
| Market and language switcher | Not in v9 ⚙️ | Market list plus market languages (`ZoneLanguage`). Placed in the footer or header, styled with v9 chips |

---

## 3. Designed pages: sections, components, data

### 3.1 Home (`sapil-v9-note-by-note.html`)

| # | Section | Components | Data source | Status |
|---|---|---|---|---|
| 1 | **Hero, 4 layouts chosen in admin:** gallery "doors" (7 rooms), video, campaign slideshow, promo | Doors accordion with auto-advance, video tiles, slideshow, promo tiles | **New CMS hero section** with a `layout` field. Doors: up to 7 rooms (number, line, title, colour, featured product). Video: 3 clips plus products. Campaign: slides with desktop and mobile images, CTAs. Promo: bundle plus 2 tiles | 🆕 CMS type |
| 2 | New arrivals rail | ProductCard rail with arrows | Collection `new-arrivals` (per market) | ✅ existing API |
| 2b | Under AED 99 shelf: price chips with counts, price-tag shelf, "more price edits" | Chips, price-tag sticker, shelf | Catalog price facets (`maxPrice`) and counts | ✅ API, 🆕 counts per price tier |
| 3 | Collections "scroll story" cards (count + "from" price + 3 bottles) | Collection card track | Collections list + min price + 3 product images | ⚠️ needs a "collection summary" endpoint (count, min price, images) |
| 4 | Top sellers rail | ProductCard rail | **Best-seller ranking** | 🆕 sales-based ranking (analytics / ClickHouse), or a curated collection to start |
| 4b | Shop by mood: spinning wheel, 6 moods → 3 products, "Add all three" | Wheel (SVG), legend chips, result cards | **New CMS "moods"**: name, colour, line, notes, 3 products | 🆕 CMS type |
| 5 | Shop by note: note cards → shop filtered by note | Note card rail | Fragrance-notes merchandising (exists: `/storefront/merchandising/fragrance-notes`) + note filter on the listing | ✅ / ⚠️ note filter |
| 5b | Bundles: save AED X, 3–4 bottles, add the whole bundle | Bundle card | **Promotions** (bundle / buy-X type) + a bundle content block (name, products, tint) | ⚠️ set up as promotions; "add many" to cart |
| 6 | Instagram reels: autoplay in view, sound toggle, "Shop [product]" | Reel player carousel | Shoppable-video merchandising (exists: `/storefront/merchandising/shopable-video`). Videos must be hosted by us | ✅ API, 🆕 video hosting |
| 7 | About: image + bottle, text, 3 facts | About block | CMS rich-text section + counts (number of fragrances, collections, starting price) | ✅ CMS, ⚠️ counts |

### 3.2 Shop (`sapil-v9-shop.html`)
- Breadcrumbs, shop hero, toolbar (filters + sort), product grid.
- "Keep exploring": collection cards and 3 promo tiles.
- **Data:** existing listing API with facets: For (gender), Collection, Fragrance family, Notes, price, sort; infinite scroll.
- Gender ("For Her / Him / Unisex") and "family" must exist as product facets for Sapil products.

### 3.3 Collection (`sapil-v9-collection.html`)
- Breadcrumbs, collection hero, "collection notes" row, toolbar, grid.
- **Data:** existing collection listing + banner. The notes row is the collection's most common notes (computed, or a CMS field).

### 3.4 Price edit (`sapil-v9-under-99.html`)
- Tier tabs (Under AED 50 / 99 / 199), kicker + title, line with counts, hero chips (price bands with counts), price-tag shelf, toolbar, grid.
- **Data:** listing with `maxPrice`; band counts from price facets. The tiers (50/99/199) should be **market settings** so other currencies work (e.g. SAR).

### 3.5 Product (`sapil-v9-product.html`)
- Breadcrumbs.
- Gallery + buy box: name, kind tag, gender, price / was-price / % off, size, quantity, add to bag, delivery and cash-on-delivery notes, Tabby / Tamara instalments.
- **Notes journey** ("first spray → dry-down": top / heart / base).
- Reviews (stars, list).
- Product FAQ (accordion).
- "More to fall for" related rail.
- **Sticky add-to-bag bar** on scroll.
- **Data:**
  - product API, gallery, reviews (Judge.me import exists), related collection
  - **notes split into top / heart / base** — check D365/Shopify fields; add product attributes if missing
  - product FAQ — CMS or product metafields
  - instalments use existing Tabby / Tamara widgets with **Sapil's merchant accounts**

### 3.6 Checkout (`sapil-v9-checkout.html`)
- Steps: **Contact** (email, phone, newsletter), **Delivery address** (name, emirate list, area, address), **Delivery method** (standard / express with ETA), **Payment** (card, Apple Pay, Tabby, **cash on delivery**).
- Review; order summary with promo code; empty-bag state; summary folds away on mobile.
- **Data:** the existing checkout flow (session, address, delivery methods, payment methods, totals) supplies everything. The design's fees, ETAs, cash-on-delivery fee and VAT are replaced by the API's values.
- **Decisions:**
  - Is cash on delivery supported for Sapil (backend support plus a fee)?
  - Which card provider for Sapil UAE (Paymob or Stripe)?
  - Apple Pay through which provider?
  - The emirate list per market comes from the address settings.

### 3.7 Order (`sapil-v9-order.html`)
- After checkout: "Your order is confirmed" with items, delivery and payment blocks, and help.
- Without an order number: the "Your orders" list.
- **Data:** existing order confirmation + account orders + track APIs. The design keeps orders in the browser — replace that entirely.

### 3.8 Blog (`sapil-v9-blog.html`)
- Tag chips, featured post, grid.
- **Data:** existing blog module (per brand / market / language). Post page built from the design system.

---

## 4. Pages built from the design system (no v9 design)

| Page | Built from | Notes |
|---|---|---|
| Sign in / register / verify / forgot / reset | Checkout `Field`, `Checkbox`, `Button`; centred card on paper; SectionHead typography | Same auth API; Sapil customers are brand-scoped |
| Account: profile, addresses, wishlist, rewards, returns, reviews, security | Order page layout; `Field` / `RadioCard` for addresses; ProductCard grid for wishlist; Tabs as chips | Hide features Sapil doesn't use (decision list) |
| Order detail / track | v9 order view | |
| Search results | Shop grid, toolbar, search dialog | |
| Bag page | Drawer line items + checkout summary column | |
| Blog post | Blog header + rich text + product rail | |
| FAQ / policies / pages | Blog typography + Accordion | Legal text is Sapil's own |
| Gift cards | Product layout + RadioCard amounts | Only if Sapil sells them |
| 404 / shop unavailable | Price-edit banner style with sticker + `Button` | |
| States: loading, empty, error, out of stock, form errors, signed-in header | Skeletons on the `--tile` pastel; shop empty state; "We couldn't load … / Try again"; status colours | Same patterns as Swiss Arabian, Sapil look |

**Review gate:** a page built from the design system goes live only after design review, because there is no reference to match it against.

---

## 5. New backend and CMS work the design needs

| Item | Owner | Size |
|---|---|---|
| Hero section with 4 layouts (doors / video / campaign / promo) | Backend CMS + admin | M |
| Moods (name, colour, line, notes, products) | Backend CMS + admin | S |
| Card tint: bottle colour per product (hex) → pastel, or computed from the image | Catalog attribute + admin / import | S |
| Notes split into top / heart / base, plus gender and family facets for Sapil | Catalog / D365 mapping | M |
| Best-seller ranking (sales-based) | Analytics (ClickHouse) → storefront endpoint | M |
| Collection summary (count, from-price, 3 images) | Catalog endpoint | S |
| Price tiers (50 / 99 / 199) and band counts per market | Market settings + facets | S |
| Bundles as promotions + "add bundle" to cart | Promotions (exists) + cart multi-add | S–M |
| Reels / video hosting (our storage + poster images) | Media | M |
| Free-delivery threshold, cash on delivery (+ fee), express delivery and ETAs for Sapil UAE | Market shipping / payment settings | S (if supported) / M (cash on delivery) |
| Product FAQ | CMS / metafields | S |
| Media moved off `sapil.com` / Shopify CDN | Shopify import (Type A cutover) | Part of cutover |

---

## 6. Multi-language

- Every string through the message files (no hard-coded English); content through the backend translation tables.
- Right-to-left by language: v9 has no RTL rules, so mirror the layout with Tailwind logical properties (`ms-/me-/ps-/pe-`, `start/end`).
  - Elements to check by hand: rails and arrows, the doors hero, the mood wheel, the price tags, breadcrumbs.
- Fonts: Gloock, Fraunces and Poppins are Latin-only. Each other script needs a matching fallback font chosen with the designer (Arabic first).
- Prices and dates use `Intl` for the page's language and the market's currency.

---

## 7. Build order (MVP first)

1. **Foundation** (in progress on separate branches): brand config; `[locale]` routing + static rendering; Sapil Tailwind tokens and components.
2. **Shared chrome:** announcement, header, chip row, phone menu, search, bag drawer, footer.
3. **Product card + Shop + Collection** (exercises the listing APIs and facets).
4. **Product page.**
5. **Checkout + Order** (payments in Sapil TEST mode).
6. **Home:** existing-API sections first (new arrivals, under-99, collections, notes, reels, about), then the new CMS sections (hero layouts, moods, bundles, best sellers).
7. **Price edit, Blog, Blog post.**
8. **Auth + Account + Track + Search + Bag page + content pages + 404 / errors** (design-system pages, design review).
9. **Arabic layout and RTL pass, performance budget, screenshot comparison in CI,** then the go-live steps from `22-PHASE-10-GO-LIVE-CHECKLIST.md`.

Each step is checked with:
- **Screenshot comparison** against the v9 HTML (390 / 768 / 1280 / 1440 px) using the same mock data
- **Lighthouse budget** (LCP ≤ 2.5 s target, TBT ≤ 200 ms, CLS ≤ 0.1)
- **Brand isolation tests** (no Swiss Arabian data, IDs or text on Sapil)

---

## 8. Decisions needed

1. **MVP scope (O7):** which of the ⚙️ pages and account features Sapil needs on day one (subscriptions, gift cards, loyalty / rewards, employee benefits, stores?).
2. **Cash on delivery** for Sapil, and its fee.
3. **Payment providers** for Sapil UAE (card provider, Apple Pay, Tabby, Tamara).
4. **Price-edit URLs:** dedicated pages (`/under-99`) or collection URLs (`/collections/under-99`).
5. **Blog URL:** keep Shopify's `/blogs/news/…` (best for SEO at cutover) or move to `/blog/…` with redirects.
6. **Data owners:** bottle colours, moods, notes split, hero rooms, bundles.
7. **Arabic and other-script fonts** for Sapil (with the designer).
8. **Domains** (O2) and the first market(s) (O1).
