# Swiss Arabian — Storefront Customer Frontend Integration Guide (Phase 2)

> **Audience:** Customer storefront frontend developer + their Cursor/AI coding agent.  
> **Purpose:** Wire **customer account** APIs — safe profile update, address book, phones, locale/currency preferences, and marketing consents — on top of Phase 1 auth/session.  
> **Source of truth:** running backend + Swagger at `/api/docs`. Where a field is not listed here, **treat Swagger as authoritative** — never invent fields.  
> **Scope (Phase 2):** account-owned `/storefront/customer/*` — `PATCH /me`, `addresses*`, `phones*`, `preferences`, `marketing-consents`.  
> **Prerequisite:** Phase 1 auth/session ([`STOREFRONT_FRONTEND_INTEGRATION_GUIDE_PHASE_1.md`](./STOREFRONT_FRONTEND_INTEGRATION_GUIDE_PHASE_1.md)). Recommended: Phase 1B gate + sign-in code ([`STOREFRONT_FRONTEND_INTEGRATION_GUIDE_PHASE_1B.md`](./STOREFRONT_FRONTEND_INTEGRATION_GUIDE_PHASE_1B.md)).  
> **Out of scope:** orders / shipments / cancel (later), catalog, cart, checkout, wishlist, reviews, support, returns.  
> **Companion inventory:** [`STOREFRONT_FRONTEND_SMOKE_TEST_PLAN.md`](./STOREFRONT_FRONTEND_SMOKE_TEST_PLAN.md) §2.3 + checklist D (account rows only).  
> **Short agent handoff:** [`STOREFRONT_PHASE_2_FE_HANDOFF.md`](./STOREFRONT_PHASE_2_FE_HANDOFF.md).  
> **Phase 1 guide:** [`STOREFRONT_FRONTEND_INTEGRATION_GUIDE_PHASE_1.md`](./STOREFRONT_FRONTEND_INTEGRATION_GUIDE_PHASE_1.md).  
> **UI note:** Account screens may already exist — Phase 2 is **API integration**, not a redesign.

---

## 0. How to use this document (read first)

Keep this file in the frontend repo (e.g. `docs/backend/STOREFRONT_ACCOUNT_PHASE_2.md`) and attach it with the Phase 1 guide when generating account clients/hooks.

### 0.1 Golden rules for the agent

1. Reuse Phase 1 client — same envelope unwrap (`response.data.data`), same Bearer customer JWT, same refresh interceptor. **Do not** fork a second HTTP stack.
2. There is **no** global `/api/v1` prefix. Routes are absolute: `PATCH /storefront/customer/me`.
3. **Ownership is JWT-only.** Never send `customerId` in body/query to prove ownership. Cross-customer ids → `404` (not `403`).
4. **Split ownership of `/me`:**
   - `GET /storefront/customer/me` → IAM (Phase 1) — identity snapshot
   - `PATCH /storefront/customer/me` → Account (Phase 2) — safe profile fields only
   - Do **not** invent a second GET on the account controller.
5. Password / sessions / identities stay on Phase 1 IAM routes — never move them into account screens as new endpoints.
6. Phone numbers must be valid (E.164 after normalize). Invalid → `400` with message like `Invalid phone number`.
7. Preferences PATCH requires **at least one** of `preferredCountryCode` / `preferredCurrencyCode` / `preferredLocale`.
8. Marketing consent upserts need a resolvable `zoneId` (item `zoneId` or customer’s `zoneId`). Items without zone are **skipped** server-side — ensure the customer has a zone (from register) before relying on consents.
9. Do not pull orders/shipments into Phase 2 even though they share the account controller tag in Swagger.
10. Never invent fields — Swagger wins.

### 0.2 Phase 2 waves (build in order)

| Wave | Theme | Ship when |
|------|--------|-----------|
| **2.0** | Foundation — account API module on Phase 1 client; types for profile/address/phone/prefs/consents | Types compile; one authenticated GET works |
| **2.1** | Profile — `PATCH /storefront/customer/me` + hydrate prefs fields | Account “My details” save works |
| **2.2** | Addresses — list/create/get/update/delete + set default | Address book CRUD + default shipping/billing |
| **2.3** | Phones — list/create/update/delete + set primary | Phone book + primary sync to profile `phoneE164` |
| **2.4** | Preferences — `GET/PATCH /preferences` | Locale/currency/country prefs UI |
| **2.5** | Marketing consents — `GET/PATCH /marketing-consents` | Opt-in/out per channel |

