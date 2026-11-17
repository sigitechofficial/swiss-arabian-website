import { getActiveCart } from "@/features/cart/api/cart.service";
import { storeCartId } from "@/features/cart/utils/guestToken";
import { useCartStore } from "@/stores/useCartStore";
import { releaseOrderToCart } from "../api/orders.service";
import type { PaymentMethodOption } from "../types/checkout";
import { clearCheckoutSessionId, clearHostedPaymentOpen, clearPaymentState } from "./checkoutSession";
import { isTabbyPaymentMethod } from "./tabby";
import { isTamaraPaymentMethod } from "./tamara";

/**
 * Tabby QA (Nov 2026): after a cancelled or declined Tabby payment the shopper
 * goes back to checkout with the same bag, to try again or pay another way.
 * After a decline Tabby is not offered again for that bag. Tamara, Tabby's
 * twin, works the same way. Shared by every brand.
 */

/** Hosted BNPL providers that can decline a bag and send the shopper back. */
export type DecliningProvider = "tabby" | "tamara";

const DECLINED_KEY: Record<DecliningProvider, string> = {
  tabby: "sa_tabby_declined_cart",
  tamara: "sa_tamara_declined_cart",
};

const IS_PROVIDER_METHOD: Record<
  DecliningProvider,
  (method: Pick<PaymentMethodOption, "providerCode" | "methodCode">) => boolean
> = {
  tabby: isTabbyPaymentMethod,
  tamara: isTamaraPaymentMethod,
};

const PROVIDERS = Object.keys(DECLINED_KEY) as DecliningProvider[];

/** The provider declined this bag: hide it at checkout for that bag (this tab only). */
export function markDeclined(provider: DecliningProvider, cartId: string): void {
  try {
    sessionStorage.setItem(DECLINED_KEY[provider], cartId);
  } catch {
    // Storage blocked: the provider's own pre-check still declines it at checkout.
  }
}

export function isDeclinedFor(provider: DecliningProvider, cartId: string | null | undefined): boolean {
  if (!cartId) return false;
  try {
    return sessionStorage.getItem(DECLINED_KEY[provider]) === cartId;
  } catch {
    return false;
  }
}

export function clearDeclined(provider: DecliningProvider): void {
  try {
    sessionStorage.removeItem(DECLINED_KEY[provider]);
  } catch {
    // ignore
  }
}

/** Order placed: no bag is declined any more. */
export function clearDeclinedPayments(): void {
  for (const provider of PROVIDERS) clearDeclined(provider);
}

/** Payment methods to show for this bag: without Tabby / Tamara once that provider declined it. */
export function offeredPaymentMethods<T extends Pick<PaymentMethodOption, "providerCode" | "methodCode">>(
  methods: T[],
  cartId: string | null | undefined,
): T[] {
  const declined = PROVIDERS.filter((provider) => isDeclinedFor(provider, cartId));
  if (!declined.length) return methods;
  return methods.filter((m) => !declined.some((provider) => IS_PROVIDER_METHOD[provider](m)));
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
  opts: { declined?: boolean; provider?: DecliningProvider } = {},
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
  const provider = opts.provider ?? "tabby";
  if (opts.declined) markDeclined(provider, cartId);
  else clearDeclined(provider);
  return { kind: "checkout" };
}
