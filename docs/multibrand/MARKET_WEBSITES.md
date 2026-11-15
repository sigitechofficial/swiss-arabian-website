# Market websites: one deployment per brand, one website per market

Go-live plan phase 3 ([GO_LIVE_PLAN.md](./GO_LIVE_PLAN.md)). Decided 2026-11-15 on
enterprise merit: one source of truth (the backend address table), one release
updates every market of a brand at once, and a new market website needs no
deployment or rebuild.

## How a request is served

```
ksa.swissarabian.com/ar/products/oud
  → proxy (src/proxy.ts)
      1. checks the address with the backend (GET /storefront/site, cached 60 s)
         unknown → 404 · backend unreachable on first sight → 503
      2. root domain (no market of its own) → 307 to a market website
      3. rewrites to /ksa.swissarabian.com/ar/products/oud   (shoppers never see it)
  → app/[site]/[locale]/… : its own prerendered / cached pages per address
```

- **`[site]`** is the address the shopper used (`sp.localhost:3045` is written
  `sp.localhost__3045`). It is a root param: server code reads it with
  `currentSiteHost()` (`src/lib/site/currentSite.ts`), so pages stay static and
  every address gets its own cache entries.
- `next/root-params` may only be imported in the page tree. `src/lib/site/siteParam.ts`
  (imported by the root layout and `routeLocale`) registers the reader; route
  handlers pass the address with `withSiteHost()` instead.
- Every server API call sends that address (`x-storefront-host`), so the backend
  answers for the market of the address (`ksa.` → KSA prices, stock, content).

## What each market website gets

| | Where |
|---|---|
| Market, prices, currency in the first HTML | backend: a market address decides the market (no cookie overrides it) |
| Canonical = its own address | `requestOrigin()` → metadataBase |
| hreflang across market websites (`en-SA`, `ar-AE`, …, x-default = brand default market) | `src/lib/seo/marketAlternates.ts`; a market is linked only where the page exists (catalog checked against that market's catalog; CMS pages and Journal posts stay on their own website) |
| `robots.txt`, `sitemap.xml` per address | `app/[site]/robots.txt`, `app/[site]/sitemap.xml` |
| Root domain `robots.txt` lists the market websites' sitemaps; its sitemap is empty (it redirects) | `src/lib/seo/siteRobots.ts`, `siteSitemap.ts` |
| Analytics: the page tells GTM / GA4 its website, market, country, currency and language | `AnalyticsScripts` (`site_host`, `market`, `market_country`, `currency`, `site_language`) |

## Root domain (e.g. `swissarabian.com`)

An address in the address table with no market of its own. When the brand has
market websites, the proxy sends visitors (307, `private, no-store`) to: the market
they chose before (market cookie) → the market of their country (hosting edge
header `x-vercel-ip-country` / `cf-ipcountry` / `cloudfront-viewer-country`) → the
brand's default market. Page, language and query are kept. With no market
websites yet (e.g. locally) it serves pages itself as before.

## Market picker

On a market website the picker lists the markets with a website of their own;
choosing one goes there, same page and language (checkout / order pages go to
that market's bag: bags are per market). Sign-in is per website (D5).

The choice is kept for the brand's root domain (`<brand>-market-choice`, set on
the brand's domain from the backend address table, `brandDomain`), so
`swissarabian.com` later sends the shopper back to the market they chose. The
root redirect order is: that choice → a choice made on the root address itself →
the visitor's country (Front Door's `x-client-country`) → the brand's default.

## Safety

- Only addresses in the backend address table are served (`GET /storefront/site`
  resolves `x-storefront-host` only: no fallback to another brand or signal), and
  only this build's brand's addresses (another brand's address is a 404).
- Deployed websites serve only requests through Front Door (`TRUSTED_EDGE_IDS`,
  `src/lib/site/edge.ts`): the address and country headers are Front Door's own.
- A typed internal path (`/ksa.swissarabian.com/en/…`) is refused (404); the proxy's
  internal-rewrite header is honoured only for the address's own tree.
- `/.well-known/…` (Apple Pay domain check) and static files pass through.

## Analytics and marketing per market

- **GTM / GA4**: set per market on the integrations switchboard (admin → Settings →
  Integrations, ADR-005 phase E; `docs/multibrand/SITE_INTEGRATIONS.md`) — usually
  one container for the brand default. Route markets
  inside GTM with a lookup on the `market` (or `site_host`) dataLayer value: one
  GA4 property per market, or one per brand with a market dimension. No code change
  or rebuild for a new market. Direct GA4 (no GTM) gets the same fields as page
  parameters.
- **Google Merchant Center**: each market's feed items link to that market's
  website (backend `productLinkBaseFor(zoneId)`), so landing-page price and currency
  match the feed.
- **Insider**: one account per brand; the customer's markets come from the backend
  (`user_markets`, phase 2).

## Shopify 301s at cutover

Admin URL redirects are stored per address and market and applied by the proxy for
the address's own market, so each Shopify subdomain's old URLs are imported for
its market website. Old Shopify URL shapes are handled in code
(`shopifyLegacyRedirects.ts`).

## Adding a market website

1. Backend: market exists; address linked to it (`npm run ops:storefront:market-domains`).
   Linked is not live: no other website, email or payment return uses it yet.
2. DNS and hosting: point the subdomain at the brand's website project (same deployment).
3. Nothing to build: the address renders on first visit; the next build prerenders it.
4. Register the address with payment providers and Search Console; add its GTM routing.
5. Cutover: admin → Brands → Domains → Market websites → Checks → **Go live**
   (backend `docs/storefront/MARKET_WEBSITE_CUTOVER.md`). Only live addresses get
   `storefrontUrl`, so only they appear in the picker, hreflang and the root redirect.

## Local testing

Aliases map `*.localhost` addresses to market addresses:

```bash
APP_ENV=local
API_BASE_URL=http://127.0.0.1:3000
LOCAL_STOREFRONTS="sa=SWISS_ARABIAN@uae.swissarabian.com,ksa=SWISS_ARABIAN@ksa.swissarabian.com,qa=SWISS_ARABIAN@qa.swissarabian.com,root=SWISS_ARABIAN@swissarabian.com,sp=SAPIL@sapil.test"
```

Backend with `STOREFRONT_MARKET_URLS=on` (market website addresses). Then
`http://ksa.localhost:3004` is the KSA website; the picker moves between the local
aliases. Checked 2026-11-15 on a production build: KSA in SAR / UAE in AED in the
first HTML, self canonical, cross-market hreflang, per-address sitemap (713 URLs on
KSA), root domain 307 by country, unknown address 404.
