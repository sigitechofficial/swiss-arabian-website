"use client";

import { toast } from "@/components/ui/Toaster";
import { pageTranslator } from "@/lib/i18n/pageTranslator";
import { useCartStore } from "@/stores/useCartStore";
import { useUiStore } from "@/stores/useUiStore";
import { addItemOptimistic } from "../api/optimisticCart";

export type AddToCartInput = {
  sku?: string;
  variantId?: string;
  quantity?: number;
  /** Shown in the bag straight away, before the server cart comes back. */
  slug?: string;
  title?: string;
  imageUrl?: string | null;
  price?: number | null;
  currency?: string;
  sizeLabel?: string;
};

export function useAddToCart() {
  const setCartOpen = useUiStore((s) => s.setCartOpen);
  const addLocalLine = useCartStore((s) => s.addLine);
  const syncing = useCartStore((s) => s.syncing);

  return {
    /** The API sync is still running — the bag already shows the change. */
    isPending: syncing,
    /**
     * Resolves immediately: the line is added locally and an "Added to your bag" message with a
     * "View bag" button is shown. The bag itself stays closed so shoppers can keep browsing; if it
     * is already open, the new line simply appears in it.
     */
    addToCart: async (opts: AddToCartInput) => {
      const quantity = opts.quantity ?? 1;

      if (opts.sku || opts.variantId) {
        addItemOptimistic({
          sku: opts.sku,
          variantId: opts.variantId,
          quantity,
          line: {
            slug: opts.slug ?? "",
            title: opts.title ?? "",
            imageUrl: opts.imageUrl ?? undefined,
            unitPrice: opts.price ?? 0,
            currency: opts.currency ?? "AED",
            sizeLabel: opts.sizeLabel,
          },
        });
      } else if (opts.slug && opts.title) {
        // No live backend variant for this product yet — kept client-side
        // only (persisted, shown in the drawer/bag page), never synced.
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

      if (useUiStore.getState().cartOpen) return;
      const t = pageTranslator();
      toast(t("cart.added"), "success", { label: t("cart.drawer.viewBag"), onClick: () => setCartOpen(true) });
    },
  };
}
