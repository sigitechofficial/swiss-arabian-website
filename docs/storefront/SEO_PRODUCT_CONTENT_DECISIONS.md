# Product SEO and content: findings and decisions (2026-11-10)

What we checked against the live Shopify stores (UAE `uae.swissarabian.com`, Qatar `qa.swissarabian.com`),
what we found, and what we decided. Shopify was only read (Admin API queries and public pages); nothing was written to Shopify.

Related: [SEO_MULTILINGUAL.md](./SEO_MULTILINGUAL.md), [PRODUCT_URLS_AND_SEO.md](./PRODUCT_URLS_AND_SEO.md),
backend [docs/seo/D365_VS_SHOPIFY.md](../../../swiss-arabian-backend-d/docs/seo/D365_VS_SHOPIFY.md).

---

## 1. Decisions

| # | Decision | Why |
|---|----------|-----|
| D1 | **Until launch, Shopify is the source for everything a shopper or Google reads**: product name, description, meta title, meta description, in English and Arabic. D365 stays the source for price, stock and SKU. | The live Shopify pages are what Google has indexed. Matching them keeps rankings. |
| D2 | **D365 item labels never reach shoppers.** Shopify metafields `d365.Description` and `d365.Product_name` are not used as copy. | They are ERP labels: "VANILLA 01 1080 50ML EXTRAIT DE PARFUM SA", "GPAC142102", "NOORA 378 20ML CPO SA". |
| D3 | **Description = the Shopify product body** (what the live page shows), then `custom.description`. | Same as Shopify. `custom.description` was empty on every UAE product. |
| D4 | **Name = the Shopify title**, then `custom.product_name`. The storefront shows the market's name (product page and product cards). | Same as Shopify. The market copy already held the Shopify title, but the storefront showed the D365 name. |
| D5 | **Arabic = Shopify's Arabic store translation** (title, description, meta title, meta description), then the `custom.*_arabic` metafields. | Shopify keeps Arabic as store translations. They were never imported, so Arabic pages showed D365 Arabic labels ("SA EDP 100ML 1043 فلينسيا") or English. |
| D6 | **Empty meta title / description are not stored.** The website builds them (see §1a). The admin shows the automatic text greyed in the empty field, in the search preview and in an info tip, and never pre-fills it (saving would store it). | Anyone who later types SEO text in the admin always wins; nothing auto-generated is locked into the database, so it follows name / description changes. |
| D7 | **Market site name** comes from SEO Management → Brand identity: brand-wide "Swiss Arabian", UAE "Swiss Arabian UAE", Qatar "Swiss Arabian Qatar". A new market only needs its name there. | Same suffix as the Shopify stores. |
| D8 | The market name is **not added twice**: it is skipped only when the title already contains the **full** market site name ("Swiss Arabian UAE"). A title containing only "Swiss Arabian" still gets the suffix. | Shopify does the same (`unless page_title contains shop.name`). |
| D9 | **Edits made in the admin are kept.** Imports never overwrite a market section someone edited by hand. A stored description is only replaced when it is exactly the D365 label (one-time correction). | Admin is the source after launch. |
| D10 | **After launch the admin is the source**; Shopify re-imports only fill empty fields. | Shopify is a migration bootstrap only. |
| D11 | Product brand in structured data is the house name **"Swiss Arabian"** (not "SWISS ARABIAN" from D365, not the market site name). The market site name is the **seller**. | One consistent brand entity for Google. |

### 1a. Automatic meta title and meta description (fields left empty)

| Field | What the website shows | Example |
|---|---|---|
| Meta title | `<product name> – <market site name>`; the site name is not added again when the title already has the **full** market site name | `VANILLA 01 – Swiss Arabian UAE` |
| Meta description | Start of the product description as plain text, **at most 160 characters**: ends on a full sentence when one ends after ~104 characters, else at a word with "…". Nothing when the product has no description (Google then picks text from the page). | `This fragrance opens with a burst of Pink Pepper from Madagascar, sunlit Orange Flower, and creamy Coconut, setting a radiant tone. The heart is an…` |
| Market site name | SEO Management → Brand identity: the market's "Official brand / site name", else the brand-wide one | `Swiss Arabian UAE`, `Swiss Arabian Qatar` |

**What Shopify does (measured 2026-11-10 on uae.swissarabian.com, products without an SEO description):** the meta and
`og:description` are the **first 320 characters** of the product description, cut mid-word with no "…" (vanilla-01,
zahra, summer-by-the-lake, the-collector-s-edition: all exactly 320).

**Why 160, not 320:** Google shows about 155–160 characters on desktop (less on mobile) and cuts the rest with its own "…",
often mid-word. A description that ends cleanly inside that length reads better in results. Google may still write its own
snippet; a hand-written 120–160 character description per product remains the best option.

Code: website `productMetaDescription` (`src/features/catalog/api/catalog.service.ts`), `buildCatalogMetadata` /
`namesBrand` (`src/lib/seo/`); admin `productSeoFallback.utils.ts` mirrors the same rules for the preview and info tips.

### 1b. New markets (KSA, SAPIL, later ones)

The fixes are in the import and the website, not in data, so a new market's Shopify import uses the same rules
(Shopify title / body / Arabic translation first, D365 labels never shown, admin edits kept). Setup per new market:

1. SEO Management → Brand identity: set the market's site name (else titles end with the brand-wide "Swiss Arabian").
2. The market's Shopify app must allow reading **translations** (`read_translations`); without it, Arabic falls back to the
   English Shopify text (the import only logs a warning). The KSA app also still needs menu access approved.
