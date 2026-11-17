import { getActiveCart } from "@/features/cart/api/cart.service";
import { storeCartId } from "@/features/cart/utils/guestToken";
import { useCartStore } from "@/stores/useCartStore";
import { releaseOrderToCart } from "../api/orders.service";
import type { PaymentMethodOption } from "../types/checkout";
import { clearCheckoutSessionId, clearHostedPaymentOpen, clearPaymentState } from "./checkoutSession";
import { isTabbyPaymentMethod } from "./tabby";

/**
 * Tabby QA (Nov 2026): after a cancelled or declined Tabby payment the shopper
 * goes back to checkout with the same bag, to try again or pay another way.
 * After a decline Tabby is not offered again for that bag. Shared by every brand.
 */

const DECLINED_KEY = "sa_tabby_declined_cart";

/** Tabby declined this bag: hide Tabby at checkout for it (this tab only). */
export function markTabbyDeclined(cartId: string): void {
  try {
    sessionStorage.setItem(DECLINED_KEY, cartId);
  } catch {
    // Storage blocked: Tabby's own pre-check still declines it at checkout.
  }
}

export function isTabbyDeclinedFor(cartId: string | null | undefined): boolean {
  if (!cartId) return false;
  try {
    return sessionStorage.getItem(DECLINED_KEY) === cartId;
  } catch {
    return false;
  }
}

export function clearTabbyDeclined(): void {
  try {
    sessionStorage.removeItem(DECLINED_KEY);
  } catch {
    // ignore
  }
}

/** Payment methods to show for this bag: without Tabby once Tabby declined it. */
export function offeredPaymentMethods<T extends Pick<PaymentMethodOption, "providerCode" | "methodCode">>(
  methods: T[],
  cartId: string | null | undefined,
): T[] {
  return isTabbyDeclinedFor(cartId) ? methods.filter((m) => !isTabbyPaymentMethod(m)) : methods;
}

export type ReturnToCheckoutResult =
  /** Bag restored; send the shopper to checkout. */
  | { kind: "checkout" }
  /** The payment went through after all; send them to the confirmation. */
  | { kind: "paid" }
  /** The order could not be released (a payment is still open). Keep it. */
  | { kind: "kept" };

/**
 * Cancel the unpaid order and put its bag back (server: release-to-cart), then
 * load that bag into this browser so checkout starts from it.
 */
export async function returnToCheckout(
  orderId: string,
  opts: { declined?: boolean } = {},
): Promise<ReturnToCheckoutResult> {
  clearHostedPaymentOpen();
  const released = await releaseOrderToCart(orderId);
  if (released.outcome === "paid") return { kind: "paid" };
  if (released.outcome !== "released" || !released.cartId) return { kind: "kept" };

  const cartId = released.cartId;
  storeCartId(cartId);
  const store = useCartStore.getState();
  store.setCartId(cartId);
  store.setCartFromApi(await getActiveCart(cartId));
  // The old checkout belonged to the cancelled order; checkout opens a new one.
  clearCheckoutSessionId();
  clearPaymentState();
  if (opts.declined) markTabbyDeclined(cartId);
  else clearTabbyDeclined();
  return { kind: "checkout" };
}
