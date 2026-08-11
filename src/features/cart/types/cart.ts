/** API types for the cart module — mirrors backend Cart response shape. */

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
  /** Primary image URL returned directly by the API */
  image?: string | null;
  /** Full image array returned by the API */
  images?: ApiCartImage[];
  /** Decimal string — e.g. "2" */
  quantity: string;
  /** Decimal string — e.g. "150.00" */
  unitPriceEstimate: string | null;
  /** Decimal string */
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
  /** Decimal string — total units across all items */
  totalQuantity: string;
  subtotalEstimate: string;
  discountEstimate: string;
  taxEstimate: string;
  shippingEstimate: string;
  totalEstimate: string;
  currency: string;
  validation: CartValidation | null;
  updatedAt: string;
  metadata: Record<string, unknown> | null;
};
