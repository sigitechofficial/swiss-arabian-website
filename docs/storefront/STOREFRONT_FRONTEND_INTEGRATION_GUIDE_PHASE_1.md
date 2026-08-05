# Swiss Arabian — Storefront Customer Frontend Integration Guide (Phase 1)

> **Audience:** Customer storefront frontend developer + their Cursor/AI coding agent.  
> **Purpose:** Everything needed to wire **customer auth** against the NestJS SAPG/SIGI backend — envelope, errors, session/refresh, feature flags, per-endpoint flows with demo payloads/responses/errors, and a drop-in API client.  
> **Source of truth:** running backend + Swagger at `/api/docs`. This guide is derived from backend code; where a field is not listed here, **treat Swagger as authoritative** — never invent fields.  
> **Scope (Phase 1):** `/storefront/auth/*` + auth-owned `/storefront/customer/*` (profile read, sessions, change-password, linked identities).  
> **Out of scope (later phases):** account profile PATCH / addresses / phones / preferences, catalog, cart, checkout, orders, wishlist, reviews, support.  
> **Companion inventory:** [`STOREFRONT_FRONTEND_SMOKE_TEST_PLAN.md`](./STOREFRONT_FRONTEND_SMOKE_TEST_PLAN.md).  
> **Short agent handoff:** [`STOREFRONT_PHASE_1_FE_HANDOFF.md`](./STOREFRONT_PHASE_1_FE_HANDOFF.md).  
> **UI note:** Screens may already exist — Phase 1 is **API integration + session wiring**, not a redesign.

---

## 0. How to use this document (read first)

Keep this file in the frontend repo (e.g. `docs/backend/STOREFRONT_AUTH_PHASE_1.md`) and attach it to the Cursor agent when generating clients, hooks, or auth screens.

### 0.1 Golden rules for the agent

1. Every backend JSON response is an **envelope** — never treat the axios body as the business payload. Unwrap `response.data.data`.
2. There is **no** global `/api/v1` prefix. Routes are absolute: `POST /storefront/auth/login`. Base URL only from env (`VITE_API_BASE_URL` or equivalent).
3. Customer JWT: `Authorization: Bearer <accessToken>`. Claims include `typ: "customer"`. **Never** send admin tokens to `/storefront/*` or customer tokens to `/admin/*`.
4. Handle `401` (refresh once → login), `422` (business rules), `429` (rate limit + `Retry-After`), and envelope `error.code` via **one** interceptor.
5. Password min length on register / reset / change is **8** (max 128). Login identifier is **email or phone** (`identifier` field — not `email`).
6. Register requires **`zoneCode`** and at least one of **`email`** or **`phone`**.
7. Verification + OAuth routes are **feature-flagged**. If the flag is off, expect `401`. Do not build those UIs as hard blockers for MVP login if staging flags are off.
8. Request/forgot/resend verification endpoints return a **neutral** success message even when the account does not exist (anti-enumeration). Do not show “email not found”.
9. After `reset-password` or `change-password`, **all sessions are revoked** — clear local tokens and force re-login.
10. Do not invent `customerId` ownership proofs on authenticated routes — JWT is the sole proof. Never send admin API keys.

### 0.2 Phase 1 waves (build in order)

| Wave | Theme | Ship when |
|------|--------|-----------|
| **1.0** | Foundation — env, envelope unwrap, `StorefrontApiError`, token store, axios client + single-flight refresh | Client compiles; health + one public call works |
| **1.1** | Core auth — register, login, refresh, logout, logout-all, `GET /customer/me` | User can register/login, stay logged in across reloads, logout |
| **1.2** | Sessions — list + revoke | Account security / devices screen |
| **1.3** | Verification + password recovery | Only if `CUSTOMER_VERIFICATION_ENABLED=true` |
| **1.4** | Social login (Google / Apple / PKCE code) | Only if `CUSTOMER_OAUTH_ENABLED=true` |
| **1.5** | Link/unlink identities + change-password | Account settings polish |

