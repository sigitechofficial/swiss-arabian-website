# Store locator (website)

**Status:** phase 3 of the store locator plan (`docs/STORE_LOCATOR_GBP_PLAN_2026-11-14.md`, workspace root). Branch `feat/store-locator-site` (from `feat/multibrand-sapil`).
**Data:** backend `/storefront/stores…` (backend branch `feat/store-locator`, contract `docs/frontend/STORE_LOCATOR_API.md`). Stores are managed in admin → Website → Stores. No store data lives in this repo any more.

## Routes

| Route | Page | Notes |
|---|---|---|
| `/stores` | Locator: search, "Use my location", area / type / "Open now" filters, numbered list, map, links to area pages | Market has no stores yet → the market's CMS store page if published, else the "coming soon" placeholder (noindex), as before |
| `/stores/[area]` | Area page (e.g. `/stores/dubai`): intro text, its stores, other areas | 404 when the area has no store on the website |
| `/stores/[area]/[store]` | Store page: type, live open/closed status, address + "how to find us", directions / call / WhatsApp / email, opening hours for today and the next 6 days (holidays and Ramadan hours shown with their name), services, Google rating and review links, description, photos, map, nearby shops, "Shop online" | Wrong area → 308 to the right address. Closed for good: page with a "closed" note + nearby shops, noindex; after 90 days → 308 to the area page. Unknown / draft → 404 |

Every route starts with `requireBrandFeature("storeLocator")`: brands with the switch off (Sapil today) answer 404 and never link to it. All addresses work with the language prefix (`/ar/stores/…`).

## Multi-brand

| Shared (`src/features/stores`) | Per brand (`@brand-ui`) |
|---|---|
| `api/storesApi.ts` (server loaders), `routes/storeRouteData.ts` (per-request cache), `hooks/useStoreLocator.ts` (search, filters, near me, `useNow`), `utils/openingHours.ts` (open now, week ahead, time formatting), `utils/storeText.ts`, `utils/storeLinks.ts`, `utils/storeJsonLd.ts`, `components/map/*` | `StoreLocatorPageView`, `StoreAreaPageView`, `StorePageView` |

- Swiss Arabian: `features/stores/components/StoresPageView.tsx`, `StorePageView.tsx`, `SaStoreFinder.tsx`.
- Sapil: `brands/sapil/pages/content/SapilStorePages.tsx`, `brands/sapil/components/content/SapilStoreFinder.tsx` (v9 design system: chips, `Button`, `Breadcrumbs`, `Wrap`). Built and checked; switched on when Sapil has stores (`features.storeLocator` in `src/lib/brand/brands/sapil.ts`).
- Wording: shared keys `stores.*` in `src/messages/en.json` / `ar.json` (both brands).
- Map: `StoreMap` uses Google Maps (brand's `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` + `…_MAP_ID`, labels in the page's language) and falls back to a free street map (Leaflet + Esri tiles) when the brand has no key. Loaded only when scrolled into view; pins in the brand's colour.

## Behaviour notes

- **"Open now"** is worked out in the browser in the store's time zone (`useNow`, refreshed every minute). Server HTML has no open/closed state, so cached pages never show a stale one; the hours table shows the plain week (Monday first) until then, with no layout shift.
- **Near me:** the browser position never leaves the browser; the list sorts by distance and the nearest shop is selected.
- **SEO:** `pageMetadata` (admin SEO overrides, canonical, hreflang). Structured data: BreadcrumbList on all three; `Store` per shop (address, geo, phone, hours incl. special dates, `hasMap`, photos, brand). No `aggregateRating` (Google's rating, not ours). Sitemap lists `/stores`, every area and store in every language when the brand has the locator and the market has stores.
- Old Shopify `/pages/store-locator` → `/stores` (existing redirect).

## Checked (2026-11-14)

Swiss Arabian (local, 44 seeded UAE stores, 42 published): locator, area, store pages in English and Arabic (right-to-left, Arabic time format), live status, map pins, 308 / 404 cases, JSON-LD (17 stores on `/stores/dubai`), hreflang, sitemap (100 store addresses = 50 pages × 2 languages). Sapil: 404 on all store routes with the switch off, not in the sitemap; with the switch turned on locally and demo stores, locator and store page (Arabic) render in the v9 design (switch and demo data reverted).

## Not done yet

- Google Business Profile sync (phase 4): hours, rating and links still come from admin.
- Designer-approved layouts: both brands' pages are built from their existing design systems.
- Arabic store names / addresses and opening hours for most stores: content to enter in admin.
