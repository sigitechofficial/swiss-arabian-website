# Insider — current status for backend

**Date:** 2026-09-04  
**For:** Nest `swiss-arabian-backend`  
**From:** Storefront `swiss-arabian-website`  
**Partner:** `swissarabianuatnew` · Account ID `10015366`  
**Azure Dev storefront:** https://ca-swissarabian-website-dev.greenbush-d5b07575.uaenorth.azurecontainerapps.io  
**Azure Dev API:** https://ca-swissarabian-backend-dev.greenbush-d5b07575.uaenorth.azurecontainerapps.io

This is the handoff of what we locked with Noor / Saad / Nest. Older FE guides that still mention `/event/v1/collect` or Web SDK `type: "checkout"` are outdated.

---

## 1. Split of ownership

| Layer | Owner | What |
|---|---|---|
| Web SDK (`ins.js` + `InsiderQueue`) | Frontend | Identify, page types, add/remove cart, logout |
| Unification upsert | Backend | `user_register`, `purchase`, `checkout_started`, `order_cancelled`, `order_refunded` |
| UCD flags, Architect, channels, UAE journeys | Saad / Insider / CRM | Not FE or Nest code |
| Azure Nest image + `INSIDER_STOREFRONT_BASE_URL` | DevOps / backend | Live consent + purchase URL |

Website never calls Unification. Backend never sends page views or add-to-cart.  
UCD token (`INSIDER_API_KEY` / `X-REQUEST-TOKEN`) is **backend-only**. Never `NEXT_PUBLIC_*`.

---

## 2. Frontend — done and verified on Azure Dev (2026-09-03)

Checkout uses the documented Web SDK method:

- Queue: `type: "other"` + `init` → `other_page_view`
- We do **not** send `type: "checkout"`
- Funnel start stays backend `checkout_started` on upsert

Azure Dev `/checkout` check: `initialized: true`, queue `other` + `init` (`processed: true`), `insiderObject.page.type = Other`.

### Page views (Azure Dev, `processed: true`)

| Route | Queue | Insider event |
|---|---|---|
| `/` | `home` + `init` | `home_page_view` |
| PLP / collections / search | `category` + `init` | `listing_page_view` |
| PDP `/products/:slug` | `product` + `init` | `product_detail_page_view` |
| `/cart` only | `cart` + `init` (line snapshot) | `cart_page_view` |
| Checkout | `other` + `init` | `other_page_view` |
| Account / login / confirmation | `other` + `init` | `other_page_view` |

Cart page view is **only** on `/cart`. Header/sidebar mini-cart is not a cart page view (our decision, not an Insider limitation).

### Still working (not changed)

- Identify after login/register (`type: user` — uuid / email / phone)
- Add to Cart after cart API 200 (`add_to_cart`)
- Remove from Cart after cart API 200 (`remove_from_cart`)
- Cart Clearance = one `remove_from_cart` per line after clear API 200
- Azure Dev Insider account ID / script host

Live ATC/remove check (ECOMTEST): `add_to_cart` then mini-cart remove → `remove_from_cart`, both `processed: true`. Mini-cart open did **not** send `type: cart`.

### Frontend does not send

- `purchase`
- `user_register`
- Channel opt-ins (`email_optin` / `sms_optin`) — register body only has `marketingConsent` / `smsConsent`; Nest maps them
- UCD token

`localhost` does not init Insider (`initialized: false`). Test on Azure Dev.

---

## 3. Backend — agreed in Nest (mapper + unit tests)

All events: **one URL only**

```http
POST https://unification.useinsider.com/api/user/v1/upsert
Content-Type: application/json
X-PARTNER-NAME: swissarabianuatnew
X-REQUEST-TOKEN: <UCD key, backend-only>
```

**Do not use** `/api/event/v1/collect` (404 on this partner). Collect is removed from the Nest client.

### Consent (Noor’s mapping — confirmed in Nest tests)

| Storefront register field | Insider attribute | Where |
|---|---|---|
| `marketingConsent` | `email_optin` | Top-level `attributes.email_optin` |
| `smsConsent` | `sms_optin` | Top-level `attributes.sms_optin` |

- Not under `attributes.custom`
- Null / missing → omit (do not overwrite)
- Do **not** send `whatsapp_optin`
- Do **not** map `marketingConsent` → `gdpr_optin`
- Login identify does not send opt-ins (FE). Backend login does not upsert.

### Events

| Event | Kind | When |
|---|---|---|
| `user_register` | Custom | Self-service `POST /storefront/auth/register` only. Not login. **No** `sign_up_confirmation` until Saad says UAE Welcome uses it (avoid double Welcome). |
| `purchase` | Insider **default** (not custom) | First transition to `PAID` only (`isBecomingPaid`). Guests OK if email/phone on order. |
| `checkout_started` | Custom | First `POST /storefront/checkout/from-cart`, not resume. Skip if no uuid/email/phone. |
| `order_cancelled` | Custom | Lifecycle `CANCELLED` or cancellation-window path. |
| `order_refunded` | Custom | Admin refund **request created** (money may still be pending). |

