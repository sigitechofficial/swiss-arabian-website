# Pages and policies

Built 10 Nov 2026. These are the text pages (`/pages/{handle}`) and policies (`/policies/{handle}`) of every market website, with English and Arabic.

## Global page, market version, hidden

| In a market | Meaning | Shown on that market's website |
|---|---|---|
| **Global** | The brand version, shared by every market | The global text |
| **Own version here** | This market has its own text (for example Qatar's shipping policy) | The market's text |
| **This market only** | No global page; only this market has it | The market's text |
| **Hidden here** | A global page this market does not show | Not found (404) |

- Editing a **global** page changes every market that follows it.
- Editing a market version changes only that market.
- **Follow global** removes the market version, so the market shows the global page again.

## Admin

Markets → *market* → Website → **Pages & policies** (`/markets/{zoneId}/website/site-pages`).

| Action | What it does |
|---|---|
| Import from Shopify | Preview first, then **Save pages**. Reads the market's Shopify store only; nothing is written to Shopify. |
| Add page | Choose **every market (global)** or **this market only**; page or policy; address; status |
| Edit / Edit global | Title, text, SEO title and description, in English and Arabic; status (Published, Draft, Archived) |
| Own version | Copies the global text for this market to edit |
| Hide here | Hides a global page in this market |
| Follow global | This market shows the global page again |
| Delete | Only for global pages added in the admin. Imported pages are archived instead, because a later import would bring them back. |

- **Text editor:** has a **Visual / HTML** switch. Pages with tables or embedded videos open in HTML mode, so nothing is dropped when editing.
- **Change history:** each change asks for a reason, which is stored with the page.
- **Permissions:** viewing needs `website.read`; changes need `website.write`.

## Shopify import rules

| Case | Result |
|---|---|
| The brand's default market (UAE) | Its pages become the **global** pages |
| Another market, same text as the global page | Follows the global page (no copy) |
| Another market, different text | Own version for that market |
| Another market, page not in the global set | This market only |
| A global page the market's store does not have | Hidden in that market |
| Page empty in Shopify (under 60 characters of text, no images; the theme or an app builds it) | Saved as a **draft** with its title, so someone can write the text here |
| Contact page (Shopify contact template) | Published; the website adds the market's contact information policy under the text |
| Page or version edited in the admin | Never overwritten |
| Imported page no longer in Shopify | Archived |
| Images in the text | Copied to our storage (same file on every re-import); links to the old store become site links |
| Titles with theme markup (`<H1 class="remove-head">OUR STORY</H1>`) | Only the text is kept |

**Order of imports:** import the default market (UAE) first. Otherwise every page of another market becomes "this market only"; importing that market again afterwards fixes it.

Images are compared by file name: each Shopify store hosts the same file at its own address.

## Website

- `/pages/{handle}` and `/policies/{handle}` (and `/ar/…`) show the market's version, else the global one, in the shopper's language, else in English.
- Text is cleaned before it is shown (`sanitize-html`).
  - Kept: headings, lists, links, images, tables, YouTube/Vimeo.
  - Removed: scripts, styles, forms and event handlers.
  - Links to other sites open in a new tab.
- SEO: title and description from the page; SEO Management can override them for the same address. Canonical and hreflang are set, and a breadcrumb is included.
- Published pages are listed in the sitemap, except addresses that redirect to a platform page (`/pages/faqs` → `/faq`, `/pages/our-story-1` → `/our-story`, `/pages/store-locator` → `/stores`).

## Data on 10 Nov 2026

| Market | Pages in Shopify | Policies | Result |
|---|---|---|---|
| UAE (default) | 37 (31 with Arabic) | 5 | 42 global pages; 22 empty in Shopify → drafts; 18 of 20 images copied (2 failed) |
| Qatar | 27 | 4 | 17 own versions, 12 Qatar only, 2 follow global, 7 global pages hidden |
| KSA | — | — | Blocked: the Shopify app needs permission from the store owner (same as menus and redirects) |

Footer links checked on 10 Nov:
- **UAE:** all work except `/pages/product-catalogue`. It is empty in Shopify, so it is a draft; write its text or link the catalogue file.
- **Qatar:** all work once its domain is linked to the Qatar market. Locally, the UAE redirect list answers two of its old addresses.

Policies have no Arabic in Shopify; the Arabic site shows the English text until Arabic is added here.

## Code

- **Backend:** `src/modules/website-pages/`
  - `website-page.core.ts`: handles, links, empty-page and content comparison rules
  - `website-pages.service.ts`: admin, import, storefront
  - Controllers: `admin/website/markets/:zoneCode/pages…` and `storefront/website/pages…`
  - Model `prisma/models/catalog/website-page.prisma`; migrations `20261110200000`, `20261110201000`
- **Website:**
  - `src/features/site-pages/`
  - `src/app/(shop)/pages/[handle]`, `src/app/(shop)/policies/[handle]`
  - `src/lib/html/sanitizePageHtml.ts`
  - `.site-page-body` styles in `globals.css`
  - Sitemap
- **Admin:**
  - `src/features/website-management/api/sitePages.api.ts`
  - `components/WebsiteSitePagesPageView.tsx`
  - Route `app/(dashboard)/markets/[id]/website/site-pages`
- **Tests:** `website-page.core.spec.ts`, `website-pages.service.spec.ts`, `sanitizePageHtml.test.ts`
