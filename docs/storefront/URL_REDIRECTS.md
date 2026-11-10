# URL redirects

Built 10 Nov 2026. Old website addresses answer **301** to a new address, per market website. This keeps old links, bookmarks and search rankings when a market moves from Shopify.

## Where to manage them

Admin → Markets → *market* → Website → **URL redirects** (`/markets/{zoneId}/website/redirects`).

| Action | What it does |
|---|---|
| Import from Shopify | Preview first, then **Save redirects**. Reads the market's Shopify store only; nothing is written to Shopify. Safe to run again. |
| Add redirect | Old address (a path on this site) → new address (a site path or a full https address) |
| Edit | Change the new address. An edited imported redirect becomes an admin redirect; later imports leave it alone. |
| Switch off / on | Keeps the redirect for later |
| Delete | Removes it; the old address answers "not found" again |

Each change asks for a reason, which is stored with the redirect. Viewing needs `website.read`; changes need `website.write`.

The list flags a new address that is **not on the new site** (a product, collection or category that is not live in this market). Shoppers following that redirect get a 404, so the new address should be fixed.

## Import rules

| Case | Result |
|---|---|
| New redirect in Shopify | Added, on |
| Old address is a live page on the new site (product, collection, category, fixed page) | Kept but **off**: "The page exists on the new site". Shopify, too, only redirects addresses that no longer exist. |
| Redirect added or edited in the admin | Never overwritten |
| Imported redirect no longer in Shopify | Switched off: "Removed from Shopify" |
| Points to itself once case, trailing slash and query are ignored (e.g. `/collections/x?page=8` → `/collections/x`) | Skipped |
| Same old address twice (Shopify keeps `?page=1`, `?page=2` apart) | First one kept |
| New address on the old store's own domain (`https://uae.swissarabian.com/collections/x`) | Stored as a site path (`/collections/x`) |

Matching ignores case, a trailing slash and the query string. Paths are stored decoded (Arabic handles work).

## How the website uses them

- The website proxy asks the backend for the redirects of its own domain: `GET /storefront/website/redirects`.
  - It uses the domain's market when the domain is linked to one, else the brand's default market.
  - Chains (a → b → c) are sent as one hop; loops are dropped.
- The list is cached in memory for a minute per domain and refreshed in the background.
  - Only the first request after a start waits for it, at most 1.5 s.
  - If the backend cannot be reached, the site works without redirects.
- Stored redirects are checked before the fixed old-Shopify rules (`shopifyLegacyRedirects.ts`).
- An Arabic address (`/ar/…`) uses its own redirect first. Otherwise it uses the English one and keeps `/ar` on a site target.
- A site target keeps the shopper's query (utm tags) unless the target has its own query.

## Data on 10 Nov 2026

| Market | In Shopify | Saved | On | Off (page exists) | Skipped | New address not live |
|---|---|---|---|---|---|---|
| UAE | 310 | 260 | 249 | 11 | 25 point to themselves, 25 duplicates | 34 (collections not in UAE, old sample products, Shopify pages not moved yet) |
| Qatar | 20 | 20 | 20 | 0 | 0 | not checked yet |
| KSA | — | — | — | — | — | Blocked: the Shopify app needs `read_online_store_navigation` from the store owner (same as KSA menus) |

## Before go-live

1. **Link each domain to its market** (Brand → Domains). Today no domain has a market, so every domain uses the brand default market (UAE). On the Qatar site that would apply UAE's redirects.
   - The admin cannot set this yet; the backend can only set it when a domain is created.
2. **Fix the Qatar domain.** It is registered as `qa.swissarabian.com`, but the live site is `qatar.swissarabian.com`.
3. Fix the 34 UAE redirects whose new address is not live. About a dozen are `/pages/…` targets, which resolve once pages and policies move to the CMS.
4. Import KSA once the store owner grants the permission.

## Code

- Backend: `src/modules/website-redirects/`
  - `website-redirect.core.ts`: path rules and chain collapsing
  - `website-redirects.service.ts`: admin list/CRUD, Shopify import, storefront list
  - Two controllers: `admin/website/markets/:zoneCode/redirects…` and `storefront/website/redirects`
  - Model `prisma/models/catalog/website-url-redirect.prisma`; migrations `20261110190000`, `20261110191000`
- Website: `src/lib/seo/storedRedirects.ts`, `src/proxy.ts`
- Admin: `src/features/website-management/api/urlRedirects.api.ts`, `components/WebsiteUrlRedirectsPageView.tsx`, route `app/(dashboard)/markets/[id]/website/redirects`
- Tests: `website-redirect.core.spec.ts`, `website-redirects.service.spec.ts`, `storedRedirects.test.ts`
