import type { ProductCardModel } from "@/features/home/components/ProductCard";
import type { ProductSummary } from "../types/product";
import { stripHtml } from "./catalogHtml";

function cardFamily(product: ProductSummary): string {
  const fromSubtitle = stripHtml(product.subtitle).trim();
  if (fromSubtitle) {
    return fromSubtitle.length > 72
      ? `${fromSubtitle.slice(0, 71).trimEnd()}…`
      : fromSubtitle;
  }
  return product.sku || "Swiss Arabian";
}

/** Map catalog API product → shared ProductCard model (incl. gallery). */
export function toProductCardModel(
  product: ProductSummary,
): ProductCardModel {
  const images =
    product.imageUrls?.length ?
      product.imageUrls
    : product.imageUrl ?
      [product.imageUrl]
    : [];

  return {
    id: product.id,
    name: product.title,
    family: cardFamily(product),
    price: product.price,
    image: images[0] ?? product.imageUrl ?? null,
    images,
    slug: product.slug,
    currency: product.currency || "AED",
    variantId: product.variantId,
    sku: product.sku,
  };
}
