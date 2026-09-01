# Insider — Wave 2 events and journeys

**As of:** 2026-09-01  
**Repos:** `swiss-arabian-backend` (this file) · `swiss-arabian-website` (Web SDK)  
**Partner (Azure Dev / UAT):** `swissarabianuatnew` · Account ID `10015366`  
**Direction:** Outbound only. We push events and page types **to** Insider. Journeys, WhatsApp, email, and web push are built **inside Insider Architect by CRM** — not in our code.

This document is the Wave 2 source of truth. Do not follow `INSIDER_FRONTEND_INTEGRATION_GUIDE.md` for SDK calls (`identify` / `setItem` / `addItem` are wrong for this partner). Phase 1 as-built: website `INSIDER_IMPLEMENTED_EVENTS.md` (2026-09-01).

---

## 1. How events vs journeys split

| Layer | Owner | What it is |
|---|---|---|
| **Events / page types** | SIGI (FE Web SDK + BE BullMQ) | Data Insider can trigger on |
| **UCD / collection flags** | Insider partner team | Turns payloads into User Profiles + Architect product attributes |
| **Journeys** | Swiss Arabian CRM in Architect | Welcome, cart abandon, browse abandon, checkout abandon, post-purchase |

We do **not** build journey graphs in NestJS. If a journey cannot start, either an event is missing, a page type is wrong (`other` instead of `cart` / `product`), or a partner collection flag is off.

---

## 2. Phase 1 — live on Azure (do not redo)

| # | Signal | Who | Insider name | Journeys it can already feed |
|---|---|---|---|---|
| 1 | `{ type: "user" }` | FE | Identify / cookie stitch | All identified journeys |
| 2 | `{ type: "product" }` + `init` | FE | `product_detail_page_view` | Browse abandon **once UCD is on** |
| 3 | `{ type: "add_to_cart" }` | FE | `item_added_to_cart` | Cart abandon starter (verified in User Profiles) |
| 4 | `{ type: "other" }` + `init` | FE | `other_page_view` | Too coarse — **Wave 2 replaces this** |
| 5 | `Insider.track.logout()` | FE | Logout | Session unlink |
| 6 | `user_register` | BE Upsert API | `user_register` | Welcome / onboarding |
| 7 | `purchase` | BE Event Collect | `purchase` | Post-purchase; **exit** for abandon journeys |

**Still true:**

- `purchase` and `user_register` stay **backend-only**.
- Add-to-cart fires only after `POST /storefront/cart/items` returns 200.
- All `window.Insider` / `InsiderQueue` access stays in `src/lib/insider.ts`.
- Failures are swallowed — never break auth, cart, or checkout.
- `localhost` does not initialize (`window.Insider.initialized === false`). Test on Azure Dev.

---

## 3. Why abandon journeys are not really live yet

Payloads for PDP and add-to-cart are already sent. Architect still cannot personalize “item in cart / last browsed product” until the partner turns collection on.

Verified on Azure Dev (storefront, 2026-09-01):

| Flag / check | Status |
|---|---|
| `window.Insider.initialized` | `true` on Azure Dev |
| `insiderObject.page.type` on PDP | `"Product"` with name / SKU / price |
| User Profiles → `product_detail_page_view` | **Not collected** |
| Latest Visited Product | Empty |
| `eventCollectionStatus.productPage` | `false` |
| `UCDBrowseAbandonmentCollectionStatus` | `false` |
| Network `hit` | Often `page_type: "other"`, `ucd: false` |
| Add to cart in User Profiles | **Works** |

Blanket `{ type: "other" }` on every non-PDP route also means **no** `home_page_view`, `listing_page_view`, `cart_page_view`, or checkout page view. Cart abandon can start from `item_added_to_cart`, but cart contents and checkout abandon stay weak until page types + cart snapshot exist.

---

## 4. Journey map (what CRM can turn on, and what we must send)

| Journey (Architect) | Starter | Exit / goal | We send | Blocker today |
|---|---|---|---|---|
| **Welcome / onboarding** | `user_register` | First purchase | BE upsert (live) | Consent attrs are `null` (Wave 2B). Channel (email/WhatsApp) is CRM + Insider. |
| **Browse abandonment** | `product_detail_page_view` | Add to cart or purchase | FE product + init (live) | **Partner UCD off.** |
| **Cart abandonment** | `item_added_to_cart` | Purchase | FE add_to_cart (live) | Need **cart page + cart snapshot + remove_from_cart** + partner “Cart/Browsed/Purchased Items from Event Parameters”. |
| **Checkout abandonment** | Checkout page view | Purchase | FE currently sends `other` | Wave 2A: `{ type: "checkout" }` (or `custom_event` if partner has no checkout page type). Optional BE `checkout_started` later. |
| **Post-purchase / cross-sell** | `purchase` | Repeat purchase | BE collect (live) | CRM builds the journey. Optional later: shipped / delivered. |
| **Wishlist reminder** | Wishlist add | Purchase | Not implemented | Wishlist not live on storefront. Skip until the feature ships. |
| **Win-back / NPS** | Days after purchase | — | `purchase` is enough to start | CRM timing. Optional BE cancel/refund later so we do not message refunded orders. |

