import { apiGet, apiPost, apiPut } from "@/lib/api/apiClient";
import type { DeliveryMethodOption } from "@/features/checkout/types/checkout";

import type {
  PlanProduct,
  PublicSubscriptionConsent,
  PublicSubscriptionPlan,
  RegisterSubscriptionBody,
  SubscriptionAudience,
  SubscriptionDetail,
  SubscriptionQueueView,
  SubscriptionSummary,
} from "../types/subscription.types";

function zoneQuery(zoneCode: string): string {
  return `zoneCode=${encodeURIComponent(zoneCode)}`;
}

export async function listSubscriptionPlans(zoneCode: string): Promise<PublicSubscriptionPlan[]> {
  const data = await apiGet<{ items: PublicSubscriptionPlan[] }>(
    `/storefront/subscription-plans?${zoneQuery(zoneCode)}`,
    { skipAuth: true },
  );
  return data.items ?? [];
}

export async function getSubscriptionPlan(
  planCode: string,
  zoneCode: string,
): Promise<PublicSubscriptionPlan> {
  return apiGet<PublicSubscriptionPlan>(
    `/storefront/subscription-plans/${encodeURIComponent(planCode)}?${zoneQuery(zoneCode)}`,
    { skipAuth: true },
  );
}

export async function listPlanProducts(
  planCode: string,
  zoneCode: string,
  audience?: SubscriptionAudience,
): Promise<PlanProduct[]> {
  const audienceQuery = audience ? `&audience=${encodeURIComponent(audience)}` : "";
  const data = await apiGet<{ items: PlanProduct[] }>(
    `/storefront/subscription-plans/${encodeURIComponent(planCode)}/products?${zoneQuery(zoneCode)}${audienceQuery}`,
    { skipAuth: true },
  );
  return data.items ?? [];
}

export async function getSubscriptionConsent(zoneCode: string): Promise<PublicSubscriptionConsent> {
  return apiGet<PublicSubscriptionConsent>(
    `/storefront/subscription-consent?${zoneQuery(zoneCode)}`,
    { skipAuth: true },
  );
}

export async function registerSubscription(
  body: RegisterSubscriptionBody,
  idempotencyKey: string,
): Promise<SubscriptionDetail> {
  return apiPost<SubscriptionDetail>("/storefront/subscriptions", body, {
    headers: { "Idempotency-Key": idempotencyKey },
  });
}

export async function listMySubscriptions(zoneCode: string): Promise<SubscriptionSummary[]> {
  const data = await apiGet<{ items: SubscriptionSummary[] }>(
    `/storefront/subscriptions/me?${zoneQuery(zoneCode)}`,
  );
  return data.items ?? [];
}

export async function getMySubscription(id: string, zoneCode: string): Promise<SubscriptionDetail> {
  return apiGet<SubscriptionDetail>(
    `/storefront/subscriptions/${encodeURIComponent(id)}?${zoneQuery(zoneCode)}`,
  );
}

export async function getSubscriptionQueue(
  id: string,
  zoneCode: string,
): Promise<SubscriptionQueueView> {
  return apiGet<SubscriptionQueueView>(
    `/storefront/subscriptions/${encodeURIComponent(id)}/queue?${zoneQuery(zoneCode)}`,
  );
}

export async function replaceSubscriptionQueue(
  id: string,
  zoneCode: string,
  variantIds: string[],
): Promise<SubscriptionQueueView> {
  return apiPut<SubscriptionQueueView>(
    `/storefront/subscriptions/${encodeURIComponent(id)}/queue`,
    { zoneCode, variantIds },
  );
}

export async function changeSelectionMode(
  id: string,
  zoneCode: string,
  mode: RegisterSubscriptionBody["mode"],
): Promise<SubscriptionDetail> {
  return apiPut<SubscriptionDetail>(
    `/storefront/subscriptions/${encodeURIComponent(id)}/selection-mode`,
    { zoneCode, mode },
  );
}

export type FirstPaymentOutcome =
  | "NOT_STARTED"
  | "PROCESSING"
  | "REQUIRES_CUSTOMER_ACTION"
  | "FAILED"
  | "RECONCILIATION_REQUIRED"
  | "SUCCESS";

export type FirstPaymentSnapshot = {
  subscriptionId: string;
  status: string;
  billingEnabled: boolean;
  nextBillingAt: string | null;
  currencyCode: string;
  amount: string;
  shippingMode: string;
  shippingAmount: string;
  monthlyTotal: string;
  paymentInstrumentId: string | null;
  cycle: {
    cycleNumber: number;
    cycleReference: string | null;
    status: string;
    totalAmount: string | null;
    paymentTransactionId: string | null;
    outcome: FirstPaymentOutcome;
  };
  clientSecret: string | null;
};

export type FirstPaymentBody = {
  zoneCode: string;
  paymentInstrumentId: string;
};

