# CMS, pages and imports: audit

Audit of 10 Nov 2026, before changing the CMS. It answers four questions:

1. How the home page and other content work today, and what is wrong.
2. How new pages are created and filled.
3. What was built for pages and policies, and why. Does it support both global and market-specific content?
4. Can a new market (or a new brand) be imported and set up from the admin, without a developer?

## Short answers

| Question | Answer |
|---|---|
| Why the home page looks like a demo | No market has a home page in the CMS. The website then shows a built-in layout. Its hero, feature cards, bundle banner text, reviews and story are fixed in the code. |
| Can the admin build the home page today? | Yes, section by section (19 section types, drafts, preview, publish, version history). But only **per market and per language**: UAE English, UAE Arabic, Qatar English … are 6 separate pages. The "Seed Content" button that should pre-fill it is broken. |
| Global + market-specific? | **Text pages and policies: yes** (built 10 Nov). **Home page, announcement bar, footer: no**, not yet. This audit proposes the same model for them. |
| New pages | Text pages and policies: yes, from the admin. Pages built from sections (campaign or landing pages): **not possible yet**; the CMS only knows the home page, announcement bar and footer. |
| Imports from the admin | Catalog, media, customers, collections, menus, redirects, pages and policies all have buttons. Things that still need a developer or the store owner are listed further down. |

---

## 1. The CMS today

### How it is built

| Part | Today |
|---|---|
| Page types | `HOME`, `ANNOUNCEMENT_BAR`, `FOOTER`. One per brand. |
| Versions of a page | One per **market + language** (`content_page_variants`: page, zone, locale). UAE `en-us`, UAE `ar`, Qatar `en-us` … are separate and do not share anything. |
| Sections | 19 types. The admin can edit all of them and the website can show all of them: hero banner, hero slider, image banner, text block, image with text, category grid/carousel, product carousel, trending products, featured collection, collection showcase, bundle promotion, testimonials, brand story, trust indicators, subscription plans, newsletter, fragrance notes, shoppable video, announcement/footer. |
| Product sections | Live per market: a product carousel stores a collection or product ids. Each market's website shows that market's products, prices and stock. |
| Workflow | Draft → preview link → publish (new version) → version history → restore. Separate permissions: `content.read/create/edit/delete/publish/preview/restore/seed`. |
| Admin screens | Market → Website → Pages → Homepage editor (add, edit, reorder, hide, delete sections; preview; publish; history; Seed Content). Global regions editor for the announcement bar and footer. |
| Website | `/` asks for the published home page of the selected market and language. Footer and top ticker ask for their regions. |

### Data on 10 Nov 2026

There are **no** CMS pages at all: no home page, no announcement bar, no footer, in any market.

### Problems found

| # | Problem | Effect | Severity |
|---|---|---|---|
| C1 | No home page published in any market | The website shows the built-in layout. Hero, feature cards, bundle banner text, reviews and story are fixed texts in the code: the same on every market and not editable. | High |
| C2 | "Seed Content" cannot run | It accepts only market code `UAE` and language `en`. The UAE market is `URD1` and its languages are `en-us` and `ar`. Checked: every market and language is refused. | High |
| C3 | No global version | 3 markets × 2 languages = 6 home pages to build and keep in step. The same goes for the announcement bar and footer. A change shared by all markets (new hero) must be made 6 times. | High |
| C4 | Only 3 page types | Campaign or landing pages built from sections (e.g. Ramadan, Black Friday) cannot be created. | Medium |
| C5 | Home page drawn only in the browser | Search engines first see an empty page. Mitigated on 10 Nov: a server-rendered H1, page SEO and structured data. | Medium |
| C6 | Sample products in the code | Best sellers and trending fell back to sample products when the request failed. Bundles **always** showed samples; menu tiles showed sample pictures. Fixed on 10 Nov: real products only, or the strip is hidden. Still to clean: checkout summary, wishlist and product filters can borrow sample pictures/details for matching slugs. | Fixed / Low |
| C7 | `/lp/1`, `/lp/2` … | Design demos of header layouts, not CMS pages. They should be removed or blocked before going live. | Low |
| C8 | Brand text in code | "Swiss Arabian" is fixed in website titles, share tags and structured data (including SEO defaults added on 10 Nov), sign-in screens and the built-in home layout. A SAPIL website would show Swiss Arabian texts. | High for a second brand |

---

## 2. Two kinds of pages

