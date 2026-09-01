"use client";

import {
  insiderAddToCart,
  insiderRemoveFromCart,
} from "@/lib/insider";
import { useCartStore } from "@/stores/useCartStore";
import {
  updateCartItem,
  removeCartItem,
  clearCartItems,
  getActiveCart,
} from "../api/cart.service";
import { cartLineToInsiderItem } from "../utils/insiderCartItem";
import { storeCartId } from "../utils/guestToken";
import { toast } from "@/components/ui/Toaster";

/**
 * Provides optimistic cart mutations backed by the API.
 * On failure the cart is re-fetched to restore authoritative state.
 * Insider cart events fire only after the matching API returns 200.
 */
export function useCartMutations() {
  const lines = useCartStore((s) => s.lines);
  const cartId = useCartStore((s) => s.cartId);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeLine = useCartStore((s) => s.removeLine);
  const clear = useCartStore((s) => s.clear);
  const setCartFromApi = useCartStore((s) => s.setCartFromApi);

  /** Re-fetch authoritative cart state after a failed mutation. */
  async function refetch() {
    if (!cartId) return;
    try {
      const cart = await getActiveCart(cartId);
      storeCartId(cart.cartId);
      setCartFromApi(cart);
    } catch {
      // Ignore — UI already shows stale data; user can refresh.
    }
  }

  /**
   * Update quantity for a cart line.
   * Passing quantity <= 0 removes the item.
   */
  async function updateItem(variantId: string, quantity: number) {
    const line = lines.find((l) => l.variantId === variantId);
    if (!line) return;

    if (!line.cartItemId || !cartId) {
      // No API cart yet — local-only update.
      updateQuantity(variantId, quantity);
      return;
    }

    if (quantity <= 0) {
      await removeItem(variantId);
      return;
    }

    const previousQty = line.quantity;
    const delta = quantity - previousQty;

    // Optimistic
    updateQuantity(variantId, quantity);

    try {
      const cart = await updateCartItem({
        cartItemId: line.cartItemId,
        quantity,
        cartId,
      });
      storeCartId(cart.cartId);
      setCartFromApi(cart);
      if (delta > 0) {
        insiderAddToCart(cartLineToInsiderItem(line, delta));
      } else if (delta < 0) {
        insiderRemoveFromCart(cartLineToInsiderItem(line, -delta));
      }
    } catch {
      toast("Could not update quantity. Please try again.", "error");
      void refetch();
    }
  }

  /** Remove a single cart line by variantId. */
  async function removeItem(variantId: string) {
    const line = lines.find((l) => l.variantId === variantId);
    if (!line) return;

    if (!line.cartItemId || !cartId) {
      removeLine(variantId);
      return;
    }

    // Optimistic
    removeLine(variantId);

    try {
      const cart = await removeCartItem({
        cartItemId: line.cartItemId,
        cartId,
      });
      storeCartId(cart.cartId);
      setCartFromApi(cart);
      insiderRemoveFromCart(cartLineToInsiderItem(line, line.quantity));
    } catch {
      toast("Could not remove item. Please try again.", "error");
      void refetch();
    }
  }

  /** Clear all cart lines. */
  async function clearCart() {
    const snapshot = [...lines];

    if (!cartId) {
      clear();
      return;
    }

    // Optimistic
    clear();

    try {
      const cart = await clearCartItems(cartId);
      storeCartId(cart.cartId);
      setCartFromApi(cart);
      for (const line of snapshot) {
        insiderRemoveFromCart(cartLineToInsiderItem(line, line.quantity));
      }
    } catch {
      toast("Could not clear cart. Please try again.", "error");
      void refetch();
    }
  }

  return { updateItem, removeItem, clearCart };
}
