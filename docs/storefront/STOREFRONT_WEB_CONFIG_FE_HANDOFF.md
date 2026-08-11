# Storefront Phase 3 — FE handoff (short)

**Theme:** Catalog merchandising + **Website Management navigation** on the customer storefront.  
**Guide:** [`WEB_CONFIGURATION_GUIDE.md`](./WEB_CONFIGURATION_GUIDE.md)  
**Prerequisite:** Phase 1 envelope/client (public calls). Phase 2 account is **not** required for nav.  
**Admin source:** [`../website-management/ADMIN_WEBSITE_MANAGEMENT_FE_GUIDE.md`](../website-management/ADMIN_WEBSITE_MANAGEMENT_FE_GUIDE.md)  
**Smoke:** [`STOREFRONT_FRONTEND_SMOKE_TEST_PLAN.md`](./STOREFRONT_FRONTEND_SMOKE_TEST_PLAN.md) §2.13

## Build order

1. Public `GET /storefront/navigation?zoneCode=` on layout  
2. Header mega-menu (3 levels) from `header`  
3. Footer from `footer` (empty = render nothing)  
4. Collection / category PLP from existing merchandising routes  
5. React to `metadata.source` (`bound_menu` vs category fallback)

## One rule

Storefront reads **bound HEADER/FOOTER menus**. Never call `/admin/website-management/*`. Deleted/archived admin items must not appear.

## Key APIs

| Area | Path |
|------|------|
| Nav | `GET /storefront/navigation` · `/header` · `/footer` |
| Collections PLP | `GET /storefront/merchandising/collections` · `/:idOrSlug` |
| Categories PLP | `GET /storefront/merchandising/categories` · `/:idOrSlug` |

## Out of scope

Account · cart · checkout · CMS banners · admin Website Management UI
