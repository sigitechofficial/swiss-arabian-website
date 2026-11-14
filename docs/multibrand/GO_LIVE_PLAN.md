# Go-live plan: multiple brands, multiple markets

Status: agreed 2026-11-14. Nothing deployed yet.

## Decisions

| # | Decision |
|---|---|
| D1 | **One website build per brand** (the brand's design is chosen at build time); one shared backend, admin and database. |
| D2 | **One subdomain per market**, e.g. `uae.swissarabian.com`, `ksa.swissarabian.com`, `uae.sapil.com`. Matches today's Shopify addresses (keeps search rankings). Language stays a path (`/ar/…`). |
| D3 | **One customer account per brand**, used across all of that brand's markets. Swiss Arabian and Sapil accounts stay separate (each brand owns its customer relationship and consent). |
| D4 | Marketing needs to know **which markets each customer uses**: tracked per customer per market (phase 2). Marketing in a market only with that market's consent. |
| D5 | Shoppers sign in once per subdomain (same account); shared sign-in across subdomains can come later. |

## What is already in place

- One deployment per brand serves all of its subdomains, each with its own cached pages (phase 3; before it, production server-rendered pages used the one configured address).
- Backend address table `StorefrontDomain`: address → brand → market (optional). Unknown addresses never fall back to Swiss Arabian.
- Markets exist for both brands (SA: UAE, KSA, Qatar; Sapil: UAE, KSA, Oman).
- Per brand: design, emails (colours, language, logos), payment credential packs, feature switches, legacy redirects. Email senders per brand + market.
- Accounts: unique per brand; registration stores the sign-up market (`customer.zoneId`). Marketing consent per channel per market (`CustomerMarketingConsent.zoneId`). Orders store their market.

## Phase 1 — market subdomains work correctly (~3 days, development) — ✅ done 2026-11-14

Backend `feat/sapil-cms` 579776bc; details in backend `docs/storefront/MARKET_DOMAINS.md`.

1. Link every subdomain to its market in `StorefrontDomain` and mark each market's primary address (locally `ksa.`, `om.`, `qa.`, `kw.swissarabian.com` still fall to the default market).
2. Per-market public address: email links and Tabby / Telr return addresses use the order's market site (today one address per brand: `STOREFRONT_PUBLIC_BASE_URL__<BRAND>`, pack `returnBaseUrl`).
3. Production CORS reads allowed origins from the address table (today a fixed list in config).
4. Tests: each subdomain resolves to the right brand, market, prices and currency.

## Phase 2 — one account, many markets (~3–4 days, development) — ✅ done 2026-11-14

Backend and admin `feat/sapil-cms`; details in backend `docs/customers/CUSTOMER_MARKETS.md`.
As built: activity (first / last seen, last sign-in, language, sign-up flag) is stored per
customer per market (`customers.customer_markets`); order count, spend and last order are
computed from the orders table when read, so they never drift. Backfill:
`npm run ops:customers:backfill-markets -- --apply` (run once per environment after the
migration). Admin market lists default to "use this market" (signed up here, active here
or ordered here) with a "signed up here" switch; CSV export per market (`customers.export`).
Plan as written:

1. New record per customer per market: first / last seen, first / last order, order count, amount spent, last language, sign-up market flag.
2. Updated on sign-up, every sign-in and session refresh (market from the site address) and every order.
3. Sessions store the site address and market (support, fraud checks).
4. "Main market" per customer: most orders in the last 12 months, else last sign-in, else sign-up market.
5. Marketing in a market only with that market's consent (existing per-market consent).
6. CRM (Insider) attributes: `markets_used`, `main_market`, `signup_market`, last order per market.
7. Admin customer page: "Markets" panel (market, last seen, orders, consent); export of customers by market.

## Phase 3 — shopper experience and SEO across subdomains (~3–4 days, development) — ✅ done 2026-11-15

As built: [MARKET_WEBSITES.md](./MARKET_WEBSITES.md). Each subdomain is its own cached
page set inside one deployment per brand (route segment `[site]`), checked against the
backend address table (unknown → 404); root domain → 307 to a market website by
earlier choice, country, else default. Merchant Center links per market website.
Plan as written:

1. Market switcher goes to the other subdomain, keeping language and page.
2. Canonical address per site; hreflang between markets and languages; sitemap and robots.txt per site.
3. Shopify 301 redirects per subdomain at cutover.
4. Analytics and marketing IDs per brand and market (GA4 / GTM, Merchant Center feeds, Insider).

## Phase 4 — setup per brand and market (business and IT, start now, runs in parallel)

Details in [`../sapil/LAUNCH_CHECKLISTS.md`](../sapil/LAUNCH_CHECKLISTS.md).

1. Payment accounts per brand, and per market where the provider requires it (e.g. Paymob UAE vs KSA). Telr is test-only today: going live needs development.
2. Register every subdomain with providers: Apple Pay domain registration (Stripe), allowed return addresses (Tabby, Telr, Paymob).
3. Email sending domain per brand (SPF, DKIM, DMARC); sender, reply-to, support per market where they differ.
4. Policy and contact details confirmed per brand and market.
5. Hosting: one project per brand with all its subdomains, HTTPS; DNS records, TTL lowered before cutover.

## Phase 5 — staging and go-live, one market at a time

1. Staging subdomain per brand and market. Smoke test: browse; prices and currency; checkout with every payment method; emails and their links; language switch; market switch; a customer active in two markets shows both in the admin.
2. Rollout order: **Swiss Arabian UAE** (replaces live Shopify) → **Sapil UAE** → **Swiss Arabian KSA, Qatar, Kuwait, Oman** → **Sapil KSA, Oman**. A market goes live only when its phase 4 items are done.
3. Each cutover: switch DNS, check 301s on the top old URLs, watch orders, payments and errors for 24–48 h, keep Shopify ready to roll back.

## Timeline

| Work | Who | Effort | Depends on |
|---|---|---|---|
| Phase 1 | Development | ~3 days | — |
| Phase 2 | Development | ~3–4 days | Phase 1 (address → market) |
| Phase 3 | Development | ~3–4 days | Phase 1 |
| Phase 4 | Finance, IT, legal, providers | external lead times | start now |
| Phase 5 | Development + QA + business | per market | Phases 1–4 for that market |

Development total: ~9–11 working days. Phase 4 (provider accounts, DNS, domain verification) is the likely critical path.
