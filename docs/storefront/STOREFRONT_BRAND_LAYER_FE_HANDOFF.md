# Storefront FE — Brand / Sapil backend changes (give this to customer FE)

**Audience:** Storefront web + mobile (customer shop)  
**Backend branch:** `sapil`  
**Date:** 2026-09-21  
**Swagger:** tags `Storefront — *`  
**Envelope:** `{ success, statusCode, code, message, data, error, errors, meta }` — read **`data`**.

This is the **single customer-FE pack** for Brand work on `sapil` (through Phase 11 catalog isolation). Same idea as the admin pack: what changed on the API, what you must implement, what you must not do.

**Admin FE is a different contract.** Never send `X-Admin-Brand-*` on `/storefront/*`. Never send `X-Storefront-Host` on `/admin/*`.

| Also useful | Path |
|-------------|------|
| Short brand contract | [`docs/storefront/STOREFRONT_BRAND_CONTEXT_FE.md`](../storefront/STOREFRONT_BRAND_CONTEXT_FE.md) |
| Day-by-day ticks | [`docs/brand-architecture/storefront/FE-DAILY-HANDOFF.md`](../brand-architecture/storefront/FE-DAILY-HANDOFF.md) |
| Cart | [`docs/storefront/STOREFRONT_CART_FE_HANDOFF.md`](../storefront/STOREFRONT_CART_FE_HANDOFF.md) |
| Checkout + orders | [`docs/storefront/STOREFRONT_CHECKOUT_AND_ORDERS_FE_GUIDE.md`](../storefront/STOREFRONT_CHECKOUT_AND_ORDERS_FE_GUIDE.md) |
| Local test pay | [`docs/storefront/SMOKE_PAYMENT_FE_GUIDE.md`](../storefront/SMOKE_PAYMENT_FE_GUIDE.md) |
| Coupons / gift cards | [`docs/frontend/STOREFRONT_PROMOTIONS_FE_HANDOFF.md`](./STOREFRONT_PROMOTIONS_FE_HANDOFF.md) |
| Admin Brand pack (do not mix) | [`ADMIN_BRAND_LAYER_FE_HANDOFF.md`](./ADMIN_BRAND_LAYER_FE_HANDOFF.md) |

---

## 0. One-line product rule

Each shop origin is **one tenant brand**. Swiss Arabian UAE and Sapil UAE share `zoneCode=UAE` but are **different `zoneId`s**. Brand comes from **Host / client id**, not from `UAE`.

- Same `/storefront/*` paths for every brand. **Never** add `/storefront/sapil/*`.
- **Fail closed.** Unknown host never becomes Swiss Arabian.
- Catalog, cart, checkout, orders, JWT, guest cart are all stamped with brand server-side.

```text
Web:    every /storefront/* call → X-Storefront-Host = shop hostname
Mobile: every /storefront/* call → X-Storefront-Client-Id = registered client
Market: ?zoneCode=UAE&salesChannelCode=platform_uae  (inside that brand)
```

---

## 1. What FE must change (summary)

| Area | Backend is ready | FE must do |
|------|------------------|------------|
| HTTP client | Host / client → Brand | Interceptor on **every** `/storefront/*` call |
| Dual UAE | Two `zoneId`s, same `zoneCode` | Do not treat `UAE` as globally unique |
| Catalog / nav / search | Visibility is zone-scoped | Header + `zoneCode` + `salesChannelCode`; expect `data.context.brandCode` |
| Auth | JWT claim `bid` | Tokens **per origin**; SA token on Sapil → **401** |
| Cart / checkout / orders | Brand stamp; wrong id → **404** | Same headers; 404 = not found |
| Guest cart | `guestToken` bound to brand | New guest token per brand/origin; do not reuse SA guest on Sapil |
| Promotions | Pairs enforced server-side | Same apply APIs; do **not** send tenant brand on apply |
| Pay (local) | `smoke_payment` / `test_pay` | Use this until Paymob LIVE for Sapil |
| Kill-switch | Domain `isActive=false` | Unknown host → shop-unavailable page |
| Live Sapil DNS | **Not ready** | Local `sapil.test` only; do not invent production hosts |

**Not customer-FE work:** admin Brand picker, kill-switch UI, GMC, Key Vault, Tabby.

---

## 2. Headers (mandatory)

