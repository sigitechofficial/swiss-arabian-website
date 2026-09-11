# Storefront Phase 1 (+ catalog) — Smoke results

**Date:** 2026-08-10  
**Runner:** FE (PowerShell against Azure Dev)  
**API base:** `https://ca-swissarabian-backend-dev.greenbush-d5b07575.uaenorth.azurecontainerapps.io`  
**Note:** Official `STOREFRONT_FRONTEND_SMOKE_TEST_PLAN.md` was not in the FE repo; cases taken from Phase 1 guide §9 + collections guide.

## Summary

| PASS | FAIL | TOTAL |
|------|------|-------|
| 12 | 1 | 13 |

## Results

| Test | Pass | HTTP | Detail |
|------|------|------|--------|
| GET /storefront/catalog/collections | yes | 200 | items=109; requestId=`42177e1d-42fe-4727-add2-78b683229a08` |
| GET /storefront/catalog/collections/{slug} | yes | 200 | slug=`15yes`; requestId=`b99021d9-224c-4225-a1cf-8b48b57cdef7` |
| GET /storefront/catalog/collections/{slug}/products | yes | 200 | count=5; requestId=`5c9f8057-7ecc-414e-b34c-61a97fb2fa70` |
| GET /storefront/catalog/products | yes | 200 | sampleSlug=`BCED141201`; requestId=`1df5e214-785d-4e51-8df7-181133c7ea55` |
| GET /storefront/catalog/products/{slug} | yes | 200 | requestId=`93d1187d-bbe2-4c83-8318-88a999440cf4` |
| POST /storefront/auth/register | yes | 201 | zone=`uae` salesChannel=`platform_uae`; requestId=`3cb78485-804b-47fe-8d13-f81f3c5e852d` |
| POST /storefront/auth/login | yes | 200 | requestId=`5c616638-98d7-40ea-ae7d-b94a10b8dbf6` |
| GET /storefront/customer/me | yes | 200 | requestId=`592c7b13-79bf-4173-8f6f-8d8652668da3` |
| GET /storefront/customer/sessions | yes | 200 | count=2; requestId=`04e58028-d052-4e53-a7ad-bafd69a9e544` |
| POST /storefront/auth/refresh | yes | 200 | requestId=`5858b688-a3b3-403d-9821-b6058ec50d54` |
| POST /storefront/auth/forgot-password | **no** | **401** | Validation failed; requestId=`d19bbc73-535c-4042-a6c4-6ea815398e83` |
| POST /storefront/auth/logout | yes | 200 | requestId=`385909bb-0f94-413d-9f1c-c6e4cb4ce4e9` |
| GET /me after logout (expect 401) | yes | 401 | expected |

## Not smoked this run

- change-password (destructive on session)
- verify-phone / otp/resend (needs BE verification enabled + SMS)
- reset-password (blocked by forgot-password failure)
- OAuth (deferred)
- logout-all / revoke session by id
- UI browser walkthrough

## Backend follow-up

Confirm whether Azure Dev has password-reset / verification disabled (guide allows `401` when verification disabled). If enabled, investigate `forgot-password` 401 with the requestId above.
