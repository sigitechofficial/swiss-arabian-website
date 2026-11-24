import { getStoredCartId } from "@/features/cart/utils/guestToken";
import { track } from "./tracker";

/**
 * Named browser events. Names are the ones the platform already accepts (see the registry): the
 * catalog's `product_viewed` is stored as `catalog_product_viewed`, and so on.
 */
export type ProductRef = {
  productId?: string | null;
  variantId?: string | null;
  sku?: string | null;
  currencyCode?: string | null;
};

export type CartLineRef = ProductRef & { quantity: number; cartId?: string | null };

export function trackPageViewed(pathname: string): void {
  track("page_viewed", {}, { dedupeKey: pathname });
}

/**
 * Which "view" event a route is, if any. Product pages are not here: they report the product itself
 * (`trackProductViewed`) once its data has loaded. `path` is the route without a language prefix.
 */
export function viewEventForPath(path: string): "home" | "list" | "cart" | "checkout" | null {
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return "home";
  if (parts[0] === "products" && parts.length === 1) return "list";
  if (parts[0] === "search" || parts[0] === "collections") return "list";
  if (parts[0] === "cart" && parts.length === 1) return "cart";
  if (parts[0] === "checkout") {
    if (parts[1] === "payment" && (parts[2] === "success" || parts[2] === "cancel")) return null;
    return "checkout";
  }
  return null;
}

/** Sends the home, list, cart or checkout view for a route. Does nothing for other routes. */
export function trackRouteView(path: string): void {
  const view = viewEventForPath(path);
  if (view === "home") trackHomeViewed();
  else if (view === "list") trackListingViewed();
  else if (view === "cart") trackCartViewed();
  else if (view === "checkout") trackCheckoutViewed();
}

export function trackHomeViewed(): void {
  track("homepage_viewed", {}, { dedupeKey: "home" });
}

export function trackListingViewed(): void {
  track("catalog_product_list_viewed", {}, { dedupeKey: "list" });
}

export function trackProductViewed(product: ProductRef): void {
  track(
    "catalog_product_viewed",
    {
      productId: product.productId,
      variantId: product.variantId,
      sku: product.sku,
      currencyCode: product.currencyCode,
    },
    { dedupeKey: product.productId ?? product.sku ?? "" },
  );
}

export function trackCartItemAdded(item: CartLineRef): void {
  track("cart_item_added", {
    productId: item.productId,
    variantId: item.variantId,
    sku: item.sku,
    currencyCode: item.currencyCode,
    cartId: item.cartId ?? getStoredCartId(),
    quantity: item.quantity,
  });
}

export function trackCartItemRemoved(item: CartLineRef): void {
  track("cart_item_removed", {
    productId: item.productId,
    variantId: item.variantId,
    sku: item.sku,
    currencyCode: item.currencyCode,
    cartId: item.cartId ?? getStoredCartId(),
    quantity: item.quantity,
  });
}

export function trackCartViewed(): void {
  track("cart_viewed", {}, { dedupeKey: "cart" });
}

export function trackCheckoutViewed(): void {
  track("checkout_viewed", {}, { dedupeKey: "checkout" });
}

/**
 * A checkout exists for this bag. Carries the checkout and cart ids, which is how the checkout
 * recovery journey finds an abandoned checkout. Sent from the browser, not the server, so it is
 * only recorded when the shopper allowed analytics.
 */
export function trackCheckoutStarted(checkoutId: string, cartId: string | null | undefined): void {
  track("checkout_started", { checkoutId, cartId: cartId ?? getStoredCartId() }, { dedupeKey: checkoutId });
}

export function trackEngagementThreshold(seconds: number): void {
  track("engagement_threshold_reached", { dwellSeconds: seconds });
}

export function trackScrollDepth(percent: number): void {
  track("scroll_depth_reached", { scrollDepthPercent: percent }, { dedupeKey: String(percent) });
}

