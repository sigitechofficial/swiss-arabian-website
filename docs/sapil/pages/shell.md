# Sapil shell (chrome on every page)

Area: `shell`. Code in `src/brands/sapil/components/shell/` and `components/states/`. Wording: `i18n/messages/{en,ar}/shell.json`.

## `@brand-ui` names

| Name | Entry | Sapil component |
|---|---|---|
| `StorefrontShell` | `brand-ui.ts` (server) | `SapilStorefrontShell`: imports `theme.css`, `<SapilRoot>`, loads `loadSapilMessages(locale)` into `SapilCopyProvider` (server, via `next/root-params`), renders `SapilChrome` |
| `StorefrontShell` | `brand-ui.client.ts` (error / not-found routes) | `SapilStorefrontShellClient`: same chrome; the wording loads in the browser (English until it arrives) |
| `CrashFallback` | both | `SapilCrashFallback` (state panel, Try again + full reload home) |
| `NotFoundView` (new contract name, client) | `brand-ui.client.ts` | `SapilNotFoundView`. Swiss Arabian's not-found content moved unchanged into `components/layout/NotFoundView.tsx`; `app/[locale]/not-found.tsx` renders `<StorefrontShell><NotFoundView/></StorefrontShell>` |
| `ShopUnavailableView` | `brand-ui.ts` | `SapilShopUnavailableView` (rendered without the shell; own `SapilRoot` + wording) |

