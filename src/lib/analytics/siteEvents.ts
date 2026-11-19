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
