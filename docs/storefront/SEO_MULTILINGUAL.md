# SEO in every language (SEO Management)

Updated 10 Nov 2026. Covers what admins set per language and per market, and how the website uses it.
Indexing is still off (`SEO_INDEXING_ENABLED`), so nothing here is visible to search engines yet.

## Languages come from the markets

There is no fixed English/Arabic list. The languages are the active languages of the brand's markets.

- Admin API: `GET /admin/website/pages-seo/languages`
  - Returns one entry per base language: `code` ("en", "ar", "fr"), `label`, `direction` (ltr/rtl), the market locales it covers and the markets that offer it.
  - Market default languages come first.
- Adding a language to a market (Markets → languages) makes it appear in SEO Management, Brand identity and SEO variables with no code change.
- The website still serves only `en` and `/ar` paths. SEO saved for another language is kept and starts working when the website gets that language.

**Language rule** (used everywhere below): exact language → same base language ("ar" for "ar-ae") → market default → English → first.

## 1. Page SEO per language

SEO Management → open a page → the language switch shows every market language, e.g. "Arabic (KSA, QTR, URD1)".

- Each language is saved and published on its own.
- If there are unsaved edits, switching language shows the usual Save draft / Discard / Cancel dialog. Before this change it was a dead-end error.
- **Collection pages:** the auto-fill uses the collection's translation in that language only. A language with no translation stays empty, and the website then uses its own per-language fallback. English text is no longer copied into the Arabic draft.
- **Canonical:** the auto-fill sets a canonical only when it can build a full address (the brand website URL). Before, it set a bare path that failed the admin's own check. The website sets each market's own canonical.
- The website reads the page's SEO with `locale=en|ar` (`lib/seo/pageSeo.ts`):
  - Call: `GET /storefront/catalog/page-seo?path=/&locale=en&zoneCode=URD1` (market from the `sa-zone-code` cookie, else the default market).
  - Source: table `website_seo_page`, one row per brand + path + locale. Only `publishedConfig` is read (after **Publish**); the draft never reaches the website.
  - Per key, the market's own value (`marketOverrides[zoneId]`) wins over the brand value (`brand`); empty values are skipped; SEO variables are filled in.
  - Keys: `title`, `description`, `canonicalUrl`, `robots`, `ogTitle`, `ogDescription`, `ogImage`, `ogImageAlt`, `ogType`, `ogUrl`, `twitterCard`, `twitterTitle`, `twitterDescription`, `twitterImage`, `twitterImageAlt`, `jsonLd`.
  - Nothing published (404): the page uses its own fallback title and the Brand identity description.
  - The "Homepage" sections builder (Website → Content) has no effect on these meta tags.

## 2. Brand identity per language and market

SEO Management → Brand identity.

- **Main fields:** name, website, description, logos and social profiles. They are in the main language.
- **"Name and description in other languages":** one row per other market language, written right-to-left where needed. Empty means the main value is used.
- **Market scope:** the same rows apply to that market only. Empty means the brand value for that language is used.
- **Stored as:** `brandIdentity.translations` and `marketOverrides[zoneId].translations` = `{ ar: { officialName, description } }`.
- **Storefront API:** `GET /storefront/website/seo/brand-identity?locale&zoneCode` returns `{ name, names, description, url, logo, squareLogo, sameAs }`. The name comes from SEO Management, else from the brand record.

### Where the website uses it

- **Site name:** `og:site_name`, the browser title suffix ("… · سويس أرابيان") and the default title (`app/layout.tsx`, `lib/seo/catalogPage.ts`).
- **No double brand name:** a title that already names the brand in any of its languages is not suffixed again (`namesBrand`).
- **Home page:**
  - Organization and WebSite JSON-LD: name, `alternateName` (the other languages), url, logo, description, `sameAs`.
  - Fallback title "{name} | …" and description.
- **Product pages:** the product's own brand, else the store brand (no hard-coded name).
- **`og:locale`:** language plus market country, e.g. `ar_QA` or `en_SA`.
- **If the API is down:** it falls back to the domain's own brand name (`storefrontLogo()`).

## 3. SEO variables per language

Website → SEO content → insert or edit a variable.

- "Value" is the main language. "Other languages (optional)" has one field per other market language.
- **Stored in:** `brand_seo_variables.metadata.translations` (`{ ar: "…" }`). Saving without sending translations keeps the saved ones; sending `{}` removes them. Codes are checked (`ar`, `fr`, `en-gb`), and HTML is refused as for the main value.
- **Built-in market variables:**
  - **Country name:** the saved name for that language, else the saved name, else the country's name in the shopper's language from the market country code (QA → "Qatar" / "قطر").
  - **Cities:** stay empty until saved under Website → Countries & cities.