**Stop rule:** Do not pull cart merge UX, account address book, or checkout into Phase 1. `guestToken` on login/OAuth is accepted by the API but merge is best-effort / deferred — pass it if you already have a guest cart token; do not block login on merge.

---

## 1. Environment, base URL, and Swagger

| Item | Value |
|------|-------|
| Protocol | HTTP(S) — REST + JSON |
| Local base URL | `http://localhost:3000` (default `PORT=3000`) |
| **Global route prefix** | **None.** e.g. `POST /storefront/auth/login` |
| Swagger UI | `GET /api/docs` |
| OpenAPI JSON | `GET /api/docs-json` |
| Health | `GET /health` |
| Content type | `application/json` |
| Auth header | `Authorization: Bearer <customer access JWT>` |
| Swagger scheme | `customer-bearer` (Authorize → paste access token **without** `Bearer `) |

**Recommended frontend env vars:**

```bash
VITE_API_BASE_URL=http://localhost:3000
# Feature awareness (mirror backend flags for UI gating — do not invent backend behavior)
VITE_CUSTOMER_VERIFICATION_UI=false   # set true only when BE CUSTOMER_VERIFICATION_ENABLED=true
VITE_CUSTOMER_OAUTH_UI=false          # set true only when BE CUSTOMER_OAUTH_ENABLED=true
```

### 1.1 Backend feature flags (must match staging)

| Flag | Default (example) | Effect when `false` |
|------|-------------------|---------------------|
| `CUSTOMER_AUTH_ENABLED` | `true` (local) | register / login / refresh / JWT guards → `401` “Customer authentication is disabled” |
| `CUSTOMER_VERIFICATION_ENABLED` | often `false` | verify / forgot / reset / otp / change-password → `401` “Customer verification is disabled” |
| `CUSTOMER_OAUTH_ENABLED` | often `false` | google / apple / code / link / unlink / identities → `401` “Customer social login is disabled” |

Also used by auth (do not hardcode TTLs — read from responses):

| Env | Typical |
|-----|---------|
| `CUSTOMER_ACCESS_TOKEN_TTL_SEC` | `900` (15 min) |
| `CUSTOMER_REFRESH_TOKEN_TTL_SEC` | `2592000` (30 days) |
| `CUSTOMER_JWT_ISSUER` | `sa-storefront` |

### 1.2 Swagger tags for Phase 1

- **Storefront — Auth**
- **Storefront — Verification**
- **Storefront — Social Login**
- **Storefront — Customer** (IAM: `me`, sessions, change-password, identities)

---

## 2. The response envelope (every endpoint)

Controllers return **data only**; a global interceptor wraps every response.

```ts
interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  code: string;              // 'SUCCESS' or machine error code
  message: string;
  data: T | null;
  error: ApiError | null;
  errors: ApiFieldError[];   // field validation ([] when none)
  meta: {
    timestamp: string;
    path: string;
    requestId: string;       // always log on errors
    pagination?: PaginationMeta;
  };
}

interface ApiError {
  type: string;   // e.g. 'AUTHENTICATION_ERROR' | 'BUSINESS_RULE_ERROR'
  code: string;   // e.g. 'UNAUTHORIZED' | 'BUSINESS_RULE_FAILED'
  message: string;
  source: string; // 'PLATFORM' | 'VALIDATION' | ...
}
```

### Success example

```json
{
  "success": true,
  "statusCode": 200,
  "code": "SUCCESS",
  "message": "Success",
  "data": { "id": "cust_…", "email": "customer@example.com" },
  "error": null,
  "errors": [],
  "meta": {
    "timestamp": "2026-08-03T10:00:00.000Z",
    "path": "/storefront/customer/me",
    "requestId": "b7c1f0e2-9a34-4b2a-9c11-1f2e3d4c5b6a"
  }
}
```

### Validation error example

```json
{
  "success": false,
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "data": null,
  "error": {
    "type": "VALIDATION_ERROR",
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "source": "VALIDATION"
  },
  "errors": [
    { "field": "password", "code": "minLength", "message": "password must be longer than or equal to 8 characters" }
  ],
  "meta": {
    "timestamp": "2026-08-03T10:01:00.000Z",
    "path": "/storefront/auth/register",
    "requestId": "…"
  }
}
```

