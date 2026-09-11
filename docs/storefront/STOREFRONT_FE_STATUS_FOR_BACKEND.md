# Storefront FE → Backend status

**Date:** 2026-08-10  
**Env smoked:** Azure Dev  
`https://ca-swissarabian-backend-dev.greenbush-d5b07575.uaenorth.azurecontainerapps.io`  
**Context:** `zoneCode=UAE&languageCode=en&currencyCode=AED`  
**Audience:** Backend team — what FE has done vs your docs, plus live smoke results.

---

## 1. Documents you shared — brief status

| Document | Purpose | FE status |
|----------|---------|-----------|
| `STOREFRONT_FRONTEND_INTEGRATION_GUIDE_PHASE_1.md` | Phase 1 auth contract | **Implemented** — envelope client, tokens, refresh, register/login/logout, me, sessions, change-password, flag-gated verify/forgot/reset |
| `STOREFRONT_PHASE_1_FE_HANDOFF.md` | Short build order | **Followed** — Waves 1.0–1.3 done; 1.4 OAuth deferred; 1.5 change-password done, identities/OAuth deferred |
| `STOREFRONT_PHASE_1_INTEGRATION_STATUS.md` | Wave tracker | **Up to date** (1.0–1.3 DONE, 1.4 DEFERRED, 1.5 PARTIAL) |
| `STOREFRONT_FRONTEND_SMOKE_TEST_PLAN.md` | Smoke inventory | **Missing in FE repo** (referenced by handoff/guide but file not present). Smoke below ran from Phase 1 §9 checklist + collections guide |
| `COLLECTIONS_AND_PRODUCTS_GUIDE.md` | Catalog / collections / PDP | **Wired** — collections list/detail, products grid, PDP `/products/{slug}`, public (no login) |
| `STOREFRONT_ACCOUNT_UI_API_MAP.md` | Figma account UI ↔ API | **Written by FE** — live vs mock/pending per screen |

---

## 2. What is DONE on FE

### Phase 1 — Auth (API wired)
- Envelope unwrap (`success` / `data` / `error` / `meta.requestId`)
- No `/api/v1` prefix — paths under `/storefront/...`
- Register: `zoneCode` lowercase (`uae`) + `salesChannelCode` `platform_uae` + email + phone + password ≥ 8
- Login: `identifier` (email or E.164 phone)
- Token store + Bearer on protected calls
- Single-flight refresh on 401; refresh rotation
- `GET /storefront/customer/me` hydrates account
- Sessions list + revoke UI (`/account/security`)
- Logout / logout-all clear local state
- Change-password → clear session → login
- Verify / forgot / reset UI present; gated by FE flags (`NEXT_PUBLIC_CUSTOMER_VERIFICATION_UI`, `NEXT_PUBLIC_ENABLE_PASSWORD_RESET`)
- OAuth **not** wired (`NEXT_PUBLIC_ENABLE_OAUTH=false`)

### Catalog / PDP (public)
- Collections + products APIs consumed
- Public PDP at `/products/{slug}` (slug = API `product.slug`; FE also resolves SKU as fallback)
- Title, price, image, availability visible **without login**
- Collection routes = browse only (not Merchant product landing links)

### Account UI (Figma)
- Auth screens, dashboard, purchase history, profile, my subscription, payments — **UI built**
- Live where Phase 1 APIs exist (`me`, auth, change-password)
- Orders / subscription / payments / addresses — **UI + mocks**; waiting on later phase APIs (honest “coming soon”, no fake success)

---

## 3. Live smoke results (2026-08-10)

**Score: 12 PASS / 1 FAIL / 13 total**

