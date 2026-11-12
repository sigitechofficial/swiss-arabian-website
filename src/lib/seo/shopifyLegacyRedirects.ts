/**
 * Permanent (301) redirects for Shopify's standard URL shapes, so links and
 * search results from the old store land on the platform's own pages.
 *
 * Product and collection handles themselves are resolved by the catalog
 * (slug, per-market handle, alias) — this only rewrites the URL *shape*.
 * Arabic URLs keep their "/ar" prefix.
 */

const ACCOUNT_REDIRECTS: Array<[RegExp, string]> = [
  [/^\/account\/login\/?$/, "/login"],
  [/^\/account\/register\/?$/, "/register"],
  [/^\/account\/(recover|reset)(\/.*)?$/, "/forgot-password"],
  [/^\/account\/activate(\/.*)?$/, "/login"],
  // Shopify order tokens only — platform order ids (UUIDs) are real detail pages.
  [
    /^\/account\/orders\/(?![0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/?$)[^/]+\/?$/i,
    "/account/orders",
  ],
  [/^\/account\/logout\/?$/, "/"],
];

/** Shopify default page handles with a platform page of the same purpose. */
const PAGE_REDIRECTS: Record<string, string> = {
  "about-us": "/our-story",
  about: "/our-story",
  "our-story": "/our-story",
  // UAE store handle for "About Us" (footer link).
  "our-story-1": "/our-story",
  faq: "/faq",
  faqs: "/faq",
  "store-locator": "/stores",
  stores: "/stores",
  "our-stores": "/stores",
  "track-order": "/track",
  "track-your-order": "/track",
  // Gift sets differ per market (giftsets-gifts, gifting-collection …).
  "gift-box": "/collections",
  subscription: "/subscriptions",
  subscriptions: "/subscriptions",
  // Shopify app and utility pages (completeness report, 11 Nov 2026): same purpose here.
  wishlist: "/account/wishlist",
  "swym-share-wishlist": "/account/wishlist",
  "rapid-search-results": "/search",
  "search-results": "/search",
  "search-results-v-next": "/search",
  "order-status": "/track",
  locator: "/stores",
  "virtual-tour": "/stores",
  blogs: "/blog",
  "joy-subscription": "/subscriptions",
  "manage-subscriptions": "/subscriptions",
  "return-form": "/account/returns",
  "subscribe-form": "/",
  shortcode: "/",
  shortcoe: "/",
  "scent-finder": "/collections",
  "bundles-1": "/collections/bundles",
  "collection-bundle": "/collections/bundles",
  // Both markets have the catalogue download page.
  "product-catalogue": "/pages/download-product-catalogue",
  "product-catalog": "/pages/download-product-catalogue",
  "product-feed": "/pages/download-product-catalogue",
  "h1-class-remove-head-product-catalogue-h1": "/pages/download-product-catalogue",
};

/**
 * Old links with a market folder (e.g. "/uae/return-policy/" in imported FAQ text).
 * The market is chosen by the shopper here, so the folder is dropped.
 */
const MARKET_FOLDER = /^\/(uae|ae|ksa|sa|qatar|qa)(\/.*)?$/i;

/** Short Shopify paths (no "/pages/") seen in imported content. */
const SHORT_PAGE_REDIRECTS: Record<string, string> = {
  "return-policy": "/policies/refund-policy",
  "returns": "/policies/refund-policy",
  "refund-policy": "/policies/refund-policy",
  "track-order": "/track",
  "track-your-order": "/track",
};

function rewriteBare(path: string): string | null {
  const folder = MARKET_FOLDER.exec(path);
  if (folder) {
    const rest = folder[2] && folder[2] !== "/" ? folder[2] : "/";
    return rewriteBare(rest) ?? rest.replace(/(.)\/$/, "$1");
  }
  const short = /^\/([^/]+)\/?$/.exec(path);
  if (short && SHORT_PAGE_REDIRECTS[short[1].toLowerCase()]) {
    return SHORT_PAGE_REDIRECTS[short[1].toLowerCase()];
  }

  // Shopify's built-in "all products" collection.
  if (/^\/collections\/all\/?$/.test(path)) return "/products";

  // /collections/{collection}/products/{product} → canonical product URL.
  const nested = /^\/collections\/[^/]+\/products\/([^/]+)\/?$/.exec(path);
  if (nested) return `/products/${nested[1]}`;

  for (const [pattern, target] of ACCOUNT_REDIRECTS) {
    if (pattern.test(path)) return target;
  }

  const page = /^\/pages\/([^/]+)\/?$/.exec(path);
  if (page) {
    const target = PAGE_REDIRECTS[page[1].toLowerCase()];
    return target ?? null;
  }

  // /blogs/{blog}/{article} → /blog/{article}; /blogs/{blog} → /blog.
  const article = /^\/blogs\/[^/]+\/([^/]+)\/?$/.exec(path);
  if (article) return `/blog/${article[1]}`;
  if (/^\/blogs\/[^/]+\/?$/.test(path)) return "/blog";

  return null;
}

/** Target path for an old Shopify URL, or null when no redirect applies. */
export function shopifyLegacyRedirect(pathname: string): string | null {
  const isArabic = pathname === "/ar" || pathname.startsWith("/ar/");
  const bare = isArabic ? pathname.slice(3) || "/" : pathname;
  const target = rewriteBare(bare);
  if (!target || target === bare) return null;
  if (!isArabic) return target;
  return target === "/" ? "/ar" : `/ar${target}`;
}
