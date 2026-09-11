# New design site — Azure env + auth (give this to Claude)

Wire the **new design** UI to the **same Azure Dev backend**. Do not invent `/api/v1` paths. Swagger on the API host is source of truth.

**This file only:** env + auth. Catalog/cart/checkout later.

Reference implementation: `swiss-arabian-website` (`src/lib/api/apiClient.ts`, `src/features/auth/`, `src/lib/auth/token.ts`, `src/providers/AuthSessionProvider.tsx`).

---

## 1. Env (Azure Dev)

Copy `docs/storefront/new-design.env.example` → new repo `.env.local`.

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_USE_LOCAL_API` | `false` (Azure, not LAN) |
| `NEXT_PUBLIC_APP_ENV` | `dev` |
| `NEXT_PUBLIC_DEV_API_BASE_URL` | `https://ca-swissarabian-backend-dev.greenbush-d5b07575.uaenorth.azurecontainerapps.io` |
| `NEXT_PUBLIC_DEV_RETURN_URL` | new-design origin, e.g. `http://localhost:3000` |

Resolve `apiBaseUrl` = Azure URL when `USE_LOCAL_API` is not `true`. **No trailing slash.**

Catalog browse query (not auth body): `zoneCode=UAE&languageCode=en&currencyCode=AED`.

Auth register zone is **lowercase**: `uae` + `salesChannelCode` `platform_uae`.

---

## 2. Envelope (every JSON call)

```ts
{ success: boolean, data?: T, error?: unknown, meta?: { requestId?: string } }
```

- Use **`data` only**. Never treat the raw axios/fetch body as the payload.
- `success === false` or `!res.ok` → throw; show `error` message.
- Paths: `/storefront/...` on `apiBaseUrl`. **No** `/api/v1`.

---

## 3. Tokens

`localStorage`:

| Key | Value |
|------|--------|
| `sa_store_access_token` | Bearer access |
| `sa_store_refresh_token` | Refresh |

Protected calls: `Authorization: Bearer <access>`.

**Refresh (single-flight):** `POST /storefront/auth/refresh` `{ "refreshToken": "..." }` — skipAuth. On 401 of a protected call: refresh once, retry; if refresh fails → `endSession()` (clear tokens + auth state).

Do **not** send empty `email` / `phone` keys.

---

## 4. Session bootstrap (app mount)

1. No access and no refresh → guest, `bootstrapped = true`.
2. Refresh only → `POST /storefront/auth/refresh`, then `GET /storefront/customer/me`.
3. Access present → `GET /storefront/customer/me`.
4. Fail → `endSession()`, still `bootstrapped = true` (UI must not hang).

`GET /storefront/customer/me` — **Bearer required**.

Customer shape:

```ts
{
  id: string
  email: string | null
  phoneE164: string | null
  firstName: string | null
  lastName: string | null
  fullName: string | null
  zoneId: string | null
  isEmailVerified: boolean
}
```

---

## 5. Register

`POST /storefront/auth/register` — skipAuth

```json
{
  "zoneCode": "uae",
  "salesChannelCode": "platform_uae",
  "email": "user@example.com",
  "phone": "+9715xxxxxxxx",
  "password": "min 8 chars",
  "firstName": "Hamza",
  "lastName": "Iqbal",
  "marketingConsent": true,
  "smsConsent": false
}
```

Need **email or phone** (or both) + password ≥ 8. Phone E.164 (`+` + digits).

**Response `data`:** `{ token, customer }` — persist tokens, set user (same as login success).

---

## 6. Login

`POST /storefront/auth/login` — skipAuth

```json
{
  "identifier": "user@example.com",
  "password": "…"
}
```

`identifier` = email **or** E.164 phone. **Not** a field named `email`.

**HTTP 200 two shapes:**

A. `{ token, customer }` → save tokens, set user.

B. `{ "status": "EMAIL_VERIFICATION_REQUIRED", "email": "…" }` — **not an error**. Show verify UI; no tokens.

Optional passwordless:  
`POST /storefront/auth/login/email-code/request` `{ email }`  
`POST /storefront/auth/login/email-code/confirm` `{ email, code }` → `{ token, customer }`.

---

## 7. Logout

- `POST /storefront/auth/logout` — Bearer  
- `POST /storefront/auth/logout-all` — Bearer  
- Always clear local tokens even if the request fails.

---

## 8. Password / verify (flags)

| Flag | Default for new design |
|------|------------------------|
| `NEXT_PUBLIC_ENABLE_PASSWORD_RESET` | `true` |
| `NEXT_PUBLIC_CUSTOMER_VERIFICATION_UI` | `true` |
| `NEXT_PUBLIC_ENABLE_OAUTH` | `false` — do not wire Google/Apple |

| Method | Path | Body notes |
|--------|--------|------------|
| POST | `/storefront/auth/forgot-password` | skipAuth |
| POST | `/storefront/auth/reset-password` | skipAuth; after success all sessions dead → login |
| POST | `/storefront/auth/verify-email/request` | |
| POST | `/storefront/auth/verify-email/confirm` | |
| POST | `/storefront/auth/verify-phone/request` | |
| POST | `/storefront/auth/verify-phone/confirm` | |
| POST | `/storefront/auth/otp/resend` | |

Reset/change-password → force login.

---

## 9. Auth UI flow

```
Register → tokens + me
Login (password) → tokens + me  OR  EMAIL_VERIFICATION_REQUIRED
App load → bootstrap (refresh? → me)
Logout → logout API + clear storage
```

Keep existing design screens; replace mock submit with these APIs. No fake success if the API fails.

---

## 10. Claude — do this first

1. Add `.env.local` from `new-design.env.example` (`USE_LOCAL_API=false`).
2. `apiClient`: envelope unwrap + Bearer + single-flight refresh.
3. Token helpers (`sa_store_*`).
4. Register / login / logout / `me` + bootstrap provider.
5. Smoke: register or login against Azure Dev → `me` returns customer; refresh after access drop.

Swagger: `{API}/api/docs` — authorize **customer-bearer**.
