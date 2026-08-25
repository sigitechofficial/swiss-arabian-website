import { apiGet, apiPost } from "@/lib/api/apiClient";
import { getAccessToken } from "@/lib/auth/token";
import { getOrCreateGuestToken } from "@/features/cart/utils/guestToken";

function guestQs(): string {
  if (getAccessToken()) return "";
  const token = getOrCreateGuestToken();
  return token ? `?guestToken=${encodeURIComponent(token)}` : "";
}

export type PlaceOrderResponse = {
  orderId: string;
  orderNumber?: string;
  accessToken?: string;
};

export type PaymentInitiateResponse = {
  paymentAction?: "REDIRECT" | null;
  redirectUrl?: string | null;
};

export async function placeOrderFromCheckout(
  checkoutSessionId: string,
): Promise<PlaceOrderResponse> {
  return apiPost<PlaceOrderResponse>(
    `/storefront/orders/from-checkout${guestQs()}`,
    { checkoutSessionId },
  );
}

export async function initiateOrderPayment(
  orderId: string,
): Promise<PaymentInitiateResponse> {
  return apiPost<PaymentInitiateResponse>(
    `/storefront/orders/${encodeURIComponent(orderId)}/payment/initiate${guestQs()}`,
    {},
  );
}

export async function getOrderPaymentStatus(orderId: string) {
  return apiGet<Record<string, unknown>>(
    `/storefront/orders/${encodeURIComponent(orderId)}/payment/status${guestQs()}`,
  );
}
