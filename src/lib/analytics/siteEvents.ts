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
    cartId: item.cartId,
    quantity: item.quantity,
  });
}

export function trackCartItemRemoved(item: CartLineRef): void {
  track("cart_item_removed", {
    productId: item.productId,
    variantId: item.variantId,
    sku: item.sku,
    currencyCode: item.currencyCode,
    cartId: item.cartId,
    quantity: item.quantity,
  });
}

export function trackCartViewed(): void {
  track("cart_viewed", {}, { dedupeKey: "cart" });
}

export function trackCheckoutViewed(): void {
  track("checkout_viewed", {}, { dedupeKey: "checkout" });
}

export function trackEngagementThreshold(seconds: number): void {
  track("engagement_threshold_reached", { dwellSeconds: seconds });
}

export function trackScrollDepth(percent: number): void {
  track("scroll_depth_reached", { scrollDepthPercent: percent }, { dedupeKey: String(percent) });
}
