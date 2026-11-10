# CMS: global page + market changes

Applies to the home page, announcement bar and footer (CMS page types `HOME`, `ANNOUNCEMENT_BAR`, `FOOTER`).
Built 10 Nov 2026 (handover row R50). Proposal: `CMS_AND_PAGES_AUDIT.md` section 4.

## How it works

| Level | What it holds |
|---|---|
| **Global page**, one per brand + page + language (`en-us`, `ar`) | The full ordered list of sections. Each section has a stable key. |
| **Market changes**, one per market + page + language, only where needed | For a section: **own version** (`OVERRIDE`, a copy edited for this market), **hidden here** (`HIDDEN`), or **only here** (`ADDED`, a market-only section placed after a chosen global section, or at the end). |

What a shopper sees (the website asks the same endpoints as before and gets one finished page):

1. The **published** global page for the language.
2. The market's **published** changes applied to it: own version replaces the global section in place, hidden removes it, only-here sections are inserted after their global section (or at the end).
3. Product, collection and category sections are then filled live for the market (its products, prices, stock).

- A market with no changes shows the global page as is.
- A market change whose global section no longer exists is ignored and shown in the admin as **Removed from global** until someone resets it.
- No global page published for the language: the market's own published page is shown exactly as before.
- Languages are the market content languages (`en-us`, `ar`). The global page uses the same codes.

## Admin steps

Market → Website → Pages → **Homepage** (or Global Content · Announcement Bar / Footer).

1. Pick the **language** (top right).
2. **Global (all markets)** tab:
   - First time: **Seed Content** (fills the brand's global page in the default market's language, as a draft) or **Create global homepage** and add sections.
   - Other language: **Copy from en-us** starts the Arabic page from English. Translate, then publish.
   - Edit, reorder, hide or delete sections as before → **Preview** → **Publish global**. Every market following the global page changes.
3. **This market** tab: each section shows where it comes from:
   - **Global**: same as the global page. Buttons **Override**, **Hide**, **+** (add a section after it).
   - **Own version here**: edit it with the pencil. **Hide** or **Reset to global**.
   - **Hidden here**: **Override** or **Reset to global**.
   - **Only here**: edit or delete.
   - **Removed from global**: the global section was deleted. **Reset to global** removes the leftover change.
   - **Add here (at the end)** adds a market-only section.
   - Then **Preview** (the combined page) → **Publish here**.
4. Every Override / Hide / Reset / Add / Copy asks for a short reason (kept in the audit log).

## Rules

- Nothing is published automatically. Seeds, copies and market changes are drafts.
- The global page and each market's changes have their own draft, preview, publish and version history. Restoring a version keeps the section keys, so market changes still match.
- Publishing the global page changes every market that follows it. Publishing a market changes only that market.
- Sections added in a market are always market-only; global sections are edited only in the Global tab.
- Seeds belong to the brand (Swiss Arabian: `swiss-arabian-homepage-v1`, announcement and footer seeds). They fill the brand's global page in the content language of the brand default market (Brands → Brand go-live → Default market). The seed refuses if that language does not match the seed text.
- Permissions are unchanged: `content.read / create / edit / delete / publish / preview / restore / seed`.

## Technical notes

- Data: `content.content_page_variants.zone_id` empty = global. Partial unique indexes: one global per (page, locale), one per (page, zone, locale).
  `content.content_sections`: `section_key` (unique per variant), `override_mode` (`OVERRIDE` / `HIDDEN` / `ADDED`, market variants only), `after_section_key`.
  Migration `20261110210000_content_global_and_market_sections`.
