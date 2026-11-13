# Sapil content pages

Area: `content`. Code in `src/brands/sapil/pages/content/` and `src/brands/sapil/components/content/`. Wording: `src/brands/sapil/i18n/messages/{en,ar}/content.json`.

## Routes and components

| Route | `@brand-ui` name | Sapil component | Design |
|---|---|---|---|
| `/blog` | `BlogPageView` | `SapilBlogPage` | v9 blog: crumbs, centred head, topic chips with counts, featured post (`.post.big`), 3-column grid, pagination |
| `/blog/[slug]` | `BlogArticlePageView` | `SapilBlogArticlePage` | system: crumbs, Gloock title, 16:7 picture, article typography (`SAPIL_PROSE`), notes table, tags, share, related posts |
| `/faq` (market has no FAQ page) | `FaqPageView` | `SapilFaqPage` | system: help state panel (track order / contact) |
| `/faq` (market FAQ page), `/pages/*`, `/policies/*`, `/our-story`, `/stores` | `SitePageView` | `SapilSitePage` | system: crumbs, Gloock title, `SAPIL_PROSE`; question pages fold into the v9 `Accordion` |
| `/collections` | `CollectionsPageView` | `SapilCollectionsPage` | system: pastel collection cards (v9 `.ccard` look) with loading / error / empty states |
| `/offers/[code]` | `OfferShop` | Swiss Arabian's (not rebuilt) | 568-line promotions page with its own logic; left for a later pass |
| `/shop-unavailable` | `ShopUnavailableView` | `SapilShopUnavailableView` | system state panel (see shell.md) |

## Data sources

| Page | Data |
|---|---|
| Blog list / post | the route's existing loaders (`features/blog/api`, props `posts`, `article`); topics = post `category` |
| Site pages | the route's `SitePage` (cleaned with `sanitizePageHtml`, H1 demoted); contact details policy when the page template is "contact" |
| Collections | `useCollectionsList(initial)` (extracted, see below) → `fetchCollections` for the selected market |
| FAQ fallback | none: the built-in FAQ content is Swiss Arabian's own text, so Sapil does not show it |

## Hooks extracted

- `features/collections/hooks/useCollectionsList.ts` (from `CollectionsPageView`; Swiss Arabian uses it, no visible change). Tests: `useCollectionsList.spec.tsx`.

## Behaviour

- **Accordion rule** (`components/content/htmlSections.ts`): a page whose HTML has at least three h2–h4 parts, 60 %+ of them ending in "?" / "؟", becomes an accordion (question = summary, answer HTML inside). Policies stay as text. Tests: `htmlSections.test.ts`.
- Blog topic chips filter the current page client-side (the API has no topic filter yet); chips hide when there are fewer than two topics.
- RTL: logical properties throughout; arrows flip.

## Visual diff

The blog has a v9 design; its breadcrumb is covered by the existing `crumbs` kit spec (0 % at all widths). The list itself is data-driven (posts from the blog API vs v9's links to us.sapil.com), so it was compared side by side: same head (Gloock 84px title, centred chips), featured card (7fr/5fr, 380px picture), 3-column grid with 24px gaps, 16:9 pictures.

## Known differences from v9

- No "Posts open on us.sapil.com" note (posts are ours); posts link to `/blog/[slug]`, not out.
- Post dates are not shown: the blog list API has no date field on `BlogPost` yet.
- Article page, FAQ, site pages and collections index have no v9 design (design review needed before launch).

## Open questions

- Blog URL: keep `/blog` or Shopify's `/blogs/news` (plan decision 5).
- Sapil FAQ content: until Sapil publishes an FAQ page per market, `/faq` shows the help panel.
- `OfferShop` redesign.
