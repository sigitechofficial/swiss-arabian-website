# Swiss Arabian storefront (v2)

Next.js 16 App Router storefront structured as a new instance of the Swiss Arabian architecture.

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

The app runs on [http://localhost:3004](http://localhost:3004) against the backend in `API_BASE_URL`
(`http://127.0.0.1:3000`, a local backend, in `.env.example`).

### Local addresses (why a page says "Not found")

The website only shows addresses the backend knows (`GET /storefront/site` with `x-storefront-host`, answered
from the backend's address table, Admin → Brands → Domains). `localhost` is not such an address, so locally the
website stands it in for a registered one, from `.env.local` (local only — any other `APP_ENV` refuses these):

| Setting | Example | Meaning |
|---|---|---|
| `STOREFRONT_HOST` | `uae.swissarabian.com` | The shop a plain `http://localhost:3004` stands for |
| `LOCAL_STOREFRONTS` | `sa=SWISS_ARABIAN@uae.swissarabian.com,sp=SAPIL@sapil.test` | `http://sp.localhost:3004` stands for `sapil.test`, and so on |

Each host must be an **active domain of an active brand** in the backend, or the page is "Not found" (the answer is
cached for 60 s). On a fresh backend database the migrations create Swiss Arabian's domains
(`uae.swissarabian.com`, …); Sapil starts inactive with no domain — activate it and add `sapil.test` in the admin
(backend README, "Fresh environment").

One server shows one brand's design (`NEXT_PUBLIC_STOREFRONT_BRAND_CODE`, read when the server starts). For Sapil,
run a second server with `NEXT_PUBLIC_STOREFRONT_BRAND_CODE=SAPIL` and `STOREFRONT_HOST=sapil.test` on another port.

## Architecture

- `src/app/**/page.tsx` — thin pages only
- `src/features/<domain>/` — UI, API services, React Query hooks, Zod schemas
- `src/components/ui/` — design system, no domain logic
- `src/lib/api/apiClient.ts` — all HTTP calls
- `src/lib/config/env.ts` — all environment access
- Zustand for auth / cart / UI only — never API cache

See `docs/STOREFRONT_NEW_INSTANCE_SETUP.md` in the source storefront for the full setup guide.

## Quality

```bash
npm run quality
```