- Published snapshots keep their shape; sections carry `sectionKey`, `overrideMode`, `afterSectionKey` when set.
- Merge rules: backend `src/modules/content/utils/content-merge.util.ts` (+ spec).
- Admin API (`zoneCode` = market worked in, `locale` = content language), page type `home`, `announcement-bar` or `footer`:
  - `GET  /admin/content/layouts/:pageType/global`
  - `POST /admin/content/layouts/:pageType/global/ensure`
  - `POST /admin/content/layouts/:pageType/global/copy-from-language` `{ fromLocale, confirmReplace?, reason }`
  - `GET  /admin/content/layouts/:pageType/market`: sections with state `GLOBAL` / `OVERRIDE` / `HIDDEN` / `ADDED` / `ORPHANED`
  - `POST /admin/content/layouts/:pageType/market/sections` `{ type, config, afterSectionKey?, reason }`
  - `POST /admin/content/layouts/:pageType/market/sections/:sectionKey/override | hide | reset` `{ reason }`
  - Publish, preview token, versions, restore: the existing `/admin/content/page-variants/:variantId/...` endpoints, for either variant.
- Website: no change. `GET /storefront/content/pages/home`, `/regions/:pageType` and `/pages/home/preview` return the same shape.

## Review fixes (10 Nov 2026)

A reviewer pass tested the CMS from the admin UI, the API and the logs in UAE, Qatar and KSA. These changes came out of it.

**Access**
- Every content endpoint addressed by id (sections, page variants, publish, preview token, versions, restore, seed) now checks brand and market.
- Changing a market version needs that market.
- The global page can be read by an admin of any market of the brand. Changing or publishing it needs every active market of the brand, because it changes them all.
- This is unit-tested only: there is no market-scoped admin account locally.

**Preview**
- Admin → Preview uses `GET /admin/content/page-variants/:id/preview?zoneCode&locale`. It uses one of the brand's registered hosts, the market's own first.
- Before, the host was hard-coded to `sa.test` and Preview always failed.

**Consistency**
- Override, hide, reset, copy-from-language and restore each run in one transaction, with the page row locked.

**What admins see**
- Each market row carries `liveInGlobal` and a note, for example:
  - "not live yet: publish the global page first"
  - "still live until the global page is published"
  - "shown at the end: the global section it followed was removed"
- Publishing a market returns `warnings` for changes that won't show; the admin shows them as toasts.
- The global endpoint lists `marketChanges`, so deleting a global section names the markets that changed it.
- The publish dialog says who the publish reaches (every market following the page, or only this market).

**Storefront**
- A merged page with no sections is served as "no page", so the website uses its built-in layout.

**Announcement bar and footer**
- The global page is created on the first save, not when the editor is opened.
- Seed (dry run first) and Copy from language (reason required) were added.
- "Publish global" is disabled while the global page is empty.

**Follow-ups closed (11 Nov 2026, handover R54)**
- **Unpublish:** "Unpublish" on the home page, announcement bar and footer (global or market), with a reason.
  - `POST /admin/content/page-variants/:id/unpublish` `{ reason }`, permission `content.publish`.
  - The draft and every version are kept; publish again to bring the page back.
  - Global page: needs every market of the brand. Markets then show only their own added sections, else the website's built-in layout. The admin is told which markets still show their own sections.
  - Market page: that market shows the global page again.
- **Republishing a restored version** no longer creates a new version. The content hash leaves out row ids, and "unpublished changes" / "no change" compare the content itself, so rows saved before this change need no backfill.
- **Draft conflicts** return code `DRAFT_CHANGED` with "This page was changed by someone else … Reload the page" (was `DUPLICATE_RECORD`, shown as "This record already exists").
- **Audit:** one shared writer (`content-audit.util.ts`). Every CMS audit row has brand, market (none = global), page type, language, action, reason and details (section type and key, version numbers, manifest).
- **Seed dry run** only reads; it no longer creates an empty global row.
- **Admin:**
  - "Open on storefront" opens the market's website address from SEO settings (local: the local website); `/ar` for Arabic. The website has no market switch in the URL, so the tooltip says to choose the market on the site when markets share one address.
  - Section lists show an image thumbnail (hero slides, banners, tiles). Website paths such as `/assets/...` are loaded from the storefront address; the preview does the same.
  - Header buttons wrap under the title on narrow screens.

**Still open**
- None from the review. The `/account` hydration warning came from three website files that did not compile at the time; it no longer happens after those were fixed (checked on `/account` and `/account/addresses`).
