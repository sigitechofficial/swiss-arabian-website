export type SubscriptionSelectionMode = "REPLENISHMENT" | "QUEUE" | "SURPRISE";

export type SubscriptionAudience = "MEN" | "WOMEN";

export type SubscriptionStatus = "PENDING_ACTIVATION" | "ACTIVE" | "PAUSED" | "CANCELLED";

/** Public plan card. Prices come from the published plan response. */
export type PublicSubscriptionPlan = {
  planCode: string;
  name: string;
  description: string | null;
  amount: string;
  shippingMode?: "INCLUDED" | "EXTRA_FIXED";
  shippingAmount?: string;
  monthlyTotal?: string;
  currencyCode: string;
  intervalUnit: string;
  intervalCount: number;
  versionNumber: number;
  publishedAt: string;
};

export type PlanProduct = {
  variantId: string;
  productId: string;
  sku: string;
  name: string;
  imageUrl?: string | null;
};

export type SubscriptionSummary = {
  id: string;
  planId: string;
  planCode: string;
  planVersionId: string;
  versionNumber: number;
  amount: string;
  shippingMode?: "INCLUDED" | "EXTRA_FIXED";
  shippingAmount?: string;
  monthlyTotal?: string;
  currencyCode: string;
  intervalUnit: string;
  intervalCount: number;
  selectionMode: SubscriptionSelectionMode;
  audience?: SubscriptionAudience | null;
  status: SubscriptionStatus;
  billingEnabled: boolean;
  nextBillingAt: string | null;
  registeredAt: string;
  planStatus: string;
  imageUrl?: string | null;
};

export type SubscriptionQueueItem = {
  variantId: string;
  productId?: string;
  sku: string;
  name?: string;
  position: number;
  quantity: number;
  available?: boolean;
};

export type SubscriptionQueueView = {
  selectionMode: SubscriptionSelectionMode;
  provisional: boolean;
  allocated: boolean;
  items: SubscriptionQueueItem[];
};

export type ProvisionalPreview = {
  provisional: boolean;
  allocated: boolean;
  source?: "SCHEDULE" | "PROVISIONAL_POOL";
  variant: {
    variantId: string;
    productId: string;
    sku: string;
    name: string | null;
  } | null;
};

export type SurpriseScheduleSnapshot = {
  scheduleVersionId: string;
  versionNumber: number;
  audience: SubscriptionAudience | null;
  pinned: boolean;
  allocated: false;
  provisional: true;
  repeatsAfterMonth12: false;
  months: Array<{
    position: number;
    variantId: string;
    productId: string;
    sku: string;
  }>;
};

export type SubscriptionBillingCycleView = {
  cycleNumber: number;
  status: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  dueAt?: string | null;
  planAmount?: string;
  shippingAmount?: string;
  totalAmount?: string;
  currencyCode?: string;
  variantId?: string | null;
  sku?: string | null;
  orderId?: string | null;
  orderNumber?: string | null;
  orderStatus?: string | null;
  fulfillmentStatus?: string | null;
  shipmentStatus?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
};

export type SubscriptionManagementActions = {
  canPause: boolean;
  canResume: boolean;
  canSkip: boolean;
  canCancel: boolean;
  canReplacePaymentMethod?: boolean;
};

export type SubscriptionPaymentMethod = {
  brand: string | null;
  last4: string | null;
  expiryMonth: number | null;
  expiryYear: number | null;
  status: string;
};

export type PaymentRecoveryStatus =
  | "NONE"
  | "FAILED"
  | "ACTION_REQUIRED"
  | "PROCESSING"
  | "RECONCILIATION_REQUIRED"
  | "ORDER_RECOVERY";

export type SubscriptionPaymentRecovery = {
  cycleNumber: number | null;
  status: PaymentRecoveryStatus;
  retryEligible: boolean;
  customerActionRequired: boolean;
  message: string | null;
};

export type SubscriptionDetail = SubscriptionSummary & {
  billable: boolean;
  queue: SubscriptionQueueItem[] | SubscriptionQueueView;
  consent: { consentTextVersion: string; acceptedAt: string } | null;
  customerAddressId?: string;
  surpriseSchedule?: SurpriseScheduleSnapshot | null;
  provisionalPreview?: ProvisionalPreview | null;
  billingCycles?: SubscriptionBillingCycleView[];
  pausedAt?: string | null;
  pauseReason?: string | null;
  resumedAt?: string | null;
  renewalChargePending?: boolean;
  paymentMethod?: SubscriptionPaymentMethod | null;
  paymentRecovery?: SubscriptionPaymentRecovery | null;
  actions?: SubscriptionManagementActions;
  events?: Array<{
    id: string;
    eventType: string;
    fromStatus: string | null;
    toStatus: string | null;
    reason: string | null;
    createdAt: string;
  }>;
};

export type PublicSubscriptionConsent = {
  available: boolean;
  version: string | null;
  text: string | null;
  publishedAt: string | null;
};

export type RegisterSubscriptionBody = {
  zoneCode: string;
  planCode: string;
  mode: SubscriptionSelectionMode;
  audience: SubscriptionAudience;
  variantIds?: string[];
  customerAddressId: string;
  consentTextVersion: string;
};
