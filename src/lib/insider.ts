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
    queue().push({ type: "init" });
  });
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
 * SOW event #2 — product detail page viewed.
 * Fire when a PDP mounts and product data is available.
 */
export function insiderProductViewed(product: InsiderProductPayload): void {
  runWhenReady(() => {
    window.Insider?.track?.setItem({
      id: product.id,
      name: product.name,
      sku: product.sku,
      taxonomy: product.category ? [product.category] : [],
      currency: product.currency,
      unit_price: product.price,
      unit_sale_price: product.price,
      url:
        product.productUrl ??
        (typeof window !== "undefined" ? window.location.href : ""),
      product_image_url: product.imageUrl ?? "",
      ...(product.brand ? { brand: product.brand } : {}),
    });
  });
}

/**
 * SOW event #3 — add to cart.
 * Fire AFTER the backend cart API returns success — not on button click.
 */
export function insiderAddToCart(item: InsiderCartItemPayload): void {
  runWhenReady(() => {
    window.Insider?.track?.addItem({
      id: item.id,
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      currency: item.currency,
      unit_price: item.price,
      unit_sale_price: item.price,
      url:
        item.productUrl ??
        (typeof window !== "undefined" ? window.location.href : ""),
      product_image_url: item.imageUrl ?? "",
      taxonomy: item.category ? [item.category] : [],
      ...(item.brand ? { brand: item.brand } : {}),
    });
  });
}
