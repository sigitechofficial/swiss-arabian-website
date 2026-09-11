# Storefront Wishlist — FE handoff (short)

**Theme:** Logged-in wishlist / saved items.  
**Guide (send this to the agent):** [`STOREFRONT_WISHLIST_FE_GUIDE.md`](./STOREFRONT_WISHLIST_FE_GUIDE.md)  
**Prerequisite:** Phase 1 auth live + Phase 2 account live (same customer JWT).  
**Swagger:** `/api/docs` → Authorize **`customer-bearer`** → tag **Storefront Wishlist**

---

## Prerequisite

- Customer JWT works (`GET /storefront/customer/me`)
- Catalog PDP already returns `productId` (UUID) — wishlist uses **that id**, not slug/SKU
- UI pages exist: `/account/wishlist`, `/account/saved`, PDP/PLP heart — this phase is **API wiring**

---

## Build order

| Wave | What |
|------|------|
| **W.0** | `wishlistApi` on the existing Phase 1 client |
| **W.1** | `GET /status?productIds=` on PLP/PDP hearts |
| **W.2** | `POST /items` + `DELETE /items/:productId` (toggle) |
| **W.3** | Account list `GET /` + remove + add-to-cart from card |
| **W.4** | Optional clear-all `DELETE /items` |

---

## One rule

**JWT only. No guest wishlist.** Guest taps heart → login with `returnTo`. Do not invent localStorage wishlist.

---

## Out of scope

Reviews · returns · support · recently viewed · product preferences · coupons · saved cards
