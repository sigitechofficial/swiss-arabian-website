# Brand websites: production deployment plan

Status: **proposed 2026-11-15, not approved, nothing deployed.** Website code for W1–W5 built 2026-11-15 (§7); infrastructure (W6–W9) not started. Builds on
[GO_LIVE_PLAN.md](./GO_LIVE_PLAN.md) (D1 one build per brand, D2 one subdomain per
market) and [MARKET_WEBSITES.md](./MARKET_WEBSITES.md) (how one deployment serves
every market website of a brand). Backend hosting context: backend
`docs/architecture/SAPIL_DEPLOYMENT_HOSTING_AND_COST.md` (Option A: one shared
backend, admin and database).

Rule for every choice below: enterprise merit, never less work.

## 1. Target topology

```
shopper ── DNS (per brand zone) ── Azure Front Door Premium (WAF, TLS, CDN, geo rule)
                                        │  origin group per brand, private link
              ┌─────────────────────────┴─────────────────────────┐
   Container App: web-swissarabian-<env>              Container App: web-sapil-<env>
   (image: website, brand SWISS_ARABIAN)               (image: website, brand SAPIL)
   uae. / ksa. / qa. / kw. / om. swissarabian.com      uae. / ksa. / om. sapil.com
   + swissarabian.com (root: redirects)                + sapil.com (root: redirects)
              └──────────────┬──────────────┘
          shared page cache (Azure Managed Redis, key prefix per brand + release)
                             │
                Container App: commerce-backend (shared, both brands)
```

| Piece | Decision (proposed) | Why |
|---|---|---|
| Edge | **Azure Front Door Premium** in front of both website apps and the backend | WAF (bots, OWASP rules), managed TLS for every subdomain and the root domains, CDN for `/_next/static` and images, a country header for the root-domain redirect (§5), private link so the apps cannot be reached directly |
| Website hosting | **One Container App per brand per environment** (D1) | A brand's release, scale and rollback never touch the other brand; each brand's image carries its own design |
| Market websites | Every market subdomain of a brand → that brand's app (same deployment) | Already built (phase 3): a new market needs DNS + Front Door route only, no build |
| Page cache | **Shared cache in Azure Managed Redis** (§4) | Required as soon as an app runs more than one replica |
| Regions | UAE North (same as backend) | Latency to GCC shoppers and the backend |
| Environments | dev → **staging** → prod, each with its own Front Door endpoint, apps, Key Vault, database | Staging is where each market is rehearsed before cutover (GO_LIVE_PLAN phase 5) |

## 2. Addresses per environment

| Environment | Swiss Arabian | Sapil |
|---|---|---|
| prod | `swissarabian.com` (root), `uae.`, `ksa.`, `qa.`, `kw.`, `om.swissarabian.com` | `sapil.com` (root), `uae.`, `ksa.`, `om.sapil.com` (final domain to confirm) |
| staging | `uae.staging.swissarabian.com`, `ksa.staging.…` | `uae.staging.sapil.com`, … |
| dev | current `ca-swissarabian-website-dev` URL + dev subdomains | dev subdomains |

Every address is a row in the backend address table (`StorefrontDomain`) of that
environment: an unknown address is a 404 by design. Staging and dev addresses
are always `noindex` (`NEXT_PUBLIC_SEO_INDEXING_ENABLED=false`) and behind Front
Door access rules (office IPs / basic sign-in) so they are never indexed or shopped.

## 3. Build and release

| Step | Plan |
|---|---|
| Build | One image per brand per commit: `website:<sha>-swissarabian`, `website:<sha>-sapil` (`NEXT_PUBLIC_STOREFRONT_BRAND_CODE` build arg; `check:brand` fails a wrong / missing brand setting) |
| Promotion | **Build once, promote the same image** dev → staging → prod (W4, built): the image holds only the brand, product switches and its commit; nothing is rendered at build time. Each environment's settings are set on the container (§3a) |
| Release | New Container App revision with **0 % traffic** → smoke test on the revision URL (every market address of the brand, via Front Door test route) → shift traffic 10 % → 100 % (blue / green, like the backend `deploy-azure-dev-bluegreen.yml`) |
| Rollback | Shift traffic back to the previous revision (seconds); images are kept 30 days |
| Backend first | A release that needs a backend change ships the backend first; the website must keep working with the previous backend for one release (additive APIs) |
| Pipeline | GitHub Actions per environment with OIDC to Azure (as dev today); prod deploy needs a manual approval (GitHub environment protection) and a green staging run of the same commit |
| Warm-up | After a release, before traffic moves: request each market address's home, top collections and products through the new revision (pages render once into the shared cache) |
| Secrets | None in the image. Server-only settings from Key Vault references on the Container App (`SITE_REVALIDATE_SECRET`, `REDIS_PASSWORD`) |

