"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCartStore } from "@/stores/useCartStore";
import { createOrResolveCart, getActiveCart } from "@/features/cart/api/cart.service";
import {
  getStoredCartId,
  storeCartId,
  clearCartId,
  clearGuestToken,
} from "@/features/cart/utils/guestToken";

/**
 * App-wide cart lifecycle manager.
 *
 * Responsibilities:
 * 1. After auth bootstrap: restore the cart for the current identity.
 *    - Authenticated: POST /storefront/cart (merges guest cart, returns customer cart).
 *    - Guest with cartId: GET /storefront/cart (restore previous guest session).
 * 2. On login: POST /storefront/cart with Bearer to merge guest cart.
 * 3. On logout: clear local cart state (server cart is preserved for 30 days).
 *
 * Must be rendered INSIDE AuthSessionProvider so bootstrapped state is available.
 */
export function CartSessionProvider({ children }: { children: ReactNode }) {
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const user = useAuthStore((s) => s.user);
  const setCartFromApi = useCartStore((s) => s.setCartFromApi);
  const setCartId = useCartStore((s) => s.setCartId);
  const clear = useCartStore((s) => s.clear);

  // Track lifecycle state across renders without triggering re-renders.
  const stateRef = useRef<{
    restored: boolean;
    prevUserId: string | null;
  }>({ restored: false, prevUserId: null });

  useEffect(() => {
    if (!bootstrapped) return;

    const { restored, prevUserId } = stateRef.current;
    const currUserId = user?.id ?? null;

    // ── Initial restore (runs once after auth settles) ────────────────────
    if (!restored) {
      stateRef.current.restored = true;
      stateRef.current.prevUserId = currUserId;

      const cartId = getStoredCartId();

      if (currUserId) {
        // Authenticated: create/resolve to get the customer's cart.
        // Backend merges any existing guest cart automatically.
        void createOrResolveCart({ cartId })
          .then((cart) => {
            storeCartId(cart.cartId);
            setCartId(cart.cartId);
            setCartFromApi(cart);
            clearGuestToken();
          })
          .catch(() => {
            // Soft failure — local lines remain from Zustand persist.
          });
      } else if (cartId) {
        // Guest with a known cartId: try to restore.
        void getActiveCart(cartId)
          .then((cart) => {
            storeCartId(cart.cartId);
            setCartId(cart.cartId);
            setCartFromApi(cart);
          })
          .catch(() => {
            // 404 = cart expired (30-day TTL) — discard stale cartId.
            clearCartId();
          });
      }

      return;
    }

    // ── Auth state changed after initial restore ──────────────────────────
    if (currUserId === prevUserId) return;
    stateRef.current.prevUserId = currUserId;

    if (currUserId && !prevUserId) {
      // User just logged in: merge guest cart into customer cart.
      const cartId = getStoredCartId();
      void createOrResolveCart({ cartId })
        .then((cart) => {
          storeCartId(cart.cartId);
          setCartId(cart.cartId);
          setCartFromApi(cart);
          clearGuestToken();
        })
        .catch(() => {
          // Non-critical — user can still browse.
        });
    } else if (!currUserId && prevUserId) {
      // User just logged out: discard cart identity.
      // Server-side cart persists for 30 days.
      clear();
      setCartId(null);
      clearCartId();
    }
  }, [bootstrapped, user, setCartFromApi, setCartId, clear]);

  return children;
}
