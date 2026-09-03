import { env } from "@/lib/config/env";

declare global {
  interface Window {
    InsiderQueue?: Array<Record<string, unknown>>;
    Insider?: {
      initialized?: boolean;
      identify?: (user: Record<string, unknown>) => void;
      track?: {
        setUser: (user: Record<string, unknown>) => void;
        setItem: (item: Record<string, unknown>) => void;
        addItem: (item: Record<string, unknown>) => void;
        removeItem: (item: Record<string, unknown>) => void;
        purchase: (data: Record<string, unknown>) => void;
        logout: () => void;
      };
      eventBuffer?: { name: string; buffer: unknown[] };
    };
  }
}

type InsiderCall = () => void;

const pending: InsiderCall[] = [];
let sdkReady = false;

function envAllows(): boolean {
  return env.insider.enabled && Boolean(env.insider.accountId);
}

function hasRealSdk(): boolean {
  return typeof window !== "undefined" && typeof window.Insider === "object";
}

function queue(): NonNullable<Window["InsiderQueue"]> {
  window.InsiderQueue = window.InsiderQueue || [];
  return window.InsiderQueue;
}

/** After ins.js loads, replay identify/track calls that fired first. */
export function startInsiderSdk(): void {
  if (typeof window === "undefined" || !envAllows()) return;
  waitUntilInitialized(flushInsiderQueue);
}

function waitUntilInitialized(done: () => void): void {
  const deadline = Date.now() + 4000;
  const tick = () => {
    if (window.Insider?.initialized === true) {
      done();
      return;
    }
    if (Date.now() > deadline) {
      if (process.env.NODE_ENV !== "production") {
        const partnerHost =
          (
            window.Insider as
              | { partner?: { site?: { host?: string } } }
              | undefined
          )?.partner?.site?.host ?? "(unknown)";
        console.warn(
          `[Insider] SDK did not initialize on ${window.location.host}. Partner site host is ${partnerHost}. Events will not send until this page is opened on that host (or that host is added in Insider InOne → site / multi-domains). Watch for: "API Init failed. Check site information."`,
        );
      }
      done();
      return;
    }
    window.setTimeout(tick, 50);
  };
  tick();
}

/** Replay queued events after ins.js finishes loading. */
export function flushInsiderQueue(): void {
  if (typeof window === "undefined" || !envAllows()) return;
  if (!hasRealSdk()) return;
  sdkReady = true;
  const queued = pending.splice(0);
  for (const call of queued) {
    try {
      call();
    } catch {
      // Insider must never break app flow
    }
  }
}

function runWhenReady(call: InsiderCall): void {
  if (typeof window === "undefined" || !envAllows()) return;
  if (sdkReady || hasRealSdk()) {
    sdkReady = true;
    try {
      call();
    } catch {
      // silent
    }
    return;
  }
  pending.push(call);
}

export type InsiderIdentifyUser = {
  uuid: string;
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  zoneCode?: string | null;
  locale?: string | null;
};

export type InsiderProductPayload = {
  id: string;
  sku: string;
  name: string;
  price: number;
  currency: string;
  imageUrl?: string | null;
  productUrl?: string;
  category?: string | null;
  brand?: string | null;
};

export type InsiderCartItemPayload = InsiderProductPayload & {
  quantity: number;
};

export type InsiderCartSnapshot = {
  total: number;
  items: InsiderCartItemPayload[];
};

export type InsiderListingPage = {
  taxonomy?: string | null;
  items?: InsiderProductPayload[];
};

function productUrl(product: InsiderProductPayload): string {
  return (
    product.productUrl ??
    (typeof window !== "undefined" ? window.location.href : "")
  );
}

