export type ProductSummary = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  price: number | null;
  currency: string;
  imageUrl?: string | null;
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
  description: string;
  descriptionHtml?: string;
  variantId: string;
  brandName?: string;
  collections?: ProductCollectionRef[];
};
