"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ApiCart, CartValidation } from "@/features/cart/types/cart";

export type CartLine = {
  /** API-assigned cart item ID — required for update/remove mutations. */
  cartItemId?: string;
  productId?: string;
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
  /** False when API reports item is not sellable (e.g. out of stock). */
  isSellable?: boolean;
  sku?: string;
  category?: string | null;
  brand?: string | null;
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
  /** API-assigned cart ID — persisted in localStorage, threaded through every mutation. */
  cartId: string | null;
  /** Authoritative totals from the API response; null until first API sync. */
  totals: CartTotals | null;
  /** Populated after POST /validate. */
  validation: CartValidation | null;

  // ── Local mutations (used for optimistic updates + offline fallback) ──
  addLine: (line: Omit<CartLine, "quantity"> & { quantity?: number }) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeLine: (variantId: string) => void;
  clear: () => void;
  setCartId: (id: string | null) => void;
  setValidation: (v: CartValidation | null) => void;

  /**
   * Sync full store state from an API cart response.
   * Merges API items with existing local lines to preserve imageUrl / slug / notes
   * that the API does not return.
   */
  setCartFromApi: (cart: ApiCart) => void;

  // ── Derived ──
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
            lines: [...state.lines, { ...line, quantity: line.quantity ?? 1 }],
          };
        }),

      updateQuantity: (variantId, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((item) => item.variantId !== variantId)
              : state.lines.map((item) =>
                  item.variantId === variantId ? { ...item, quantity } : item,
                ),
        })),

      removeLine: (variantId) =>
        set((state) => ({
          lines: state.lines.filter((item) => item.variantId !== variantId),
        })),

      clear: () => set({ lines: [], totals: null, validation: null }),

      setCartId: (id) => set({ cartId: id }),

      setValidation: (v) => set({ validation: v }),

      setCartFromApi: (cart) =>
        set((state) => {
          // Build a lookup of existing lines by variantId to preserve
          // imageUrl / slug / notes that the API does not return.
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
              imageUrl: local?.imageUrl ?? item.image ?? item.images?.[0]?.url ?? undefined,
              unitPrice,
              currency: item.currencyCode ?? cart.currency ?? "AED",
              quantity,
              sizeLabel: item.variantName ?? local?.sizeLabel,
              notes: local?.notes,
              isSellable: item.sellabilitySummary?.isSellable ?? true,
              sku: item.sku || local?.sku,
              category: local?.category,
              brand: local?.brand,
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
      // Only persist lines for offline/SSR fallback — live data comes from API.
      partialize: (state) => ({ lines: state.lines }),
    },
  ),
);