`beforeFooter` (market SEO text) is kept. `navbarVariant` is accepted and ignored (Swiss Arabian's header showcase option).

## Pieces and data

| v9 piece | Component | Data (shared hooks / stores only) |
|---|---|---|
| `.announce` | `SapilAnnouncement` + ui `AnnouncementBar` | `useAnnouncementBar()` (CMS `announcement-bar` region; message + link; several messages rotate, not with reduced motion). Nothing published → no bar |
| `.hdr` | `SapilHeader` | logo from `getBrand().logo` (localized alt); main menu from `useNavigation(marketId).headerNav` → `menuItemsFromNav` (dropdowns from children, group headers as columns, collection pictures as mega tiles); search → `useUiStore.setSearchOpen`; account → `/account` or `/login`; bag count from `useCartStore.itemCount()` after hydration, bumps when it goes up |
| `.subnav` "Shop by" | `SapilShopBy` + ui `Subnav` | chips = collection links nested in the header menu (`shopByChipsFromNav`, v9 chip colours) + the market's featured price edit (`priceEditTiers`, middle tier → "Under AED 99", sale style). Info text = `useMarketSettings()` → `delivery.freeDeliveryThreshold` ("Free delivery over AED 100") and `delivery.cashOnDelivery.available` ("Pay on delivery"); **hidden when the API sends neither** — never hard-coded. No chips → no row |
| `.mnav` | `SapilPhoneMenu` | same menu (dropdowns as folding sections + "Shop all …"), quick links = the chips, account + search, market / language pickers. Modal dialog from the reading start (RTL aware), focus to close, Escape, scrim, focus return, `inert` when closed |
| search dialog | `SapilSearchDialog` + ui `Dialog` (wide) | `useHeaderSearch()` (extracted from Swiss Arabian's `SearchOverlay`): live hits (`useCatalogSearch`), Enter → `/search?q=`, hits as `SapilProductCard` (no heart or quick view inside the dialog); hint / loading / error / count states |
| bag drawer | `SapilBagDrawer` (commerce area, `bag-checkout.md`) | `useBag()`, `useUiStore().cartOpen` |
| toast | `SapilToastHost` + ui `Toast` | every shared `toast()` call via `useToastFeed()`; the default Toaster hides while a brand host is mounted, so every toast on a Sapil page is drawn by Sapil (v9 `.toast`). The **sentences** of toasts raised by shared hooks are still the shared English ones (see `PROGRAM.md` known gaps) |
| `footer` | `SapilFooterView` | newsletter (`useNewsletterSignup`, provider not connected — same as Swiss Arabian), columns from `useNavigation().footerItems` (`footerColumnsFromNav`), copy from `useFooterContent()` (heading, placeholder, button, copyright), else Sapil wording; legal row end = market + language pickers |
| market + language switcher (no v9 design) | `SapilLocaleSwitcher` | `useMarket()` (`regionOptions`, `setMarketId`, `languageOptions` = `marketLanguageOptions`) + `useLanguageSwitch()` (extracted from `useNavbarChrome`). Chip-styled native selects; hidden when there is nothing to choose |
| errors | `SapilStatePanel` | price-edit banner look: pastel gradient, Gloock title + serif accent, butter sticker, buttons |

## Hooks extracted (Swiss Arabian uses them, no visible change; tests next to each)

| Hook | From |
|---|---|
| `features/cms/hooks/useCmsGlobalRegion.ts` → `useAnnouncementBar`, `useFooterContent` (+ pure parsers) | `TopbarTicker`, `SiteFooter` |
| `features/search/hooks/useHeaderSearch.ts` | `SearchOverlay` |
| `hooks/useLanguageSwitch.ts` | `useNavbarChrome` |
| `features/markets/hooks/useMarketSettings.ts` (new) | markets API `priceEditTiers` + `delivery` (types added as optional fields of `StorefrontMarket`) |
| `components/ui/Toaster.tsx` → `useToastFeed()` | default Toaster (now hides while a brand host is mounted) |
| `features/navigation` → `useNavigation().headerNav` (raw header menu, additive) | |

## Design-system fixes (src/brands/sapil/ui, theme.css)

- `theme.css`: Sapil utilities moved to their own cascade layer `sapil-utilities`, declared after `utilities`. In a real build the host stylesheet loaded **after** Sapil's, so the host's `.flex` / `.grid` beat Sapil's `max-1280:hidden` etc. (responsive hiding broke). The kit page didn't show it because its stylesheet order differed.
- `Subnav`, `Accordion`: physical margins/paddings → logical (`me-`, `ms-auto`, `ps-`/`pe-`) for RTL.
- `ProductCard`: optional `viewLabel` / `addLabel`; `Breadcrumbs`: optional `label` (were English-only).

## Visual diff

`node scripts/sapil-visual-diff.mjs --group=preview` against a Sapil build on :3031 (the kit routes (`page.dev.tsx`) exist only in `next dev`, in a Sapil build, or in a build made with `SAPIL_KIT=1` (a build-time rule in `next.config.ts`: a Swiss Arabian production build has no kit route and ships none of its code); a production server also needs `SAPIL_KIT=1` at runtime, else the page 404s. In practice: build **and** start the Sapil build with `SAPIL_KIT=1`) (`/sapil-preview` renders the chrome and static home parts with v9's mock values; `src/brands/sapil/kit/SapilShellPreview.tsx`).

Last run (Chromium 1217, puppeteer-core, % of pixels differing; Sapil build on the backend branch API, 2026-11-13):

| piece (v9 source) | 390 | 768 | 1280 | 1440 | notes |
|---|---|---|---|---|---|
| announcement `.announce` | 0.00 | 0.00 | 0.00 | 0.00 | `**bold**` in the CMS message |
| header `.hdr` | 0.26 | 0.13 | 1.45* | 0.02 | *menu button shown at ≤1280 (see below) |
| "Shop by" `.subnav` | 7.03 | 6.72 | 4.03 | 3.59 | same chips/text; chip edges anti-alias differently (sub-pixel x offset of the row) |
| footer | 7.46 | 0.55 | 5.54 | 5.29 | static columns match; newsletter line without "once a fortnight", legal row (v9 concept note) |
| hero intro `.d-intro` | 20.18 | 26.75 | 10.11 | 9.23 | data-driven: stats from the API; the eyebrow wraps one line earlier with self-hosted Poppins (text width sits exactly on the column edge), shifting what follows |
| `#new .sec-head` | 0.00 | 0.00 | 0.03 | 0.00 | |
| `#collections .sec-head` | 0.09 | 0.06 | 0.07 | 0.06 | |
| `#bestsellers .sec-head` | 0.00 | 0.00 | 0.06 | 0.00 | |
| `#bundles .sec-head` | 1.73 | 1.03 | 1.95 | 1.78 | headline accent "and easier." (v9 "and cheaper.") |

Data-driven parts (rails, doors, collection cards, mood, bundles, shelf, footer links) were compared side by side in the built site against the seeded Sapil UAE market: same grid tracks, gaps, radii, tile colours and type.

## Known differences from v9

- The menu button shows at ≤1280px (v9 hides the main menu at ≤1280 but shows the button only at ≤900, leaving 901–1280 with no menu at all).
- Logo comes from the brand config (`/assets/sapil-online-perfume-store.png`, 195×80) — slightly wider than v9's file at 34px high.
- Announcement text is the CMS message; `**words**` render bold (v9 bolds "The Scent Society").
- The announcement and "Shop by" rows are client-rendered once the market is known (same as Swiss Arabian's ticker), so they appear a moment after the header (layout shift at the top). Server-rendering them needs the market on the server (open question).
- Mega-menu tiles show the collection picture from the menu API (v9: a bottle and "N scents"); there is no per-option count in the menu API.
- Footer legal row: copyright + market/language pickers (v9: concept note and "All concepts" link).
- "Shop by" chips come from the header menu's collection links: there is no dedicated CMS menu for this row yet. With the local seed (menus not bound) the row shows only the price-edit chip.

## Open questions

- A dedicated CMS menu (or menu handle) for the "Shop by" row.
- Newsletter → Sapil's CRM / Insider consent (no provider wired for any brand yet).
- Shared route metadata still uses Swiss Arabian wording from `src/messages` (e.g. `pages.blog.description`, serialized page messages) — outside this area, needs per-brand page metadata.
