# Storefront Phase 1 — Integration status

Updated: 2026-08-03  
Guide: [`STOREFRONT_FRONTEND_INTEGRATION_GUIDE_PHASE_1.md`](./STOREFRONT_FRONTEND_INTEGRATION_GUIDE_PHASE_1.md)

| Wave | Theme | Status |
|------|--------|--------|
| **1.0** | Envelope client, token store, single-flight refresh, env base URL | **DONE** |
| **1.1** | register · login · refresh · logout · logout-all · `GET /storefront/customer/me` | **DONE** |
| **1.2** | sessions list + revoke | **DONE** (`/account/security`) |
| **1.3** | verify · forgot/reset · otp/resend | **DONE** (UI gated by flags) |
| **1.4** | OAuth Google/Apple/PKCE | **DEFERRED** (`NEXT_PUBLIC_ENABLE_OAUTH=false`) |
| **1.5** | change-password · identities · oauth link/unlink | **PARTIAL** (change-password done; identities/OAuth deferred) |

## Contract alignment

- Paths under `/storefront/auth/*` and `/storefront/customer/*` (no `/api/v1`, no `/store/auth`)
- Login body uses `identifier`
- Register sends `zoneCode` + email + phone + password ≥ 8
- Auth result unwraps `token` + `customer`
- Refresh rotates both tokens (single-flight)
- App-wide `AuthSessionProvider` bootstraps `me` on load
- Reset / change-password clear local session and force login

## Feature flags (FE)

| Env | Mirrors |
|-----|---------|
| `NEXT_PUBLIC_CUSTOMER_VERIFICATION_UI` | BE `CUSTOMER_VERIFICATION_ENABLED` |
| `NEXT_PUBLIC_ENABLE_PASSWORD_RESET` | verification/forgot/reset availability |
| `NEXT_PUBLIC_ENABLE_OAUTH` | social login (not wired yet) |

## Key files

- `src/features/auth/api/auth.service.ts`
- `src/features/auth/lib/applyAuthSession.ts`
- `src/providers/AuthSessionProvider.tsx`
- `src/lib/api/apiClient.ts`
- `src/features/account/components/AccountSecurityPageView.tsx`