const PAGE_PAGES = new Set([
  "pages",
  "policies",
  "faq",
  "our-story",
  "return-terms",
  "gift-box",
  "gift-cards",
  "store-locator",
  "lp",
]);
const CHECKOUT_PAGES = new Set(["checkout", "order-confirmation", "payments", "subscriptions"]);

/**
 * Shopify's page type for the web performance reports (Index, Product, Collection, …). `path` is
 * the route without a language prefix. These are report labels, not shopper wording.
 */
export function pageTypeForPath(path: string): string {
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return "Index";
  const [first, second] = parts;
  if (first === "products") return second && second !== "p" ? "Product" : "Collection";
  if (first === "collections") return second ? "Collection" : "List collections";
  if (first === "categories") return "Collection";
  if (first === "cart") return "Cart";
  if (first === "search") return "Search";
  if (first === "blog") return second && second !== "p" ? "Article" : "Blog";
  if (PAGE_PAGES.has(first)) return "Page";
  if (CHECKOUT_PAGES.has(first)) return "Checkout";
  if (first === "account") return "Account";
  return "Other";
}

/** The Core Web Vitals Shopify reports on. */
export const REPORTED_WEB_VITALS = new Set(["LCP", "INP", "CLS"]);

export type WebVitalMetric = {
  id: string;
  name: string;
  value: number;
  rating?: string;
  navigationType?: string;
};

// Next can report a metric more than once, even under a new id (development re-mounts, a callback
// registered again). Each metric is measured once per page load, so its first report is recorded.
// This module lives as long as the page load (client navigations are not measured again).
const sentWebVitals = new Set<string>();

/**
 * One Core Web Vital of this page load (Largest Contentful Paint, Interaction to Next Paint,
 * Cumulative Layout Shift). `path` is the page the load started on (without a language prefix).
 */
export function trackWebVital(metric: WebVitalMetric, path: string): void {
  if (!REPORTED_WEB_VITALS.has(metric.name) || !Number.isFinite(metric.value)) return;
  const once = metric.name;
  if (sentWebVitals.has(once)) return;
  const value =
    metric.name === "CLS" ? Math.round(metric.value * 10_000) / 10_000 : Math.round(metric.value);
  const sent = track(
    "web_vital_recorded",
    {
      metric: metric.name,
      value,
      rating: metric.rating,
      navigationType: metric.navigationType,
      pageType: pageTypeForPath(path),
      pagePath: path,
    },
    { dedupeKey: once },
  );
  if (sent) sentWebVitals.add(once);
}

/** A product shown in a recommendation section ("You may also like", companions, the bag drawer). */
export type RecommendedProduct = {
  id?: string | null;
  variantId?: string | null;
  sku?: string | null;
  slug?: string | null;
};

function recommendationProperties(surface: string, product: RecommendedProduct, position: number) {
  return {
    productId: product.id,
    variantId: product.variantId,
    sku: product.sku,
    surface,
    position,
  };
}

// A section that renders again (new data, new order) does not show its products again.
const shownRecommendations = new Set<string>();

/** The shopper saw this recommended product (its section came into view), once per page. */
export function trackRecommendationImpression(
  surface: string,
  product: RecommendedProduct,
  position: number,
): void {
  const page = typeof window === "undefined" ? "" : window.location.pathname;
  const once = `${page}|${surface}|${product.id ?? product.slug ?? position}`;
  if (shownRecommendations.has(once)) return;
  const sent = track("product_recommendation_impression", recommendationProperties(surface, product, position), {
    dedupeKey: `${surface}:${product.id ?? product.slug ?? position}`,
  });
  if (sent) shownRecommendations.add(once);
}

/** Tests only. */
export function resetRecommendationEventsForTests(): void {
  shownRecommendations.clear();
  sentWebVitals.clear();
}

/** The shopper clicked a recommended product (its page, add to bag, or select). */
export function trackRecommendationClicked(
  surface: string,
  product: RecommendedProduct,
  position: number,
): void {
  track("product_recommendation_clicked", recommendationProperties(surface, product, position), {
    dedupeKey: `${surface}:${product.id ?? product.slug ?? position}`,
  });
}