- **Where variables are filled:** in page SEO fields and in the footer SEO text, in the shopper's language.

## 4. SEO text above the footer

Website → SEO content (per market, one block per market language: heading + body).

- **Display:** shown above the footer on every shop page, server-rendered so search engines read it.
  - It uses the shopper's language, else the market default.
  - It has `lang` and `dir` set.
  - Body text keeps its paragraphs; HTML is sanitized.
- **Off or empty:** nothing is shown.
- **API:** `GET /storefront/website/seo/footer-text?locale&zoneCode` → `{ text: { locale, heading, body } | null }`.
- **Code:** `features/seo-footer/` and `app/(shop)/layout.tsx`.

## Checked on 10 Nov (local, Qatar)

| Check | Result |
|---|---|
| `/` title, site name, JSON-LD | "Swiss Arabian \| …", alternateName "سويس أرابيان", description |
| `/ar` | title "سويس أرابيان \| عطور فاخرة وعود", `og:site_name` Arabic, `og:locale` ar_QA |
| Footer text en / ar | "Perfumes in Qatar" + variable in English / "عطور في قطر" + Arabic variable value |
| UAE (no text saved) | no footer block |
| Admin language switch | English / Arabic from markets; switching with unsaved edits asks Save / Discard |
| Admin Arabic collection auto-fill | Arabic collection name, no canonical error |

All test data (identity, Qatar text, test variable) was removed afterwards. Brand identity is back to empty.

## Not done / next

- The website serves `en` and `ar` only. A third language needs website routing and copy first.
- Brand identity is still empty for Swiss Arabian. Fill in the name, Arabic name, description, logos and social profiles before indexing.
- Cities per market are not filled in (Website → Countries & cities).
- A brand-wide canonical (when the brand website is set) points every market at one domain. That waits on the domain ↔ market link (open gap).

## SEO audit follow-ups (11 Nov 2026, R56)

- **Homepage SEO import:** SEO Management → "Import homepage from Shopify" reads every store's homepage title and description (English and Arabic), read-only, into the homepage **draft**. Values already set are kept unless "Replace" is ticked. KSA has none in Shopify: set its own in SEO Management.
- **Headings:** one H1 per home page: the footer SEO text heading when the market has one, else the page title. Hero, section titles, trust items, product names and footer column titles are plain text.
- **Logo:** `/assets/swiss-arabian-online-perfume-store.png`, alt "Swiss Arabian Online Perfume Store" (SAPIL: its own file and alt).
- **Collections:** an empty `en-us` row no longer hides the imported SEO of the `en` row.
- **Imports and admin edits:** see `swiss-arabian-backend-d/docs/migration/IMPORTS_AND_ADMIN_EDITS.md`.

## SEO checklist rows 11, 16–19, 21, 22 (11 Nov 2026, R58)

- **Alt text:** product gallery "<product> – image N of M"; scent image = product name; collection banner = its alt text, else the collection name.
- **Content in the first HTML:** the homepage (published CMS homepage of the market) and the collection, category and all-products listings (page N via `?page=N`, when no sort or price filter) render on the server. A plain "More products" link points to the next page; infinite scroll is unchanged.
- **Old links:** `/uae/…`, `/ksa/…`, `/qatar/…` and short Shopify paths (`/return-policy`, `/track-order`) redirect 301 (see `URL_REDIRECTS.md`).
- **No layout jump:** collection banners carry their pixel sizes from the API; fonts are WOFF2 with 400/500/700 preloaded and a width-matched Arial stand-in (`globals.css`, `app/layout.tsx`). The Stripe card form still loads the `.ttf` files (`stripeCheckoutAppearance.ts`), so they stay in `public/fonts/`.
- **Analytics:** `NEXT_PUBLIC_GTM_ID` (GTM-…) or `NEXT_PUBLIC_GA4_ID` (G-…); GTM wins when both are set; nothing loads when empty (`components/layout/AnalyticsScripts.tsx`).
- **Checked (local production build, Lighthouse mobile):** layout shift 0 (was 0.4–0.6), performance ~60 (was ~20). All 890 UAE sitemap URLs answer 200, no broken internal links. 13 key pages fit 375 px.
- **Homepage SEO:** English and Arabic published (11 Nov). KSA has none of its own and shows the brand (UAE) text; set KSA's own in SEO Management (market view).
- **Open:** no published Arabic CMS homepage (the older homepage shows); desktop banners are 3840 px and served at full size.