**Frontend rules:**

- Business payload = envelope `data`.
- Logic branching = `error.code` / HTTP status; form fields = `errors[]`; toast fallback = `message`.
- Always capture `meta.requestId` for support.

---

## 3. Error handling guide

### 3.1 Types → HTTP → UX

| `error.type` | HTTP | UX |
|--------------|------|-----|
| `VALIDATION_ERROR` | 400 | Map `errors[]` to form fields |
| `AUTHENTICATION_ERROR` | 401 | Refresh once, else login; bad credentials message |
| `AUTHORIZATION_ERROR` | 403 | Access denied (rare on pure auth; common later on ownership) |
| `NOT_FOUND_ERROR` | 404 | Not found empty state |
| `BUSINESS_RULE_ERROR` | 422 | Show `message` (OTP invalid, zone required, unlink blocked, …) |
| `RATE_LIMIT_ERROR` | 429 | Disable submit; honor `Retry-After` |
| `INTERNAL_ERROR` / others | 5xx | Generic toast + `requestId` |

### 3.2 Codes you will see in Phase 1

| `code` | When |
|--------|------|
| `VALIDATION_ERROR` | DTO validation |
| `UNAUTHORIZED` | Bad/missing JWT, bad credentials, locked account, auth/verification/oauth disabled, bad refresh |
| `RESOURCE_NOT_FOUND` | Session / identity not found |
| `BUSINESS_RULE_FAILED` | Domain rule (missing email+phone, OTP invalid, OAuth zone required, unlink only method, …) |
| `RATE_LIMITED` | Auth / OTP throttle |

### 3.3 Client matrix

| Situation | Detect | Action |
|-----------|--------|--------|
| Access expired | `401` on protected route | One silent `POST /storefront/auth/refresh`; retry; else clear → login |
| Bad login | `401` on login | “Invalid email/phone or password” (generic) |
| Account locked | `401` message contains locked | Show locked / contact support |
| OTP / business | `422` | Show `message` |
| Rate limit | `429` | Cooldown from `Retry-After` |
| Validation | `400` + `errors[]` | Inline fields |

---

## 4. Authentication & session model

### 4.1 Token shape

```ts
interface IssuedCustomerToken {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;        // seconds — schedule from this
  sessionId: string;
  refreshToken: string;     // opaque; returned once per rotation
  refreshExpiresIn: number; // seconds
}

interface CustomerProfileView {
  id: string;
  email: string | null;
  phoneE164: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  zoneId: string | null;
  isEmailVerified: boolean;
}

interface AuthResult {
  token: IssuedCustomerToken;
  customer: CustomerProfileView;
}
```

Access JWT claims (informative): `sub` = customerId, `typ` = `"customer"`, `sid` = sessionId, `iss` = configured issuer.

### 4.2 Storage recommendation

| Token | Recommendation |
|-------|----------------|
| Access | Memory (+ optional `sessionStorage` for reload) |
| Refresh | Most protected store available; SPA pragmatic default = `localStorage` / `sessionStorage` — document XSS trade-off |
| Clear | On logout, logout-all, failed refresh, password reset/change |

### 4.3 Refresh rules

1. Proactive (before `expiresIn`) **or** reactive on first `401`.
2. `POST /storefront/auth/refresh` `{ refreshToken }` → **rotated** `token` — replace **both** access and refresh.
3. Single-flight: concurrent 401s share one refresh.
4. Refresh `401` → clear → login.

### 4.4 Guest vs logged-in (Phase 1 impact)

- Phase 1 auth screens are public except logout / sessions / me / link / change-password.
- Later commerce routes use optional JWT or guest tokens — **do not** invent guest checkout here.
- Optional `guestToken` on login / OAuth: pass through if present; do not fail the UI if merge is a no-op.

---

## 5. Foundational FE instructions (wire before screens)

UI may already exist. Implement these **before** polishing screens:

1. **Single API module** — base URL from env, envelope unwrap helpers (`apiGet` / `apiPost` / `apiDelete`).
2. **Token store** — get/set/clear access + refresh; expose `isAuthenticated`.
3. **Auth interceptor** — attach Bearer; on 401 refresh once (skip `/storefront/auth/login|register|refresh|…` public auth paths).
4. **Session bootstrap on app load** — if refresh present → refresh or use access → `GET /storefront/customer/me` → hydrate profile.
5. **Route guards** — public auth routes vs protected account routes; `returnTo` query after login.
6. **Forms** — Zod/RHF schemas matching DTO rules below; map `errors[].field`.
7. **i18n** — show backend `message` as fallback; prefer FE copy keyed by `error.code` where you care.
8. **Market context** — registration needs a real `zoneCode` from storefront config (e.g. `UAE`). Do not hardcode production-only assumptions beyond what config provides.
9. **Observability** — log `meta.requestId` on every failed auth call.

---

## 6. User flows → API impact

### Flow A — Register → session

```
UI: Register form
 → POST /storefront/auth/register
 → store token + customer
 → optional: navigate to verify-email UI (Wave 1.3) if product requires
 → GET /storefront/customer/me (optional hydrate)
```

**Impact:** Creates customer + credential + session. Returns tokens immediately (verification is **non-blocking** — login works even if email unverified).

### Flow B — Login → session

```
UI: Login (identifier = email or +E.164 phone)
 → POST /storefront/auth/login
 → store token + customer
 → optional guestToken from cart cookie
```

### Flow C — App reload / silent refresh

```
Has refreshToken?
 → POST /storefront/auth/refresh
 → replace tokens
 → GET /storefront/customer/me
Else → treat as guest / show login
```

### Flow D — Logout current device

```
POST /storefront/auth/logout  (Bearer)
 → clear local tokens
```

### Flow E — Logout all devices

```
POST /storefront/auth/logout-all  (Bearer)
 → clear local tokens
 → data.revokedCount
```

### Flow F — Forgot / reset password

```
POST /storefront/auth/forgot-password { identifier }
 → always neutral success UI (“If the account exists…”)
 → user enters OTP + new password
 → POST /storefront/auth/reset-password
 → ALL sessions revoked → force login
```

### Flow G — Verify email / phone

```
request → confirm (or otp/resend)
 → confirm returns { success: true }
 → refresh profile (isEmailVerified / phone verified state)
```

### Flow H — Social login

```
Client obtains Google/Apple ID token (or auth code + PKCE)
 → POST /storefront/auth/oauth/google|apple|code
 → status AUTHENTICATED → same as login (token + customer)
 → status EMAIL_VERIFICATION_REQUIRED → show OTP verify for that email, then retry social or continue product flow
 → new account without zoneCode → 422 (must send zoneCode)
```

### Flow I — Change password (logged in)

```
POST /storefront/customer/change-password
 → success → all sessions revoked → clear tokens → login
```

### Flow J — Manage sessions / identities

```
GET /storefront/customer/sessions
DELETE /storefront/customer/sessions/:id
GET /storefront/customer/identities
POST /storefront/auth/oauth/link
DELETE /storefront/auth/oauth/:provider   (GOOGLE | APPLE | …)
```

---

## 7. Endpoint catalog — payloads, responses, errors

> All paths below are relative to `VITE_API_BASE_URL`.  
> Success bodies shown are the **envelope `data`** value unless noted.

---

### 7.1 `POST /storefront/auth/register` — Public (rate limited: sensitive)

**Auth:** none  
**Wave:** 1.1

**Request**

