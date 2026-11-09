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
  [/^\/account\/orders\/[^/]+\/?$/, "/account/orders"],
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
  "gift-box": "/gift-box",
  "gift-cards": "/gift-cards",
  subscription: "/subscriptions",
  subscriptions: "/subscriptions",
};

function rewriteBare(path: string): string | null {
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
