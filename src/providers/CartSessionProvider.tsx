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

export function CartSessionProvider({ children }: { children: ReactNode }) {
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const user = useAuthStore((s) => s.user);
  const setCartFromApi = useCartStore((s) => s.setCartFromApi);
  const setCartId = useCartStore((s) => s.setCartId);
  const clear = useCartStore((s) => s.clear);

  const stateRef = useRef<{
    restored: boolean;
    prevUserId: string | null;
  }>({ restored: false, prevUserId: null });

  useEffect(() => {
    if (!bootstrapped) return;

    const { restored, prevUserId } = stateRef.current;
    const currUserId = user?.id ?? null;

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
      } else if (cartId) {
        void getActiveCart(cartId)
          .then((cart) => {
            storeCartId(cart.cartId);
            setCartId(cart.cartId);
            setCartFromApi(cart);
          })
          .catch(() => {
            clearCartId();
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
  }, [bootstrapped, user, setCartFromApi, setCartId, clear]);

  return children;
}