| Header | Who | Value | Rules |
|--------|-----|--------|--------|
| `X-Storefront-Host` | **Web (W1, locked)** | Shop hostname only: lowercase, **no** scheme, **no** path, **no** port. Example: `sapil.test` | Do **not** use the API’s `Host` header (that is the Nest host). |
| `X-Storefront-Client-Id` | **Mobile (required)** | Registered `StorefrontAppClient.clientId` | Dev: `sapil_ios_dev`, `sapil_android_dev`, `sapil_web_client`. SA apps keep their own ids. |
| `Authorization` | Logged-in | `Bearer <accessToken>` issued **on this shop** | Cross-brand JWT → 401 |
| `guestToken` | Guest cart/checkout | Query param, UUIDv4 | Bound to the cart’s brand; do not share across shops |

If **both** Host and Client-Id are sent, they must resolve to the **same** brand, else **400** `STOREFRONT_SIGNAL_CONFLICT`.

### Web interceptor

If the FE runs on `localhost` but must act as Sapil, use an env override (do not send `localhost` unless that host is registered — it is not).

```ts
api.interceptors.request.use((config) => {
  const host =
    process.env.NEXT_PUBLIC_STOREFRONT_HOST?.trim().toLowerCase() ||
    (typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '');
  if (host && !host.includes('localhost')) {
    config.headers['X-Storefront-Host'] = host.replace(/:\d+$/, '');
  } else if (process.env.NEXT_PUBLIC_STOREFRONT_HOST) {
    config.headers['X-Storefront-Host'] = process.env.NEXT_PUBLIC_STOREFRONT_HOST
      .trim()
      .toLowerCase();
  }
  return config;
});
```

Local mapping (hosts file / proxy): `127.0.0.1 sapil.test` and browse `http://sapil.test:<fe-port>`.

### Mobile interceptor

```ts
headers['X-Storefront-Client-Id'] = 'sapil_ios_dev'; // or sapil_android_dev
```

Never reuse Swiss Arabian client ids on the Sapil app.

---

## 3. Query params (market **inside** the brand)

Unchanged names:

```text
?zoneCode=UAE&salesChannelCode=platform_uae
```

Optional: `zoneId` (UUID) if you already have it from `data.context`. Prefer **code + Host** for first paint.

`zoneCode=UAE` without Host, when **two** brands are ACTIVE → **400** `BRAND_SIGNAL_REQUIRED`.

**Do not** use `GET /storefront/markets/:zoneCode` as a unique market key after dual UAE. That list is not brand-filtered. A Sapil deploy should use **this shop’s** `zoneCode` + `salesChannelCode` (env or first Host-resolved catalog `context`), and must **not** offer Swiss Arabian UAE as a switcher on the Sapil origin.

---

## 4. HTTP / `code` mapping (UX)

| HTTP | `code` | Meaning | UI |
|------|--------|---------|-----|
| 400 | `STOREFRONT_HOST_UNKNOWN` | Host not in Domain table, or kill-switch turned the domain off | “Shop not available” — **no** SA catalog |
| 400 | `STOREFRONT_CLIENT_UNKNOWN` | Mobile client id unknown / inactive | App config error |
| 400 | `BRAND_SIGNAL_REQUIRED` | 2+ active brands and no Host/client | Interceptor bug |
| 400 | `STOREFRONT_SIGNAL_CONFLICT` | Host and client id are different brands | Config bug |
| 400 | `STOREFRONT_ZONE_REQUIRED` | Brand resolved, market missing | Send `zoneCode` |
| 400 | `BRAND_INACTIVE` | Brand killed / inactive | Shop unavailable |
| 422 | `ZONE_BRAND_MISMATCH` | `zoneId` / channel belongs to the other brand | “Invalid market for this shop” |
| 401 | (generic unauthorized) | JWT `bid` ≠ this Host, expired, etc. | Clear session; show login. **Do not** retry with the other shop’s token. |
| 404 | | Cart / checkout / order / PDP id not on this brand | Not found. **Do not** say “exists on Swiss Arabian”. |
| 422 | `CART_ITEM_NOT_SELLABLE` | SKU not sellable here (includes SA-only SKU on Sapil) | Normal OOS / not available |

Envelope `meta.requestId` — include it in bug reports.

---

## 5. Local hosts (fixture — not live DNS)

| Brand | Web header | Mobile client | Query |
|-------|------------|---------------|--------|
| Sapil | `X-Storefront-Host: sapil.test` | `sapil_ios_dev` / `sapil_android_dev` | `zoneCode=UAE&salesChannelCode=platform_uae` |
| Swiss Arabian | `X-Storefront-Host: sa.test` | SA client ids | same query |

