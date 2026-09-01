"use client";

import { toast } from "@/components/ui/Toaster";
import { insiderAddToCart } from "@/lib/insider";
import { useCartStore, type CartLine } from "@/stores/useCartStore";
import { useUiStore } from "@/stores/useUiStore";
import { addCartItem } from "../api/cart.service";
import { DEFAULT_SIZE_LABEL } from "../data/cartContent";
import { productPageUrl } from "../utils/insiderCartItem";
import { storeCartId } from "../utils/guestToken";

type AddPayload = Omit<CartLine, "quantity"> & {
  quantity?: number;
  /**
   * D365 SKU — preferred over variantId for add-to-cart.
   * Pass both when available; the service will prefer sku.
   */
  sku?: string;
  category?: string | null;
  brand?: string | null;
};

/** Adds a product to the cart (optimistic + API sync) and opens the side sheet. */
export function useAddToCart() {
  const addLine = useCartStore((s) => s.addLine);
  const removeLine = useCartStore((s) => s.removeLine);
  const setCartFromApi = useCartStore((s) => s.setCartFromApi);
  const cartId = useCartStore((s) => s.cartId);
  const setCartOpen = useUiStore((s) => s.setCartOpen);

  return (payload: AddPayload): void => {
    const { sku, category, brand, quantity, ...cartFields } = payload;
    const line: CartLine = {
      sizeLabel: DEFAULT_SIZE_LABEL,
      ...cartFields,
      sku,
      category,
      brand,
      quantity: quantity ?? 1,
    };

    // Optimistic: instant feedback before API responds.
    addLine(line);
    setCartOpen(true);

    void addCartItem({
      sku,
      variantId: payload.variantId,
      quantity: line.quantity,
      cartId,
    })
      .then((cart) => {
        storeCartId(cart.cartId);
        setCartFromApi(cart);
        insiderAddToCart({
          id: payload.variantId,
          sku: sku || payload.variantId,
          name: payload.title,
          price: payload.unitPrice,
          currency: payload.currency,
          quantity: line.quantity,
          imageUrl: payload.imageUrl ?? null,
          productUrl: productPageUrl(payload.slug),
          category: category ?? null,
          brand: brand ?? null,
        });
      })
      .catch(() => {
        // Revert the optimistic add and notify the user.
        removeLine(line.variantId);
        toast("Could not add item to cart. Please try again.", "error");
      });
  };
}
