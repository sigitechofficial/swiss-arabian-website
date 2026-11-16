"use client";

import { useCallback, useState } from "react";
import { setQuantityOptimistic, useAddToCart } from "@/features/cart";
import { atStockLimit } from "@/features/cart/utils/stockLimit";
import { useResetOnChange } from "@/hooks/useResetOnChange";
import { useCartStore, type CartLine } from "@/stores/useCartStore";
import type { ProductSummary } from "../types/product";

/** Most units of one product a shopper picks before adding (the line can grow in the bag). */
export const PURCHASE_MAX_QUANTITY = 9;

export type AddResult =
  /** Added (the bag opens). */
  | { status: "added"; quantity: number }
  /** The bag already holds every unit in stock. */
  | { status: "full"; maxQuantity: number };

/**
 * Product-page buying logic shared by every brand's buy box: the quantity
 * picker (which edits the bag line directly once the product is in the bag),
 * stock / price checks, and Add to bag.
 */
export function useProductPurchase(product: ProductSummary, cartLine: CartLine | undefined) {
  const [quantity, setQuantity] = useState(1);
  const updateLocalQuantity = useCartStore((s) => s.updateQuantity);
  const { addToCart } = useAddToCart();

  useResetOnChange(product.slug, () => setQuantity(1));

  /** No price, not sellable or out of stock: offer a back-in-stock alert instead. */
  const needsAlert =
    product.price == null || product.isSellable === false || product.inStock === false;
  /** No price at all: "Unavailable". */
  const unavailable = product.price == null;
  const displayQty = cartLine ? cartLine.quantity : quantity;

  const setLineQuantity = useCallback(
    (line: CartLine, next: number) => {
      if (line.remote || line.cartItemId) {
        setQuantityOptimistic(line.variantId, next);
      } else {
        updateLocalQuantity(line.variantId, next);
      }
    },
    [updateLocalQuantity],
  );

  const decrease = useCallback(() => {
    if (cartLine) {
      setLineQuantity(cartLine, Math.max(1, cartLine.quantity - 1));
      return;
    }
    setQuantity((current) => Math.max(1, current - 1));
  }, [cartLine, setLineQuantity]);

  const increase = useCallback(() => {
    if (cartLine) {
      setLineQuantity(cartLine, Math.min(PURCHASE_MAX_QUANTITY, cartLine.quantity + 1));
      return;
    }
    setQuantity((current) => Math.min(PURCHASE_MAX_QUANTITY, current + 1));
  }, [cartLine, setLineQuantity]);

  /** Sets the picker (or the bag line) to `next`, within 1…9. */
  const setDisplayQuantity = useCallback(
    (next: number) => {
      const value = Math.max(1, Math.min(PURCHASE_MAX_QUANTITY, Math.trunc(next)));
      if (cartLine) setLineQuantity(cartLine, value);
      else setQuantity(value);
    },
    [cartLine, setLineQuantity],
  );

  const add = useCallback((): AddResult => {
    if (cartLine?.maxQuantity != null && atStockLimit(cartLine)) {
      return { status: "full", maxQuantity: cartLine.maxQuantity };
    }
    const units = cartLine ? 1 : quantity;
    void addToCart({
      sku: product.sku,
      variantId: product.variantId,
      slug: product.slug,
      title: product.title,
      imageUrl: product.imageUrl,
      price: product.price,
      currency: product.currency,
      quantity: units,
    });
    return { status: "added", quantity: units };
  }, [addToCart, cartLine, product, quantity]);

  return {
    needsAlert,
    unavailable,
    displayQty,
    canDecrease: displayQty > 1,
    canIncrease: cartLine ? !atStockLimit(cartLine) : true,
    decrease,
    increase,
    setDisplayQuantity,
    add,
  };
}