```json
{
  "zoneCode": "UAE",
  "salesChannelCode": "WEB",
  "email": "fatima@example.com",
  "phone": "+971501234567",
  "password": "SecurePass1",
  "firstName": "Fatima",
  "lastName": "Al-Rashid",
  "address": {
    "address1": "Sheikh Zayed Rd",
    "city": "Dubai",
    "countryCode": "AE"
  },
  "acquisition": {
    "source": "google",
    "medium": "cpc",
    "campaign": "brand"
  },
  "visitorId": "550e8400-e29b-41d4-a716-446655440000",
  "behaviorSessionId": "550e8400-e29b-41d4-a716-446655440001",
  "behaviorConsentStatus": "GRANTED"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `zoneCode` | **Yes** | Market/zone code from storefront config |
| `email` **or** `phone` | **One required** | Both allowed |
| `password` | **Yes** | 8–128 chars |
| `salesChannelCode` | No | Channel hint |
| `firstName` / `lastName` / `address` | No | |
| `acquisition` / visitor / behavior* | No | Analytics; safe to omit in Phase 1 |

**Success `data`:** `AuthResult` (`token` + `customer`) — typically HTTP **201** (Nest default for POST without `@HttpCode`).

**Errors**

| HTTP | When |
|------|------|
| 400 | Validation (password length, email format, …) |
| 401 | `CUSTOMER_AUTH_ENABLED` false |
| 422 | Neither email nor phone; zone/business registration failures |
| 429 | Rate limited |

---

### 7.2 `POST /storefront/auth/login` — Public (rate limited: login)

**Auth:** none · **HTTP 200** · **Wave:** 1.1

**Request**

```json
{
  "identifier": "fatima@example.com",
  "password": "SecurePass1",
  "guestToken": "optional-guest-cart-token"
}
```

Phone login example: `"identifier": "+971501234567"` (must start with `+` for phone path).

**Success `data`:** `AuthResult`

**Errors**

| HTTP | Message / when |
|------|----------------|
| 400 | Validation |
| 401 | Invalid credentials (generic — no enumeration) |
| 401 | Account is locked |
| 401 | Auth disabled |
| 429 | Rate limited |

---

### 7.3 `POST /storefront/auth/refresh` — Public (rate limited: sensitive)

**Auth:** none · **HTTP 200** · **Wave:** 1.0 / 1.1

**Request**

```json
{ "refreshToken": "opaque_refresh_token_value" }
```

**Success `data`**

```json
{
  "token": {
    "accessToken": "eyJ…",
    "tokenType": "Bearer",
    "expiresIn": 900,
    "sessionId": "sess_…",
    "refreshToken": "new_opaque_refresh",
    "refreshExpiresIn": 2592000
  }
}
```

**Errors:** `401` invalid/expired refresh; `429` throttle.

---

### 7.4 `POST /storefront/auth/logout` — Strict JWT

**Auth:** Bearer · **HTTP 200** · **Wave:** 1.1

**Request:** empty body  
**Success `data`:** `{ "success": true }`  
**Errors:** `401` missing/invalid/expired session

---

### 7.5 `POST /storefront/auth/logout-all` — Strict JWT

**Auth:** Bearer · **HTTP 200** · **Wave:** 1.1

**Success `data`:** `{ "revokedCount": 3 }`

---

### 7.6 Email verification — Public (OTP throttle)

**Flag:** `CUSTOMER_VERIFICATION_ENABLED=true` · **Wave:** 1.3

#### `POST /storefront/auth/verify-email/request`

```json
{ "email": "fatima@example.com" }
```

**Success `data` (always neutral if enabled):**

```json
{
  "success": true,
  "message": "If the account exists, a verification code has been sent."
}
```

#### `POST /storefront/auth/verify-email/confirm`

```json
{ "email": "fatima@example.com", "code": "123456" }
```

**Success `data`:** `{ "success": true }`  
**Errors:** `422` invalid/expired code; `401` verification disabled; `429`

---

### 7.7 Phone verification — Public (OTP throttle)

#### `POST /storefront/auth/verify-phone/request`

```json
{ "phone": "+971501234567" }
```

Neutral success (same message shape as email request).

#### `POST /storefront/auth/verify-phone/confirm`

```json
{ "phone": "+971501234567", "code": "123456" }
```

**Success `data`:** `{ "success": true }`

---

### 7.8 Forgot / reset password — Public (OTP throttle)

#### `POST /storefront/auth/forgot-password`

```json
{ "identifier": "fatima@example.com" }
```

Neutral success (anti-enumeration).

#### `POST /storefront/auth/reset-password`

```json
{
  "identifier": "fatima@example.com",
  "code": "123456",
  "newPassword": "NewSecurePass1"
}
```

**Success `data`:** `{ "success": true }`  
**Side effect:** **all sessions revoked** — FE must clear tokens and send user to login.  
**Errors:** `422` invalid/expired code; `400` password length; `401` verification disabled

---

### 7.9 `POST /storefront/auth/otp/resend` — Public (OTP throttle)

```json
{
  "identifier": "fatima@example.com",
  "purpose": "VERIFY_EMAIL"
}
```

`purpose`: `VERIFY_EMAIL` | `VERIFY_PHONE` | `RESET_PASSWORD`  
**Success:** same neutral message.  
**Errors:** `422` too many verification requests / hour; `429` guard throttle

---

### 7.10 OAuth — Public / JWT (social)

**Flag:** `CUSTOMER_OAUTH_ENABLED=true` · **Wave:** 1.4 / 1.5  
**Providers enum:** `GOOGLE` | `APPLE` | `MICROSOFT` (FE should only enable providers configured in BE)

#### `POST /storefront/auth/oauth/google`

```json
{
  "idToken": "<google-id-token-jwt>",
  "nonce": "optional-nonce",
  "guestToken": "optional",
  "zoneCode": "UAE",
  "salesChannelCode": "WEB"
}
```

`zoneCode` **required only when creating a new account**.

#### `POST /storefront/auth/oauth/apple`

Same shape with Apple `idToken`.

#### `POST /storefront/auth/oauth/code` (PKCE)

```json
{
  "provider": "GOOGLE",
  "code": "auth_code",
  "codeVerifier": "pkce_verifier",
  "redirectUri": "https://store.example/oauth/callback",
  "nonce": "optional",
  "zoneCode": "UAE"
}
```

**Success `data` — authenticated**

```json
{
  "status": "AUTHENTICATED",
  "token": { "accessToken": "…", "tokenType": "Bearer", "expiresIn": 900, "sessionId": "…", "refreshToken": "…", "refreshExpiresIn": 2592000 },
  "customer": { "id": "cust_…", "email": "…", "phoneE164": null, "firstName": "…", "lastName": "…", "fullName": "…", "zoneId": "…", "isEmailVerified": true }
}
```

**Success `data` — email verification required (still HTTP 200)**

```json
{
  "status": "EMAIL_VERIFICATION_REQUIRED",
  "provider": "GOOGLE",
  "email": "fatima@example.com"
}
```

FE **must** branch on `data.status`. Do not assume tokens always present.

**Common errors:** `401` OAuth disabled / bad token; `422` missing `zoneCode` for new account; provider not supported for code exchange

#### `POST /storefront/auth/oauth/link` — Strict JWT

```json
{
  "provider": "GOOGLE",
  "idToken": "<id-token>",
  "nonce": "optional"
}
```

**Success `data`:** `{ "linked": true, "alreadyLinked": false }`

#### `DELETE /storefront/auth/oauth/:provider` — Strict JWT

Example: `DELETE /storefront/auth/oauth/GOOGLE`  
**Success `data`:** `{ "success": true }`  
**Errors:** `404` no identity; `422` cannot remove only sign-in method (set password first)

---

### 7.11 Customer IAM (auth-owned) — Strict JWT

**Wave:** 1.1 / 1.2 / 1.5 · Base: `/storefront/customer`

#### `GET /storefront/customer/me`

**Success `data`:** `CustomerProfileView`  
**Note:** Safe profile **updates** are `PATCH /storefront/customer/me` on the **account** controller — **Phase 2+**, not Phase 1.

#### `GET /storefront/customer/sessions`

**Success `data`:** array of

```ts
{
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceName: string | null;
  browser: string | null;
  os: string | null;
  city: string | null;
  countryCode: string | null;
  issuedAt: string;
  lastSeenAt: string | null;
  expiresAt: string;
  current: boolean;   // true for this access token's session
}
```

#### `DELETE /storefront/customer/sessions/:id`

**Success `data`:** `{ "success": true }` · `404` if not found / not owned

#### `POST /storefront/customer/change-password`

```json
{
  "currentPassword": "SecurePass1",
  "newPassword": "NewSecurePass1"
}
```

**Success `data`:** `{ "success": true }`  
**Side effect:** revokes **all** sessions → clear tokens → login  
**Errors:** `401` wrong current password / verification disabled; `422` password change not available (e.g. OAuth-only without password)

#### `GET /storefront/customer/identities`

**Success `data`:** array of

```ts
{
  provider: 'GOOGLE' | 'APPLE' | 'MICROSOFT';
  emailAtProvider: string | null;
  displayName: string | null;
  linkedAt: string;
  lastLoginAt: string | null;
}
```

Requires OAuth enabled.

---

## 8. Reference API client (TypeScript + axios)

Adapt paths from the admin Phase 1 client — same envelope, **customer** token store, refresh URL `/storefront/auth/refresh`.

```ts
// api/types.ts
export interface ApiResponse<T> {
  success: boolean; statusCode: number; code: string; message: string;
  data: T | null; error: ApiError | null; errors: ApiFieldError[]; meta: ApiMeta;
}
export interface ApiError {
  type: string; code: string; message: string; source: string;
}
export interface ApiFieldError {
  field?: string; code: string; message: string;
}
export interface ApiMeta {
  timestamp: string; path: string; requestId: string;
}

