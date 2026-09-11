# Storefront Cart API — Frontend Integration Guide

> **Last updated:** Aug 11, 2026  
> **Module path:** `src/modules/storefront/cart/`  
> **Backend team:** Swiss Arabian Platform  
> **Audience:** Frontend / Mobile developers

---

## Overview

The cart module handles the full shopping cart lifecycle for both **guest** and **authenticated** customers.

All cart data is zone-aware (UAE, KSA, etc.), currency-aware, and scoped to the correct legal entity and D365 pricing/inventory context automatically — the frontend does not need to handle any of that logic directly.

---

## Base URL

```
https://<api-host>/storefront/cart
```

All responses use the global envelope:

```json
{
  "success": true,
  "statusCode": 200,
  "code": "SUCCESS",
  "message": "Success",
  "data": { ... },
  "error": null,
  "errors": [],
  "meta": {
    "timestamp": "2026-08-11T06:00:00.000Z",
    "path": "/storefront/cart",
    "requestId": "uuid"
  }
}
```

The actual cart object lives inside `data`.

---

## Authentication — Guest vs Logged-in

All cart endpoints use **optional JWT auth**. Both guest and customer flows use the same endpoints.

### Guest flow

- Generate a **UUIDv4** on first visit and store it in `localStorage` as `guestToken`
- Pass `guestToken` as a query param on every cart request
- Do **not** send an `Authorization` header

### Authenticated flow

- Send `Authorization: Bearer {accessToken}` header
- Do **not** pass `guestToken` — the JWT `customerId` is authoritative and overrides everything
- The backend automatically merges any existing guest cart into the customer's cart on first authenticated request

### After login

1. User logs in → receive `accessToken`
2. Call `POST /storefront/cart` with the JWT header (and optionally `cartId` of the previous guest cart)
3. Backend merges the guest cart and returns the merged cart
4. Store the new `cartId` and discard the old guest `cartId`

---

## Context Query Parameters

Every cart endpoint accepts these query params to identify the market/zone context:

| Param | Type | Required | Example | Notes |
|---|---|---|---|---|
| `zoneCode` | string | Recommended | `uae` | lowercase; identifies the market |
| `salesChannelCode` | string | Recommended | `platform_uae` | identifies the channel |
| `countryCode` | string | Optional | `AE` | falls back to zone default |
| `currencyCode` | string | Optional | `AED` | falls back to zone default |
| `languageCode` | string | Optional | `en` | |
| `cartId` | UUID | Required for modify ops | `uuid` | required for update/remove/clear/validate |
| `guestToken` | string | Guest only | `uuid` | your locally stored anonymous ID |
| `customerId` | UUID | Deprecated | — | ignored when JWT Bearer is sent |

**Send `zoneCode` and `salesChannelCode` on every request.** If you omit them, the backend will attempt to resolve the context from any existing cart, but explicitly providing them is safer.

---

## Endpoints

---

### 1. Create or Resolve Cart

```
POST /storefront/cart
```

Creates a new cart or returns the existing active cart for this identity.  
**Call this before the first add-to-cart, or on app/page load to restore cart state.**

**Query params:** `zoneCode`, `salesChannelCode`, `guestToken` (guest only)

**Request body (all fields optional):**

```json
{
  "metadata": {},
  "acquisition": {
    "source": "google",
    "medium": "cpc",
    "campaign": "summer-sale-2026",
    "term": "oud perfume",
    "content": "banner-a",
    "landingPath": "/collections/oud",
    "referrerHost": "google.com",
    "gclid": "...",
    "fbclid": "...",
    "msclkid": "...",
    "ttclid": "..."
  },
  "visitorId": "uuid-v4",
  "behaviorSessionId": "uuid-v4",
  "behaviorConsentStatus": "GRANTED"
}
```

> `acquisition` fields are analytics attribution only (UTM / click IDs). Pass them when available.  
> `behaviorConsentStatus` values: `GRANTED` | `DENIED` | `UNKNOWN`