**Stop rule:** Do not expand into orders, cart, checkout, or catalog in this phase.

---

## 1. Environment, auth, and Swagger

| Item | Value |
|------|-------|
| Base URL | Same as Phase 1 (`VITE_API_BASE_URL`) |
| Auth | `Authorization: Bearer <customer access JWT>` — **strict** on all Phase 2 routes |
| Swagger scheme | `customer-bearer` |
| Swagger tag | **Storefront — Customer** (account-owned routes below) |
| Feature flags | No new flags for Phase 2 — needs `CUSTOMER_AUTH_ENABLED=true` only |

Unauthenticated calls → `401`. Use Phase 1 refresh-once → login flow.

---

## 2. Envelope & errors (unchanged from Phase 1)

Every response is still the global envelope. Business payload = `data`. Branch on `error.code` / HTTP status; map `errors[]` to forms; log `meta.requestId`.

### Phase 2–specific codes

| HTTP | Typical `code` / situation | UX |
|------|----------------------------|-----|
| `400` | `VALIDATION_ERROR`; invalid phone; empty preferences body | Inline field errors / toast `message` |
| `401` | Missing/expired JWT | Refresh → login |
| `404` | Address / phone / customer not found (incl. other user’s id) | Empty / “not found” |
| `409` | Duplicate phone on account | “Phone already on this account” |
| `422` | Rare on Phase 2 account routes; handle generically | Show `message` |

---

## 3. Profile shape differences (important)

### IAM read — `GET /storefront/customer/me` (Phase 1)

```ts
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
```

### Account update response — `PATCH /storefront/customer/me` (Phase 2)

```ts
interface StorefrontCustomerProfileView {
  id: string;
  email: string | null;
  phoneE164: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  zoneId: string | null;
  preferredCountryCode: string | null;
  preferredCurrencyCode: string | null;
  preferredLocale: string | null;
  isEmailVerified: boolean;
  dateOfBirth: string | null;   // ISO string
  gender: string | null;
}
```

**FE guidance:** After PATCH, merge into store **or** also call `GET /preferences` for locale/currency. Do not assume GET `/me` returns preferred* / DOB / gender — it currently does not. Prefer `GET /preferences` for prefs display and PATCH `/me` (or PATCH `/preferences`) for updates.

---

## 4. Foundational FE instructions

1. Add `customerAccountApi` module next to Phase 1 `customerAuthApi` — same `apiGet` / `apiPost` / `apiPatch` / `apiDelete` helpers.
2. Protect account routes with existing auth guard (must have valid session).
3. On account page load: `GET /me` (identity) + `GET /addresses` + `GET /phones` + `GET /preferences` + `GET /marketing-consents` (parallel is fine).
4. Forms: Zod/RHF matching DTO max lengths below; map `errors[].field`.
5. After mutating phones/addresses that affect defaults, refresh lists (and optionally `GET /me` for primary phone).
6. Do not expose email/phone identity change via Phase 2 — email/phone login identity changes are auth/verification flows (Phase 1).

---

## 5. User flows → API impact

### Flow A — Edit profile details

```
Account → My details form
 → PATCH /storefront/customer/me { firstName, lastName, preferredLocale, … }
 → merge StorefrontCustomerProfileView into UI state
```

### Flow B — Address book

```
List → GET /addresses
Add → POST /addresses
Edit → PATCH /addresses/:addressId
Delete → DELETE /addresses/:addressId → { success: true }
Set default → PATCH /addresses/:addressId/default { target: "shipping"|"billing"|"both" }
```

Setting `isDefaultShipping` / `isDefaultBilling` on create/update clears previous defaults of that kind.

### Flow C — Phones

```
List → GET /phones
Add → POST /phones { phone, countryCode?, usage?, isPrimary? }
Edit → PATCH /phones/:phoneId
Delete → DELETE /phones/:phoneId → { success: true }
Set primary → PATCH /phones/:phoneId/default
```