export class StorefrontApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public type: string,
    message: string,
    public fieldErrors: ApiFieldError[],
    public requestId: string,
    public data: unknown,
    public retryAfterSec?: number,
  ) {
    super(message);
  }
}
```

```ts
// api/client.ts (sketch)
import axios, { AxiosError, AxiosInstance } from 'axios';
import { ApiResponse, StorefrontApiError } from './types';
import { tokenStore } from './token-store';

const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.request.use((config) => {
  const token = tokenStore.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<void> | null = null;

const isPublicAuthUrl = (url?: string) =>
  !!url &&
  (/\/storefront\/auth\/(login|register|refresh)/.test(url) ||
    /\/storefront\/auth\/(verify-|forgot-password|reset-password|otp\/)/.test(url) ||
    /\/storefront\/auth\/oauth\/(google|apple|code)/.test(url));

http.interceptors.response.use(
  (res) => res,
  async (err: AxiosError<ApiResponse<unknown>>) => {
    const res = err.response;
    const original = err.config as { __isRetry?: boolean; url?: string } & typeof err.config;

    if (res?.status === 401 && original && !original.__isRetry && !isPublicAuthUrl(original.url)) {
      original.__isRetry = true;
      try {
        refreshing = refreshing ?? doRefresh();
        await refreshing;
        refreshing = null;
        return http(original);
      } catch {
        refreshing = null;
        tokenStore.clear();
        // route to /login?returnTo=…
      }
    }
    throw toStorefrontApiError(err);
  },
);

async function doRefresh(): Promise<void> {
  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken) throw new Error('no refresh token');
  const { data } = await axios.post<ApiResponse<{ token: IssuedCustomerToken }>>(
    `${import.meta.env.VITE_API_BASE_URL}/storefront/auth/refresh`,
    { refreshToken },
  );
  tokenStore.setToken(data.data!.token);
}

function toStorefrontApiError(err: AxiosError<ApiResponse<unknown>>): StorefrontApiError {
  const body = err.response?.data;
  const retryAfter = Number(err.response?.headers?.['retry-after']) || undefined;
  return new StorefrontApiError(
    err.response?.status ?? 0,
    body?.error?.code ?? body?.code ?? 'NETWORK_ERROR',
    body?.error?.type ?? 'INTERNAL_ERROR',
    body?.message ?? err.message,
    body?.errors ?? [],
    body?.meta?.requestId ?? 'unknown',
    body?.data ?? null,
    retryAfter,
  );
}

export async function apiPost<T>(url: string, body?: object) {
  const res = await http.post<ApiResponse<T>>(url, body);
  return { data: res.data.data as T, meta: res.data.meta };
}
export async function apiGet<T>(url: string, params?: object) {
  const res = await http.get<ApiResponse<T>>(url, { params });
  return { data: res.data.data as T, meta: res.data.meta };
}
export async function apiDelete<T>(url: string) {
  const res = await http.delete<ApiResponse<T>>(url);
  return { data: res.data.data as T, meta: res.data.meta };
}
```

Suggested auth API module surface:

```ts
authApi.register(dto)
authApi.login(dto)
authApi.refresh(refreshToken)
authApi.logout()
authApi.logoutAll()
authApi.requestEmailVerification(email)
authApi.confirmEmailVerification(email, code)
// …mirror §7
customerAuthApi.me()
customerAuthApi.sessions()
customerAuthApi.revokeSession(id)
customerAuthApi.changePassword(dto)
customerAuthApi.identities()
```

---

## 9. Phase 1 acceptance checklist

### Wave 1.0–1.1 (required)

- [ ] Env base URL; no hardcoded `/api/v1`
- [ ] Envelope unwrap on all calls
- [ ] Register with `zoneCode` + email or phone + password ≥ 8
- [ ] Login with `identifier` + password
- [ ] Tokens stored; Bearer sent on protected calls
- [ ] Single-flight refresh on 401; refresh rotation replaces both tokens
- [ ] Logout + logout-all clear local state
- [ ] `GET /storefront/customer/me` hydrates header/account
- [ ] Validation `errors[]` mapped on register/login forms
- [ ] `429` handled with retry UX
- [ ] Customer vs admin token isolation respected

### Wave 1.2

- [ ] Sessions list shows `current`
- [ ] Revoke other session works; revoking current → re-login

### Wave 1.3 (if flag on)

- [ ] Neutral copy on request/forgot/resend
- [ ] Confirm / reset success paths
- [ ] Reset password forces login

### Wave 1.4–1.5 (if flag on)

- [ ] Branch on OAuth `status`
- [ ] New social user sends `zoneCode`
- [ ] Link / unlink + identities list
- [ ] Change-password forces login

### Explicitly deferred

- [ ] Account `PATCH /me`, addresses, phones, preferences → Phase 2
- [ ] Cart / checkout / orders → later phases
- [ ] Guest order tracking tokens → later phases

---

## 10. Suggested status artifacts (same pattern as admin)

After implementation, FE agent / QA should add (in frontend or backend `docs/storefront/`):

| File | Purpose |
|------|---------|
| `STOREFRONT_PHASE_1_INTEGRATION_STATUS.md` | Wave status: DONE / PENDING / DEFERRED |
| `STOREFRONT_PHASE_1_SMOKE_RESULTS.md` | Pass/fail per endpoint with `requestId`s |

---

## 11. Next phases (planning only)

| Phase | Theme (planned) |
|-------|-----------------|
| **2** | Customer account — profile PATCH, addresses, phones, preferences, marketing consents |
| **3** | Catalog / homepage / merchandising + storefront context query params |
| **4** | Cart + guest token |
| **5** | Checkout + payments handoff |
| **6** | Orders + guest tracking |
| **7+** | Wishlist, reviews, support, returns |

Do not expand Phase 1 into these.

---

## 12. Agent prompt snippet (paste into Cursor)

```
You are integrating the Swiss Arabian customer storefront against the NestJS backend.
Read and follow: docs/storefront/STOREFRONT_FRONTEND_INTEGRATION_GUIDE_PHASE_1.md
and the short handoff: docs/storefront/STOREFRONT_PHASE_1_FE_HANDOFF.md

Phase 1 only: customer auth + IAM sessions/me/change-password/identities.
Rules: unwrap envelope data; no /api/v1 prefix; Bearer customer JWT; single-flight refresh;
identifier (not email) on login; zoneCode + email|phone on register; password min 8;
respect CUSTOMER_VERIFICATION_ENABLED / CUSTOMER_OAUTH_ENABLED; never invent fields — Swagger wins.
UI already exists — wire APIs and session, do not redesign.
```

---

*Derived from storefront auth controllers/services/DTOs. Last aligned with backend auth module (register/login/refresh/logout, verification, OAuth, customer IAM).*
