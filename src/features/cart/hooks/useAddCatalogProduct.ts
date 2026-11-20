"use client";

import { toast } from "@/components/ui/Toaster";
import { pageTranslator } from "@/lib/i18n/pageTranslator";
import { fetchProductBySlug } from "@/features/catalog/api/catalog.service";
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
  const zoneCode = marketId?.trim() || "";

  return async (opts: CatalogAddOpts): Promise<boolean> => {
    if (!zoneCode) {
      toast(pageTranslator()("error.productNotPurchasable"), "error");
      return false;
    }
    let product: Awaited<ReturnType<typeof fetchProductBySlug>>;
    try {
      product = await fetchProductBySlug(opts.slug, zoneCode);
    } catch {
      toast(pageTranslator()("error.unreachable"), "error");
      return false;
    }
    if (!product || (!product.variantId && !product.sku)) {
      toast(pageTranslator()("error.productNotPurchasable"), "error");
      return false;
    }

    const price = product.price ?? opts.price;
    if (price == null) {
      toast(pageTranslator()("error.productNotPurchasable"), "error");
      return false;
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
    return true;
  };
}