| | **Text pages and policies** | **Section pages (CMS)** |
|---|---|---|
| What | A title and formatted text: returns policy, shipping, privacy, contact, about, FAQ text … | A layout of sections: hero, banners, product strips, … |
| Addresses | `/pages/{handle}`, `/policies/{handle}` | `/` today; campaign pages after C4 |
| Admin | Market → Website → **Pages & policies** | Market → Website → Pages → **Homepage** |
| Global + market | **Yes** | Not yet (proposal below) |
| Languages | English + Arabic on one page | One page per language |
| SEO | Page SEO title/description; SEO Management can override | SEO Management (by address) |

### How to create and fill a text page or policy (works today)

1. Admin → Markets → *any market* → Website → **Pages & policies** → **Add page**.
2. **Shown on:** *Every market (global)* or *this market only*.
3. **Type:** page (`/pages/…`) or policy (`/policies/…`). Then the address, e.g. `returns`.
4. Title and text in **English**, then the **Arabic** tab (optional; without it the Arabic site shows English).
   - The visual editor covers normal text.
   - **Edit HTML** is for tables or videos.
5. SEO title and description (optional), status **Published**, a reason → **Save**.
6. For a market that needs different text: open that market → the page → **Own version** (copies the global text) → edit. **Hide here** removes it from one market. **Follow global** undoes either.
7. To link it from the footer: Website → Navigation → add a link to `/pages/returns`.

### How to create and fill the home page

**Today:** Market → Website → Pages → Homepage → **Create homepage** → **Add section** for each section → **Preview** → **Publish**. This has to be repeated for every market and language. **Seed Content** fails (C2).

**After the proposed change:** build the **global** home page once per language. In each market, only override or hide the sections that differ. See section 4.

---

## 3. What was built for pages and policies on 10 Nov, and why

| Decision | Why |
|---|---|
| A separate pages model instead of the CMS | Shopify pages and policies are HTML documents with an address. The CMS is a section builder with one page per type; it had no addressable pages. |
| Global version + market version + hidden per market | The user asked for global content that markets can override. It is the same model as collections. Policies differ by country (shipping, returns), most other text does not. |
| UAE (brand default market) fills the global versions | One source of truth. Other markets keep a version only where their text differs; checked by comparing text in both languages. Images are compared by file name, because each store hosts the same picture at its own address. |
| Global pages a market's store lacks are hidden there | Matches what that market shows today on Shopify. |
| Pages empty in Shopify → drafts | 22 UAE pages have no text: the theme or an app builds them (wishlist, search, our story, catalogue). Publishing them would show blank pages. |
| Contact page shows the market's contact policy | Shopify's contact page is a theme form; its text is empty. |
| Admin edits never overwritten | Re-importing must be safe. |
| Images copied to our storage; old store links → site links | The platform rule: no Shopify CDN after cutover; links must keep working. |
| HTML cleaned on the website (`sanitize-html`) | Imported and typed HTML is shown to shoppers. Scripts, forms and event handlers are removed. |
| Visual / HTML switch in the editor | The visual editor can drop tables and videos. |
| Sitemap and SEO | Published pages are listed. SEO Management can override any page. |

Result:
- **UAE:** 42 global pages, of which 22 are drafts.
- **Qatar:** 17 own versions, 12 Qatar-only pages, 2 following the global page, 7 hidden.
- **KSA:** waits on a Shopify permission.

Details: `PAGES_AND_POLICIES.md`.

---

## 4. Proposal: global + market sections for the CMS

The same model as pages and policies, applied to the home page, announcement bar and footer.

| Level | Holds |
|---|---|
| **Global page**, per language | The full ordered list of sections. Every section gets a stable key. |
| **Market changes**, per language, only where needed | For a section: **own version** (a copy of that one section, edited), **hidden here**, or **only here** (a market-only section placed after a chosen global section). |

**What the website shows:** the global page with the market's changes applied. Product sections stay live per market, so one global "best sellers" strip shows UAE products in AED and Qatar products in QAR.

**Publishing:**
- The global page and each market's changes have their own draft, preview, publish and history.
- Publishing the global page updates every market that follows it.
- Nothing is published automatically.

**Admin:** the Homepage editor gets a **Global / this market** switch. In the market view every section shows *Global*, *Own version here*, *Hidden here* or *Only here*, with **Override**, **Hide**, **Reset to global** and **Add here**.

**Languages:** the global page is kept per language (English, Arabic), as markets share languages. A **Copy from English** action starts the Arabic page.

