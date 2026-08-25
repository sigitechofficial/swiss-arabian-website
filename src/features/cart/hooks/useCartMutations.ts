"use client";

import { useMutation } from "@tanstack/react-query";
import {
  addCartItem,
  removeCartItem,
  updateCartItem,
} from "../api/cart.service";
import { storeCartId } from "../utils/guestToken";
import { useCartStore } from "@/stores/useCartStore";
import { toastApiError } from "@/lib/api/toastApiError";

export function useCartMutations() {
  const setCartFromApi = useCartStore((s) => s.setCartFromApi);
  const setCartId = useCartStore((s) => s.setCartId);

  const sync = (cart: Awaited<ReturnType<typeof addCartItem>>) => {
    storeCartId(cart.cartId);
    setCartId(cart.cartId);
    setCartFromApi(cart);
  };

  const add = useMutation({
    mutationFn: addCartItem,
    onSuccess: sync,
    onError: toastApiError,
  });

  const update = useMutation({
    mutationFn: updateCartItem,
    onSuccess: sync,
    onError: toastApiError,
  });

  const remove = useMutation({
    mutationFn: removeCartItem,
    onSuccess: sync,
    onError: toastApiError,
  });

  return { add, update, remove };
}
