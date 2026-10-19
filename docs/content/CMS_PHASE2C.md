# CMS Phase 2C — Storefront Dynamic Homepage + Visual Preview

## Overview

The customer Homepage reads published CMS content from:

`GET /storefront/content/pages/home?zoneCode=&languageCode=`

Draft visual preview uses:

`GET /storefront/content/pages/home/preview` with header `X-Content-Preview-Token`

Admin never puts the preview token in a query string. Handoff:

1. Admin requests a preview token from the CMS Admin API.
2. Admin POSTs `{ token, zoneCode, languageCode }` to storefront `POST /api/cms/preview`.
3. Storefront sets HttpOnly cookie `sa_cms_preview` and redirects to `/preview/home`.
4. Preview page loads Draft via the backend preview endpoint (server-side, `cache: no-store`).
5. The same `CmsSectionList` / section registry renders published and preview.

## Environment

### Website (`swiss-arabian-website`)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_CMS_HOME_ENABLED` | Default `true`. Set `false` to force legacy hardcoded home. |
| `NEXT_PUBLIC_CMS_HOME_LEGACY_FALLBACK` | Default `true`. When CMS has no published page, keep legacy landing. Set `false` for empty/unavailable UI. |
| Existing API / storefront host vars | Unchanged — CMS uses the same `apiBaseUrl` + `X-Storefront-Host`. |

### Admin (`swiss-arabian-frontend-admin`)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_STOREFRONT_ORIGIN` | e.g. `http://localhost:3004` — visual preview handoff target. |

## Cache / revalidation

- Published home query: React Query `staleTime` 60s, refetch on window focus.
- Preview: `force-dynamic`, `no-store`, robots noindex.
- Markets are never shared in the query key (`zoneCode` + `languageCode`).

## Rollback

1. Set `NEXT_PUBLIC_CMS_HOME_ENABLED=false` and redeploy website → legacy Homepage.
2. Or leave CMS enabled with legacy fallback until markets are published.

## Deployment order

1. Backend CMS Phase 1/2A already live.
2. Deploy website (Phase 2C renderer + preview routes).
3. Deploy admin (visual preview handoff).
4. Publish Homepage variants per Brand/Zone/Locale from Admin.

## Non-goals (still future)

Landing/Content pages, scheduling, media library, analytics-based trending, section impression analytics.