**Seed:**
- Fills the **global** page from the brand's default market, in its content language (fixes C2).
- Other markets then follow it.
- The seed manifest belongs to the brand: Swiss Arabian has one, SAPIL gets its own.

**Data model:**
- `content_page_variants.zone_id` becomes optional (empty = global).
- Sections get `section_key` and `override_mode` (`OVERRIDE`, `HIDDEN`, `ADDED`) with `after_section_key`.
- Published snapshots keep their current shape.
- The website API keeps returning one finished page, so the website needs no change.
- Existing data: none, so there is nothing to migrate.

**Later, C4 (campaign pages):** add a `LANDING` page type with an address. An address can belong to only one page (text page or section page).

**Risks:**
- Publishing order: a market change against a global section that was later deleted. Shown as "global section removed" and ignored until reset.
- Preview must show the combined page.
- Both are covered by tests before the admin screen is built.

---

## 5. Imports and setup from the admin UI

### What each import is, and where to run it

| Import | Admin screen | From admin? |
|---|---|---|
| Products, prices, tags, metafields (Shopify) | Market → Shopify → Catalog | Yes (background job with progress) |
| Product images to our storage; galleries and tags per market | Market → Shopify → Media | Yes. Gallery and tag rules run inside these jobs. Their stand-alone rerun ("settle") has no button (API only). |
| Customers (Shopify) | Customers → Shopify import | Yes |
| Products from D365 | Market → D365 | Yes |
| Collections + banners (Shopify) | Market → Website → Collections → Import from Shopify | Yes (background job, progress) |
| Collection banners to our storage | Catalog → Cutover | Yes |
| Header and footer menus (Shopify) | Market → Website → Navigation → Import from Shopify | Yes |
| URL redirects (Shopify) | Market → Website → URL redirects → Import from Shopify | Yes |
| Pages and policies (Shopify) | Market → Website → Pages & policies → Import from Shopify | Yes |
| Brand default market | Brands → Brand go-live → Default market | Yes |
| Home page | Market → Website → Pages → Homepage | Build by hand yes; Seed broken (C2) |

Every import:
- previews first;
- only reads Shopify;
- can be run again safely;
- keeps what was edited in the admin.

### What still needs a developer or someone outside the admin

| Need | Why | Who |
|---|---|---|
| Shopify access for a new store | Store access tokens live in the server settings (`SHOPIFY_STORES`), not in the admin. That is the right place for secrets, but adding a store needs a server settings change. | Developer / DevOps |
| Shopify permissions (KSA) | KSA's app lacks menu, page and redirect read permission | Store owner |
| Link each domain to its market | The admin Domains screen cannot set it. The backend can only set it when a domain is created. Needed so each domain uses its own redirects and pages. | To build |
| Arabic product names from Shopify | Not built; D365 Arabic names include codes | To build |
| Home page SEO from Shopify | Not built | To build |
| Product reviews (Judge.me) | Not built | To build |

### A new brand (SAPIL)

| Works from the admin | Missing |
|---|---|
| Brand switch in the admin header | Website texts hard-coded to Swiss Arabian (C8). Titles, share tags, structured data and sign-in screens should read the brand name from the brand settings (SEO Management → Brand identity). |
| Markets, languages, domains | No home page seed for SAPIL (C2 / proposal) |
| All imports above, per market | SAPIL has no website storefront yet (0 storefronts) |
| Pages & policies, redirects, menus, collections | Every rule is per brand: SAPIL pages, redirects and collections never mix with Swiss Arabian. |

---

## 6. Recommended order

1. **CMS global + market sections** (section 4), including the seed fix. Then build the global home page once and publish it per market.
2. **Domain ↔ market link** in the admin Domains screen, before any second market goes live.
3. **Brand name from brand settings** instead of fixed "Swiss Arabian" (C8), before SAPIL.
4. Clean the remaining sample data (C6). Remove or block `/lp/*` (C7).
5. Campaign pages (C4) when marketing needs them.
6. Arabic product names, home page SEO and reviews imports.

## Code reference

- CMS backend:
  - `src/modules/content/` (services, section registry, seed manifest)
  - `src/modules/admin/content/controllers/`
  - `src/modules/storefront/content/`
  - Models: `prisma/models/content/content-page.prisma`
- CMS admin: `src/features/website-management/components/WebsiteHomepageEditorView.tsx`, `components/content/*`
- CMS website: `src/features/cms/*`; the built-in layout in `src/features/cms/components/LegacyHomeFallback.tsx` and `src/features/home/components/landing/*`
- Pages and policies: see `PAGES_AND_POLICIES.md`