| # | Endpoint | Result | HTTP | Notes / `requestId` |
|---|----------|--------|------|---------------------|
| 1 | `GET /storefront/catalog/collections` | **PASS** | 200 | 109 items · `42177e1d-42fe-4727-add2-78b683229a08` |
| 2 | `GET /storefront/catalog/collections/{slug}` | **PASS** | 200 | slug=`15yes` · `b99021d9-224c-4225-a1cf-8b48b57cdef7` |
| 3 | `GET /storefront/catalog/collections/{slug}/products` | **PASS** | 200 | 5 products · `5c9f8057-7ecc-414e-b34c-61a97fb2fa70` |
| 4 | `GET /storefront/catalog/products` | **PASS** | 200 | sampleSlug=`BCED141201` · `1df5e214-785d-4e51-8df7-181133c7ea55` |
| 5 | `GET /storefront/catalog/products/{slug}` | **PASS** | 200 | `93d1187d-bbe2-4c83-8318-88a999440cf4` |
| 6 | `POST /storefront/auth/register` | **PASS** | 201 | `zoneCode=uae`, `salesChannelCode=platform_uae` · `3cb78485-804b-47fe-8d13-f81f3c5e852d` |
| 7 | `POST /storefront/auth/login` | **PASS** | 200 | `5c616638-98d7-40ea-ae7d-b94a10b8dbf6` |
| 8 | `GET /storefront/customer/me` | **PASS** | 200 | `592c7b13-79bf-4173-8f6f-8d8652668da3` |
| 9 | `GET /storefront/customer/sessions` | **PASS** | 200 | 2 sessions · `04e58028-d052-4e53-a7ad-bafd69a9e544` |
| 10 | `POST /storefront/auth/refresh` | **PASS** | 200 | `5858b688-a3b3-403d-9821-b6058ec50d54` |
| 11 | `POST /storefront/auth/forgot-password` | **FAIL** | **401** | `Validation failed` · `d19bbc73-535c-4042-a6c4-6ea815398e83` |
| 12 | `POST /storefront/auth/logout` | **PASS** | 200 | `385909bb-0f94-413d-9f1c-c6e4cb4ce4e9` |
| 13 | `GET /me` after logout | **PASS** | 401 | Expected unauthorized |

Register body used by FE (and smoke):

```json
{
  "zoneCode": "uae",
  "salesChannelCode": "platform_uae",
  "email": "…",
  "phone": "+971…",
  "password": "…",
  "firstName": "…",
  "lastName": "…"
}
```

---

## 4. Ask backend — open items

1. **`forgot-password` → HTTP 401 `Validation failed`**  
   Guide says public + neutral success; also notes `401` when verification disabled.  
   Please confirm: is `CUSTOMER_VERIFICATION_ENABLED` / password-reset flag **off** on Azure Dev? If yes, FE will keep reset UI gated / show disabled state. If it should work, please fix or share correct contract.

2. **Please add / share `STOREFRONT_FRONTEND_SMOKE_TEST_PLAN.md`** in the handoff pack (referenced but missing on FE).

3. **Phase 2+ APIs still needed for live account UI** (UI already built with mocks):
   - `PATCH /storefront/customer/me`
   - Addresses / phones / preferences
   - Orders list + detail
   - Payments / saved cards / transactions
   - Subscriptions

4. **Google Merchant / DataFeedWatch product feed**  
   FE confirms public PDP pattern `/products/{slug}` (no login).  
   Feed generation stays on NestJS admin jobs — please confirm production storefront base URL for Merchant domain claim when ready.

5. **OAuth** — FE deferred until `CUSTOMER_OAUTH_ENABLED` + FE flag on.

---

## 5. FE flags (local `.env.local` at smoke time)

| Flag | Value | Notes |
|------|-------|--------|
| `NEXT_PUBLIC_USE_LOCAL_API` | `false` | Hitting Azure Dev |
| `NEXT_PUBLIC_CUSTOMER_VERIFICATION_UI` | `true` | OTP UI chrome on; BE must also enable for SMS/OTP to work |
| `NEXT_PUBLIC_ENABLE_PASSWORD_RESET` | `true` | UI on; **BE forgot-password currently 401** |
| `NEXT_PUBLIC_ENABLE_OAUTH` | `false` | Deferred |

---

## 6. One-liner for Slack

> Phase 1 auth + catalog are wired and smoke-tested on Azure Dev: **12/13 PASS**. Register/login/me/sessions/refresh/logout + collections/products/PDP all green. **Only fail:** `POST /storefront/auth/forgot-password` → **401 Validation failed** (`requestId=d19bbc73-535c-4042-a6c4-6ea815398e83`) — please confirm if verification/reset is disabled on Dev or if contract changed. Account Figma UI is built; orders/payments/subscription/addresses still waiting on later phase APIs. Missing file on FE: `STOREFRONT_FRONTEND_SMOKE_TEST_PLAN.md`.

---

*Companion files:* `STOREFRONT_PHASE_1_INTEGRATION_STATUS.md`, `STOREFRONT_ACCOUNT_UI_API_MAP.md`, `COLLECTIONS_AND_PRODUCTS_GUIDE.md`
