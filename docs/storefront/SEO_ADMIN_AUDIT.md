# SEO: what the admin controls, and the gaps

Audit of 10 Nov 2026. Covers every SEO setting in the admin panel and whether the website uses it.

**Indexing is off on purpose.** Every page outputs `noindex, nofollow` and `robots.txt` blocks everything. Indexing turns on only when both of these hold:

- the site runs in production;
- `NEXT_PUBLIC_SEO_INDEXING_ENABLED=true`.

An admin setting can ask for `noindex` on a page; it can never force indexing on.

## What the admin controls today

| Admin screen | What it sets | Used by the website | Data today |
|---|---|---|---|
| Products → SEO (brand + per market) | Title, description, URL handle | Yes | Per-market SEO rows (D365/Shopify): 454 |
| Products → SEO (brand + per market) | Canonical, robots, Open Graph, Twitter, Product structured data on/off, JSON-LD override | **Yes, from 10 Nov** (`lib/seo/productSeo.ts`) | None yet |
| Collections → title, description, SEO title/description | Collection page head | Yes | From the Shopify import |
| Categories → SEO section | Title, description | **Yes, from 10 Nov** (the API sent them; the site ignored them) | — |
| Website → SEO Management → a page (`/`, `/collections`, `/faq`, `/collections/{handle}`, `/categories/{handle}`) | Title, description, canonical, robots, Open Graph, Twitter, JSON-LD, per-market overrides | **Yes, from 10 Nov** (`lib/seo/pageSeo.ts`). Checked end to end on `/faq`, then the test entry was removed. | 0 pages |
| Website → SEO Management → Brand identity | Organization name, logo, social profiles | **No.** No storefront API serves it. The homepage outputs a default Organization + WebSite. | Empty |
| Market → Website → SEO content | Text block above the footer, per language | **No.** No storefront API, nothing renders it. | Empty |
| Market → Website → Countries & cities, SEO variables | Values for `{{seo_var:…}}` placeholders | **No.** Nothing replaces the placeholders; a used variable would show as raw code. | Empty; no SEO text uses them |
| Market → Website → URL redirects | Old address → new address (301): import from Shopify, add, edit, switch off, delete | **Yes, from 10 Nov** (website proxy) | UAE 260, Qatar 20 |

## Fixed in this round

| Issue | Fix |
|---|---|
| Sitemap left out every collection (real Shopify collections share the old tag-collection code prefix) | Tag leftovers are found by label, not prefix (backend `tag-seeded-collection.util.ts`). Sitemap: 888 addresses with en + ar. |
| Qatar/KSA-only collections showed on the UAE site (no rule in a market meant "visible") | A collection set up only for other markets is hidden in this one. Collections with no market rules at all stay visible. |
| Collections removed from a Shopify store stayed live in that market | A full collection import now switches off this market's Shopify-made rules for collections the store no longer has. Re-run: UAE 217, Qatar 124 removed (mostly archived rows). UAE shows 97 (96 Shopify + 1 D365). |
| Homepage, collections list, FAQ: generic title, no canonical or hreflang | Real titles and descriptions (en + ar), canonical, hreflang, all overridable from SEO Management |
| Homepage had no H1 and no structured data | Server-rendered H1; Organization + WebSite (with site search) structured data |
| Collections list loaded only in the browser (crawlers saw a spinner, no links) | Rendered on the server with all collection links |
| Collection pages: no share image, no product list data, page 2 pointed at page 1 | Banner as share image, ItemList structured data, page 2+ self-canonical |
| Placeholder pages (Journal, Our story, Stores) in the sitemap | `noindex` and out of the sitemap until their CMS content exists |
| Arabic titles got "· Swiss Arabian" added after an Arabic brand name | The brand is detected in Arabic too |

## Gaps still open

Ordered by SEO impact.

| # | Gap | Impact | Proposal |
|---|---|---|---|
| 1 | ~~Shopify URL redirects not imported~~ **Done 10 Nov**: UAE 260 and Qatar 20 saved; KSA waits on a Shopify permission. See `URL_REDIRECTS.md`. | — | Before go-live: link each domain to its market |
| 2 | ~~Pages and policies return 404~~ **Done 10 Nov**: global pages with market versions; UAE and Qatar imported, KSA waits on a Shopify permission. See `PAGES_AND_POLICIES.md`. | — | Write text for pages that were empty in Shopify (drafts) |
| 3 | Homepage content loads only in the browser | Medium: Google renders it later and less reliably | Render the CMS homepage sections on the server |
| 4 | Arabic product names and SEO come from D365 (with codes, e.g. "… 1412 100 مل EDP SA") | Medium for Arabic search | Import Arabic titles, descriptions and SEO from Shopify translations |
| 5 | Homepage SEO per market not imported from Shopify (live titles and descriptions exist in en + ar) | Medium | Import into SEO Management (brand from UAE, Qatar/KSA as market overrides) |
| 6 | SEO Management creates English pages only (no language choice) | Medium: Arabic pages use defaults | Add language to "Add page" |
| 7 | No language/country links between market sites (uae / qa / ksa product pages look alike) | Medium once more than one market is indexed | hreflang `en-AE`, `ar-AE`, `en-QA`, … across domains, using each market's own product address |
| 8 | Brand identity not on the site | Low–medium (logo and social profiles in Google) | Storefront API + use it in Organization data |
| 9 | Pre-footer SEO text not on the site | Low–medium | Storefront API + render it above the footer |
| 10 | SEO variables never replaced | Low today (unused), wrong text if used | Replace `{{seo_var:…}}` on the backend before sending SEO text |
| 11 | Indexing switch is an environment setting | Low | Per-market "allow search engines" switch in the admin, read by the website |
| 12 | Product `schemas` list (extra structured data blocks) not output | Low | Output enabled blocks next to the Product data |
| 13 | Ratings in structured data need product reviews | Low until reviews are imported | Judge.me review import |

## Code

- Website: `src/lib/seo/pageSeo.ts`, `src/lib/seo/productSeo.ts`, `src/lib/seo/catalogPage.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/(shop)/page.tsx`, `src/app/(shop)/collections/…`, `src/app/(shop)/categories/[slug]/page.tsx`, `src/app/(shop)/products/[slug]/page.tsx`.
- Backend: `src/modules/catalog/utils/tag-seeded-collection.util.ts`, `storefront-catalog-sitemap.service.ts`, `catalog-seo-redirect-export.service.ts`, `storefront-collection-read.repository.ts` (`isCollectionVisibleForZone`), `shopify-website-ia-import.service.ts` (`removedFromStore`).
- Tests: `pageSeo.test.ts`, `productSeo.test.ts`, `tag-seeded-collection.util.spec.ts`, `storefront-collection-read.repository.spec.ts`, import spec.