First phone becomes primary if `isPrimary` omitted. Primary updates customer `phoneE164` on profile. Deleting primary promotes the next remaining phone.

### Flow D — Preferences

```
GET /preferences → locale/currency/country + notificationPreferences[]
PATCH /preferences → at least one preferred* field → returns full preferences view
```

Note: notification preference rows on GET are **read** here; marketing opt-in/out mutations go through **marketing-consents**, not preferences PATCH.

### Flow E — Marketing consents

```
GET /marketing-consents → ConsentView[]
PATCH /marketing-consents { consents: [{ channel, status, zoneId? }] }
 → returns full list
```

---

## 6. Endpoint reference (account-owned)

Base: `/storefront/customer` · Auth: **Strict JWT** · Tag: Storefront — Customer

---

### 6.1 Profile — Wave 2.1

#### `PATCH /storefront/customer/me`

Update safe profile fields only. Does **not** change email, login phone identity, password, or sessions.

**Body** (`UpdateCustomerProfileDto` — all optional; send only changed fields):

| Field | Type | Max | Notes |
|-------|------|-----|--------|
| `firstName` | string | 100 | |
| `lastName` | string | 100 | |
| `preferredCountryCode` | string | 8 | e.g. `AE` |
| `preferredCurrencyCode` | string | 8 | e.g. `AED` |
| `preferredLocale` | string | 16 | e.g. `en-AE` |
| `dateOfBirth` | ISO date string | — | `@IsDateString()` |
| `gender` | string | 32 | Free string; do not invent enum |

**Demo request:**

```json
{
  "firstName": "Aisha",
  "lastName": "Hassan",
  "preferredLocale": "en-AE",
  "preferredCurrencyCode": "AED",
  "preferredCountryCode": "AE",
  "dateOfBirth": "1990-05-12",
  "gender": "female"
}
```

**Success `data`:** `StorefrontCustomerProfileView` (§3)

**Errors:** `400` validation; `401`; `404` customer not found (rare if JWT valid)

---

### 6.2 Addresses — Wave 2.2

#### Types

```ts
type CustomerAddressType = 'SHIPPING' | 'BILLING' | 'BOTH';

interface StorefrontCustomerAddressView {
  id: string;
  type: string;                 // CustomerAddressType
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  company: string | null;
  address1: string;
  address2: string | null;
  city: string | null;
  province: string | null;
  provinceCode: string | null;
  postalCode: string | null;
  country: string | null;
  countryCode: string | null;
  phoneE164: string | null;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}
```

Default `type` on create if omitted: **`SHIPPING`**.

#### `GET /storefront/customer/addresses`

**Success `data`:** `StorefrontCustomerAddressView[]`

#### `POST /storefront/customer/addresses`

**Body** — `address1` **required**; others optional:

```json
{
  "type": "SHIPPING",
  "firstName": "Aisha",
  "lastName": "Hassan",
  "company": null,
  "address1": "Marina Walk, Building 5",
  "address2": "Apt 1204",
  "city": "Dubai",
  "province": "Dubai",
  "provinceCode": "DU",
  "postalCode": "00000",
  "country": "United Arab Emirates",
  "countryCode": "AE",
  "phone": "+971501234567",
  "isDefaultShipping": true,
  "isDefaultBilling": false
}
```

**Success `data`:** created `StorefrontCustomerAddressView`  
**Errors:** `400` invalid phone / validation

#### `GET /storefront/customer/addresses/:addressId`

**Success `data`:** single view · `404` if missing / not owned

#### `PATCH /storefront/customer/addresses/:addressId`

All fields optional (including `address1`). Same shape as create.  
**Success `data`:** updated view

#### `DELETE /storefront/customer/addresses/:addressId`

HTTP **200** · **Success `data`:** `{ "success": true }` · soft-delete

#### `PATCH /storefront/customer/addresses/:addressId/default`

```json
{ "target": "both" }
```

| `target` | Effect |
|----------|--------|
| `shipping` | This address = default shipping only |
| `billing` | This address = default billing only |
| `both` (default) | Both flags set true |

Clears previous defaults for the targeted role(s) first.  
**Success `data`:** updated address view

---

### 6.3 Phones — Wave 2.3

#### Types

