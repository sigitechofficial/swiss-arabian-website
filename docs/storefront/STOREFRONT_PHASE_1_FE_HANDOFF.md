# Storefront Phase 1 — FE handoff (short)

**Theme:** Customer auth foundation — register/login/refresh/logout, session bootstrap, optional verification + OAuth when flags are on.  
**Guide (send this to the agent):** [`STOREFRONT_FRONTEND_INTEGRATION_GUIDE_PHASE_1.md`](./STOREFRONT_FRONTEND_INTEGRATION_GUIDE_PHASE_1.md)  
**Inventory:** [`STOREFRONT_FRONTEND_SMOKE_TEST_PLAN.md`](./STOREFRONT_FRONTEND_SMOKE_TEST_PLAN.md) §2.1–2.2  
**Swagger:** `/api/docs` → Authorize with **`customer-bearer`**

---

## Prerequisite

- Backend up; `CUSTOMER_AUTH_ENABLED=true` + `CUSTOMER_JWT_SECRET` set
- UI screens exist — this phase is **API + session wiring**, not redesign
- Confirm whether staging has `CUSTOMER_VERIFICATION_ENABLED` / `CUSTOMER_OAUTH_ENABLED` before building those UIs as required

---

## Build order

| Wave | What |
|------|------|
| **1.0** | Envelope client, token store, single-flight refresh, env base URL |
| **1.1** | `register` · `login` · `refresh` · `logout` · `logout-all` · `GET /storefront/customer/me` |
| **1.2** | `GET/DELETE /storefront/customer/sessions*` |
| **1.3** | Email/phone verify · forgot/reset · otp/resend *(flag)* |
| **1.4** | Google / Apple / PKCE `oauth/*` *(flag)* — branch on `status` |
| **1.5** | `change-password` · `identities` · oauth link/unlink *(flag)* |

---

## One rule

**Small PRs. Auth only.** No account addresses, cart, checkout, catalog, or orders in Phase 1.

---

## Critical contract reminders

1. Unwrap envelope `data` — never use raw axios body as payload  
2. No global `/api/v1` — `POST /storefront/auth/login`  
3. Login field is `identifier` (email **or** `+`phone), not `email`  
4. Register needs `zoneCode` + (`email` **or** `phone`) + password ≥ 8  
5. Refresh **rotates** both tokens  
6. Reset/change password → all sessions dead → force login  
7. OAuth success may be `EMAIL_VERIFICATION_REQUIRED` without tokens  
8. Customer JWT only — never admin tokens on `/storefront/*`

---

## Deliverables

- Wired auth client + session bootstrap  
- Optional: `STOREFRONT_PHASE_1_INTEGRATION_STATUS.md` + `STOREFRONT_PHASE_1_SMOKE_RESULTS.md`

## Out of scope

`PATCH /storefront/customer/me` · addresses · phones · preferences · cart · checkout · orders · wishlist · reviews · support

## Next

After Phase 1 **PASS** → Phase 2 customer account (profile / addresses / phones / preferences) — guide TBD.
