"use client";

import { toast } from "@/components/ui/Toaster";
import { notesFromFamily } from "@/features/cart/data/cartContent";
import { fetchProductBySlug } from "@/features/catalog/api/catalog.service";
import { DEFAULT_ZONE_CODE } from "@/lib/storefront/context";
import { useUiStore } from "@/stores/useUiStore";
import { useAddToCart } from "./useAddToCart";

type HomeAddOpts = {
  slug: string;
  title: string;
  imageUrl?: string;
  price?: number;
  family?: string;
};

/**
 * Resolve a static home/card product to catalog variant/SKU before add-to-cart
 * so Insider does not receive mock ids or hardcoded USD.
 */
export function useAddCatalogProduct() {
  const addToCart = useAddToCart();
  const marketId = useUiStore((s) => s.selectedMarketId);
  const zoneCode = marketId?.trim() || DEFAULT_ZONE_CODE;

  return async (opts: HomeAddOpts): Promise<void> => {
    const product = await fetchProductBySlug(opts.slug, zoneCode);
    if (!product || (!product.variantId && !product.sku)) {
      toast("This product isn’t available to purchase yet.", "error");
      return;
    }

    const price = product.price ?? opts.price;
    if (price == null) {
      toast("This product isn’t available to purchase yet.", "error");
      return;
    }

    addToCart({
      productId: product.id,
      variantId: product.variantId || product.id,
      slug: product.slug,
      title: product.title || opts.title,
      imageUrl: product.imageUrl ?? opts.imageUrl,
      unitPrice: price,
      currency: product.currency || "AED",
      sku: product.sku,
      category: opts.family || null,
      brand: product.brandName ?? null,
      notes: notesFromFamily(opts.family ?? ""),
    });
  };
}
