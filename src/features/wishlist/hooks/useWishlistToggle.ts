"use client";

import { useCallback, useEffect } from "react";
import { useLocaleRouter } from "@/lib/i18n/useLocaleRouter";
import { useAuthBootstrapped, useIsAuthenticated } from "@/hooks/useCurrentUser";
import { useWishlistStatusScope } from "../components/WishlistStatusScope";
import { isProductUuid } from "../utils/productId";
import { useWishlistMutations } from "./useWishlistMutations";
import { useWishlistStatusMap } from "./useWishlistStatus";

export type WishlistToggleState = {
  /** Only real catalog products (UUIDs) can be saved; render nothing otherwise. */
  available: boolean;
  /** Same as `available` (kept for callers that read it under this name). */
  supported: boolean;
  inWishlist: boolean;
  isAuthenticated: boolean;
  /** Auth still loading, or a save/remove is running. */
  disabled: boolean;
  /** Guests go to sign in (and come back); shoppers toggle the product. */
  toggle: () => void;
};

/**
 * The wishlist heart's logic, shared by every brand's heart button: status
 * from the nearest `WishlistStatusScope` (one batched request per grid), or
 * its own request outside a scope.
 */
/** Alias of `WishlistToggleState`. */
export type WishlistToggle = WishlistToggleState;

export function useWishlistToggle(productId: string): WishlistToggleState {
  const router = useLocaleRouter();
  const isAuthenticated = useIsAuthenticated();
  const bootstrapped = useAuthBootstrapped();
  const scope = useWishlistStatusScope();
  const fallback = useWishlistStatusMap(scope ? [] : [productId]);
  const { toggle: toggleMutation, add, remove } = useWishlistMutations();
  const available = isProductUuid(productId);

  // Depend on the (stable) register/unregister functions, not the whole scope
  // value: that changes whenever wishlist statuses load, and re-registering on
  // each change fed a render loop.
  const register = scope?.register;
  const unregister = scope?.unregister;
  useEffect(() => {
    if (!available || !register || !unregister) return;
    register(productId);
    return () => unregister(productId);
  }, [available, productId, register, unregister]);

  const inWishlist = available
    ? scope
      ? scope.inWishlist(productId)
      : fallback.inWishlist(productId)
    : false;
  const pending = add.isPending || remove.isPending;

  const toggle = useCallback(() => {
    if (!bootstrapped || pending || !available) return;
    if (!isAuthenticated) {
      const returnTo = `${window.location.pathname}${window.location.search}`;
      router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }
    void toggleMutation(productId, inWishlist);
  }, [available, bootstrapped, inWishlist, isAuthenticated, pending, productId, router, toggleMutation]);

  return {
    available,
    supported: available,
    inWishlist,
    isAuthenticated,
    disabled: !bootstrapped || pending,
    toggle,
  };
}
