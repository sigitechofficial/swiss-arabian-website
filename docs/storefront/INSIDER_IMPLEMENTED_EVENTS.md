# Insider — implemented events (storefront)

**Repo:** `swiss-arabian-website`  
**As of:** 2026-09-01  
**Scope:** What the storefront actually sends today via the Insider **Web SDK** (`InsiderQueue`).

This is a one-way push. The website does **not** receive Insider webhooks.  
`purchase` and `user_register` are **backend BullMQ only** — never fire them from this repo.

**Wiring:** `src/lib/insider.ts` is the only file that touches `window.Insider` / `window.InsiderQueue`.

---

## Partner (Azure Dev / UAT)

| Item | Value |
|---|---|
| Partner name | `swissarabianuatnew` |
| Account ID | `10015366` |
| Script | `https://swissarabianuatnew.api.useinsider.com/ins.js?id=10015366` |
| Storefront | `https://ca-swissarabian-website-dev.greenbush-d5b07575.uaenorth.azurecontainerapps.io` |

Insider partner site host is **`uae.swissarabian.com`**. `localhost` does **not** initialize (`window.Insider.initialized === false`). Test on Azure Dev or an allowed host.

---

## SDK load

Root layout `<head>`:

1. `window.InsiderQueue = window.InsiderQueue || []`
2. `ins.js` when `NEXT_PUBLIC_INSIDER_ENABLED !== false` **and** `NEXT_PUBLIC_INSIDER_ACCOUNT_ID` is set
3. `InsiderScripts` waits until `window.Insider.initialized === true`, then flushes queued calls

| Variable | Role |
|---|---|
| `NEXT_PUBLIC_INSIDER_ENABLED` | Kill switch (default `true`) |
| `NEXT_PUBLIC_INSIDER_ACCOUNT_ID` | Required; empty = no script, no events |
| `NEXT_PUBLIC_INSIDER_SCRIPT_HOST` | CDN host (UAT: `swissarabianuatnew.api.useinsider.com`) |

Backend secrets (`INSIDER_API_KEY`, `X-REQUEST-TOKEN`) stay **backend-only**.

---

## Event map

| # | Queue / SDK call | Insider meaning | Who | Status |
|---|---|---|---|---|
| 1 | `{ type: "user" }` (+ `init` only if SDK already up) | Identify / cookie stitch | **Frontend** | Implemented |
| 2 | `{ type: "product" }` + `{ type: "init" }` | Product detail page view | **Frontend** | Implemented |
| 3 | `{ type: "add_to_cart" }` | Item added to cart | **Frontend** | Implemented |
| 4 | `{ type: "home" }` + `init` | Home page view | **Frontend** | Implemented (Wave 2A) |
| 5 | `{ type: "category" }` + `init` | Listing / collection / search | **Frontend** | Implemented (Wave 2A) |
| 6 | `{ type: "cart" }` + `init` | Cart page + line snapshot | **Frontend** | Implemented (Wave 2A) |
| 7 | `{ type: "checkout" }` + `init` | Checkout flow | **Frontend** | Implemented (Wave 2A) |
| 8 | `{ type: "other" }` + `init` | Account, login, confirmation, etc. | **Frontend** | Implemented |
| 9 | `{ type: "remove_from_cart" }` | Item removed / qty decreased | **Frontend** | Implemented (Wave 2A) |
| 10 | `window.Insider.track.logout()` | Logout / session unlink | **Frontend** | Implemented |
| 11 | `user_register` (Upsert API) | Registration profile + event | **Backend** | Not in this repo |
| 12 | `purchase` (Event Collect API) | Paid order | **Backend** | Not in this repo |

Do **not** use `Insider.identify`, `track.setItem`, or `track.addItem`. This partner SDK has `Insider.track.setItem === undefined`. Product and cart go through **`InsiderQueue` only**.

---

## 1. Identify — `{ type: "user" }`

**Wrapper:** `insiderIdentify()`  
**File:** `src/features/auth/lib/applyAuthSession.ts` → `stitchInsiderSession()`

Stitches the anonymous browser cookie to the known customer. This is **not** backend `user_register`.

### When it fires

| Trigger | Path |
|---|---|
| Password login | `LoginPageView` → `applyAuthResult` |
| Email-code login | `LoginPageView` → `applyAuthResult` |
| Register | `RegisterPageView` → `applyAuthResult` |
| Session restore (refresh) | `AuthSessionProvider` → `GET /storefront/customer/me` → `applyCustomerProfile` |
| Email verify | `VerifyPageView` → `applyCustomerProfile` |

Login / register pages do not call Insider themselves.

### Queue payload

```js
{
  type: "user",
  value: {
    uuid: customer.id,
    email: customer.email,              // omitted if empty
    phone_number: customer.phoneE164,   // omitted if empty
    name: customer.firstName,           // omitted if empty
    surname: customer.lastName,         // omitted if empty
    language: "en",
    custom: {
      first_name: customer.firstName,
      last_name: customer.lastName,
      zone_code: selectedMarketId || "UAE",
      locale: "en"
    }
  }
}
```

