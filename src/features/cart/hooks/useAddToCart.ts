"use client";

import { useCartMutations } from "./useCartMutations";
import { useCartStore } from "@/stores/useCartStore";
import { useUiStore } from "@/stores/useUiStore";

export type AddToCartInput = {
  sku?: string;
  variantId?: string;
  quantity?: number;
  /** Needed only for the local-cart fallback below (static catalog
   *  products with no live backend sku/variantId yet). */
  slug?: string;
  title?: string;
  imageUrl?: string | null;
  price?: number | null;
  currency?: string;
  sizeLabel?: string;
};

export function useAddToCart() {
  const { add } = useCartMutations();
  const setCartOpen = useUiStore((s) => s.setCartOpen);
  const addLocalLine = useCartStore((s) => s.addLine);

  return {
    isPending: add.isPending,
    addToCart: async (opts: AddToCartInput) => {
      const quantity = opts.quantity ?? 1;

      if (opts.sku || opts.variantId) {
        await add.mutateAsync({ sku: opts.sku, variantId: opts.variantId, quantity });
      } else if (opts.slug && opts.title) {
        // No live backend variant for this product yet — the storefront's
        // cart state is still real (persisted client-side, shown in the
        // drawer/bag page, quantity + totals all work off it), it just
        // isn't synced to the backend cart API for catalog items that
        // don't have a real sku/variantId.
        addLocalLine({
          variantId: opts.slug,
          slug: opts.slug,
          title: opts.title,
          imageUrl: opts.imageUrl ?? undefined,
          unitPrice: opts.price ?? 0,
          currency: opts.currency ?? "AED",
          quantity,
          sizeLabel: opts.sizeLabel ?? "Extrait de Parfum · 50 ml",
        });
      }

      setCartOpen(true);
    },
  };
}