```ts
type CustomerPhoneUsage =
  | 'PRIMARY'
  | 'SHIPPING'
  | 'BILLING'
  | 'WHATSAPP'
  | 'OTHER';

interface StorefrontCustomerPhoneView {
  id: string;
  phoneRaw: string;
  phoneE164: string;
  countryCode: string | null;
  usage: string;
  isPrimary: boolean;
  isVerified: boolean;
}
```

#### `GET /storefront/customer/phones`

**Success `data`:** `StorefrontCustomerPhoneView[]`

#### `POST /storefront/customer/phones`

```json
{
  "phone": "+971501234567",
  "countryCode": "AE",
  "usage": "WHATSAPP",
  "isPrimary": false
}
```

| Field | Required | Notes |
|-------|----------|--------|
| `phone` | yes | Max 32; normalized to E.164 |
| `countryCode` | no | Max 8; falls back to customer preferred country |
| `usage` | no | Default `PRIMARY` |
| `isPrimary` | no | Default `true` if first phone, else `false` |

**Success `data`:** created view  
**Errors:** `400` invalid phone; `409` duplicate E.164 on account

#### `PATCH /storefront/customer/phones/:phoneId`

Optional: `phone`, `countryCode`, `usage`  
**Success `data`:** updated view · if phone was primary, profile primary phone updated

#### `DELETE /storefront/customer/phones/:phoneId`

HTTP **200** · `{ "success": true }`  
If deleted was primary → next remaining phone promoted (if any)

#### `PATCH /storefront/customer/phones/:phoneId/default`

No body. Sets this phone primary (clears others). Updates profile `phoneE164`.  
**Success `data`:** updated phone view

---

### 6.4 Preferences — Wave 2.4

#### `GET /storefront/customer/preferences`

```ts
interface StorefrontCustomerPreferencesView {
  preferredCountryCode: string | null;
  preferredCurrencyCode: string | null;
  preferredLocale: string | null;
  notificationPreferences: Array<{
    channel: string;
    isTransactionalAllowed: boolean;
    isMarketingAllowed: boolean;
    status: string;
  }>;
}
```

#### `PATCH /storefront/customer/preferences`

At least one of:

```json
{
  "preferredCountryCode": "AE",
  "preferredCurrencyCode": "AED",
  "preferredLocale": "en-AE"
}
```

**Success `data`:** full `StorefrontCustomerPreferencesView`  
**Errors:** `400` if body has none of the three fields (`At least one preference field is required`)

Same preferred* fields can also be set via `PATCH /me`. Prefer one UX path (either profile form or dedicated prefs screen) to avoid confusing double-write UX — either is valid API-wise.

---

### 6.5 Marketing consents — Wave 2.5

#### Types

```ts
type ConsentChannel = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH';
type ConsentStatus = 'OPTED_IN' | 'OPTED_OUT' | 'UNKNOWN';

interface StorefrontMarketingConsentView {
  channel: string;
  status: string;
  zoneId: string | null;
  consentedAt: string | null;  // ISO
  revokedAt: string | null;    // ISO
}
```

#### `GET /storefront/customer/marketing-consents`

**Success `data`:** `StorefrontMarketingConsentView[]`

#### `PATCH /storefront/customer/marketing-consents`

```json
{
  "consents": [
    { "channel": "EMAIL", "status": "OPTED_IN" },
    { "channel": "SMS", "status": "OPTED_OUT", "zoneId": "zone_…" }
  ]
}
```

| Field | Required | Notes |
|-------|----------|--------|
| `consents` | yes | Non-empty array |
| `consents[].channel` | yes | Enum |
| `consents[].status` | yes | Enum |
| `consents[].zoneId` | no | UUID; defaults to customer `zoneId` |

**Server behavior:** If neither item `zoneId` nor customer `zoneId` is set, that item is **skipped** (no error). Ensure zone exists from registration.  
`OPTED_IN` sets `consentedAt`; `OPTED_OUT` sets `revokedAt`.

**Success `data`:** full consents list after upsert

---

## 7. Suggested API module surface

