"use client";

import { useCartStore, type CartLine } from "@/stores/useCartStore";
import { useUiStore } from "@/stores/useUiStore";
import { DEFAULT_SIZE_LABEL } from "../data/cartContent";

type AddPayload = Omit<CartLine, "quantity"> & { quantity?: number };

/** Adds a line and opens the Figma cart side sheet. */
export function useAddToCart() {
  const addLine = useCartStore((s) => s.addLine);
  const setCartOpen = useUiStore((s) => s.setCartOpen);

  return (line: AddPayload) => {
    addLine({
      sizeLabel: DEFAULT_SIZE_LABEL,
      ...line,
    });
    setCartOpen(true);
  };
}
