/** API types for the cart module — mirrors backend Cart response shape. */

import type { PromotionSnapshotV1 } from "@/features/promotions/types/promotions";

export type CartContext = {
  zoneId: string;
  zoneCode: string;
  legalEntityCode: string;
  salesChannelId?: string | null;
  salesChannelCode?: string | null;
  countryCode?: string | null;
  currencyCode: string;
  languageCode?: string | null;
};

export type CartSellabilitySummary = {
  isSellable: boolean;
  hasValidPrice: boolean;
  hasAvailableInventory: boolean;
  blockReasons: string[];
};

export type CartValidationIssue = {
  type: string;
  message?: string | null;
  cartItemId?: string | null;
};

export type CartValidation = {
  isValid: boolean;
  errors: CartValidationIssue[];
  warnings: CartValidationIssue[];
};

export type ApiCartImage = {
  url: string;
  altText: string | null;
  sortOrder: number;
  mediaType: string;
};

export type ApiCartItem = {
  cartItemId: string;
  productId: string | null;
  variantId: string | null;
  sku: string;
  productName: string | null;
  variantName: string | null;
  image?: string | null;
  images?: ApiCartImage[];
  quantity: string;
  unitPriceEstimate: string | null;
  lineSubtotalEstimate: string | null;
  currencyCode: string | null;
  sellabilitySummary: CartSellabilitySummary;
  warnings: CartValidationIssue[];
};

export type ApiCart = {
  cartId: string;
  status: string;
  context: CartContext;
  items: ApiCartItem[];
  itemCount: number;
  totalQuantity: string;
  subtotalEstimate: string;
  discountEstimate: string;
  taxEstimate: string;
  shippingEstimate: string;
  totalEstimate: string;
  amountPayable?: string | null;
  currency: string;
  promotions?: PromotionSnapshotV1 | null;
  /** Server redemption quote. Display only — never priced in the browser. */
  loyaltyRedemption?: unknown;
  loyaltyApplied?: string | null;
  validation: CartValidation | null;
  updatedAt: string;
  metadata: Record<string, unknown> | null;
};
