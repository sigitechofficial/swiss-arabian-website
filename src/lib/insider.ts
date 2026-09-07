import { env } from "@/lib/config/env";

declare global {
  interface Window {
    InsiderQueue?: Array<Record<string, unknown>>;
    /** Pathname already flushed with type+init in <head> (before ins.js). */
    __SA_INSIDER_HEAD_PATH__?: string;
    /** Head already pushed user/currency/language/cart (PDP skips page+init). */
    __SA_INSIDER_HEAD_CONTEXT__?: boolean;
    /** Access token present — React must flush user+page+init after /me. */
    __SA_INSIDER_WAIT_AUTH__?: boolean;
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
/** Survives React Strict Mode remounts — one page type + init per path. */
let flushedPath: string | undefined;

const INSIDER_UUID_KEY = "sa_insider_uuid";
const INSIDER_USER_KEY = "sa_insider_user";
const INSIDER_LANGUAGE = "en_US";
const INSIDER_CURRENCY = "AED";

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

/** True when <head> already pushed this route's page type + init before ins.js. */
export function consumeHeadInsiderInit(pathname: string): boolean {
  if (typeof window === "undefined") return false;
  if (window.__SA_INSIDER_HEAD_PATH__ !== pathname) return false;
  window.__SA_INSIDER_HEAD_PATH__ = undefined;
  return true;
}

/**
 * First caller for this pathname may flush page type + init.
 * Later callers (Strict Mode, cart-line rerenders) must not push another init.
 */
export function beginInsiderRouteFlush(pathname: string): boolean {
  if (typeof window === "undefined") return false;
  if (window.__SA_INSIDER_WAIT_AUTH__) {
    window.__SA_INSIDER_WAIT_AUTH__ = false;
    flushedPath = pathname;
    window.InsiderQueue = [];
    return true;
  }
  if (consumeHeadInsiderInit(pathname)) {
    flushedPath = pathname;
    return false;
  }
  if (flushedPath === pathname) return false;
  flushedPath = pathname;
  window.InsiderQueue = [];
  return true;
}

export function resetInsiderRouteFlushForTests(): void {
  flushedPath = undefined;
  if (typeof window !== "undefined") {
    window.__SA_INSIDER_WAIT_AUTH__ = false;
  }
}

export function getOrCreateInsiderUuid(): string {
  if (typeof window === "undefined") return "anon";
  try {
    const existing = localStorage.getItem(INSIDER_UUID_KEY);
    if (existing) return existing;
    const created =
      window.crypto?.randomUUID?.() ?? `anon-${Date.now().toString(16)}`;
    localStorage.setItem(INSIDER_UUID_KEY, created);
    return created;
  } catch {
    return `anon-${Date.now().toString(16)}`;
  }
}

function persistInsiderUserValue(value: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(INSIDER_USER_KEY, JSON.stringify(value));
    if (typeof value.uuid === "string" && value.uuid) {
      localStorage.setItem(INSIDER_UUID_KEY, value.uuid);
    }
  } catch {
    // ignore
  }
}

function readStoredInsiderUserValue(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(INSIDER_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object" || !parsed.uuid) return null;
    return parsed;
  } catch {
    return null;
  }
}

function clearStoredInsiderUser(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(INSIDER_USER_KEY);
  } catch {
    // ignore
  }
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
  stock?: number;
  color?: string;
  size?: string;
  groupcode?: string;
};

export type InsiderCartItemPayload = InsiderProductPayload & {
  quantity: number;
};

export type InsiderCartSnapshot = {
  total: number;
  items: InsiderCartItemPayload[];
};

export type InsiderPurchaseLineInput = {
  sku: string;
  productId?: string | null;
  variantId?: string | null;
  productName?: string | null;
  variantName?: string | null;
  quantity: string | number;
  unitPrice: string | number;
  imageUrl?: string | null;
};

export type InsiderPurchaseOrderInput = {
  orderId: string;
  total: string | number;
  shipping?: string | number;
  lines: InsiderPurchaseLineInput[];
};

/** Web SDK purchase `value` — order_id, total, quantity, items[] (array). */
export type InsiderPurchaseValue = {
  order_id: string;
  total: number;
  quantity: number;
  items: Record<string, unknown>[];
  shipping_cost?: number;
};

export function toInsiderPurchaseValueFromOrder(order: {
  orderId: string;
  orderNumber?: string | null;
  totals?: { total?: string; shipping?: string } | null;
  lines?: InsiderPurchaseLineInput[] | null;
}): InsiderPurchaseValue {
  return toInsiderPurchaseValue({
    orderId: order.orderNumber || order.orderId,
    total: order.totals?.total ?? 0,
    shipping: order.totals?.shipping,
    lines: order.lines ?? [],
  });
}

export function toInsiderPurchaseValue(
  order: InsiderPurchaseOrderInput,
): InsiderPurchaseValue {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const items = order.lines.map((line) => {
    const qty = Number.parseInt(String(line.quantity), 10);
    const quantity = Number.isFinite(qty) && qty > 0 ? qty : 1;
    const price = Number(line.unitPrice);
    const unitPrice = Number.isFinite(price) ? price : 0;
    const id = line.variantId || line.productId || line.sku;
    return {
      id,
      name: line.productName?.trim() || line.sku,
      taxonomy: ["Shop"],
      unit_price: unitPrice,
      unit_sale_price: unitPrice,
      quantity,
      url: origin ? `${origin}/products/${encodeURIComponent(line.sku)}` : "",
      product_image_url: line.imageUrl ?? "",
    };
  });
  const quantity = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );
  const total = Number(order.total);
  const shipping = Number(order.shipping);
  const value: InsiderPurchaseValue = {
    order_id: order.orderId,
    total: Number.isFinite(total) ? total : 0,
    quantity,
    items,
  };
  if (Number.isFinite(shipping) && shipping > 0) {
    value.shipping_cost = shipping;
  }
  return value;
}