/** Web SDK product object — same fields for type:'product' and type:'add_to_cart'. */
function productQueueValue(
  product: InsiderProductPayload,
  quantity?: number,
): Record<string, unknown> {
  return {
    id: product.id,
    name: product.name,
    taxonomy: product.category ? [product.category] : [],
    unit_price: product.price,
    unit_sale_price: product.price,
    url: productUrl(product),
    product_image_url: product.imageUrl ?? "",
    ...(typeof quantity === "number" ? { quantity } : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    ...(product.brand ? { brand: product.brand } : {}),
    ...(product.currency ? { custom: { currency: product.currency } } : {}),
  };
}

/**
 * Call after login OR registration — stitches the anonymous browser session
 * to the known platform customer inside Insider.
 */
export function insiderIdentify(user: InsiderIdentifyUser): void {
  runWhenReady(() => {
    queue().push({
      type: "user",
      value: {
        uuid: user.uuid,
        ...(user.email ? { email: user.email } : {}),
        ...(user.phone ? { phone_number: user.phone } : {}),
        ...(user.firstName ? { name: user.firstName } : {}),
        ...(user.lastName ? { surname: user.lastName } : {}),
        language: user.locale || "en",
        custom: {
          ...(user.firstName ? { first_name: user.firstName } : {}),
          ...(user.lastName ? { last_name: user.lastName } : {}),
          ...(user.zoneCode ? { zone_code: user.zoneCode } : {}),
          ...(user.locale ? { locale: user.locale } : {}),
        },
      },
    });
    // Do not init here on first load — that sends page_type "other" and
    // Insider ignores a later product+init for the hit. Page views come from
    // the route helpers below. If the SDK is already up (SPA), init once so
    // user stitch still flushes with the last page type.
    if (window.Insider?.initialized === true) {
      queue().push({ type: "init" });
    }
  });
}

function pushPage(type: string, value?: Record<string, unknown>): void {
  runWhenReady(() => {
    if (value) queue().push({ type, value });
    else queue().push({ type });
    queue().push({ type: "init" });
  });
}

/** Home — `home_page_view`. */
export function insiderHomePage(): void {
  pushPage("home");
}

/** Listing / collection / search PLP — `listing_page_view`. */
export function insiderListingPage(page?: InsiderListingPage): void {
  const value: Record<string, unknown> = {};
  if (page?.taxonomy) value.taxonomy = [page.taxonomy];
  if (page?.items?.length) {
    value.items = page.items.map((item) => productQueueValue(item));
  }
  pushPage("category", Object.keys(value).length ? value : undefined);
}

/** Cart page — `cart_page_view`. Must include the current line items. */
export function insiderCartPage(cart: InsiderCartSnapshot): void {
  pushPage("cart", {
    total: cart.total,
    items: cart.items.map((item) => productQueueValue(item, item.quantity)),
  });
}

/**
 * Checkout flow — documented Web SDK page view is `other_page_view`
 * (`type: "other"` + `init`). Do not send `type: "checkout"` unless Insider
 * confirms this partner accepts it. Funnel start stays backend `checkout_started`.
 */
export function insiderCheckoutPage(): void {
  pushPage("other");
}

/**
 * Account, login, content, confirmation, 404 — Other Page View.
 * PDPs must not call this; they send product + init.
 */
export function insiderOtherPage(): void {
  pushPage("other");
}

/**
 * Call on logout — clears the Insider session link between browser and customer.
 */
export function insiderLogout(): void {
  runWhenReady(() => {
    window.Insider?.track?.logout();
  });
}

/**
 * SOW event #2 — product detail page viewed (`product_detail_page_view`).
 * Fire when a PDP mounts and product data is available.
 */
export function insiderProductViewed(product: InsiderProductPayload): void {
  runWhenReady(() => {
    queue().push({ type: "product", value: productQueueValue(product) });
    queue().push({ type: "init" });
  });
}

/**
 * SOW event #3 — add to cart (`item_added_to_cart`).
 * Fire AFTER the backend cart API returns success — not on button click.
 * Does not need a following `init` (Insider Web SDK).
 */
export function insiderAddToCart(item: InsiderCartItemPayload): void {
  runWhenReady(() => {
    queue().push({
      type: "add_to_cart",
      value: productQueueValue(item, item.quantity),
    });
  });
}

/**
 * Remove from cart (`item_removed_from_cart`).
 * Fire AFTER the cart DELETE/PATCH success — not on button click.
 * Does not need a following `init`.
 */
export function insiderRemoveFromCart(item: InsiderCartItemPayload): void {
  runWhenReady(() => {
    queue().push({
      type: "remove_from_cart",
      value: productQueueValue(item, item.quantity),
    });
  });
}
