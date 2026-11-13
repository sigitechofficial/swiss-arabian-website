"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthBootstrapped, useIsAuthenticated } from "@/hooks/useCurrentUser";
import { useWishlistStatusScope } from "../components/WishlistStatusScope";
import { isProductUuid } from "../utils/productId";
import { useWishlistMutations } from "./useWishlistMutations";
import { useWishlistStatusMap } from "./useWishlistStatus";

export type WishlistToggle = {
  /** False for products the wishlist can't hold (no catalog id): render nothing. */
  supported: boolean;
  inWishlist: boolean;
  isAuthenticated: boolean;
  /** Auth still loading or a change is being saved. */
  disabled: boolean;
  /** Guests go to sign-in (and come back); members add or remove. */
  toggle: () => void;
};

/**
 * Heart button logic for one product: its saved state (batched through a
 * WishlistStatusScope when there is one) and the add / remove / sign-in action.
 */
export function useWishlistToggle(productId: string): WishlistToggle {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const bootstrapped = useAuthBootstrapped();
  const scope = useWishlistStatusScope();
  const fallback = useWishlistStatusMap(scope ? [] : [productId]);
  const { toggle, add, remove } = useWishlistMutations();
  const supported = isProductUuid(productId);

  // Depend on the (stable) register/unregister functions, not the whole scope
  // value: that changes whenever wishlist statuses load, and re-registering on
  // each change fed a render loop.
  const register = scope?.register;
  const unregister = scope?.unregister;
  useEffect(() => {
    if (!supported || !register || !unregister) return;
    register(productId);
    return () => unregister(productId);
  }, [productId, supported, register, unregister]);

  const inWishlist = supported
    ? scope
      ? scope.inWishlist(productId)
      : fallback.inWishlist(productId)
    : false;
  const pending = add.isPending || remove.isPending;

  return {
    supported,
    inWishlist,
    isAuthenticated,
    disabled: !bootstrapped || pending,
    toggle: () => {
      if (!supported || !bootstrapped || pending) return;
      if (!isAuthenticated) {
        const returnTo = `${window.location.pathname}${window.location.search}`;
        router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
        return;
      }
      void toggle(productId, inWishlist);
    },
  };
}