### 3a. Container settings per environment (read at runtime)

| Setting | dev | staging | prod | Notes |
|---|---|---|---|---|
| `APP_ENV` | `dev` | `staging` | `production` | Required; a server without it refuses to start |
| `API_BASE_URL` | backend dev URL | backend staging URL | backend prod URL (internal) | https outside local; the website forwards the browser's `/storefront`, `/catalog` calls here |
| `SEO_INDEXING_ENABLED` | `false` | `false` | `true` at go-live | Refused outside production |
| `TRUSTED_EDGE_IDS` | (optional) | Front Door profile id | Front Door profile id | Required in staging / prod |
| `REDIS_HOST` / `PORT` / `PASSWORD` / `TLS` | (optional) | Managed Redis | Managed Redis | Required in staging / prod (shared page cache) |
| `SITE_REVALIDATE_SECRET` | Key Vault | Key Vault | Key Vault | Same value as the backend's |
| `STOREFRONT_HOST`, `LOCAL_STOREFRONTS` | — | — | — | Local only; refused elsewhere |

Build arguments (the same image for every environment): `NEXT_PUBLIC_STOREFRONT_BRAND_CODE`
(required), `NEXT_PUBLIC_ENABLE_MFA` / `_PASSWORD_RESET` / `_CUSTOMER_VERIFICATION_UI`,
`NEXT_DEPLOYMENT_ID` (commit). The build check refuses every old environment setting
(`NEXT_PUBLIC_APP_ENV`, `NEXT_PUBLIC_*_API_BASE_URL`, `NEXT_PUBLIC_*_RETURN_URL`,
`NEXT_PUBLIC_STOREFRONT_HOST`, `NEXT_PUBLIC_SEO_INDEXING_ENABLED`, `NEXT_PUBLIC_CATALOG_MEDIA_BASE_URL`, …).

## 4. Cache across replicas (W1 — built 2026-11-15)

Pages, `unstable_cache` entries (site integrations, site settings) and
`revalidateTag` live **per replica** today (Next.js default file / memory cache).
With 2+ replicas:
- the backend's signed refresh (`SITE_REVALIDATE_URLS`) reaches **one** replica
  through the load balancer; the others keep the old Insider tag, analytics ids,
  promos or prices until their 300 s fallback;
- shoppers see different pages depending on the replica.

Built (W1): `cache-handler.cjs` keeps pages, data, route responses and optimized
images in Redis (keys `web:<BRAND>:<BUILD_ID>:` — brands never share entries, a
release starts clean) and records revalidated tags there with Next's own
semantics, copying them into each server's manifest before an entry is served.
Redis down: pages render fresh, writes are skipped, a revalidation fails so the
backend retries. Staging / production refuse to start without `REDIS_HOST`.
`deploymentId` (commit) protects browsers across a rolling release.

## 5. Root domain redirect needs the visitor's country (W2 — website built 2026-11-15)

`swissarabian.com` sends a visitor to their market website by: earlier choice →
country → brand default (`src/lib/site/siteRegistry.ts`). The country is read from
`x-vercel-ip-country` / `cf-ipcountry` / `cloudfront-viewer-country`; **Azure
sends none of these**, so every first visit would land on the default market.

Built (W2, website): the website reads only `x-client-country`, and serves only
requests carrying its Front Door profile id (`x-azure-fdid` in `TRUSTED_EDGE_IDS`;
anything else 403, `/api/health` exempt for the container probe). Staging /
production refuse to start without `TRUSTED_EDGE_IDS`.

Front Door configuration (W6, infrastructure):
- **Routes**: every brand domain and market subdomain → that brand's website
  origin group (the website forwards `/storefront`, `/catalog` to the backend).
  HTTPS only, HTTP redirected; caching on for `/_next/static/*` and `/fonts/*`.
- **Origin**: the Container App over private link; origin host header = the
  app's host name; Front Door sends `X-Forwarded-Host` (the shopper's address)
  and `X-Azure-FDID`.
- **Rule set, in order**: (1) always: overwrite `x-client-country` = `ZZ` (so a
  client can never send its own); (2) one rule per market country: if client
  geo = AE / SA / QA / KW / OM, overwrite `x-client-country` with that code.
- **WAF**: managed rule set (OWASP) + bot manager, prevention mode after a week in detection.

## 6. Market switch and the address (checked in code; live test pending)