Do **not** invent production Sapil domains. Live DNS is Phase 10 / client ops. When it exists, only the Host **string** changes (`sapil.test` → real hostname registered in `StorefrontDomain`).

CORS: non-prod often allows `*.test`. Prod: add the real origin to `CORS_ORIGINS`.

Cookies: **host-only**. No shared parent cookie across `swissarabian.com` and a future Sapil domain.

---

## 6. Catalog, homepage, search, nav

**No JWT required.** Still send Host + market query.

Typical paths (unchanged):

| Method | Path |
|--------|------|
| GET | `/storefront/catalog/products` |
| GET | `/storefront/catalog/products/:idOrSlug` |
| GET | `/storefront/catalog/categories…` |
| GET | `/storefront/catalog/collections…` |
| GET | `/storefront/catalog/search` |
| GET | `/storefront/catalog/filters` |
| GET | `/storefront/homepage` |
| GET | `/storefront/navigation…` |
| GET | `/storefront/merchandising…` |

### Context in `data`

Catalog / homepage include:

```json
{
  "zoneId": "uuid",
  "zoneCode": "UAE",
  "brandId": "uuid",
  "brandCode": "SAPIL",
  "salesChannelCode": "platform_uae",
  "currencyCode": "AED",
  "legalEntityCode": "URD1"
}
```

On `sapil.test` expect **`brandCode": "SAPIL"`**. If you see `SWISS_ARABIAN`, the Host header is wrong.

Product `brandCode` / `brandName` on a card is still **perfume house** (Ajmal, …), not the tenant. Tenant is only `context.brandCode`.

Phase 11: other-brand SKUs are not visible in this zone. Deep-link to another brand’s `productId` → **404**. Do not copy SA PDP URLs onto Sapil.

---

## 7. Auth (register / login / refresh / OAuth / password)

Send the **same** Host/client headers as catalog.

| Method | Path |
|--------|------|
| POST | `/storefront/auth/register` |
| POST | `/storefront/auth/login` |
| POST | `/storefront/auth/refresh` |
| POST | `/storefront/auth/logout` (as today) |
| POST | `/storefront/auth/oauth/…` |
| POST | `/storefront/auth/…` verify / password reset |

Register body still includes market:

```json
{
  "email": "you@example.test",
  "password": "…",
  "firstName": "Sapil",
  "lastName": "Dev",
  "zoneCode": "UAE",
  "salesChannelCode": "platform_uae"
}
```

Access JWT includes **`bid`** (tenant brand id). Backend rejects a Swiss Arabian token on a Sapil Host with **401** (same message as invalid token — do not special-case copy).

### FE session rules

1. Store tokens **per origin** (separate deploys) or key storage by brand (`sapil.accessToken` vs `sa.accessToken`).
2. On 401: clear **this** shop’s session only.
3. Password-reset / verify-email links must stay on the **Sapil origin** (emails use brand-zone sender; FE must not bounce users to SA).
4. Do not share localStorage across `sa.test` and `sapil.test`.

---

## 8. Cart, checkout, orders

Same paths as today. Add Host + market query. Guest: `guestToken` query. Logged-in: Bearer, **no** guestToken.

| Area | Prefix |
|------|--------|
| Cart | `/storefront/cart` |
| Checkout | `/storefront/checkout` |
| Orders | `/storefront/orders` |
| Tracking | `/storefront/order-tracking` |
| Account | `/storefront/customer` |
| Wishlist / recently viewed | `/storefront/customer/wishlist`, `…/recently-viewed` |
| Returns / exchanges | `/storefront/returns`, `/storefront/exchanges`, `/storefront/customer/…` |
| Support | `/storefront/support` |
| Reviews | `/storefront/catalog/reviews`, `/storefront/customer/reviews` |
| Analytics events | `/storefront/analytics` |

### Guest token

- New UUIDv4 on first visit **on this origin**.
- Bound to the cart’s brand. Reusing an SA `guestToken` on Sapil will not show the SA bag (404 / empty / new cart).
- After login, JWT wins; stop sending `guestToken`.

### Isolation

- Get cart / checkout / order by id for the **other** brand → **404**.
- Adding an SA-only SKU on Sapil → not sellable (`CART_ITEM_NOT_SELLABLE` or missing from PLP).
- My-orders lists **this** brand only.

---

## 9. Promotions & gift cards

Existing FE: [`STOREFRONT_PROMOTIONS_FE_HANDOFF.md`](./STOREFRONT_PROMOTIONS_FE_HANDOFF.md).

