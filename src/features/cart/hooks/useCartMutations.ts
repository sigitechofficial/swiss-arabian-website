"use client";

import { useCartStore } from "@/stores/useCartStore";
import {
  updateCartItem,
  removeCartItem,
  clearCartItems,
  getActiveCart,
} from "../api/cart.service";
import { storeCartId } from "../utils/guestToken";
import { toast } from "@/components/ui/Toaster";

/**
 * Provides optimistic cart mutations backed by the API.
 * On failure the cart is re-fetched to restore authoritative state.
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
    } catch {
      toast("Could not remove item. Please try again.", "error");
      void refetch();
    }
  }

  /** Clear all cart lines. */
  async function clearCart() {
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
    } catch {
      toast("Could not clear cart. Please try again.", "error");
      void refetch();
    }
  }

  return { updateItem, removeItem, clearCart };
}