How it works (built in phase 3):
- On a market website the picker lists only markets with a live website of their
  own. Choosing one **goes to that subdomain**, same page and language
  (`/ar/products/oud` on `uae.` → `/ar/products/oud` on `ksa.`); query and anchor kept.
- Checkout, payment and order pages go to the other market's `/cart` (bags are per market).
- The address decides the market: no cookie can show KSA prices on `uae.`.
- Sign-in is per website (D5): the shopper signs in again on the other subdomain.

Gaps found (both fixed 2026-11-15):
- **W3 — the choice is not remembered for the root domain.** The market cookie is
  written only on the address that set it (no `Domain=`), and on a market website
  the switch navigates away without writing it at all. So `swissarabian.com`
  never sees "the market they chose before". Fix: on a switch, record the choice
  on the brand's registrable domain (`Domain=.swissarabian.com`, derived from the
  backend address table, never by guessing from the host string), read it in the
  root redirect, with tests for both brands and for the staging domains.
  **Built**: `<brand>-market-choice` on the backend's `brandDomain`.
- **W5 — a brand app serves the other brand's addresses.** The proxy checks that an
  address exists in the backend, not that it belongs to *this* build's brand. A
  `Host` / `X-Forwarded-Host` of `uae.sapil.com` sent to the Swiss Arabian app
  renders Sapil data in Swiss Arabian design and caches it. Fix: 404 when
  the address's brand is not the build's brand; trust `X-Forwarded-Host` only from
  Front Door (W2's check). **Built.**
- To verify live (§9): a product not sold in the target market (expect its 404 page
  with links, not an error), a language the target market does not offer, the
  picker on the root domain, switching while signed in, a page with filters in the
  query.

## 7. Work items before the first production market

| # | Item | Repo | Blocking |
|---|---|---|---|
| W1 | Shared cache handler on Redis; two-replica test | website (+ infra) | **built** (website); Redis per environment: W6 |
| W2 | Front Door country header + trusted-proxy check | website + infra | **built** (website); Front Door rule set: W6 |
| W3 | Market choice remembered on the brand domain | website + backend | **built** |
| W4 | Runtime configuration (API address, environment) so one image is promoted | website | **built** |
| W5 | Address must belong to the build's brand | website | **built** |
| W10 | Product images are absolute storage URLs (`stswissarabiandev.blob.core.windows.net` today): add the staging / production storage hosts to `REMOTE_IMAGE_PATTERNS` once created (one fixed list, valid in every environment), else those images are served unoptimized | website | before the first market |
| W6 | Infrastructure as code (Bicep) for Front Door, apps, Redis, DNS records, alerts — per environment | infra | yes |
| W7 | Prod pipeline: build per brand, staging gate, approval, blue / green, rollback job | website CI | yes |
| W8 | Monitoring: Application Insights per app (brand + market dimensions), availability tests per market address, alerts on 5xx / latency / 404 rate | infra | yes |
| W9 | Backend: `SITE_REVALIDATE_URLS` per brand app, `INTEGRATIONS_ALERT_EMAILS`, CORS from the address table (built), `STOREFRONT_MARKET_URLS=on` | backend config | yes |

## 8. Per-market go-live (each market, in the GO_LIVE_PLAN order)

1. Address row exists and is linked to the market (staging and prod).
2. DNS: TTL lowered to 300 s two days before; Front Door custom domain + managed certificate validated.
3. Integrations switchboard: every payment / courier on for the market with an account that passed a connection test (go-live check blocks otherwise); webhooks registered to the prod backend; return addresses registered with Tabby / Telr / Paymob; Apple Pay domain verified.
4. Shopify 301s imported for the address; top 500 old URLs checked.
5. Staging smoke test (§9) green.
6. Admin → Market websites → Checks → **Go live** (records who and when).
7. DNS switch; watch orders, payments, errors 24–48 h; Shopify kept ready for rollback (DNS back + **Roll back** in admin).

## 9. Smoke test per market (staging, then prod after cutover)

Browse home / collection / product in both languages; prices and currency; market
picker to every other live market (same page, language, address); root domain
redirect by country and by earlier choice; sign up / sign in; add to bag;
checkout with every payment method of the market (test cards in staging);
order emails and their links point to the market's own address; Insider tag and
analytics ids are the market's; `robots.txt`, `sitemap.xml`, canonical, hreflang;
an unknown address → 404; the other brand's address on this app → 404 (W5).

## 10. Open decisions for the business

- Sapil production domain (`sapil.com` or another).
- Front Door Premium vs Standard (Premium recommended: private link to the apps and managed WAF rule sets).
- Staging access: office IPs vs sign-in.
