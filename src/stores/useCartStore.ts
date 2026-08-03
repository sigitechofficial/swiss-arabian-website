"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartLine = {
  productId: string;
  variantId: string;
  slug: string;
  title: string;
  imageUrl?: string;
  unitPrice: number;
  currency: string;
  quantity: number;
  /** e.g. "75 ml EDP" */
  sizeLabel?: string;
  /** Fragrance note chips */
  notes?: string[];
};

type CartState = {
  lines: CartLine[];
  addLine: (line: Omit<CartLine, "quantity"> & { quantity?: number }) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeLine: (variantId: string) => void;
  clear: () => void;
  itemCount: () => number;
  subtotal: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      addLine: (line) =>
        set((state) => {
          const existing = state.lines.find(
            (item) => item.variantId === line.variantId,
          );
          if (existing) {
            return {
              lines: state.lines.map((item) =>
                item.variantId === line.variantId
                  ? {
                      ...item,
                      quantity: item.quantity + (line.quantity ?? 1),
                      imageUrl: line.imageUrl ?? item.imageUrl,
                      sizeLabel: line.sizeLabel ?? item.sizeLabel,
                      notes: line.notes?.length ? line.notes : item.notes,
                    }
                  : item,
              ),
            };
          }
          return {
            lines: [
              ...state.lines,
              { ...line, quantity: line.quantity ?? 1 },
            ],
          };
        }),
      updateQuantity: (variantId, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((item) => item.variantId !== variantId)
              : state.lines.map((item) =>
                  item.variantId === variantId
                    ? { ...item, quantity }
                    : item,
                ),
        })),
      removeLine: (variantId) =>
        set((state) => ({
          lines: state.lines.filter((item) => item.variantId !== variantId),
        })),
      clear: () => set({ lines: [] }),
      itemCount: () =>
        get().lines.reduce((sum, line) => sum + line.quantity, 0),
      subtotal: () =>
        get().lines.reduce(
          (sum, line) => sum + line.unitPrice * line.quantity,
          0,
        ),
    }),
    { name: "sa-store-cart" },
  ),
);