export async function startFirstPayment(
  id: string,
  body: FirstPaymentBody,
): Promise<FirstPaymentSnapshot> {
  return apiPost<FirstPaymentSnapshot>(
    `/storefront/subscriptions/${encodeURIComponent(id)}/first-payment`,
    body,
  );
}

export async function readFirstPayment(
  id: string,
  zoneCode: string,
): Promise<FirstPaymentSnapshot> {
  return apiGet<FirstPaymentSnapshot>(
    `/storefront/subscriptions/${encodeURIComponent(id)}/first-payment?zoneCode=${encodeURIComponent(zoneCode)}`,
  );
}

export type SubscriptionCheckoutState =
  | "NOT_STARTED"
  | "PROCESSING"
  | "REQUIRES_CUSTOMER_ACTION"
  | "FAILED"
  | "RECONCILIATION_REQUIRED"
  | "SUCCESS";

export type SubscriptionCheckoutView = {
  subscriptionId: string;
  cycleReference: string | null;
  chargeMode: string | null;
  status: string;
  billingEnabled: boolean;
  currencyCode: string;
  amount: string;
  shippingAmount: string;
  monthlyTotal: string;
  publishableKey: string | null;
  clientSecret: string | null;
  paymentState: SubscriptionCheckoutState;
  orderId?: string | null;
  orderNumber?: string | null;
  orderStatus?: string | null;
  fulfillmentStatus?: string | null;
  orderState?: "CONFIRMED" | "PENDING" | "NONE" | null;
};

export type BeginSubscriptionCheckoutBody = {
  zoneCode: string;
  recurringUseAccepted: true;
  consentTextVersion: string;
  deliveryMethodCode: string;
};

export async function listSubscriptionDeliveryMethods(
  zoneCode: string,
  countryCode?: string,
): Promise<DeliveryMethodOption[]> {
  const params = new URLSearchParams({ zoneCode });
  if (countryCode) params.set("countryCode", countryCode);
  return apiGet<DeliveryMethodOption[]>(`/storefront/subscriptions/delivery-methods?${params.toString()}`);
}
export async function beginSubscriptionCheckout(
  id: string,
  body: BeginSubscriptionCheckoutBody,
): Promise<SubscriptionCheckoutView> {
  return apiPost<SubscriptionCheckoutView>(
    `/storefront/subscriptions/${encodeURIComponent(id)}/checkout`,
    body,
  );
}

export async function readSubscriptionCheckout(
  id: string,
  zoneCode: string,
): Promise<SubscriptionCheckoutView> {
  return apiGet<SubscriptionCheckoutView>(
    `/storefront/subscriptions/${encodeURIComponent(id)}/checkout?zoneCode=${encodeURIComponent(zoneCode)}`,
  );
}

export async function pauseSubscription(
  id: string,
  zoneCode: string,
  reason?: string,
): Promise<SubscriptionDetail> {
  return apiPost<SubscriptionDetail>(
    `/storefront/subscriptions/${encodeURIComponent(id)}/pause`,
    { zoneCode, reason },
  );
}

export async function resumeSubscription(id: string, zoneCode: string): Promise<SubscriptionDetail> {
  return apiPost<SubscriptionDetail>(
    `/storefront/subscriptions/${encodeURIComponent(id)}/resume`,
    { zoneCode },
  );
}

export async function skipSubscriptionMonth(
  id: string,
  zoneCode: string,
  idempotencyKey: string,
): Promise<SubscriptionDetail> {
  return apiPost<SubscriptionDetail>(
    `/storefront/subscriptions/${encodeURIComponent(id)}/skip`,
    { zoneCode },
    { headers: { "Idempotency-Key": idempotencyKey } },
  );
}

export async function confirmSubscriptionPaymentMethod(
  id: string,
  body: { zoneCode: string; instrumentId: string },
): Promise<SubscriptionDetail> {
  return apiPost<SubscriptionDetail>(
    `/storefront/subscriptions/${encodeURIComponent(id)}/payment-method/confirm`,
    body,
  );
}

export async function startSubscriptionPaymentMethod(
  id: string,
  body: { zoneCode: string; recurringUseAccepted: true; consentTextVersion: string },
): Promise<{
  subscriptionId: string;
  instrumentId: string;
  status: string;
  providerCode: string;
  clientSecret: string;
  publishableKey: string | null;
}> {
  return apiPost(
    `/storefront/subscriptions/${encodeURIComponent(id)}/payment-method/setup`,
    body,
  );
}

export async function retrySubscriptionPayment(id: string, zoneCode: string): Promise<SubscriptionDetail> {
  return apiPost<SubscriptionDetail>(
    `/storefront/subscriptions/${encodeURIComponent(id)}/payment/retry`,
    { zoneCode },
  );
}

export async function cancelSubscription(
  id: string,
  zoneCode: string,
  reason?: string,
): Promise<SubscriptionDetail> {
  return apiPost<SubscriptionDetail>(
    `/storefront/subscriptions/${encodeURIComponent(id)}/cancel`,
    { zoneCode, reason },
  );
}