- Zone: `useUiStore.selectedMarketId`, else `DEFAULT_ZONE_CODE` (`UAE`)
- Locale: always `DEFAULT_LANGUAGE_CODE` (`en`)
- Extra `{ type: "init" }` **only if** `window.Insider.initialized === true` (SPA stitch). First load does **not** init here — that would send `page_type: "other"` and drop a later product hit.

### Verified

User Profiles show email / uuid / phone after login (e.g. Azure Dev).

---

## 2. Product detail page view — `{ type: "product" }` + `{ type: "init" }`

**Wrapper:** `insiderProductViewed()`  
**File:** `src/features/catalog/components/ProductDetailPageView.tsx`  
**Insider event name (when UCD collects it):** `product_detail_page_view`

Fires when PDP catalog `data` is present. Re-fires when navigating to another PDP. **Not** fired on listing, search, or home.

PDP must **not** send `other` — `InsiderScripts` skips paths that start with `/products/`.

### Queue payload (`value`)

```js
{
  type: "product",
  value: {
    id: data.variantId || data.id,
    sku: data.sku || data.variantId || data.id,
    name: data.title,
    taxonomy: [featuredOrFirstCollectionName],  // or []
    unit_price: data.price ?? 0,
    unit_sale_price: data.price ?? 0,           // same value; no promo split
    url: window.location.href,
    product_image_url: data.imageUrl || first gallery image || "",
    brand: data.brandName,                      // omitted if empty
    custom: { currency: data.currency || "AED" }
  }
}
```

Then `{ type: "init" }`.

### Verified vs blocked

| Check | Result |
|---|---|
| `window.Insider.initialized` | `true` on Azure Dev PDP |
| `window.Insider.insiderObject.page.type` | `"Product"` + name / SKU / price |
| User Profiles → Events → `product_detail_page_view` | **Not collected** (partner UCD off) |
| Latest Visited Product | **Empty** until Insider enables collection |
| Network `hit` | Often `page_type: "other"`, `ucd: false` — partner `ins.js` flags, not missing FE payload |

Partner `ins.js` currently has `eventCollectionStatus.productPage: false` and `UCDBrowseAbandonmentCollectionStatus: false`. Insider team must turn on **Product Detail Page View** into UCD and **Cart/Browsed/Purchased Items from Event Parameters**.

---

## 3. Add to cart — `{ type: "add_to_cart" }`

**Wrapper:** `insiderAddToCart()`  
**File:** `src/features/cart/hooks/useAddToCart.ts`  
**Insider event name:** `item_added_to_cart` (shown as Add to Cart in User Profiles)

Fires **only** after `POST /storefront/cart/items` returns **200**. Not on button click. Failed add: optimistic line reverted, toast, **no** Insider event.

No following `{ type: "init" }` (Insider Web SDK).

UI never calls Insider directly. PDP, `ProductCard`, and home sections all go through `useAddToCart`.

### Queue payload (`value`)

```js
{
  type: "add_to_cart",
  value: {
    id: payload.variantId,
    sku: sku || variantId,
    name: payload.title,
    quantity: line.quantity,            // default 1
    taxonomy: [category],               // or []
    unit_price: payload.unitPrice,
    unit_sale_price: payload.unitPrice,
    url: `${origin}/products/${slug}`,
    product_image_url: payload.imageUrl || "",
    brand: payload.brand,               // omitted if empty
    custom: { currency: payload.currency }
  }
}
```

### What each UI passes into the hook

| UI | sku | variantId | currency | category | brand |
|---|---|---|---|---|---|
| PDP | catalog SKU | catalog `variantId` | product currency (fallback AED) | featured / first collection | `brandName` |
| `ProductCard` | catalog SKU | catalog `variantId` | product currency (fallback AED) | `family` | often omitted |
| Home Shaghaf / Best Sellers featured button | often omitted | static mock id | may be hardcoded `USD` | static `family` | often omitted |

### Verified

User Profiles → Events shows Add to Cart (e.g. ROSE 01 PERFUME + OIL / abandoned cart).

---

## 4. Page types (Wave 2A) — one type + `init` per route

**File:** `src/components/layout/InsiderScripts.tsx`  
PDP is **not** sent from here — `ProductDetailPageView` already sends `product` + `init`.

| Route | Queue | Wrapper |
|---|---|---|
| `/` | `home` + `init` | `insiderHomePage()` |
| `/products`, `/search`, `/collections`, `/collections/:slug` | `category` + `init` | `insiderListingPage({ taxonomy })` |
| `/products/:slug` | skip (PDP owns it) | `insiderProductViewed()` |
| `/cart` | `cart` + `init` with current lines | `insiderCartPage(snapshot)` |
| `/checkout`, `/checkout/payment/stripe` | `checkout` + `init` | `insiderCheckoutPage()` |
| `/order-confirmation/:id`, `/checkout/payment/success`, `/checkout/payment/cancel`, account, auth, content | `other` + `init` | `insiderOtherPage()` |

