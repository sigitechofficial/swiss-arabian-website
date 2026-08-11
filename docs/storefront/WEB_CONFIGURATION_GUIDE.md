# Web Configuration Guide

> **Audience:** Customer storefront frontend + Cursor/AI coding agent.  
> **Purpose:** Wire **header/footer navigation** and catalog merchandising from platform Website Management.  
> **Source of truth:** running backend + Swagger `/api/docs` → **Storefront Navigation**.  
> **Prerequisite:** Phase 1 envelope unwrap (public GETs). Customer JWT is **not** required for nav.  
> **Admin (who authors the menu):** [`../website-management/ADMIN_WEBSITE_MANAGEMENT_FE_GUIDE.md`](../website-management/ADMIN_WEBSITE_MANAGEMENT_FE_GUIDE.md)  
> **Short handoff:** [`STOREFRONT_PHASE_3_FE_HANDOFF.md`](./STOREFRONT_PHASE_3_FE_HANDOFF.md)  
> **Smoke:** [`STOREFRONT_FRONTEND_SMOKE_TEST_PLAN.md`](./STOREFRONT_FRONTEND_SMOKE_TEST_PLAN.md) §2.13  
> **Out of scope:** account, cart, checkout, CMS banners (`cmsAvailable` stays false until WM-5).

---

## 0. How this works

```text
Admin Website Management (per market)
  → ACTIVE menu bound to HEADER / FOOTER
       ↓
GET /storefront/navigation?zoneCode=UAE
  metadata.source = "bound_menu"
       ↓
Storefront navbar / footer
```

If no ACTIVE header menu is bound, `source = "catalog_categories"` (fallback). Do not invent a third menu on the FE.

**Never** call `/admin/website-management/*` from the storefront.

---

## 1. Golden rules

1. Unwrap envelope `data` (same Phase 1 client).
2. No `/api/v1` prefix: `GET /storefront/navigation?zoneCode=UAE`.
3. Public — no customer JWT required. Do not send admin tokens.
4. Always pass **`zoneCode`** (or zone context used by other storefront catalog calls).
5. Render **only** what the API returns. Deleted/hidden admin items are already omitted.
6. `GROUP_HEADER` is a **label**, not a link (`href` is null).
7. `footer: []` → render **no** footer links (never hardcode).
8. Cache per `zoneCode` (layout). TTL **30–60s** so admin archive/delete shows quickly.
9. After market/zone switch, refetch nav.

---

## 2. Endpoints

| Method | Path | Auth | Use |
|--------|------|------|-----|
| `GET` | `/storefront/navigation` | Public + `zoneCode` | Header + footer + metadata |
| `GET` | `/storefront/navigation/header` | Public | `{ context, items, metadata }` |
| `GET` | `/storefront/navigation/footer` | Public | `{ context, items, metadata }` |
| `GET` | `/storefront/merchandising/collections` | Public | Collection rails / index |
| `GET` | `/storefront/merchandising/collections/:idOrSlug` | Public | Collection PLP |
| `GET` | `/storefront/merchandising/categories` | Public | Category index |
| `GET` | `/storefront/merchandising/categories/:idOrSlug` | Public | Category PLP |

```http
GET /storefront/navigation?zoneCode=UAE
```

---

## 3. Response shape

```ts
type NavItem = {
  id: string;
  label: string;
  slug: string | null;
  type: 'COLLECTION' | 'CATEGORY' | 'PRODUCT' | 'URL' | 'GROUP_HEADER';
  href: string | null;
  children?: NavItem[];
};

type NavigationPayload = {
  context: { zoneId: string; zoneCode: string; /* … */ };
  header: NavItem[];
  footer: NavItem[];
  metadata: {
    generatedAt: string;
    source: 'bound_menu' | 'catalog_categories';
    cmsAvailable: boolean;
    headerMenuHandle?: string | null;
    footerMenuHandle?: string | null;
    note?: string;
  };
};
```

Header-only / footer-only responses use `items` instead of `header`/`footer`.

### `type` → UI

| `type` | Click | Example `href` |
|--------|-------|----------------|
| `COLLECTION` | Go to collection PLP | `/collections/men` |
| `CATEGORY` | Go to category PLP | `/categories/…` |
| `PRODUCT` | Go to PDP | `/products/gharam` |
| `URL` | Internal path or external | `/collections/…` or `https://…` |
| `GROUP_HEADER` | **Not clickable** | `null` |

Max depth = **3** (UAE `new-nav`: PERFUMES → TYPE → MEN).

---

## 4. Header / footer UI

### Header

- Fetch once in app/layout for the active `zoneCode`.
- Level 1 = top bar; level 2–3 = dropdown / mega menu.
- `GROUP_HEADER` (TYPE, COLLECTIONS) = section title inside the dropdown.
- Skip nodes with no `href` and no children (API already prunes most of these).

### Footer

- If `footer.length === 0`, show **no** link columns.
- Same item renderer as header (simpler, usually 1–2 levels).

### Fallback banner (dev / staging only)

If `metadata.source === "catalog_categories"`:

> Header is using category fallback. Bind an Active menu in Website Management.

Do **not** show this to customers in production.

---

## 5. Admin → storefront behavior

| Admin action | Storefront |
|--------------|------------|
| Bind HEADER | `source = bound_menu`, navbar = that tree |
| Archive bound menu | Binding ignored → category fallback |
| Unarchive only | Still fallback until **re-bind** |
| Delete item (e.g. MINI) | Item gone from navbar |
| Hide item | Item gone |
| Restore menu | Previously deleted items stay gone |

---

## 6. Storefront messages

| Situation | Copy |
|-----------|------|
| Collection/product 404 from a stale `href` | This page is no longer available. |
| Empty header (should be rare) | (render logo only — no fake links) |
| Empty footer | (no footer nav) |

Do not surface admin archive/restore wording on the customer site.

---

## 7. Cache

```
['storefront', 'navigation', zoneCode]
```

- Stale-while-revalidate 30–60s.
- Invalidate on `zoneCode` change.
- Optional: refetch on window focus in staging so merchandisers see changes faster.

---

## 8. Ops prerequisite (UAE)

Before the navbar matches `new-nav`, admin must bind HEADER:

```http
PUT /admin/website-management/markets/UAE/bindings
{ "headerMenuId": "<active-menu-id>", "reason": "Publish UAE header on storefront" }
```

Then:

```http
GET /storefront/navigation?zoneCode=UAE
```

Expect `metadata.source === "bound_menu"` and `headerMenuHandle === "new-nav"` (or the bound handle).

Seed fallback if needed: `POST /admin/website-management/markets/UAE/seed-new-nav`.

---

## 9. Acceptance

| ID | Check |
|----|--------|
| S1 | Nav API with UAE bound menu → `bound_menu` |
| S2 | Navbar matches admin **live** tree (not archived, not deleted MINI) |
| S3 | Delete MINI in admin → gone on storefront after refresh/TTL |
| S4 | Archive header menu → category fallback |
| S5 | Restore + re-bind → menu returns; deleted items stay gone |
| S6 | Footer empty or authored — never hardcoded |

---

## 10. Waves

| Wave | Ship when |
|------|-----------|
| **3.0** | Layout fetches `/storefront/navigation` |
| **3.1** | Header mega-menu (3 levels + GROUP_HEADER) |
| **3.2** | Footer from API |
| **3.3** | Collection/category clicks hit merchandising PLP |
| **3.4** | Fallback vs bound_menu handled; smoke S1–S6 |
