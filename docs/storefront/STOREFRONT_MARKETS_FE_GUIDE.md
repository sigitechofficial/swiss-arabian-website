# Storefront markets — Frontend guide

**As of:** 2026-09-14  
**Audience:** Storefront frontend (market selector / multi-market testing)  
**Backend:** Public markets API  
**Swagger:** `/api/docs` → **Storefront Markets**

Replace the hardcoded `UAE` / `platform_uae` default with this list. Do **not** call admin `GET /admin/markets`.

---

## 1. Golden rules

1. Unwrap the global envelope — use `data` only (`response.data.data`).
2. Public — **no JWT**. Same client as catalog PLP.
3. Prefer **`catalogContext`** from the selected market for every storefront call (catalog, cart, checkout, wishlist, reviews). Do not invent `salesChannelCode`.
4. Prefer markets with **`isCatalogReady: true`**. Incomplete markets may lack PLATFORM channel / currency / language.
5. On first paint, use **`defaultMarket`** (first catalog-ready market, else first in list) unless the user already has a saved selection.
6. Persist the selected `zoneCode` (and optional language/currency overrides) in client state. Changing market must refresh catalog/cart context — do not mix zone A products into zone B.
7. Language/currency pickers come from that market’s `languages[]` / `currencies[]`. Defaults: `defaultLanguageCode` / `defaultCurrencyCode`.

---

## 2. Endpoints

### 2.1 List — `GET /storefront/markets`

```http
GET /storefront/markets
GET /storefront/markets?countryCode=AE
```

| Param | Required | Notes |
|-------|----------|--------|
| `countryCode` | No | ISO country filter (e.g. `AE`, `SA`, `QA`). Case-insensitive; normalized upper. |

### 2.2 Detail — `GET /storefront/markets/:zoneCode`

```http
GET /storefront/markets/UAE
```

| Param | Notes |
|-------|--------|
| `zoneCode` | Path — e.g. `UAE`, `KSA`. Inactive / unknown → **404** |

Same item shape as list rows.

---

## 3. Response shape (`data`)

### List

```typescript
type StorefrontMarketListResponse = {
  markets: StorefrontMarket[];
  /** Suggested first paint — first isCatalogReady, else markets[0], else null */
  defaultMarket: StorefrontMarket | null;
};
```

### Market item (list + detail)

```typescript
type StorefrontMarket = {
  zoneId: string;
  zoneCode: string; // e.g. "UAE"
  name: string;
  countryCode: string; // e.g. "AE"
  defaultCurrencyCode: string | null;
  defaultLocale: string | null; // e.g. "en-AE"
  defaultLanguageCode: string | null; // e.g. "en"
  salesChannelId: string | null;
  salesChannelCode: string | null; // e.g. "platform_uae"
  primaryLegalEntityCode: string | null;
  /** PLATFORM channel + primary LE + default currency + language present */
  isCatalogReady: boolean;
  currencies: StorefrontMarketCurrency[];
  languages: StorefrontMarketLanguage[];
  /** Drop straight into catalog/cart/checkout query string */
  catalogContext: StorefrontMarketCatalogContext;
};

type StorefrontMarketCurrency = {
  currencyCode: string;
  displayName: string | null;
  symbol: string | null;
  decimalPlaces: number;
  isDefault: boolean;
};

type StorefrontMarketLanguage = {
  locale: string; // e.g. "en-AE"
  languageCode: string; // e.g. "en"
  displayName: string | null;
  isDefault: boolean;
};

type StorefrontMarketCatalogContext = {
  zoneId: string;
  zoneCode: string;
  salesChannelId: string | null;
  salesChannelCode: string | null;
  legalEntityCode: string | null;
  languageCode: string | null;
  currencyCode: string | null;
  countryCode: string;
};
```

---

## 4. Wire the selector → storefront context

When the user picks a market (or on boot from `defaultMarket` / saved `zoneCode`):

```ts
const ctx = market.catalogContext;

// Persist + send on subsequent calls:
// zoneCode, salesChannelCode, languageCode, currencyCode
```

Example catalog call after selecting UAE:

```http
GET /storefront/catalog/products
  ?zoneCode=UAE
  &salesChannelCode=platform_uae
  &languageCode=en
  &currencyCode=AED
```

Same params pattern for:

| Area | Example |
|------|---------|
| Search | `GET /storefront/catalog/search?...` |
| Collections / categories | catalog taxonomy routes |
| Cart / checkout | existing storefront cart/checkout context qs |
| Wishlist / reviews | `zoneCode` + `salesChannelCode` as in those FE guides |

If the user switches language or currency **within** the market, keep `zoneCode` + `salesChannelCode` and override only `languageCode` / `currencyCode` from that market’s arrays.

---

## 5. UX recommendations

| Step | Behavior |
|------|----------|
| Boot | `GET /storefront/markets` once (cache). Use saved `zoneCode` if still in list + ready; else `defaultMarket`. |
| Selector UI | Show `name` (+ optional `countryCode`). Hide or disable `isCatalogReady === false` for shoppable flows. |
| Switch market | Clear or re-fetch cart/catalog under new context. Do not keep previous market’s line prices. |
| Country-only entry | Optional: `?countryCode=AE` then pick among returned markets. |
| Empty list | Show “no markets available” — do not hardcode UAE as a fake fallback if the API returns `[]`. |

---

## 6. Errors

| Case | HTTP | FE |
|------|------|-----|
| Unknown / inactive `zoneCode` | 404 | Fall back to list / `defaultMarket` |
| Envelope unwrap | — | Always read `data` |
| Network / 5xx | — | Retry; keep last good market list if cached |

---

## 7. Example calls

```http
### All active markets
GET /storefront/markets

### UAE-only by country
GET /storefront/markets?countryCode=AE

### One market
GET /storefront/markets/UAE
```

Smoke:

- [ ] List → 200, `markets[]` non-empty in a multi-market env  
- [ ] Each ready market has `salesChannelCode` + `catalogContext.zoneCode`  
- [ ] PLP with that `catalogContext` returns that market’s products only  
- [ ] `GET /storefront/markets/NOPE` → 404  
- [ ] Selector does not use `/admin/markets`

---

## 8. Out of scope (this guide)

| Topic | Notes |
|-------|--------|
| Admin market bootstrap / readiness | `GET /admin/markets*` — ops only |
| Shopify channel codes | Storefront uses **PLATFORM** channel only |
| Geo-IP auto-detect | Optional FE; backend does not infer from IP here |
| Payment / shipping method lists | Separate checkout option APIs after market is chosen |

---

## 9. Agent prompt (paste into Cursor)

```
You are wiring Swiss Arabian storefront market selector against the NestJS backend.
Read docs/storefront/STOREFRONT_MARKETS_FE_GUIDE.md
Reuse the existing apiClient (envelope unwrap). Public — no JWT. No /api/v1 prefix.
Do not call /admin/markets.
Use catalogContext from GET /storefront/markets (or :zoneCode) for all catalog/cart/checkout qs.
Prefer isCatalogReady markets; boot from defaultMarket unless user has a saved zoneCode.
Switching market must refresh market-scoped data — no cross-zone product mix.
Swagger tag: Storefront Markets.
```
