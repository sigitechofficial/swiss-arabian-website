"use client";

import { toast } from "@/components/ui/Toaster";
import { fetchProductBySlug } from "@/features/catalog/api/catalog.service";
import { DEFAULT_ZONE_CODE } from "@/lib/storefront/context";
import { useUiStore } from "@/stores/useUiStore";
import { useAddToCart } from "./useAddToCart";

type CatalogAddOpts = {
  slug: string;
  title: string;
  imageUrl?: string;
  price?: number;
  family?: string;
};

/**
 * Resolve a static card product to a real catalog variant/SKU before
 * add-to-cart, so the cart never receives mock ids or a hardcoded currency.
 */
export function useAddCatalogProduct() {
  const { addToCart } = useAddToCart();
  const marketId = useUiStore((s) => s.selectedMarketId);
  const zoneCode = marketId?.trim() || DEFAULT_ZONE_CODE;

  return async (opts: CatalogAddOpts): Promise<void> => {
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

    await addToCart({
      sku: product.sku,
      variantId: product.variantId || product.id,
      slug: product.slug,
      title: product.title || opts.title,
      imageUrl: product.imageUrl ?? opts.imageUrl,
      price,
      currency: product.currency || "AED",
      quantity: 1,
    });
  };
}
