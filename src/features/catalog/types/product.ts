export type ProductSummary = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  price: number | null;
  currency: string;
  imageUrl?: string | null;
  sku?: string;
  variantId?: string;
  isSellable?: boolean;
  isVisible?: boolean;
  sellabilityStatus?: string;
  inStock?: boolean;
  availableQty?: number;
  blockReasons?: string[];
};

export type ProductDetail = ProductSummary & {
  description: string;
  variantId: string;
};
