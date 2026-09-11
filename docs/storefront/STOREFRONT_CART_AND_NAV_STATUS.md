# Storefront FE → Backend Status Update

**Date:** 2026-08-11
**Env:** Azure Dev
`https://ca-swissarabian-backend-dev.greenbush-d5b07575.uaenorth.azurecontainerapps.io`
**Context:** `zoneCode=UAE&salesChannelCode=platform_uae&languageCode=en&currencyCode=AED`
**Audience:** Backend team — Cart API + Navigation API integration status.

---

## 1. Cart API Integration ✅ DONE

**Handoff doc used:** `STOREFRONT_CART_FE_HANDOFF.md`

### What is wired

| Endpoint | Status | Notes |
|----------|--------|-------|
| `POST /storefront/cart` | ✅ Wired | Create / resolve cart. Called on app load (authenticated) + after login (merge) |
| `GET /storefront/cart` | ✅ Wired | Restore cart on app load (guest with saved `cartId`) |
| `POST /storefront/cart/items` | ✅ Wired | Add to cart. Auto-creates cart if no `cartId` |
| `PATCH /storefront/cart/items/:cartItemId` | ✅ Wired | Update quantity in cart side sheet |
| `DELETE /storefront/cart/items/:cartItemId` | ✅ Wired | Remove single item |
| `DELETE /storefront/cart/items` | ✅ Wired | Clear all items |
| `POST /storefront/cart/validate` | ✅ Wired | Called before checkout; blocks on `isValid = false` |

### Context params sent on every cart request

```
zoneCode=UAE
salesChannelCode=platform_uae
cartId={stored UUID}         ← for modify ops
guestToken={UUID}            ← guest only, omitted when Bearer is present
```

### Guest vs Authenticated flow

- **Guest:** `guestToken` generated as UUIDv4 on first add-to-cart, stored in `localStorage` as `sa_guest_token`. Passed as query param on all requests. No Bearer header.
- **Authenticated:** Bearer auto-attached. `guestToken` omitted. Backend handles merge.
- **Login:** `POST /storefront/cart` called immediately after login with Bearer (+ previous guest `cartId`). Backend auto-merges. FE stores new `cartId`, clears `guestToken`.
- **Logout:** `sa_cart_id` cleared from `localStorage`. Local cart state reset.

### localStorage keys

| Key | Value |
|-----|-------|
| `sa_guest_token` | UUIDv4 — generated once, cleared after login |
| `sa_cart_id` | Cart UUID — updated after every cart-creating call |

### Optimistic updates

All mutations (add / update / remove / clear) are optimistic — UI updates instantly, then syncs with API response. On failure: auto-refetch `GET /storefront/cart` to restore authoritative state + toast shown to user.

### Totals + currency

Cart totals (`subtotalEstimate`, `totalEstimate`, etc.) from API response are used directly in the UI. All prices displayed in **AED** using the `currencyCode` from the cart context.

---

## 2. Navigation API Integration ✅ DONE

**Handoff doc used:** `WEB_CONFIGURATION_GUIDE.md` + `STOREFRONT_WEB_CONFIG_FE_HANDOFF.md`

### What is wired

| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /storefront/navigation?zoneCode=UAE` | ✅ Wired | Header + footer both read from this single call |

### Behavior

- **Header nav** (desktop mega-menu + mobile accordion) fully driven by API `data.header` array.
- **Footer nav** columns driven by API `data.footer` array.
- If `footer: []` → no footer link columns rendered (never hardcoded).
- Cache TTL: **30s stale / 60s gc** (React Query).
- Fallback: hardcoded nav shown while API loads — swapped silently on response.
- `GROUP_HEADER` nodes at level 2 correctly rendered as **column headings** in desktop mega-menu dropdown.
- 3-level structure fully supported: L1 item → L2 `GROUP_HEADER` (heading) → L3 links.

### Live API response confirmed (2026-08-11)

```
GET /storefront/navigation?zoneCode=UAE
→ 200 OK
→ metadata.source = "bound_menu"
→ metadata.headerMenuHandle = "new-nav"
→ header: 11 items (SALE, MINIS, BUNDLES, NEW LAUNCHES, BEST SELLERS, PERFUMES, HAIR MIST, PERFUME OILS, INCENSE, GIFTSETS, HOME FRAGRANCES)
→ footer: [] (no footer menu bound yet)
```

**PERFUMES dropdown confirmed working** — TYPE and COLLECTIONS `GROUP_HEADER` sections with all sub-links rendering correctly.

---

## 3. Open items for Backend

### Cart

1. **`cartId` in PATCH/DELETE query** — confirm `cartId` is required as query param (not body) for `PATCH /storefront/cart/items/:cartItemId`. Currently sending as query. ✅ Working per handoff doc.

2. **Quantity as integer in PATCH body** — FE sends `{ "quantity": 3 }` as a JS number (not string). Please confirm this is accepted (doc shows number, not decimal string).

3. **Validation before checkout** — `POST /storefront/cart/validate` is wired but not smoke-tested yet. Please confirm it returns `validation.isValid` and per-item `sellabilitySummary`.

4. **Cart TTL** — Handoff says 30 days. If cart expires, `GET /storefront/cart` should return 404. FE handles this (clears `sa_cart_id`, user starts fresh on next add-to-cart). Please confirm.

### Navigation

5. **Footer menu** — `footerMenuHandle: null` and `footer: []` in current response. FE shows hardcoded fallback until footer menu is bound. Please bind a footer menu in Website Management when ready and confirm handle.

6. **Cache invalidation** — FE caches nav for 30s. After admin archives/deletes a nav item, changes will appear within 30s. Confirm this TTL is acceptable.

7. **`source: "bound_menu"` confirmed** — `new-nav` is active. No action needed from FE.

---

## 4. One-liner for Slack

> Cart API (all 7 endpoints) + Navigation API fully wired on storefront FE. Cart: guest token + cartId lifecycle, optimistic mutations, login merge, AED currency display — all working. Navigation: `GET /storefront/navigation?zoneCode=UAE` live (`bound_menu`, `new-nav`), 3-level mega-menu with GROUP_HEADER columns rendering correctly. **Open items:** bind footer menu in Website Management; confirm cart validate endpoint contract; confirm `forgot-password` status (still 401 on Dev).

---

*Previous status:* `STOREFRONT_FE_STATUS_FOR_BACKEND.md` (Phase 1 auth + catalog — 12/13 PASS)
