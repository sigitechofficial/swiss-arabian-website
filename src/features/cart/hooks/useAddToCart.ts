"use client";

import { useCartStore, type CartLine } from "@/stores/useCartStore";
import { useUiStore } from "@/stores/useUiStore";
import { addCartItem } from "../api/cart.service";
import { storeCartId } from "../utils/guestToken";
import { toast } from "@/components/ui/Toaster";
import { DEFAULT_SIZE_LABEL } from "../data/cartContent";

type AddPayload = Omit<CartLine, "quantity"> & {
  quantity?: number;
  /**
   * D365 SKU — preferred over variantId for add-to-cart.
   * Pass both when available; the service will prefer sku.
   */
  sku?: string;
};

/** Adds a product to the cart (optimistic + API sync) and opens the side sheet. */
export function useAddToCart() {
  const addLine = useCartStore((s) => s.addLine);
  const removeLine = useCartStore((s) => s.removeLine);
  const setCartFromApi = useCartStore((s) => s.setCartFromApi);
  const cartId = useCartStore((s) => s.cartId);
  const setCartOpen = useUiStore((s) => s.setCartOpen);

  return (payload: AddPayload): void => {
    const line: CartLine = {
      sizeLabel: DEFAULT_SIZE_LABEL,
      ...payload,
      quantity: payload.quantity ?? 1,
    };

    // Optimistic: instant feedback before API responds.
    addLine(line);
    setCartOpen(true);

    void addCartItem({
      sku: payload.sku,
      variantId: payload.variantId,
      quantity: line.quantity,
      cartId,
    })
      .then((cart) => {
        storeCartId(cart.cartId);
        setCartFromApi(cart);
      })
      .catch(() => {
        // Revert the optimistic add and notify the user.
        removeLine(line.variantId);
        toast("Could not add item to cart. Please try again.", "error");
      });
  };
}
