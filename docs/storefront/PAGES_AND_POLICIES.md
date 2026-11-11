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

## Versions, scheduling and order records (12 Nov 2026)

Every page and policy (global, or a market's own) keeps **saved versions**. Only one is **live**; the website always shows it at the normal address.

| Status | Meaning |
|---|---|
| Live | The text shoppers see now |
| Scheduled | Goes live by itself at its start date |
| Draft | Being written; not shown |
| Earlier version | Was live; can be restored |

**Admin:** Pages & policies → **Versions** on a row. The list shows the live version and the next scheduled one.
- **New version:** starts as a copy of the live text and is saved as a draft.
- **Make live now:** the website changes within a minute. The live version becomes an earlier version.
- **Schedule:** enter a start date, and optionally an end date, in the market's time (UAE time, Qatar time). Two versions can't start at the same moment. At the end date, the version live before comes back.
- **Restore:** makes an earlier version live again (rollback).
- **Compare with live:** shows the changes sentence by sentence, in English and Arabic.
- **Preview:** a signed website link, valid for 2 hours, showing the version with a "Preview" banner. It is not indexed. Shoppers never see it.
- **History:** who created, scheduled, activated or replaced each version, when, and why. Every action asks for a reason. The history can't be edited.
- **Arabic:** a version without Arabic needs the "Go live with English only" box ticked.
- **Global vs market:** a market with its own version keeps it when a new global version goes live. Global versions change every market that follows the global page.
- **Edit (live text):** saving still changes the live text straight away. The text before is kept as an earlier version.
- Only drafts can be deleted. Every other version stays for the record.

**Automatic switching:** the backend checks every minute (`WebsitePageVersionsScheduler`; turn it off with `WEBSITE_PAGE_VERSIONS_WORKER_ENABLED=false`). Each switch runs in one transaction and is safe with several backend instances. A failed switch shows a red notice on the version and on the page row.

**Orders:** each new order stores the policy versions live in its market when it was placed (`orders.policy_snapshot`): refund, shipping, terms, privacy, exchange and contact. Admin order detail shows them as `policies`. The order is placed even if this lookup fails. Older orders have none.

**Preview secret:** `WEBSITE_PREVIEW_SECRET` (falls back to `ADMIN_JWT_SECRET`). Links use `STOREFRONT_PUBLIC_BASE_URL`, or `http://localhost:3004` locally.

**Code:**
- Backend:
  - `website-page-versions.service.ts`, `.core.ts` and `.scheduler.ts`
  - `controllers/admin-website-page-versions.controller.ts` (`/admin/website/markets/:zoneCode/pages/:pageId/versions`)
  - `GET /storefront/website/pages/preview`
  - `policy-snapshot/`
  - Migration `20261112090000_website_page_versions`: existing text became version 1, "Current text"
- Admin: `SitePageVersionsModal.tsx`, `api/sitePageVersions.api.ts`, `utils/pageVersions.utils.ts`
- Website: preview parameters in `sitePageRoute.tsx`

## One version per policy (11 Nov 2026)

Shopify has each policy twice: a built-in policy (`/policies/…`, English only) and a page the footer links to (`/pages/…`, English and Arabic, different text). The pages are the version we keep. The built-in addresses redirect (301) to them in every market, and `/ar` stays `/ar`:

| Old address | Goes to |
|---|---|
| `/policies/shipping-policy`, `/shipping-policy` | `/pages/shipping-delivery-policy` |
| `/policies/refund-policy`, `/refund-policy`, `/return-policy`, `/returns` | `/pages/refund-policy` |
| `/policies/privacy-policy`, `/privacy-policy` | `/pages/privacy-policy` |
| `/policies/terms-of-service`, `/terms-and-conditions` | `/pages/terms-and-conditions` |

- `/policies/contact-information` stays; the contact page shows it.
- The redirected addresses are left out of the sitemap.
- The checkout's Privacy Policy link goes to `/pages/privacy-policy`.
- Edit a policy's text under **Pages & policies**, on the page (global, or the market's own version).
- **Qatar:** its exchange page in Shopify is `/pages/exchange-and-retuen-policy` (spelling from the store). A Qatar redirect sends `/pages/exchange-and-return-policy` (and `/ar/…`) there. It is a market redirect in the admin (**Redirects**), so each environment needs it.
- Code: `src/lib/seo/shopifyLegacyRedirects.ts` (`POLICY_REDIRECTS`, `SHORT_PAGE_REDIRECTS`).

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