- Apply coupon / gift card on **cart/checkout** as today.
- **Do not** send tenant `brandCode` on apply. Host selects the brand; campaigns are `allowedBrandZonePairs`.
- A Swiss Arabian coupon code does not apply on Sapil (server 422 / not applicable). Show the API `message`.
- Default evaluation without Host is not your case once two brands are ACTIVE — always send Host.

---

## 10. Payments (local vs LIVE)

| Mode | FE |
|------|----|
| Local / UAT until Sapil Paymob LIVE | Prefer **`smoke_payment` / `test_pay`** — [`SMOKE_PAYMENT_FE_GUIDE.md`](../storefront/SMOKE_PAYMENT_FE_GUIDE.md). `paymentAction` is not `REDIRECT`; poll until `orderPaymentStatus === PAID`. |
| Paymob (when ops enables Sapil pack) | Existing Paymob FE guide. Keys are **brand+zone** on the server (`PAYMOB__SAPIL__UAE__*`). FE does not send merchant keys. |

Cancellation window (default 15 minutes) still applies after PAID. Do not invent a second Paymob merchant in the client.

---

## 11. Kill switch (customer impact)

Ops can turn Sapil storefront domains off (`POST /admin/brands/SAPIL/kill-switch`). Customer FE then gets **400** `STOREFRONT_HOST_UNKNOWN` (or brand inactive). Show a static “temporarily unavailable” page. **Do not** fall back to Swiss Arabian catalog.

Payments-only kill leaves catalog up but payment methods empty / initiate fail — use existing checkout error UX.

---

## 12. Suggested implementation order

1. Interceptor: `X-Storefront-Host` (web) or `X-Storefront-Client-Id` (mobile) on all `/storefront/*`.
2. Confirm PLP `data.context.brandCode === "SAPIL"` on `sapil.test`.
3. Register / login / refresh; prove SA JWT → 401 on Sapil.
4. Guest cart add from PLP; new `guestToken` per origin.
5. Checkout + `smoke_payment`.
6. Order detail / tracking 404 for foreign ids.
7. Theme / cookies / reset-password origin.
8. Error pages for unknown host / kill-switch.

---

## 13. QA (customer FE)

| # | Case | Expect |
|---|------|--------|
| 1 | `GET /storefront/catalog/products?zoneCode=UAE&salesChannelCode=platform_uae` + `X-Storefront-Host: sapil.test` | 200, `context.brandCode=SAPIL` |
| 2 | Same URL, **no** Host (two brands ACTIVE) | 400 `BRAND_SIGNAL_REQUIRED` |
| 3 | Host `no-such-shop.test` | 400 `STOREFRONT_HOST_UNKNOWN` |
| 4 | Register on Sapil, use token on `sa.test` | 401 |
| 5 | SA token on `sapil.test` | 401 |
| 6 | Browse → add to cart on Sapil | 2xx; bag is Sapil SKUs only |
| 7 | Guest token from SA reused on Sapil | No SA lines |
| 8 | Open SA order UUID on Sapil | 404 |
| 9 | Checkout + smoke pay | `orderPaymentStatus=PAID` |
| 10 | Password reset link | Stays on Sapil origin |
| 11 | Cookies | Host-only; not shared with SA |
| 12 | Admin Brand headers on storefront | Must **not** be sent |

Backend smokes for comparison: `scripts/ops/smoke-sapil-storefront.ts`, `smoke-sapil-isolation-p0.ts`, `smoke-sapil-pay-test.ts`.

---

## 14. Do / do not

| Do | Do not |
|----|--------|
| Same `/storefront/*` | `/storefront/sapil/*` |
| Host / client on every call | Silent Swiss Arabian fallback |
| Tokens + guestToken per origin | Share JWT / guest bag across brands |
| `zoneCode` + Host | Treat `UAE` as one shop |
| 404 as not found | “This order is on the other brand” |
| `smoke_payment` locally | Block Sapil FE on Paymob LIVE |
| Perfume house vs tenant | Use product `brandCode` as SAPIL/SA |
| `sapil.test` until ops DNS | Invent live Sapil production hosts |
| Storefront headers on storefront | `X-Admin-Brand-*` on customer APIs |

---

## 15. Out of scope for this FE pack

- Admin Brand picker, create market, kill-switch **UI**, catalog conflicts table.
- Live Sapil public DNS, Key Vault, Tabby/COD, Sapil-own warehouse.
- Shopify write-back.
- Group analytics dashboards.
