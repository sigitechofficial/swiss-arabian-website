import {
  localePrefixOf,
  stripLocalePrefix,
  withLocalePrefix,
} from "@/lib/i18n/localePath";
import { getBrandConfig } from "@/lib/brand";

/**
 * Permanent (301) redirects for Shopify's standard URL shapes, so links and
 * search results from the old store land on the platform's own pages.
 *
 * Product and collection handles themselves are resolved by the catalog
 * (slug, per-market handle, alias) — this only rewrites the URL *shape*.
 * Addresses in another language keep their prefix ("/ar").
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

/**
 * Shopify's built-in policies (/policies/…) are a second, English-only copy with
 * different text. The pages the store's footer links to are the real policies
 * (English + Arabic, per market), so the built-in addresses go there. Contact
 * information stays: the contact page shows it.
 */
const POLICY_REDIRECTS: Record<string, string> = {
  "shipping-policy": "/pages/shipping-delivery-policy",
  "refund-policy": "/pages/refund-policy",
  "privacy-policy": "/pages/privacy-policy",
  "terms-of-service": "/pages/terms-and-conditions",
};

/** Short Shopify paths (no "/pages/") seen in imported content and links. */
const SHORT_PAGE_REDIRECTS: Record<string, string> = {
  "return-policy": "/pages/refund-policy",
  "returns": "/pages/refund-policy",
  "refund-policy": "/pages/refund-policy",
  "privacy-policy": "/pages/privacy-policy",
  "shipping-policy": "/pages/shipping-delivery-policy",
  "terms-and-conditions": "/pages/terms-and-conditions",
  "track-order": "/track",
  "track-your-order": "/track",
};

/**
 * One store's own Shopify addresses (its page renames, short links, market folders).
 * Shopify's standard URL shapes below apply to every brand that came from Shopify.
 */
type StoreRedirects = {
  pages: Record<string, string>;
  policies: Record<string, string>;
  shortPages: Record<string, string>;
  marketFolder: RegExp | null;
};

const NO_STORE_REDIRECTS: StoreRedirects = { pages: {}, policies: {}, shortPages: {}, marketFolder: null };

/** Store-specific tables per brand. A brand not listed only gets the standard shapes. */
const STORE_REDIRECTS: Record<string, StoreRedirects> = {
  SWISS_ARABIAN: {
    pages: PAGE_REDIRECTS,
    policies: POLICY_REDIRECTS,
    shortPages: SHORT_PAGE_REDIRECTS,
    marketFolder: MARKET_FOLDER,
  },
};

function storeRedirectsFor(brandCode: string): StoreRedirects {
  return STORE_REDIRECTS[brandCode.toUpperCase()] ?? NO_STORE_REDIRECTS;
}

function rewriteBare(path: string, store: StoreRedirects): string | null {
  const folder = store.marketFolder?.exec(path);
  if (folder) {
    const rest = folder[2] && folder[2] !== "/" ? folder[2] : "/";
    return rewriteBare(rest, store) ?? rest.replace(/(.)\/$/, "$1");
  }
  const short = /^\/([^/]+)\/?$/.exec(path);
  if (short && store.shortPages[short[1].toLowerCase()]) {
    return store.shortPages[short[1].toLowerCase()];
  }

  // Shopify's built-in "all products" collection.
  if (/^\/collections\/all\/?$/.test(path)) return "/products";

  // /collections/{collection}/products/{product} → canonical product URL.
  const nested = /^\/collections\/[^/]+\/products\/([^/]+)\/?$/.exec(path);
  if (nested) return `/products/${nested[1]}`;

  for (const [pattern, target] of ACCOUNT_REDIRECTS) {
    if (pattern.test(path)) return target;
  }

  const policy = /^\/policies\/([^/]+)\/?$/.exec(path);
  if (policy) return store.policies[policy[1].toLowerCase()] ?? null;

  const page = /^\/pages\/([^/]+)\/?$/.exec(path);
  if (page) {
    const target = store.pages[page[1].toLowerCase()];
    return target ?? null;
  }

  // /blogs/{blog}/{article} → /blog/{article}; /blogs/{blog} → /blog.
  const article = /^\/blogs\/[^/]+\/([^/]+)\/?$/.exec(path);
  if (article) return `/blog/${article[1]}`;
  if (/^\/blogs\/[^/]+\/?$/.test(path)) return "/blog";

  return null;
}

/** Target path for an old Shopify URL, or null when no redirect applies. */
export function shopifyLegacyRedirect(
  pathname: string,
  brandCode: string = getBrandConfig().code,
): string | null {
  const prefix = localePrefixOf(pathname);
  const bare = prefix ? stripLocalePrefix(pathname) : pathname;
  const target = rewriteBare(bare, storeRedirectsFor(brandCode));
  if (!target || target === bare) return null;
  if (!prefix) return target;
  return withLocalePrefix(target, prefix);
}
