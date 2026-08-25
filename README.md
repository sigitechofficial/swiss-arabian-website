# Swiss Arabian storefront (v2)

Next.js 16 App Router storefront structured as a new instance of the Swiss Arabian architecture.

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

The app runs on [http://localhost:3000](http://localhost:3000) against the Azure Dev backend by default.

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
