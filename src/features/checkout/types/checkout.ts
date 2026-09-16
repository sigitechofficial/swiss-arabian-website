/** Checkout + orders API types — mirrors `/storefront/checkout` and `/storefront/orders`. */

import type { PromotionSnapshotV1 } from "@/features/promotions/types/promotions";

// ─── Checkout session ────────────────────────────────────────────────────────

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

export interface CheckoutValidationIssue {
  id?: string;
  issueType: string;
  /** "ERROR" | "WARNING" | "INFO" */
  severity: string | null;
  code: string | null;
  message: string;
  sku: string | null;
  fieldPath: string | null;
}

export interface CheckoutTotalsEstimate {
  subtotal: string;
  discount: string;
  shipping: string;
  tax: string;
  total: string;
  amountPayable?: string | null;
}

export interface CheckoutSessionResponse {
  checkoutSessionId: string;
  /** Live sessions come back as `VALID`; `COMPLETED` / `CANCELLED` / `EXPIRED` are terminal. */
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
  /** Same v1 shape as cart `promotions` after snapshot rebuild. */
  promotionSnapshot?: PromotionSnapshotV1 | null;
  giftCards?: unknown;
}

// ─── Available methods ───────────────────────────────────────────────────────

export interface PaymentMethodOption {
  zonePaymentMethodId: string;
  paymentMethodId: string;
  providerCode: string;
  methodCode: string;
  methodType?: string;
  displayName: string;
  isDefault: boolean;
  /** `true` for Paymob (hosted page), `false` for Stripe (inline Elements). */
  requiresRedirect?: boolean;
  isEnabled?: boolean;
  isTestMode?: boolean | null;
  metadata?: Record<string, unknown> | null;
}

export interface DeliveryMethodOption {
  zoneDeliveryMethodId: string;
  deliveryMethodId: string;
  partnerCode: string;
  methodCode: string;
  displayName: string;
  isDefault: boolean;
  /** Decimal string; `null` means free / not yet priced. */
  estimatedFee: string | null;
  metadata?: {
    estimatedMinDays?: number | null;
    estimatedMaxDays?: number | null;
    [key: string]: unknown;
  } | null;
}

/** Free-form JSON the address endpoint stores as-is. Shipping and billing share it. */
export interface CheckoutAddressSnapshot {
  fullName: string;
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  postalCode?: string;
  countryCode: string;
  phone?: string;
  email?: string;
}

export interface GuestContact {
  email?: string;
  phone?: string;
  fullName?: string;
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
  imageUrl?: string | null;
}

export interface OrderAddressSummary {
  /** "SHIPPING" | "BILLING" */
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
  /** One-time — only issued on first creation. */
  orderAccessToken: string | null;
  trackingToken: string | null;
  previouslyIssued: boolean;
  message: string;
}

export interface OrderMethodSummary {
  providerCode?: string | null;
  partnerCode?: string | null;
  methodCode: string | null;
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
  /** `false` on an idempotent replay of an order that already existed. */
  created: boolean;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
  guestTracking?: GuestTrackingResponse | null;
}

// ─── Payment ─────────────────────────────────────────────────────────────────

export interface StripePaymentMetadata {
  publishableKey?: string;
  clientSecret?: string;
  [key: string]: unknown;
}

export interface PaymentInitiationResponse {
  orderId: string;
  paymentTransactionId: string;
  paymentAttemptId: string | null;
  paymentStatus: string;
  paymentMethod: { providerCode: string; methodCode: string };
  providerCode: string;
  amount: string;
  currency: string;
  /** "SUCCESS" | "PENDING_PROVIDER_EXECUTION" */
  paymentExecutionStatus: string;
  /** "REDIRECT" = Paymob hosted page · "INLINE_CARD" = Stripe Elements · null = no gateway step */
  paymentAction: string | null;
  redirectUrl: string | null;
  clientSecret: string | null;
  requiresProviderExecution: boolean;
  providerExecutionAvailable: boolean;
  outboxEventId: string | null;
  warnings: string[];
  metadata?: StripePaymentMetadata | null;
}

export interface OrderPaymentStatusResponse {
  orderId: string;
  /** PENDING | AUTHORIZED | PAID | FAILED | DECLINED | CANCELLED | REFUNDED */
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
