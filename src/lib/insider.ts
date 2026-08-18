import { env } from "@/lib/config/env";

declare global {
  interface Window {
    insider_object?: string;
    Insider: {
      identify: (user: Record<string, unknown>) => void;
      track: {
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

function isEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (!env.insider.enabled || !env.insider.accountId) return false;
  if (typeof window.Insider === "undefined") return false;
  return true;
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
  if (!isEnabled()) return;
  try {
    window.Insider.identify({
      uuid: user.uuid,
      ...(user.email ? { email: user.email } : {}),
      ...(user.phone ? { phone_number: user.phone } : {}),
      custom: {
        ...(user.firstName ? { first_name: user.firstName } : {}),
        ...(user.lastName ? { last_name: user.lastName } : {}),
        ...(user.zoneCode ? { zone_code: user.zoneCode } : {}),
        ...(user.locale ? { locale: user.locale } : {}),
      },
    });
  } catch {
    // Insider must never break app flow
  }
}

/**
 * Call on logout — clears the Insider session link between browser and customer.
 */
export function insiderLogout(): void {
  if (!isEnabled()) return;
  try {
    window.Insider.track.logout();
  } catch {
    // silent
  }
}

/**
 * SOW event #2 — product detail page viewed.
 * Fire when a PDP mounts and product data is available.
 */
export function insiderProductViewed(product: InsiderProductPayload): void {
  if (!isEnabled()) return;
  try {
    window.Insider.track.setItem({
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
  } catch {
    // silent
  }
}

/**
 * SOW event #3 — add to cart.
 * Fire AFTER the backend cart API returns success — not on button click.
 */
export function insiderAddToCart(item: InsiderCartItemPayload): void {
  if (!isEnabled()) return;
  try {
    window.Insider.track.addItem({
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
  } catch {
    // silent
  }
}
