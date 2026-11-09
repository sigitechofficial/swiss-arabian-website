# Product URLs and SEO

Decision record, 10 Nov 2026. Applies to every market website (UAE, Qatar, KSA and new ones).

## The decision

A product has **one public address**: `/products/{handle}` (Arabic: `/ar/products/{handle}`).

Products are never linked as `/collections/{collection}/products/{handle}`, even when the shopper opens the product from a collection. The collection the shopper came from is shown in the **breadcrumb** instead.

| Shopper action | Address shown | Breadcrumb |
|---|---|---|
| Opens Soul of Bali from Cities Collection | `/products/soul-of-bali` | Home / Cities Collection / SOUL OF BALI |
| Opens it from search, a menu or a link | `/products/soul-of-bali` | Home / *product's own collection* / SOUL OF BALI |
| Follows an old Shopify link `/collections/cities-collection/products/soul-of-bali` | permanent redirect (301) to `/products/soul-of-bali` | as above |

## How the live Shopify sites do it

The Shopify themes link products inside a collection as `/collections/{collection}/products/{handle}`. The page answers 200 at that address and adds `<link rel="canonical" href="…/products/{handle}">`.

Checked on 10 Nov 2026:

- `https://uae.swissarabian.com/collections/buy-3-get-15-off/products/leather-and-oud` → 200, canonical `https://uae.swissarabian.com/products/leather-and-oud`.

## Why we do not copy it

| | Shopify (`/collections/x/products/y`) | Platform (`/products/y`) |
|---|---|---|
| Addresses per product | One per collection it is in, plus one (a product in 10 collections has 11) | One |
| Google crawling | Crawls the same page many times; crawl budget wasted | Each page once |
| Ranking signals | Internal links point at the copies; only the canonical *hint* consolidates them, and Google may ignore a hint | All links point at the one address |
| Old links and bookmarks | — | 301 to the one address: ranking carries over |
| "Which collection did they come from" | In the address | In the breadcrumb (kept for the browser tab) |

Removing collection-scoped product links from Shopify themes is a common SEO recommendation. The address carries no ranking benefit. Its only use is shopper context, and the breadcrumb gives that without extra addresses.

## How it works

- **Old addresses.** The website proxy permanently redirects `/collections/{x}/products/{y}` to `/products/{y}`, keeping `/ar`.
  - Code: `src/lib/seo/shopifyLegacyRedirects.ts` (tests: `shopifyLegacyRedirects.spec.ts`).
- **Breadcrumb.** The collection page remembers the collection being browsed, for this browser tab only. A product opened next shows that collection in its breadcrumb when the product is in it in this market. Otherwise it shows the product's own collection.
  - Code: `src/features/merchandising/utils/browsedCollection.ts` (tests: `browsedCollection.test.ts`).
  - The search-engine breadcrumb (structured data) always uses the product's own collection, so search engines see one stable trail.
- **Which collections a product is in.** The product API lists only collections the product is really in for that market: live, enabled in the market, and containing the product in that market's product list. Archived collections (for example the D365 code "Collection 1000") never appear.
  - Code: backend `storefront-product-detail.service.ts` → `marketCollectionsForProduct`.

## Product page SEO tags

Compared with the live Qatar product page on 10 Nov 2026:

| Tag | Platform |
|---|---|
| `<title>` | SEO title from the market; the brand appears once (no "· Swiss Arabian" added when the title already names the brand) |
| `meta description` | Market SEO description |
| `canonical` | Absolute, on the market's own domain: `https://{market domain}/products/{handle}` |
| `hreflang` en / ar / x-default | Absolute |
| `robots` | `index,follow` in production; `noindex,nofollow` on every other environment (dev, staging) on purpose |
| `og:title`, `og:description`, `og:url`, `og:site_name`, `og:locale` | Set |
| `og:image`, `twitter:image` | Product main image; Twitter card `summary_large_image` |
| Structured data `Product` | Name, description, SKU, all images, brand, `offers` (price, currency, in stock / out of stock, new) and `aggregateRating` when reviews exist |
| Structured data `BreadcrumbList` | Absolute addresses |

Not output:

- `og:type=product`, `og:price:amount` and `og:price:currency` (Facebook tags). The framework's metadata API cannot write them. Google reads price and stock from the `Product` structured data instead.
- Ratings appear only after product reviews (Judge.me) are imported.

Code: `src/lib/seo/catalogPage.ts`, `src/lib/seo/requestOrigin.ts`, `src/features/catalog/components/CatalogJsonLd.tsx`, `src/app/layout.tsx` (site base address per request). Tests: `src/lib/seo/requestOrigin.test.ts`.

## If this is ever revisited

To show the collection in the address, keep `/products/{handle}` as the canonical address. Never let `/collections/{x}/products/{y}` be indexed on its own. The trade-off is the duplicate-crawling cost above, for no ranking gain.