Insider docs: [Web SDK](https://academy.insiderone.com/docs/insider-web-sdk-integration-guide), [Cart abandon](https://academy.insiderone.com/docs/architect-cart-abandonment), [Browse abandon](https://academy.insiderone.com/docs/architect-use-case-browse-abandonment), [Welcome](https://academy.insiderone.com/docs/architect-welcome-onboarding).

---

## 5. Wave 2A — recommended next slice (unlock abandon)

**Goal:** Correct page types + cart truth so CRM can launch browse / cart / checkout abandon without waiting on new backend APIs.

**Owner:** storefront (`swiss-arabian-website`). Backend: no new endpoints. Partner: two collection flags (section 8).

### 5.1 Replace blanket `other`

`InsiderScripts` today: every pathname except `/products/*` → `{ type: "other" }` + `init`.

Change to **one page type per route**, then `init`. Never push two page types before one `init`.

| Route pattern (storefront) | Queue type | Insider event | Notes |
|---|---|---|---|
| `/` (home) | `home` | `home_page_view` | Custom params allowed; defaults are automatic. |
| Listing / collection / search PLP | `category` | `listing_page_view` | `value.items` optional; `taxonomy` if known. |
| `/products/:slug` | `product` | `product_detail_page_view` | **Already implemented** in `ProductDetailPageView`. Do not also fire `other` or a second product from `InsiderScripts`. |
| Cart page | `cart` | `cart_page_view` | **Must include current line items** (section 5.2). |
| Checkout flow | `checkout` | Checkout page view | Confirm with Insider if this partner’s `ins.js` accepts `type: "checkout"`. If not, use `custom_event` named `checkout_started` (must exist in Attributes & Events). |
| Account, login, content, 404, etc. | `other` | `other_page_view` | Keep `other` only here. |
| Order confirmation | **Do not** send `{ type: "purchase" }` | — | Backend already sends `purchase` on `PAID`. Confirmation page = `other` (or skip extra init). |

SPA: on every client-side navigation, push the new page type then `init` (Insider treats `init` as the virtual page change).

### 5.2 Cart snapshot (`type: "cart"`)

On the **cart page** (and optionally after every successful cart mutation if the mini-cart is open), push the **full current cart**, then `init`:

```js
{
  type: "cart",
  value: {
    total: number,           // cart merchandise + known shipping/tax if already quoted; else merchandise total
    items: [
      {
        id: variantId,       // same id family as add_to_cart
        name: title,
        taxonomy: [category], // or []
        unit_price: number,
        unit_sale_price: number, // same as unit_price until promos split
        quantity: number,
        url: `${origin}/products/${slug}`,
        product_image_url: imageUrl || "",
        sku: sku,            // if wrapper allows extra keys; else put sku in custom
        custom: { currency: "AED" }
      }
    ]
  }
}
```

Then `{ type: "init" }`.

Do **not** send `{ type: "cart" }` on PDP as the page type (that would overwrite Product). Cart snapshot as **user data** on every page is optional later; Wave 2A only requires it on the cart route.

### 5.3 Remove from cart (`type: "remove_from_cart"`)

Mirror add-to-cart: fire **only after** `DELETE /storefront/cart/items/:id` returns **200**. No following `init`.

Same `value` shape as `add_to_cart` (id, name, taxonomy, prices, url, image, quantity removed).

**Quantity PATCH** (`PATCH /storefront/cart/items/:id` 200):

| Change | Queue |
|---|---|
| Qty increased by N | `{ type: "add_to_cart", value: { …, quantity: N } }` |
| Qty decreased by N | `{ type: "remove_from_cart", value: { …, quantity: N } }` |
| Line removed | `{ type: "remove_from_cart" }` with the line’s last quantity |
| Clear cart | One `remove_from_cart` per line **or** empty cart snapshot + `init` on cart page |

Hook this in `useCartMutations` the same way `useAddToCart` already calls `insiderAddToCart()` after POST 200. UI must not call Insider directly.

### 5.4 Suggested wrappers (website `src/lib/insider.ts` only)

Keep existing: `insiderIdentify`, `insiderProductViewed`, `insiderAddToCart`, `insiderOtherPage`, `insiderLogout`.

Add:

| Function | Queue |
|---|---|
| `insiderHomePage()` | `home` + `init` |
| `insiderListingPage({ taxonomy?, items? })` | `category` + `init` |
| `insiderCartPage(cart)` | `cart` + `init` |
| `insiderCheckoutPage()` | `checkout` + `init` (or `custom_event` fallback) |
| `insiderRemoveFromCart(item)` | `remove_from_cart` only |

`InsiderScripts` should **route by pathname** into these helpers, not always `insiderOtherPage`.

### 5.5 Hygiene (same slice if cheap)

Home Shaghaf / Best Sellers featured add-to-cart still sends mock ids / hardcoded `USD`. Use real catalog `variantId`, SKU, currency (same as `ProductCard`) or **do not** fire Insider from those buttons.

### 5.6 Wave 2A done when

- [x] Storefront sends `home` / `category` / `cart` / `checkout` / `other` by route (verify User Profiles on Azure Dev)
- [x] Listing → `listing_page_view` (`type: "category"`)
- [x] Cart route sends `cart` snapshot with current lines
- [x] Checkout flow sends `type: "checkout"` (confirm partner accepts it)
- [x] Remove line / qty down after API 200 → `remove_from_cart`
- [x] PDP still skipped in `InsiderScripts` (Product from `ProductDetailPageView`)
- [x] Confirmation / payment success send `other`, not FE purchase
- [ ] Partner flags in section 8 confirmed on (browse + cart item attributes)

---

## 6. Wave 2B — backend (after 2A, or in parallel if CRM asks)

No new HTTP for storefront. Same BullMQ + `InsiderEventPublisherService` pattern. Never block checkout.

| Event | When | API | Why |
|---|---|---|---|
| Consent on `user_register` | Self-service register if we store marketing/SMS flags | Upsert attrs `gdpr_optin` / `sms_optin` | Today always `null`. Welcome WhatsApp/email needs opt-in. |
| `checkout_started` | After `POST /storefront/checkout/from-cart` succeeds, if `customerId` exists | Event Collect | Belt-and-suspenders if FE checkout page type is flaky. Skip guests without identifiers unless CRM wants anonymous. |
| `order_cancelled` | First cancel of a previously paid (or unpaid) order — confirm with CRM | Event Collect | Stop abandon / post-purchase messages. |
| `refund` / `order_refunded` | Refund recorded | Event Collect | Same. |
| Guest `purchase` | First `PAID` **without** `customerId` | Event Collect | Today skipped. Only if CRM wants guest revenue in Architect; identify with email/phone from the order snapshot. |

Do **not** add wishlist, search impressions, or shipment events until the storefront feature exists and CRM names the journey.

---

## 7. Out of scope (until explicitly asked)

- Insider inbound webhooks
- Building Architect journeys in code
- FE `track.purchase` / FE `user_register`
- `Insider.identify`, `track.setItem`, `track.addItem` (undefined on this partner)
- Cookie consent gate (load `ins.js` behind a banner) — legal/CRM, not abandon-event work
- Wishlist / search impression events
- Writing to Shopify

---

## 8. Need from Insider / CRM (do not invent)

Need from Insider UAE partner (`swissarabianuatnew`):

1. Turn **on** Product Detail Page View collection into UCD (`eventCollectionStatus.productPage`).
2. Turn **on** **Cart/Browsed/Purchased Items from Event Parameters** (and browse-abandon UCD if separate).
3. Confirm whether this partner’s Web SDK accepts `{ type: "checkout" }` or we must register a custom event `checkout_started` in Attributes & Events.
4. Confirm which **channels** Wave 2 journeys will use (email / WhatsApp / web push) so we know if `gdpr_optin` / `sms_optin` are blocking.

Paste back: screenshot or text of collection flags + checkout page-type answer.

Ready-to-copy:

```text
Please enable for partner swissarabianuatnew (id 10015366):
1) Product Detail Page View → UCD
2) Cart/Browsed/Purchased Items from Event Parameters
Confirm: does Web SDK type "checkout" work on this account, or should we send custom_event checkout_started?
Which channels will you use for welcome / cart abandon / browse abandon (email, WhatsApp, web push)?
```

---

## 9. Backend reference (already live)

| Item | Value |
|---|---|
| Module | `src/modules/integrations/insider/` |
| Queue | `insider-events` |
| Register | `PlatformCustomerRegistrationService` → `publishUserRegister` (self-service only) |
| Purchase | `OrderLifecycleService` first `PAID` **with** `customerId` → `publishPurchase` |
| Env | `INSIDER_ENABLED=true`, `INSIDER_PARTNER_NAME`, `INSIDER_API_KEY` |
| Skip | Missing flag/key, or `REDIS_ENABLED=false` (stub) |

`INSIDER_WORKER_ENABLED` is **unused**; the processor only checks `INSIDER_ENABLED`.

---

## 10. Implementation order

1. CRM/Insider: section 8 flags (can start immediately; unblocks browse abandon on existing PDP hits).
2. Website Wave 2A (this slice): page types + cart snapshot + `remove_from_cart`.
3. Verify on Azure Dev User Profiles (section 5.6).
4. CRM: switch on Architect journeys (welcome, browse, cart, checkout, post-purchase).
5. Backend Wave 2B only when CRM names consent / cancel / guest purchase as blockers.

Website implementation chat should attach this file and ignore the old `setItem` / `addItem` guide.
