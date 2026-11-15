"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCartStore } from "@/stores/useCartStore";
import { useUiStore } from "@/stores/useUiStore";
import { createOrResolveCart, getActiveCart } from "@/features/cart/api/cart.service";
import { ApiClientError } from "@/lib/api/apiError";
import {
  getStoredCartId,
  readGuestToken,
  storeCartId,
  clearCartId,
  clearGuestToken,
} from "@/features/cart/utils/guestToken";

export function CartSessionProvider({ children }: { children: ReactNode }) {
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const user = useAuthStore((s) => s.user);
  const setCartFromApi = useCartStore((s) => s.setCartFromApi);
  const setCartId = useCartStore((s) => s.setCartId);
  const clear = useCartStore((s) => s.clear);
  const marketZone = useUiStore((s) => s.catalogContext?.zoneCode?.trim() || "");

  const stateRef = useRef<{
    restored: boolean;
    prevUserId: string | null;
  }>({ restored: false, prevUserId: null });

  useEffect(() => {
    if (!bootstrapped) return;

    const { restored, prevUserId } = stateRef.current;
    const currUserId = user?.id ?? null;

    // Carts are per market: the API answers 400 without one. Wait until the
    // shopper's market is known (it is restored a moment after load).
    if (!restored && !marketZone) return;

    if (!restored) {
      stateRef.current.restored = true;
      stateRef.current.prevUserId = currUserId;

      const cartId = getStoredCartId();

      if (currUserId) {
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
      } else if (cartId || readGuestToken()) {
        // A guest's cart for this market (by cart id, else by guest token).
        void getActiveCart(cartId)
          .then((cart) => {
            storeCartId(cart.cartId);
            setCartId(cart.cartId);
            setCartFromApi(cart);
          })
          .catch((error: unknown) => {
            // Forget the id only when the cart is really gone; a server that
            // is briefly down must not lose the shopper's cart.
            if (error instanceof ApiClientError && error.status === 404) clearCartId();
          });
      }

      return;
    }

    if (currUserId === prevUserId) return;
    stateRef.current.prevUserId = currUserId;

    if (currUserId && !prevUserId) {
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
      clear();
      setCartId(null);
      clearCartId();
    }
  }, [bootstrapped, user, marketZone, setCartFromApi, setCartId, clear]);

  return children;
}
