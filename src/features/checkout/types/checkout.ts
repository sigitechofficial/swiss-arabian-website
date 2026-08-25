// ─── Checkout context ──────────────────────────────────────────────────────

export interface CheckoutContextSummary {
  zoneId: string | null;
  zoneCode: string;
  legalEntityCode: string;
  salesChannelId: string | null;
  salesChannelCode: string | null;
  countryCode: string | null;
  currencyCode: string;
  languageCode: string | null;
}

// ─── Checkout items ─────────────────────────────────────────────────────────

export interface CheckoutItemSummary {
  cartItemId: string | null;
  sku: string | null;
  productId: string | null;
  variantId: string | null;
  quantity: string | null;
  unitPriceEstimate: string | null;
  lineSubtotalEstimate: string | null;
}

export interface CheckoutPriceSnapshot {
  id: string;
  sku: string | null;
  quantity: string | null;
  unitPrice: string | null;
  lineTotal: string | null;
  currencyCode: string | null;
  calculatedAt: string | null;
}

export interface CheckoutInventorySnapshot {
  id: string;
  sku: string | null;
  requestedQty: string | null;
  availableQty: string | null;
  isAvailable: boolean;
  checkedAt: string | null;
}

// ─── Selected methods ────────────────────────────────────────────────────────

export interface SelectedPaymentMethod {
  paymentMethodId: string | null;
  zonePaymentMethodId: string | null;
  providerCode: string | null;
  methodCode: string | null;
}

export interface SelectedDeliveryMethod {
  deliveryMethodId: string | null;
  zoneDeliveryMethodId: string | null;
  partnerCode: string | null;
  methodCode: string | null;
  estimatedFee: string | null;
}

// ─── Validation ──────────────────────────────────────────────────────────────

export interface CheckoutValidationIssue {
  id?: string;
  issueType: string;
  severity: string | null;
  code: string | null;
  message: string;
  sku: string | null;
  fieldPath: string | null;
}

// ─── Full session response ───────────────────────────────────────────────────

export interface CheckoutTotalsEstimate {
  subtotal: string;
  discount: string;
  shipping: string;
  tax: string;
  total: string;
}

export interface CheckoutSessionResponse {
  checkoutSessionId: string;
  status: string;
  context: CheckoutContextSummary;
  cartId: string;
  items: CheckoutItemSummary[];
  priceSnapshots: CheckoutPriceSnapshot[];
  inventorySnapshots: CheckoutInventorySnapshot[];
  selectedPaymentMethod: SelectedPaymentMethod | null;
  selectedDeliveryMethod: SelectedDeliveryMethod | null;
  validationIssues: CheckoutValidationIssue[];
  totalsEstimate: CheckoutTotalsEstimate;
  currency: string;
  expiresAt: string | null;
  validation: {
    isValid: boolean;
    status: string;
  };
  metadata?: Record<string, unknown> | null;
}

// ─── Available methods ───────────────────────────────────────────────────────

export interface PaymentMethodOption {
  zonePaymentMethodId: string;
  paymentMethodId: string;
  providerCode: string;
  methodCode: string;
  displayName: string;
  isDefault: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface DeliveryMethodOption {
  zoneDeliveryMethodId: string;
  deliveryMethodId: string;
  partnerCode: string;
  methodCode: string;
  displayName: string;
  isDefault: boolean;
  estimatedFee: string | null;
  metadata?: Record<string, unknown> | null;
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export interface OrderLineSummary {
  orderLineId: string;
  lineNumber: number;
  productId: string | null;
  variantId: string | null;
  sku: string;
  productName: string | null;
  variantName: string | null;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
  currencyCode: string;
  /** May be present if the backend includes product image in order line detail */
  imageUrl?: string | null;
}

export interface OrderAddressSummary {
  addressType: string;
  fullName: string | null;
  address1: string | null;
  city: string | null;
  countryCode: string | null;
  postalCode: string | null;
}

export interface OrderCustomerSummary {
  customerId: string | null;
  email: string | null;
  fullName: string | null;
  isGuest: boolean;
}

export interface OrderTotals {
  subtotal: string;
  discount: string;
  shipping: string;
  tax: string;
  total: string;
}

export interface OrderTimelineEvent {
  eventType: string;
  title: string | null;
  occurredAt: string;
}

export interface GuestTrackingResponse {
  orderNumber: string | null;
  orderAccessToken: string | null;
  trackingToken: string | null;
  previouslyIssued: boolean;
  message: string;
}

export interface OrderResponse {
  orderId: string;
  orderNumber: string | null;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  checkoutSessionId: string | null;
  cartId: string | null;
  customer: OrderCustomerSummary;
  lines: OrderLineSummary[];
  addresses: OrderAddressSummary[];
  totals: OrderTotals;
  currency: string;
  selectedPaymentMethod: { providerCode: string | null; methodCode: string | null } | null;
  selectedDeliveryMethod: { partnerCode: string | null; methodCode: string | null } | null;
  timeline: OrderTimelineEvent[];
  created: boolean;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
  guestTracking?: GuestTrackingResponse | null;
}

// ─── Payment ─────────────────────────────────────────────────────────────────

export interface PaymentInitiationResponse {
  orderId: string;
  paymentTransactionId: string;
  paymentAttemptId: string | null;
  paymentStatus: string;
  paymentMethod: { providerCode: string; methodCode: string };
  providerCode: string;
  amount: string;
  currency: string;
  paymentExecutionStatus: string;
  paymentAction: string | null;
  redirectUrl: string | null;
  clientSecret: string | null;
  requiresProviderExecution: boolean;
  providerExecutionAvailable: boolean;
  outboxEventId: string | null;
  warnings: string[];
  metadata?: Record<string, unknown> | null;
}

export interface OrderPaymentStatusResponse {
  orderId: string;
  orderPaymentStatus: string;
  payments: Array<{
    paymentTransactionId: string;
    status: string;
    providerCode: string;
    methodCode: string;
    amount: string;
    currency: string;
    paymentExecutionStatus: string;
    paymentAction: string | null;
    redirectUrl: string | null;
    requiresProviderExecution: boolean;
    providerExecutionAvailable: boolean;
  }>;
}

// ─── Guest contact ───────────────────────────────────────────────────────────

export interface GuestContact {
  email?: string;
  phone?: string;
  fullName?: string;
}