```ts
// customerAccountApi — Phase 2
customerAccountApi.updateMe(dto)
customerAccountApi.listAddresses()
customerAccountApi.getAddress(addressId)
customerAccountApi.createAddress(dto)
customerAccountApi.updateAddress(addressId, dto)
customerAccountApi.deleteAddress(addressId)
customerAccountApi.setDefaultAddress(addressId, { target?: 'shipping'|'billing'|'both' })
customerAccountApi.listPhones()
customerAccountApi.createPhone(dto)
customerAccountApi.updatePhone(phoneId, dto)
customerAccountApi.deletePhone(phoneId)
customerAccountApi.setDefaultPhone(phoneId)
customerAccountApi.getPreferences()
customerAccountApi.updatePreferences(dto)
customerAccountApi.listMarketingConsents()
customerAccountApi.updateMarketingConsents(dto)
```

Ensure `apiPatch` exists on the Phase 1 client (Phase 1 sketch showed get/post/delete — add patch if missing):

```ts
export async function apiPatch<T>(url: string, body?: object) {
  const res = await http.patch<ApiResponse<T>>(url, body);
  return { data: res.data.data as T, meta: res.data.meta };
}
```

---

## 8. Phase 2 acceptance checklist

### Wave 2.0–2.1

- [ ] Account module uses Phase 1 client + envelope unwrap
- [ ] `PATCH /me` updates name / prefs / DOB / gender
- [ ] Response merged into UI; email not editable via this route
- [ ] `400` validation mapped to fields

### Wave 2.2

- [ ] List / create / edit / delete addresses
- [ ] `address1` required on create
- [ ] Default shipping/billing via create flags or `/default` endpoint
- [ ] Other customer’s `addressId` → `404`

### Wave 2.3

- [ ] CRUD phones; invalid phone → `400`
- [ ] Duplicate phone → `409`
- [ ] Set primary; `GET /me` reflects new `phoneE164` after refresh
- [ ] Delete primary promotes next phone

### Wave 2.4–2.5

- [ ] GET/PATCH preferences; empty PATCH → `400`
- [ ] GET/PATCH marketing consents with channel enums
- [ ] Consent works when customer has `zoneId`

### Explicitly deferred

- [ ] Customer orders / cancel / shipments → later phase (account controller exists; do not wire in Phase 2)
- [ ] Cart / checkout / catalog → later phases
- [ ] Wishlist / reviews / support / returns → later phases

---

## 9. Suggested status artifacts

| File | Purpose |
|------|---------|
| `STOREFRONT_PHASE_2_INTEGRATION_STATUS.md` | Wave status: DONE / PENDING / DEFERRED |
| `STOREFRONT_PHASE_2_SMOKE_RESULTS.md` | Pass/fail per endpoint with `requestId`s |

---

## 10. Next phases (planning only)

| Phase | Theme (planned) |
|-------|-----------------|
| **3** | Catalog / merchandising + Website Management nav → [`STOREFRONT_FRONTEND_INTEGRATION_GUIDE_PHASE_3.md`](./STOREFRONT_FRONTEND_INTEGRATION_GUIDE_PHASE_3.md) |
| **4** | Cart + guest token |
| **5** | Checkout + payments handoff |
| **6** | Orders + guest tracking (+ customer order/shipment routes on account controller) |
| **7+** | Wishlist, reviews, support, returns |

Do not expand Phase 2 into these.

---

## 11. Agent prompt snippet (paste into Cursor)

```
You are integrating Swiss Arabian storefront customer account APIs against the NestJS backend.
Read and follow:
- docs/storefront/STOREFRONT_FRONTEND_INTEGRATION_GUIDE_PHASE_2.md
- docs/storefront/STOREFRONT_PHASE_2_FE_HANDOFF.md
Prerequisite: Phase 1 auth/session already wired
  (STOREFRONT_FRONTEND_INTEGRATION_GUIDE_PHASE_1.md).

Phase 2 only: PATCH /storefront/customer/me, addresses*, phones*, preferences, marketing-consents.
Rules: reuse Phase 1 client/envelope/Bearer/refresh; no /api/v1; JWT ownership only;
GET /me is IAM read — PATCH /me is account update; never invent fields — Swagger wins.
Do not wire orders/shipments/cart/checkout. UI already exists — wire APIs, do not redesign.
```

---

*Derived from `StorefrontCustomerAccountController` + profile/address/phone/preference services/DTOs. Last aligned with storefront customer account module.*
