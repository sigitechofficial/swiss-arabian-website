export const RETURN_REASON_CODES = [
  "DAMAGED_ITEM",
  "WRONG_ITEM",
  "DEFECTIVE_ITEM",
  "SIZE_OR_VARIANT_ISSUE",
  "NOT_AS_DESCRIBED",
  "CUSTOMER_CHANGED_MIND",
  "LATE_DELIVERY",
  "DUPLICATE_ORDER",
  "ALLERGY_OR_SAFETY_CONCERN",
  "OTHER",
] as const;

export type ReturnReasonCode = (typeof RETURN_REASON_CODES)[number];

export const RETURN_RESOLUTIONS = [
  "REFUND",
  "EXCHANGE",
  "STORE_CREDIT",
  "OTHER",
] as const;

export type ReturnResolutionType = (typeof RETURN_RESOLUTIONS)[number];

export const EXCHANGE_REASON_CODES = [
  "WRONG_ITEM",
  "WRONG_VARIANT",
  "DAMAGED_ITEM",
  "DEFECTIVE_ITEM",
  "CUSTOMER_PREFERENCE",
  "OTHER",
] as const;

export type ExchangeReasonCode = (typeof EXCHANGE_REASON_CODES)[number];

export const EXCHANGE_TYPES = [
  "SAME_ITEM",
  "DIFFERENT_VARIANT",
  "DIFFERENT_PRODUCT",
  "SIZE_OR_COLOR_CHANGE",
  "OTHER",
] as const;

export type ExchangeType = (typeof EXCHANGE_TYPES)[number];

export type StorefrontReturnSummaryView = {
  returnRequestId: string;
  returnNumber: string;
  orderId: string;
  orderNumber: string | null;
  status: string;
  reasonCode: string;
  reasonText: string | null;
  requestedResolution: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  latestStatusMessage: string;
};

export type StorefrontReturnItemView = {
  itemId: string;
  orderLineId: string | null;
  sku: string;
  productName: string | null;
  variantName: string | null;
  requestedQty: number;
  reasonCode: string;
  reasonText: string | null;
};

export type StorefrontReturnDetailView = StorefrontReturnSummaryView & {
  customerNote: string | null;
  items: StorefrontReturnItemView[];
  order: {
    orderId: string;
    orderNumber: string | null;
    status: string;
    fulfillmentStatus: string;
  };
};

export type StorefrontReturnListView = {
  items: StorefrontReturnSummaryView[];
  total: number;
  limit: number;
  offset: number;
};

export type CreateReturnItemDto = {
  orderLineId: string;
  quantity: number;
  reasonCode?: string;
  reasonText?: string;
};

export type CreateReturnDto = {
  items: CreateReturnItemDto[];
  reasonCode?: string;
  reasonText?: string;
  customerNote?: string;
  requestedResolution?: ReturnResolutionType;
};

export type ExchangeMoneyAction =
  | "NONE"
  | "PAY_DIFFERENCE"
  | "AWAITING_PAYMENT"
  | "PAYMENT_COMPLETE"
  | "REFUND_PENDING"
  | "REFUND_COMPLETE"
  | "CONTACT_SUPPORT";

/** Money side of an exchange. `action` drives the UI — never show Pay on REFUND_*. */
export type ExchangeMoneyView = {
  currencyCode: string;
  additionalPaymentRequired: boolean;
  refundDifferenceRequired: boolean;
  customerPayableAmount: string;
  refundableDifferenceAmount: string;
  action: ExchangeMoneyAction;
  /** Hosted payment page, when a live session exists (detail responses only). */
  customerPayUrl?: string | null;
  payment?: { id: string; status: string; amount: string; settled: boolean } | null;
  refund?: { id: string; status: string; refundNumber: string | null; settled: boolean } | null;
  replacementOrderId?: string | null;
  replacementOrderNumber?: string | null;
  note?: string | null;
};

/** Response of the difference-payment and sync-difference-payment calls. */
export type ExchangeDifferencePaymentResult = {
  settled: boolean;
  customerPayUrl: string | null;
  money: ExchangeMoneyView;
  note?: string | null;
};

export type StorefrontExchangeSummaryView = {
  exchangeRequestId: string;
  exchangeNumber: string;
  orderId: string;
  orderNumber: string | null;
  status: string;
  reasonCode: string;
  exchangeType: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  latestStatusMessage: string;
  money?: ExchangeMoneyView | null;
};

export type StorefrontExchangeItemView = {
  itemId: string;
  orderLineId: string | null;
  sku: string;
  productName: string | null;
  variantName: string | null;
  requestedQty: number;
  replacementSku: string;
  replacementSize: string | null;
  reasonCode: string;
};