export type InsiderListingPage = {
  breadcrumb?: string | string[] | null;
};

function listingBreadcrumb(page?: InsiderListingPage): string[] {
  const raw = page?.breadcrumb;
  if (Array.isArray(raw)) {
    const parts = raw.map((part) => part.trim()).filter(Boolean);
    return parts.length ? parts : ["Shop"];
  }
  const single = raw?.trim();
  return single ? [single] : ["Shop"];
}

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
  const value: Record<string, unknown> = {
    id: product.id,
    name: product.name,
    taxonomy: product.category?.trim() ? [product.category.trim()] : ["Shop"],
    unit_price: product.price,
    unit_sale_price: product.price,
    url: productUrl(product),
    product_image_url: product.imageUrl ?? "",
  };
  if (typeof quantity === "number") value.quantity = quantity;
  if (typeof product.stock === "number") value.stock = product.stock;
  if (product.color?.trim()) value.color = product.color.trim();
  if (product.size?.trim()) value.size = product.size.trim();
  if (product.groupcode?.trim()) value.groupcode = product.groupcode.trim();
  return value;
}

function userQueueValue(user?: InsiderIdentifyUser | null): Record<string, unknown> {
  const value: Record<string, unknown> = {
    uuid: user?.uuid || getOrCreateInsiderUuid(),
    language: INSIDER_LANGUAGE,
    gdpr_optin: true,
  };
  const email = user?.email?.trim();
  if (email) value.email = email;
  const phone = user?.phone?.trim();
  if (phone) value.phone_number = phone;
  const name = user?.firstName?.trim();
  if (name) value.name = name;
  const surname = user?.lastName?.trim();
  if (surname) value.surname = surname;
  return value;
}

function cartQueueValue(cart: InsiderCartSnapshot): Record<string, unknown> {
  const quantity = cart.items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0,
  );
  const total = cart.total;
  return {
    total,
    subtotal: total,
    shipping_cost: 0,
    quantity,
    items: cart.items.map((item) => productQueueValue(item, item.quantity)),
  };
}

/**
 * User + currency + basket. Must land in InsiderQueue *before* page type + init.
 * Language is a default *user* attribute (`en_US`), not a separate queue type.
 */
export function pushInsiderUserContext(input?: {
  user?: InsiderIdentifyUser | null;
  cart?: InsiderCartSnapshot | null;
  currency?: string | null;
  /** Listing InOne testers treat any cart items as category products — omit type:cart. */
  skipCart?: boolean;
}): void {
  runWhenReady(() => {
    const cart = input?.cart ?? { total: 0, items: [] };
    const currency =
      input?.currency?.trim() ||
      cart.items.find((item) => item.currency)?.currency ||
      INSIDER_CURRENCY;
    const userValue = input?.user
      ? userQueueValue(input.user)
      : (readStoredInsiderUserValue() ?? userQueueValue(null));
    if (input?.user) persistInsiderUserValue(userValue);
    queue().push({ type: "user", value: userValue });
    queue().push({ type: "currency", value: currency });
    if (input?.skipCart !== true) {
      queue().push({
        type: "cart",
        value: cartQueueValue(cart),
      });
    }
  });
}

/**
 * Persist logged-in identifiers for the next hard reload (head script).
 * Do not push `user` after `init` — InOne rejects that on Home when the
 * session bootstrap (`/me`) finishes after the first page flush.
 */
export function insiderIdentify(user: InsiderIdentifyUser): void {
  persistInsiderUserValue(userQueueValue(user));
}

function pushPage(type: string, value?: Record<string, unknown>): void {
  runWhenReady(() => {
    if (value) queue().push({ type, value });
    else queue().push({ type });
    queue().push({ type: "init" });
  });
}

/** Last push on a route when page type is already in the queue (cart-on-every-page). */
export function insiderInit(): void {
  runWhenReady(() => {
    queue().push({ type: "init" });
  });
}

/** Home — `home_page_view`. */
export function insiderHomePage(): void {
  pushPage("home");
}

/** Listing / collection / search PLP — `listing_page_view`. Partner schema: breadcrumb[]. */
export function insiderListingPage(page?: InsiderListingPage): void {
  pushPage("category", { breadcrumb: listingBreadcrumb(page) });
}

/** Cart page — `cart_page_view`. Must include the current line items. */
export function insiderCartPage(cart: InsiderCartSnapshot): void {
  pushPage("cart", cartQueueValue(cart));
}

/**
 * Checkout flow — documented Web SDK page view is `other_page_view`
 * (`type: "other"` + `init`). Do not send `type: "checkout"` unless Insider
 * confirms this partner accepts it. Funnel start stays backend `checkout_started`.
 */
export function insiderCheckoutPage(): void {
  pushPage("other", { name: "Checkout" });
}

/**
 * Thank-you / payment success — Web SDK `purchase` + `init` (onboarding inspector).
 * Backend still sends `purchase` on PAID; this can double-count until that is turned off.
 */
export function insiderPurchasePage(value: InsiderPurchaseValue): void {
  pushPage("purchase", { ...value });
}

/**
 * Account, login, content, 404 — Other Page View.
 * Thank-you uses `insiderPurchasePage`. PDPs must not call this.
 */
export function insiderOtherPage(name = "Page"): void {
  pushPage("other", { name });
}

/**
 * Call on logout — clears the Insider session link between browser and customer.
 */
export function insiderLogout(): void {
  clearStoredInsiderUser();
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
