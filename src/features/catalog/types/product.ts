export type ProductSummary = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  price: number | null;
  currency: string;
  /** Primary image (first gallery entry). */
  imageUrl?: string | null;
  /** All product images in display order (primary first). */
  imageUrls?: string[];
  sku?: string;
  variantId?: string;
  isSellable?: boolean;
  isVisible?: boolean;
  sellabilityStatus?: string;
  inStock?: boolean;
  availableQty?: number;
  blockReasons?: string[];
};

export type ProductCollectionRef = {
  name: string;
  slug: string;
  isFeatured?: boolean;
};

export type ProductDetail = ProductSummary & {
  /** Plain-text description fallback. */
  description: string;
  /** Sanitized HTML for PDP body (preferred when present). */
  descriptionHtml?: string;
  variantId: string;
  brandName?: string;
  collections?: ProductCollectionRef[];
};
