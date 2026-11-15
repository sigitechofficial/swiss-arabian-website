# Website integrations per address (ADR-005 phase E)

**Status:** built 2026-11-15. Backend plan: `docs/integrations/INTEGRATIONS_SWITCHBOARD_PLAN.md`
§7.4, §5.2 and §18 "Phase E" (backend repository).

## What changed

Analytics (GTM / GA4), Insider's website tag, Tabby / Tamara pay-later promos and
Google Maps used to be **build settings** (`NEXT_PUBLIC_GTM_ID`,
`NEXT_PUBLIC_INSIDER_*`, `NEXT_PUBLIC_TABBY_*`, `NEXT_PUBLIC_ENABLE_TABBY / _TAMARA /
_PAYMOB`, `NEXT_PUBLIC_GOOGLE_MAPS_*`): one value per brand deployment, the same for
every market website, able to disagree with what the backend actually offers, and
changed only by a rebuild.

Now they come from the **integrations switchboard** (admin → Settings → Integrations)
for the market each address shows, so:

- each market website can have its own (or share) GTM container, Insider panel or
  Maps key — set in the admin, no deploy;
- switching an integration off for a market removes it from that market's website;
- the Tabby / Tamara promo shows only where the market's checkout offers it;
- a brand can never load another brand's tag (accounts belong to a brand).

The build check (`npm run check:brand`) refuses the old settings if a deployment
still sets them.

## How it works

```
Admin change (switchboard, market payment methods, brand kill switch)
   │  saved + history
   ▼
Backend ── POST {website}/api/site-config/revalidate   (signed, after the commit)
   │        body { hosts: [addresses of the brand] }
   ▼
Website: revalidateTag("site-integrations:<host>", { expire: 0 })
   │
   ▼
Next visit to that address: root layout → GET /storefront/site/integrations
   (x-storefront-host) → tags / promos / Maps for the address's market
```

| Piece | Where |
| --- | --- |
| Backend answer | `GET /storefront/site/integrations` — for the address's own market, else the market it shows by default (root domain): `analytics`, `insiderTag`, `paymentPromos.tabby / .tamara`, `googleMaps`. Only fields the catalogue marks public; unknown address = 404 |
| Loader (server) | `src/lib/site/siteIntegrations.ts` — `loadSiteIntegrations(host)`, `unstable_cache` per address, tag `site-integrations:<host>`, 5-minute fallback refresh; backend down = everything off for that render (never a default) |
| Validation | `parseSiteIntegrations` — each integration checked on its own (id formats); a malformed value is dropped, never rendered into a script tag |
| Client | `SiteIntegrationsProvider` / `useSiteIntegrations()` (`src/lib/site/SiteIntegrationsProvider.tsx`), given by the root layout through `AppProviders` |
| Refresh route | `src/app/api/site-config/revalidate/route.ts` — HMAC-SHA256 over `"<timestamp>.<body>"` with `SITE_REVALIDATE_SECRET` (`x-site-timestamp`, `x-site-signature: v1=<hex>`), ±5 minutes, constant-time compare; 401 bad / old signature, 503 not set up, 400 bad body |

### Which address

The tag uses the **registered** host the backend knows (`resolveStorefrontHost()`),
e.g. `sapil.test` for `sp.localhost:3045` locally — the same names the backend sends
in its refresh call (the address table).

### Settings

| Where | Setting |
| --- | --- |
| Website (server only) | `SITE_REVALIDATE_SECRET` — ≥ 32 characters, Key Vault `site-revalidate-secret` (the dev workflow sets it as a Container App secret when present) |
| Backend | `SITE_REVALIDATE_SECRET` (same value), `SITE_REVALIDATE_URLS` — comma-separated base URLs of the website deployments (one per brand), no path |

Without them the backend logs that refresh is off and websites pick changes up
within 5 minutes.

## Limits (known)

- **Several website instances:** Next's cache is per instance unless a shared cache
  handler is configured; the refresh call reaches one instance, the others catch up
  within 5 minutes. A shared cache handler (Redis) removes this.
- **GTM per market:** one container per brand still works — the page tells GTM which
  website / market it is (`dataLayer`), as before.
- **Consent:** loading of analytics / Insider is decided here by "on for the market";
  the visitor's consent (cookie banner, `feat/cookie-consent`) applies on top once
  that branch is merged — merge both conditions.

## Testing

`src/lib/site/siteIntegrations.spec.ts` (parsing, caching per address, the signed
route), `src/features/cart/components/CartTabbyPromo.spec.tsx`, `src/lib/insider.spec.ts`
(off when the tag did not render), `src/lib/brand/validate.spec.ts` (old settings refused).
