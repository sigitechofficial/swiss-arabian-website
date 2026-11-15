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