**Response:** Cart object (see [Cart Response Shape](#cart-response-shape))

---

### 2. Get Active Cart

```
GET /storefront/cart
```

Returns the current active cart.  
Returns `404` if no active cart exists for this identity — call `POST /storefront/cart` first.

**Query params:** `zoneCode`, `salesChannelCode`, `cartId` (recommended), `guestToken` (guest only)

**Response:** Cart object

---

### 3. Add Item to Cart

```
POST /storefront/cart/items
```

Adds a product variant to the cart. If no `cartId` is passed, a new cart is created automatically.

**Query params:** `zoneCode`, `salesChannelCode`, `cartId` (if cart already exists), `guestToken` (guest only)

**Request body:**

```json
{
  "sku": "AAPR141301",
  "quantity": 1
}
```

OR use `variantId` instead of `sku`:

```json
{
  "variantId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "quantity": 2
}
```

> At least one of `sku` or `variantId` is required. `sku` is preferred when you have it.

Optional analytics fields (same as create cart):

```json
{
  "sku": "AAPR141301",
  "quantity": 1,
  "acquisition": { "source": "pdp-add-to-cart" },
  "visitorId": "uuid",
  "behaviorSessionId": "uuid",
  "behaviorConsentStatus": "GRANTED"
}
```

**Response:** Updated cart object

---

### 4. Update Item Quantity

```
PATCH /storefront/cart/items/:cartItemId
```

Updates the quantity of a specific cart item. Use `cartItemId` from the items array.  
**`cartId` in query is required.**

**Query params:** `cartId` (required), `guestToken` (guest only)

**Request body:**

```json
{
  "quantity": 3
}
```

> `quantity` must be >= 1. To remove an item, use the DELETE endpoint instead.

**Response:** Updated cart object

---

### 5. Remove Item

```
DELETE /storefront/cart/items/:cartItemId
```

Removes a specific item from the cart.  
**`cartId` in query is required.**

**Query params:** `cartId` (required), `guestToken` (guest only)

**Response:** Updated cart object

---

### 6. Clear All Items

```
DELETE /storefront/cart/items
```

Removes all items from the cart (empties the cart but keeps the cart record).  
**`cartId` in query is required.**

**Query params:** `cartId` (required), `guestToken` (guest only)

**Response:** Cart object with empty `items` array

---

### 7. Validate Cart

```
POST /storefront/cart/validate
```

Re-validates all cart items against live pricing and inventory.  
**Always call this before proceeding to checkout.**

**Query params:** `zoneCode`, `salesChannelCode`, `guestToken` (guest only)

**Request body:**

```json
{
  "cartId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

**Response:** Cart object with `validation` block fully populated

---

## Cart Response Shape

Every endpoint returns the same structure inside `data`:

```json
{
  "cartId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "ACTIVE",
  "context": {
    "zoneId": "uuid",
    "zoneCode": "uae",
    "legalEntityCode": "URD1",
    "salesChannelId": "uuid",
    "salesChannelCode": "platform_uae",
    "countryCode": "AE",
    "currencyCode": "AED",
    "languageCode": "en"
  },
  "items": [
    {
      "cartItemId": "uuid",
      "productId": "uuid",
      "variantId": "uuid",
      "sku": "AAPR141301",
      "productName": "Duqoor Al Dubai",
      "variantName": null,
      "quantity": "2",
      "unitPriceEstimate": "150.00",
      "lineSubtotalEstimate": "300.00",
      "currencyCode": "AED",
      "sellabilitySummary": {
        "isSellable": true,
        "hasValidPrice": true,
        "hasAvailableInventory": true,
        "blockReasons": []
      },
      "warnings": []
    }
  ],
  "itemCount": 1,
  "totalQuantity": "2",
  "subtotalEstimate": "300.00",
  "discountEstimate": "0",
  "taxEstimate": "0",
  "shippingEstimate": "0",
  "totalEstimate": "300.00",
  "currency": "AED",
  "validation": {
    "isValid": true,
    "errors": [],
    "warnings": []
  },
  "updatedAt": "2026-08-11T06:00:00.000Z",
  "metadata": null
}
```

---

## Field Reference

### Top-level cart fields

| Field | Type | Description |
|---|---|---|
| `cartId` | UUID string | Store this — pass as `cartId` query param on all subsequent requests |
| `status` | string | `ACTIVE` (normal state) |
| `context` | object | Resolved zone/market context for this cart |
| `items` | array | Active items in the cart |
| `itemCount` | number | Number of distinct line items |
| `totalQuantity` | string (Decimal) | Total units across all items |
| `subtotalEstimate` | string (Decimal) | Sum of all line subtotals before discounts/tax |
| `discountEstimate` | string (Decimal) | Applied discount total |
| `taxEstimate` | string (Decimal) | Estimated tax |
| `shippingEstimate` | string (Decimal) | Estimated shipping |
| `totalEstimate` | string (Decimal) | Final estimated total |
| `currency` | string | Currency code (e.g. `AED`) |
| `validation` | object | Populated after `POST /validate`; partial data otherwise |
| `updatedAt` | ISO 8601 string | Last modification time |
| `metadata` | object or null | FE-controlled arbitrary metadata |

> **Important:** All price/total fields are **strings (Decimal type)** — parse them with a Decimal library (e.g. `decimal.js`), not as `parseFloat`. Display with 2 decimal places.

### Cart item fields

| Field | Type | Description |
|---|---|---|
| `cartItemId` | UUID string | Use this on update/remove requests |
| `productId` | UUID or null | Platform product ID |
| `variantId` | UUID or null | Platform variant ID |
| `sku` | string | D365 item code / variant SKU |
| `productName` | string or null | Display name |
| `variantName` | string or null | Variant label if applicable |
| `quantity` | string (Decimal) | Current quantity in cart |
| `unitPriceEstimate` | string or null | Price per unit (from D365 pricing) |
| `lineSubtotalEstimate` | string or null | `unitPrice × quantity` |
| `currencyCode` | string or null | Currency for this item |
| `sellabilitySummary` | object | Live sellability status |
| `warnings` | array | Price-change warnings for this item |

### Sellability summary fields

| Field | Type | Description |
|---|---|---|
| `isSellable` | boolean | `true` if item can proceed to checkout |
| `hasValidPrice` | boolean | `false` if no D365 price exists |
| `hasAvailableInventory` | boolean | `false` if stock insufficient |
| `blockReasons` | string[] | Codes explaining why item is blocked |

---

## Validation Issues

### Errors (item is blocked — cannot checkout)

| Type | Meaning | Recommended UX |
|---|---|---|
| `PRODUCT_NOT_VISIBLE` | Product hidden for this zone | Show "Unavailable" badge, remove from cart |
| `PRODUCT_NOT_SELLABLE` | Blocked by D365 or platform rules | Show "Unavailable" badge |
| `VARIANT_INACTIVE` | Variant was deactivated | Show "Unavailable" badge |
| `PRICE_MISSING` | No valid D365 price found | Show "Price unavailable" |
| `INVENTORY_MISSING` | No inventory data for this item | Show "Out of stock" |
| `INSUFFICIENT_INVENTORY` | Requested qty > available stock | Show "Only X left" |
| `CURRENCY_MISMATCH` | Cart currency changed since item was added | Prompt cart refresh |
| `LEGAL_ENTITY_MISSING` | Zone config issue | Show generic error, contact support |

### Warnings (item can still proceed)

| Type | Meaning | Recommended UX |
|---|---|---|
| `PRICE_CHANGED` | Price changed since item was added | Show "Price updated" notice per item before checkout |

### Validation UX rules

- If `validation.isValid = false` → **block the checkout button**, show per-item errors
- If `validation.warnings` contains `PRICE_CHANGED` → show a banner "Prices have been updated" before proceeding
- Always call `POST /validate` before proceeding to checkout
- After validation, the cart item `sellabilitySummary.isSellable` reflects the latest state

---

## Error Responses

All errors follow the global envelope with `"success": false`.

| HTTP | Code | Trigger |
|---|---|---|
| `404` | `CART_NOT_FOUND` | GET cart and no active cart exists |
| `404` | `CART_ITEM_NOT_FOUND` | Update/remove with invalid `cartItemId` |
| `422` | `CART_ID_REQUIRED` | update/remove/clear/validate called without `cartId` |
| `403` | `FORBIDDEN` | Trying to access a cart that belongs to someone else |
| `400` | `VARIANT_RESOLUTION_FAILED` | Add item with invalid `variantId` or `sku` |
| `400` | `CART_ITEM_NOT_SELLABLE` | Item exists but cannot be added (blocked in zone) |
| `400` | `CART_INSUFFICIENT_INVENTORY` | Requested quantity exceeds available stock |
| `400` | `CART_INVALID_QUANTITY` | Quantity is less than 1 |
| `400` | `CART_CONTEXT_RESOLUTION_FAILED` | Zone/channel context cannot be resolved |

**Error response shape:**

```json
{
  "success": false,
  "statusCode": 404,
  "code": "CART_NOT_FOUND",
  "message": "Cart not found: uuid",
  "data": null,
  "error": {
    "code": "CART_NOT_FOUND",
    "message": "Cart not found: uuid"
  },
  "errors": [],
  "meta": {
    "timestamp": "2026-08-11T06:00:00.000Z",
    "path": "/storefront/cart",
    "requestId": "uuid"
  }
}
```

---

## Complete Request Examples

### Create cart (guest)

```http
POST /storefront/cart?zoneCode=uae&salesChannelCode=platform_uae&guestToken=a1b2c3d4-...
Content-Type: application/json

{}
```

### Create cart (authenticated)

```http
POST /storefront/cart?zoneCode=uae&salesChannelCode=platform_uae
Authorization: Bearer eyJhbGciOiJSUzI1NiJ9...
Content-Type: application/json

{}
```

### Add item (guest, no prior cart)

```http
POST /storefront/cart/items?zoneCode=uae&salesChannelCode=platform_uae&guestToken=a1b2c3d4-...
Content-Type: application/json

{
  "sku": "AAPR141301",
  "quantity": 1
}
```

### Add item (guest, existing cart)

```http
POST /storefront/cart/items?zoneCode=uae&salesChannelCode=platform_uae&guestToken=a1b2c3d4-...&cartId=3fa85f64-...
Content-Type: application/json

{
  "sku": "AAPR141301",
  "quantity": 2
}
```

### Update quantity

```http
PATCH /storefront/cart/items/item-uuid-here?cartId=3fa85f64-...&guestToken=a1b2c3d4-...
Content-Type: application/json

{
  "quantity": 3
}
```

### Remove item

```http
DELETE /storefront/cart/items/item-uuid-here?cartId=3fa85f64-...&guestToken=a1b2c3d4-...
```

### Clear cart

```http
DELETE /storefront/cart/items?cartId=3fa85f64-...&guestToken=a1b2c3d4-...
```

### Validate before checkout

```http
POST /storefront/cart/validate?zoneCode=uae&salesChannelCode=platform_uae&guestToken=a1b2c3d4-...
Content-Type: application/json

{
  "cartId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

---

## Recommended Frontend Implementation Flow

```
1. On app load
   ├── Read guestToken from localStorage (or generate UUIDv4 and store it)
   ├── Read cartId from localStorage (if previously stored)
   └── Call GET /storefront/cart to restore cart state
       └── If 404 → no active cart yet (do not call POST yet, wait for first add-to-cart)

2. User clicks Add to Cart
   ├── Call POST /storefront/cart/items
   │   ├── Pass cartId query param if you already have one
   │   └── Pass guestToken if guest
   └── Save cartId from response.data.cartId to localStorage

3. User updates quantity in cart
   └── Call PATCH /storefront/cart/items/:cartItemId?cartId=...

4. User removes item
   └── Call DELETE /storefront/cart/items/:cartItemId?cartId=...

5. User logs in
   ├── Call POST /storefront/cart with Authorization header
   │   └── Backend auto-merges guest cart
   ├── Store new cartId from response
   └── Clear guestToken from localStorage (no longer needed)

6. User proceeds to checkout
   ├── Call POST /storefront/cart/validate
   ├── If validation.isValid = false → block checkout, show errors per item
   ├── If validation.warnings has PRICE_CHANGED → show price-updated notice
   └── If validation.isValid = true → proceed to checkout module
```

---

## localStorage Keys (Suggested)

| Key | Value | Notes |
|---|---|---|
| `sa_guest_token` | UUIDv4 string | Generate once, persist permanently for guest |
| `sa_cart_id` | UUID string | Update on every cart create/merge |

---

## Important Notes

1. **Prices are estimates.** All price fields (`unitPriceEstimate`, `subtotalEstimate`, `totalEstimate`, etc.) are approximate, sourced from D365 pricing at add-time. Final confirmed amounts are set at checkout.

2. **Prices are strings, not numbers.** All monetary values are Decimal strings (e.g. `"150.00"`). Use a Decimal library for arithmetic; do not use `parseFloat`.

3. **Cart TTL is 30 days.** An inactive cart expires after 30 days. On expiry, `GET /storefront/cart` returns 404 — create a new cart.

4. **quantity is also a string.** The `quantity` field on items returns as a Decimal string (e.g. `"2"`). Parse as integer with `parseInt`.

5. **Do not display `taxEstimate` / `shippingEstimate` as confirmed.** These are placeholder zeros until checkout resolves them.

6. **`metadata` is FE-controlled.** You can pass any JSON object as `metadata` on create/add. The backend stores it and returns it. Useful for storing FE-specific state (e.g. `{ "giftWrap": true }`). Sensitive keys (token, secret, password, credential, apiKey) are automatically stripped.

7. **`acquisition` is analytics-only.** Passing UTM/click-ID data in `acquisition` on create/add-item triggers attribution capture for analytics. It has no effect on cart prices or behaviour.

8. **Ownership is enforced.** You cannot read or modify another customer's cart. Attempting to do so returns `403 FORBIDDEN`.