export type StorefrontExchangeDetailView = StorefrontExchangeSummaryView & {
  customerNote: string | null;
  items: StorefrontExchangeItemView[];
  order: {
    orderId: string;
    orderNumber: string | null;
    status: string;
    fulfillmentStatus: string;
  };
};

export type StorefrontExchangeListView = {
  items: StorefrontExchangeSummaryView[];
  total: number;
  limit: number;
  offset: number;
};

export type CreateExchangeItemDto = {
  orderLineId: string;
  quantity: number;
  replacementSku: string;
  replacementSize?: string;
  replacementColor?: string;
  reasonCode?: string;
};

export type CreateExchangeDto = {
  items: CreateExchangeItemDto[];
  reasonCode?: string;
  exchangeType?: ExchangeType;
  customerNote?: string;
};

export type GuestProofDto = {
  orderAccessToken: string;
};

export type AfterSalesOrderLine = {
  orderLineId: string;
  sku: string;
  productName: string | null;
  variantName: string | null;
  quantity: number;
};

/** Whether one of return / exchange can be requested for an order, and if not, why. */
export type AfterSalesOption = {
  allowed: boolean;
  /** ORDER_NOT_ELIGIBLE, RETURNS_DISABLED, AFTER_SALES_SIGN_IN_REQUIRED, … */
  code: string | null;
  /** Customer-facing explanation when not allowed. */
  message: string | null;
  eligibleUntil: string | null;
};

/** Follows the market's returns & exchanges settings and the order's state. */
export type AfterSalesOptions = {
  orderId: string;
  orderNumber: string | null;
  signedIn: boolean;
  returns: AfterSalesOption;
  exchanges: AfterSalesOption;
};

/**
 * One customer-facing sentence about returns, generated by the backend from the
 * after-sales settings. `key` + `variant` are stable (the site translates by
 * them); `text` is the English fallback.
 */
export type AfterSalesCopyItem = {
  key: string;
  variant: string;
  /** Facts used in the sentence; money is `amount` + `currencyCode`. */
  values: Record<string, string | number>;
  /** Return reasons the sentence names (codes). */
  reasonCodes?: string[];
  text: string;
};

/** The returns policy in plain words: a market's rules today, or an order's frozen rules. */
export type ReturnsPolicySummary = {
  scope: "MARKET" | "ORDER";
  zoneCode: string | null;
  currencyCode: string | null;
  policyVersion: string | null;
  returnsEnabled: boolean;
  exchangesEnabled: boolean;
  returnWindowDays: number;
  exchangeWindowDays: number;
  items: AfterSalesCopyItem[];
};

export type ReturnEstimateItemDto = {
  orderLineId: string;
  quantity: number;
};

export type ReturnEstimateDto = {
  items: ReturnEstimateItemDto[];
  reasonCode?: string;
};

export type ReturnEstimateGift = {
  orderLineId: string;
  sku: string | null;
  productName: string | null;
  quantity: number;
  value: string;
};

export type ReturnEstimateLine = {
  orderLineId: string;
  sku: string;
  productName: string | null;
  variantName: string | null;
  quantity: number;
  unitPrice: string;
  grossAmount: string;
  discountAmount: string;
  taxAmount: string;
  refundAmount: string;
};

/** Refund estimate for the lines + reason picked on the return form (same calculator as the refund). */
export type ReturnEstimate = {
  orderId: string;
  orderNumber: string | null;
  currencyCode: string;
  policyVersion: string | null;
  isEstimate: true;
  reasonCode: string;
  ourFaultReason: boolean;
  /** Prices include VAT: `taxAmount` is inside `itemsTotal`. */
  taxIncluded: boolean;
  lines: ReturnEstimateLine[];
  itemsAmount: string;
  taxAmount: string;
  itemsTotal: string;
  delivery: {
    refunded: boolean;
    amount: string;
    reason: string;
    message: AfterSalesCopyItem;
  };
  deductions: {
    returnShippingFee: { amount: string; waived: boolean };
    restockingFee: { amount: string; percent: string; waived: boolean };
    freeGift: { amount: string; gifts: ReturnEstimateGift[] };
    /** Buy-X-get-Y / set offer the kept items no longer earn (older APIs: absent). */
    offerAdjustment?: { amount: string };
    spentPoints: { amount: string; points: string };
  };
  totalDeductions: string;
  /** Offer amount an earlier return kept, added back with this one (older APIs: absent). */
  offerCredit?: { amount: string };
  estimatedRefund: string;
  refundDestination: AfterSalesCopyItem;
  /** The free gift must be in the return (giftOnReturn = MUST_RETURN): submitting without it fails. */
  giftRequirement: {
    required: boolean;
    code: "RETURN_GIFT_REQUIRED" | null;
    message: string | null;
    gifts: ReturnEstimateGift[];
  };
  notes: AfterSalesCopyItem[];
};
