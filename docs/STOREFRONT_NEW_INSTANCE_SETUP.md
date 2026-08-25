# Storefront instance notes

This v2 project is structured from `STOREFRONT_NEW_INSTANCE_SETUP.md`.

## Runtime

- Dev server: `npm run dev` → http://localhost:3000
- Env: `.env.local` (copy from `.env.example`)
- API resolution: `src/lib/config/env.ts`

## Architecture

```
src/app/**/page.tsx          thin pages only
src/features/<domain>/       UI, API, hooks, schemas, types
src/components/ui/           design system
src/lib/api/apiClient.ts     all HTTP
src/stores/                  auth / cart / UI only
```

Swagger is the source of truth: `{apiBaseUrl}/api/docs`.