3. Run Seed catalog (or the metafield import) once the market exists; then compare with the store like §5.

**Changes an earlier rule:** backend `D365_VS_SHOPIFY.md` said D365 wins the English title. Since D4, the brand master still
holds the D365 title, but each market shows its own (Shopify) name. Trade-off accepted: about 15 products per market lose
D365's "(CPO)", "(EDP)", "(M)", "(W)" labels, because Shopify uses one name for two products (e.g. "KASHKHA" for both CPO and
EDP). Those can be set by hand in the admin.

**Proposed, not built:** a per-market "content source priority" setting (name, description, meta title / description, EN and AR:
Admin edit → Shopify → D365, order editable). The defaults above would be its first values.

---

## 2. What the website now sends (better than Shopify)

| | Shopify | Ours |
|---|---|---|
| Title | `<title> – Swiss Arabian UAE` | Same rule (D6, D8) |
| Meta description | SEO text, else first 160 characters (cut mid-word) | SEO text, else first ~160 characters cut at a word with "…"; never the "Product details will appear…" placeholder |
| Open Graph | type, title, description, image, price | + `og:image:alt`, `og:locale` + `og:locale:alternate`, `product:availability`, `product:condition`, `product:brand`, `product:retailer_item_id`; `og:type=website` on other pages |
| Product JSON-LD | name, image, description, offer, seller, brand | + `@id`, plain-text description (no HTML, no imported `\n`, no "Â"), `inLanguage`, fragrance notes / family / size (`additionalProperty`), seller linked to the home Organization, delivery fee and days from the market's delivery settings (`shippingDetails`, free when the product reaches the threshold), up to 5 approved reviews, rating min/max |
| Home JSON-LD | Organization, WebSite | + `@id` links, logo (Brand identity logo, else site logo), `publisher`, search action with a full URL |
| Breadcrumbs | none on product | BreadcrumbList on product and listing pages |

Only real data is written: delivery and reviews are left out when there is no fee or no approved review.

Code: `src/features/catalog/components/CatalogJsonLd.tsx`, `src/lib/seo/catalogPage.ts`, `src/lib/seo/brandIdentity.ts`,
`src/app/(shop)/products/[slug]/page.tsx`, `src/app/(shop)/page.tsx`, `src/features/catalog/api/catalog.service.ts`.

---

## 3. Findings and numbers

Checked with read-only scripts (Shopify Admin GraphQL + our storefront API) and by reading the live pages.

| Finding | Before | After (local) |
|---|---|---|
| Descriptions not matching Shopify (D365 label / item code / other field) | UAE 38 of 189, Qatar 18 of 143 (Azure; local the same) | UAE 0 of 187, Qatar 0 of 139 |
| Meta title / meta description vs Shopify (API) | 0 differences (UAE 122, Qatar 93 with own SEO) | 0 |
| Page title, meta description, OG, canonical vs live pages (23 products) | title 20/23 (market name skipped when title had "Swiss Arabian") | 23/23 meta description, OG description, canonical; titles see §4 |
| English names vs Shopify | UAE 22, Qatar 20 differ | _see §4_ |
| Arabic names vs Shopify | UAE 197 of 199, Qatar 136 of 141 differ | _see §4_ |
| Product brand in JSON-LD | "SWISS ARABIAN" / "Swiss Arabian UAE" mixed | "Swiss Arabian" |
| Placeholder "Product details will appear once the catalog is fully refreshed." as meta description / JSON-LD | yes (Azure) | never |

Data problems in Shopify itself (copied as they are, fix in the admin if wanted):
- `ward`, `tuscan-sun`: generic SEO description ("Al Anaka by Swiss Arabian…", wrong perfume).
- `sawt-el-arab-1`, `noora`: only a D365 label, no Shopify description.

Product lists differ (visibility, not SEO): UAE 7 only on Shopify / 12 only on ours; Qatar 6 / 19.

---

## 4. Names after the fix

Local, after the Shopify metafield import with the new order (UAE 199 products, Qatar 141 compared with the Shopify Admin API):

| | UAE | Qatar |
|---|---|---|
| English names differing from Shopify | 22 → **0** | 20 → **0** |
| Arabic names differing from Shopify | 197 → **0** | 136 → **0** |

Arabic rule (D5): when Shopify has no Arabic translation for a product, its `/ar` page shows the default (English)
title and body, so the market's Arabic copy holds those too. The D365 Arabic item label ("SA CPO 30ML 328 زهرة") is
never shown.

Example, `/ar/products/valencia` (UAE): title "اطلب عطر فالنسيا أو دو برفيوم 100 مل - البرغموت والزهور – Swiss Arabian UAE",
Arabic meta description, JSON-LD name "فالنسيا", all from Shopify's Arabic translation.

---

## 5. How to check again

Scripts (read-only) used for this report: compare Shopify Admin API with `/storefront/catalog/products/{slug}` for
name, meta title, meta description and description per market and language; then fetch the live Shopify product pages in a
browser and compare `<title>`, meta description, `og:*` and canonical with the local website.

---

## 6. Still to do

1. Deploy backend + website changes to Azure dev, then run the Shopify metafield import (read-only on Shopify) for UAE and Qatar.
2. Homepage share image: upload Shopify's banner in SEO Management → Social Sharing.
3. Decide on the content source priority setting (§1).