Cart snapshot waits for Zustand persist hydration so an empty cart is not sent first. Cart mutations on other pages do **not** re-fire home/checkout page views.

### Cart snapshot `value`

```js
{
  type: "cart",
  value: {
    total: number,
    items: [ /* same product object as add_to_cart, with quantity */ ]
  }
}
```

---

## 5. Remove from cart — `{ type: "remove_from_cart" }`

**Wrapper:** `insiderRemoveFromCart()`  
**File:** `src/features/cart/hooks/useCartMutations.ts`  
**Insider event name:** `item_removed_from_cart`

Fires **only** after cart API **200**. Same product `value` shape as add-to-cart. No following `init`.

| Change | Queue |
|---|---|
| DELETE line 200 | `remove_from_cart` with the line’s last quantity |
| PATCH qty up by N | `add_to_cart` with `quantity: N` |
| PATCH qty down by N | `remove_from_cart` with `quantity: N` |
| Clear cart 200 | one `remove_from_cart` per line |
| Local-only cart (no `cartItemId`) | no Insider event |

Cart page `+/-` / trash uses `useCartMutations` (not local Zustand only).

---

## 6. Logout — `Insider.track.logout()`

**Wrapper:** `insiderLogout()`  
**File:** `src/lib/auth/endSession.ts` (first line, before tokens / Zustand / query / local cart clear)

| Trigger | Path |
|---|---|
| User logout | `performLogout` / `performLogoutAll` |
| 401 after refresh fails | `apiClient` |
| Account security sign-out | `AccountSecurityPageView` |
| Reset password | `ResetPasswordPageView` |

---

## Backend-owned (not this repo)

### `user_register`

After `POST /storefront/auth/register`. BullMQ → `POST https://unification.useinsider.com/api/user/v1/upsert`.

Frontend identify still runs on register (cookie stitch). Backend upserts profile attributes + the `user_register` event.

### `purchase`

When order payment first becomes `PAID`. BullMQ → Event Collect API. Order confirmation page does **not** call Insider.

---

## User flow as implemented

```
Guest opens any storefront page (allowed host)
  → ins.js loads
  → anonymous Insider cookie
  → home / category / cart / checkout / other + init
    (PDP skipped here)

Opens a product detail page
  → product + init

Adds to bag, cart API 200
  → add_to_cart
Adds to bag, cart API fails
  → no Insider event

Removes a line or decreases qty, API 200
  → remove_from_cart
Clears cart, API 200
  → remove_from_cart per line

Opens /cart
  → cart + init (full current lines)

Login / register
  → user  (+ init only if SDK already initialized)
Register also
  → backend user_register (not this repo)

Refresh while logged in
  → /me → user

Checkout payment confirmed
  → frontend does nothing
  → backend purchase

Logout / 401 session end
  → track.logout
```

---

## Not implemented on the frontend

| Item | Notes |
|---|---|
| `track.purchase` | Backend-only. Confirmation page sends `other`, not purchase. |
| `user_register` from FE | Backend-only |
| Listing `value.items` (product impressions) | Taxonomy only on PLP |
| Wishlist | Feature not live |
| Cookie / consent gate | `ins.js` loads whenever enabled + account ID set |
| Unit tests | None for Insider |
| Partner UCD product/browse collection | Insider team — not FE |

---

## Files

| File | Role |
|---|---|
| `src/lib/insider.ts` | Queue wrappers + types |
| `src/app/layout.tsx` | Empty `InsiderQueue` + `ins.js` in `<head>` |
| `src/components/layout/InsiderScripts.tsx` | SDK ready flush + page types by route |
| `src/lib/config/env.ts` | `env.insider` |
| `src/features/auth/lib/applyAuthSession.ts` | Identify |
| `src/lib/auth/endSession.ts` | Logout |
| `src/features/catalog/components/ProductDetailPageView.tsx` | Product view |
| `src/features/cart/hooks/useAddToCart.ts` | Add to cart after API success |
| `src/features/cart/hooks/useCartMutations.ts` | Remove / qty delta after API success |
| `src/features/cart/hooks/useAddCatalogProduct.ts` | Home static cards → catalog SKU before add |
| `src/features/cart/utils/insiderCartItem.ts` | Cart line → Insider product object |
| `.github/workflows/deploy-azure-dev.yml` | Bakes `NEXT_PUBLIC_INSIDER_*` into the Azure image |

---

## Guardrails

- No `window.Insider` / `InsiderQueue` outside `src/lib/insider.ts`
- Add-to-cart UI never calls Insider directly
- Add-to-cart / remove-from-cart only after cart API success
- No frontend `purchase` or `user_register`
- Failures swallowed (`try/catch`) — never break auth, cart, or checkout
- Empty account ID or `NEXT_PUBLIC_INSIDER_ENABLED=false` = no script and no events