### Purchase payload (code / unit test — not a live Azure User Profiles check)

- One `purchase` event per line
- Same `event_group_id` (orderNumber)
- Distinct timestamps per line (do **not** tell Saad that Insider requires exactly +1s)
- Fields: `event_name`, `timestamp`, `event_group_id`, `currency`, `quantity`, `product_id`, `name`, `unit_price`, `unit_sale_price`
- `url` + `product_image_url` when catalog image/slug exist; `url` also needs `INSIDER_STOREFRONT_BASE_URL` (falls back to `GOOGLE_MERCHANT_STOREFRONT_BASE_URL` if Nest is wired that way). Omit if missing.
- Not mapped: shipping, order totals/tax/discount (only `custom.line_total`)

Unit test example: 2 lines, shared `event_group_id`, distinct timestamps. That is **payload shape**, not a live Insider “no duplicates” proof.

---

## 4. Still on you / DevOps (not FE, not Saad)

Until the new Nest image is on Azure Dev **and** env is set, User Profiles can still show the **old** consent mapping (`attributes.custom.gdpr_optin` / `sms_optin`).

1. Commit + deploy the Nest consent/purchase change to Azure Dev.
2. Set `INSIDER_STOREFRONT_BASE_URL` (Azure Dev storefront origin, no trailing slash). Without it, purchase `url` is omitted.
3. After deploy, run:
   - one self-service register → sanitized `user_register` upsert (show `email_optin` / `sms_optin` placement)
   - one **2-line** PAID order → sanitized purchase upsert + confirm Insider does not collapse the two lines
4. Confirm `integration_logs` (`system = INSIDER`) 2xx for `user_register` / `purchase` / `checkout_started` (not 404 collect).

**Do not tell Saad** that Azure already ran a live 2-SKU purchase or that User Profiles already show the new opt-ins until those steps are done.

Please send FE the sanitized snippets after the live check so we can close Noor’s remaining backend boxes.

---

## 5. Still Insider / Saad (not FE or BE code)

Escalation email to Saad is ready on FE side. His work:

- Enable UCD collection for Home / Listing / Product / Cart / Other page views and republish `ins.js`
- Evidence in live `ins.js` today: `eventCollectionStatus.homePage/categoryPage/productPage/cartPage/otherPage = false`, `purchasePage = true`, browse/cart UCD false. Hits have `ucd: false`. Pause/Resume in InOne does not flip this.
- Unlock Architect on `swissarabianuatnew` if `swissarabianuae` has it
- Transactional Journeys / Desktop & Web Suite **only if** UAE actually uses them
- Same messaging channels as UAE (Email / WhatsApp / SMS / Web Push)
- Copy/recreate UAE journeys; confirm Welcome starter (`user_register` vs `sign_up_confirmation`)
- Email Sent / WhatsApp Delivered are channel events after a journey sends — not website bugs

Admin + PII on UAT panel: `zeeshannawaz393@gmail.com`.

---

## 6. What FE sends on register (your mapping input)

`POST /storefront/auth/register` body includes:

- `marketingConsent` — UI: “Email me with news and offers”
- `smsConsent` — UI: “Text me with news and offers”

No WhatsApp checkbox. If Saad says UAE journeys need WhatsApp, that is a later FE+BE ticket (`whatsapp_optin`), not this blocker.

---

## 7. Storefront session 401 (FE-only, FYI)

`GET /storefront/customer/me` 401 happens when the access token is expired, refresh is dead, or local vs Azure tokens are mixed (`NEXT_PUBLIC_USE_LOCAL_API`).

Logout used to wait on `/logout` → 401 → refresh, so the button could hang. FE now clears local session first, then revokes server-side without a refresh wait. Not a Nest Insider change.

---

## 8. Short checklist for backend

- [x] Upsert only (no collect)
- [x] Consent → default `email_optin` / `sms_optin` (Nest tests)
- [x] `purchase` on first PAID, per-line, shared `event_group_id`, distinct timestamps (payload tests)
- [x] `url` / `product_image_url` in mapper when data + storefront base exist
- [x] Custom events on upsert: `user_register`, `checkout_started`, `order_cancelled`, `order_refunded`
- [ ] Azure Dev Nest image deployed
- [ ] `INSIDER_STOREFRONT_BASE_URL` set
- [ ] Live register + 2-line PAID snippets sent back to FE
- [ ] No `sign_up_confirmation` until Saad confirms UAE Welcome starter
