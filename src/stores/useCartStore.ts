"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ApiCart, CartValidation } from "@/features/cart/types/cart";

export type CartLine = {
  cartItemId?: string;
  productId?: string;
  variantId: string;
  slug: string;
  title: string;
  imageUrl?: string;
  unitPrice: number;
  currency: string;
  quantity: number;
  sizeLabel?: string;
  notes?: string[];
  isSellable?: boolean;
  /** Backed by the server cart (real sku/variantId) — edits sync to the API. */
  remote?: boolean;
};

type CartTotals = {
  subtotal: number;
  total: number;
  discount: number;
  currency: string;
  itemCount: number;
  totalQty: number;
};

type CartState = {
  lines: CartLine[];
  cartId: string | null;
  totals: CartTotals | null;
  validation: CartValidation | null;
  /** Optimistic edits are still being written to the API in the background. */
  syncing: boolean;
  setSyncing: (syncing: boolean) => void;
  addLine: (line: Omit<CartLine, "quantity"> & { quantity?: number }) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeLine: (variantId: string) => void;
  clear: () => void;
  setCartId: (id: string | null) => void;
  setValidation: (v: CartValidation | null) => void;
  setCartFromApi: (cart: ApiCart) => void;
  itemCount: () => number;
  subtotal: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      cartId: null,
      totals: null,
      validation: null,
      syncing: false,

      setSyncing: (syncing) => set({ syncing }),

      // Local edits clear the server `totals` — they're stale the moment a
      // line changes, so counts and subtotal fall back to the lines until the
      // next server cart lands.
      addLine: (line) =>
        set((state) => {
          const existing = state.lines.find(
            (item) => item.variantId === line.variantId,
          );
          if (existing) {
            return {
              totals: null,
              lines: state.lines.map((item) =>
                item.variantId === line.variantId
                  ? {
                      ...item,
                      quantity: item.quantity + (line.quantity ?? 1),
                      imageUrl: line.imageUrl ?? item.imageUrl,
                      sizeLabel: line.sizeLabel ?? item.sizeLabel,
                      notes: line.notes?.length ? line.notes : item.notes,
                      remote: line.remote ?? item.remote,
                    }
                  : item,
              ),
            };
          }
          return {
            totals: null,
            lines: [...state.lines, { ...line, quantity: line.quantity ?? 1 }],
          };
        }),

      updateQuantity: (variantId, quantity) =>
        set((state) => ({
          totals: null,
          lines:
            quantity <= 0
              ? state.lines.filter((item) => item.variantId !== variantId)
              : state.lines.map((item) =>
                  item.variantId === variantId ? { ...item, quantity } : item,
                ),
        })),

      removeLine: (variantId) =>
        set((state) => ({
          totals: null,
          lines: state.lines.filter((item) => item.variantId !== variantId),
        })),

      clear: () => set({ lines: [], totals: null, validation: null }),

      setCartId: (id) => set({ cartId: id }),

      setValidation: (v) => set({ validation: v }),

      setCartFromApi: (cart) =>
        set((state) => {
          const localByVariant = new Map(
            state.lines.map((l) => [l.variantId, l]),
          );

          const lines: CartLine[] = cart.items.map((item) => {
            const vid = item.variantId ?? item.sku;
            const local = vid ? localByVariant.get(vid) : undefined;
            const unitPrice = Number(item.unitPriceEstimate ?? "0");
            const quantity = parseInt(item.quantity, 10) || 1;

            return {
              cartItemId: item.cartItemId,
              productId: item.productId ?? undefined,
              variantId: vid ?? item.cartItemId,
              slug: local?.slug ?? "",
              title: item.productName ?? local?.title ?? "",
              imageUrl:
                local?.imageUrl ?? item.image ?? item.images?.[0]?.url ?? undefined,
              unitPrice,
              currency: item.currencyCode ?? cart.currency ?? "AED",
              quantity,
              sizeLabel: item.variantName ?? local?.sizeLabel,
              notes: local?.notes,
              isSellable: item.sellabilitySummary?.isSellable ?? true,
              remote: true,
            };
          });

          const totals: CartTotals = {
            subtotal: Number(cart.subtotalEstimate ?? "0"),
            total: Number(cart.totalEstimate ?? "0"),
            discount: Number(cart.discountEstimate ?? "0"),
            currency: cart.currency ?? "AED",
            itemCount: cart.itemCount ?? lines.length,
            totalQty:
              parseInt(cart.totalQuantity ?? "0", 10) ||
              lines.reduce((s, l) => s + l.quantity, 0),
          };

          return {
            lines,
            totals,
            cartId: cart.cartId,
            validation: cart.validation ?? null,
          };
        }),

      itemCount: () => {
        const { totals, lines } = get();
        if (totals) return totals.totalQty;
        return lines.reduce((sum, line) => sum + line.quantity, 0);
      },

      subtotal: () => {
        const { totals, lines } = get();
        if (totals) return totals.subtotal;
        return lines.reduce(
          (sum, line) => sum + line.unitPrice * line.quantity,
          0,
        );
      },
    }),
    {
      name: "sa-cart-v2",
      partialize: (state) => ({ lines: state.lines }),
    },
  ),
);
