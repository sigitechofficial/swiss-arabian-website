import { getAccessToken } from "@/lib/auth/token";
import { apiGet, apiPost } from "@/lib/api/apiClient";
import { DEFAULT_ZONE_CODE, toAuthSalesChannelCode } from "@/lib/storefront/context";
import { getOrCreateGuestToken } from "@/features/cart/utils/guestToken";
import type {
  CheckoutSessionResponse,
  DeliveryMethodOption,
  GuestContact,
  PaymentMethodOption,
} from "../types/checkout";

function buildContextParams(): URLSearchParams {
  const params = new URLSearchParams({
    zoneCode: DEFAULT_ZONE_CODE,
    salesChannelCode: toAuthSalesChannelCode(),
  });
  const isAuthenticated = Boolean(getAccessToken());
  if (!isAuthenticated) {
    const guestToken = getOrCreateGuestToken();
    if (guestToken) params.set("guestToken", guestToken);
  }
  return params;
}

function buildGuestParam(): URLSearchParams {
  const params = new URLSearchParams();
  const isAuthenticated = Boolean(getAccessToken());
  if (!isAuthenticated) {
    const guestToken = getOrCreateGuestToken();
    if (guestToken) params.set("guestToken", guestToken);
  }
  return params;
}

export async function createCheckoutFromCart(dto: {
  cartId: string;
  customerAddressId?: string;
  guestContact?: GuestContact;
}): Promise<CheckoutSessionResponse> {
  const params = buildContextParams();
  return apiPost<CheckoutSessionResponse>(
    `/storefront/checkout/from-cart?${params.toString()}`,
    dto,
  );
}

export async function getCheckoutSession(
  checkoutSessionId: string,
): Promise<CheckoutSessionResponse> {
  const params = buildGuestParam();
  return apiGet<CheckoutSessionResponse>(
    `/storefront/checkout/${checkoutSessionId}?${params.toString()}`,
  );
}

export async function listDeliveryMethods(
  checkoutSessionId: string,
): Promise<DeliveryMethodOption[]> {
  const params = buildGuestParam();
  return apiGet<DeliveryMethodOption[]>(
    `/storefront/checkout/${checkoutSessionId}/delivery-methods?${params.toString()}`,
  );
}

export async function selectDeliveryMethod(
  checkoutSessionId: string,
  deliveryMethodId: string,
): Promise<CheckoutSessionResponse> {
  const params = buildGuestParam();
  return apiPost<CheckoutSessionResponse>(
    `/storefront/checkout/${checkoutSessionId}/delivery-method?${params.toString()}`,
    { deliveryMethodId },
  );
}

export async function listPaymentMethods(
  checkoutSessionId: string,
): Promise<PaymentMethodOption[]> {
  const params = buildGuestParam();
  return apiGet<PaymentMethodOption[]>(
    `/storefront/checkout/${checkoutSessionId}/payment-methods?${params.toString()}`,
  );
}

export async function selectPaymentMethod(
  checkoutSessionId: string,
  paymentMethodId: string,
): Promise<CheckoutSessionResponse> {
  const params = buildGuestParam();
  return apiPost<CheckoutSessionResponse>(
    `/storefront/checkout/${checkoutSessionId}/payment-method?${params.toString()}`,
    { paymentMethodId },
  );
}

export async function setCheckoutAddress(
  checkoutSessionId: string,
  address: Record<string, unknown>,
): Promise<CheckoutSessionResponse> {
  const params = buildGuestParam();
  return apiPost<CheckoutSessionResponse>(
    `/storefront/checkout/${checkoutSessionId}/address?${params.toString()}`,
    address,
  );
}

export async function validateCheckout(
  checkoutSessionId: string,
): Promise<CheckoutSessionResponse> {
  const params = buildGuestParam();
  return apiPost<CheckoutSessionResponse>(
    `/storefront/checkout/${checkoutSessionId}/validate?${params.toString()}`,
    {},
  );
}
