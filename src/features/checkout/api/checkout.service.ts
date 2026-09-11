import { getAccessToken } from "@/lib/auth/token";
import { apiGet, apiPost } from "@/lib/api/apiClient";
import { DEFAULT_ZONE_CODE, toAuthSalesChannelCode } from "@/lib/storefront/context";
import { getOrCreateGuestToken } from "@/features/cart/utils/guestToken";
import type {
  CheckoutAddressSnapshot,
  CheckoutSessionResponse,
  DeliveryMethodOption,
  GuestContact,
  PaymentMethodOption,
} from "../types/checkout";

/** Zone + channel + guest token — for the session-creating endpoint. */
function buildContextParams(): URLSearchParams {
  const params = new URLSearchParams({
    zoneCode: DEFAULT_ZONE_CODE,
    salesChannelCode: toAuthSalesChannelCode(),
  });
  if (!getAccessToken()) {
    const guestToken = getOrCreateGuestToken();
    if (guestToken) params.set("guestToken", guestToken);
  }
  return params;
}

/** Guest token only — existing sessions already carry their context. */
function buildGuestParam(): URLSearchParams {
  const params = new URLSearchParams();
  if (!getAccessToken()) {
    const guestToken = getOrCreateGuestToken();
    if (guestToken) params.set("guestToken", guestToken);
  }
  return params;
}

type CreateFromCartDto = {
  cartId: string;
  customerAddressId?: string;
  guestContact?: GuestContact;
};

/**
 * POST /storefront/checkout/from-cart — creates a session, or resumes the
 * existing active one for this cart (which does NOT re-read a changed cart).
 */
export async function createCheckoutFromCart(
  dto: CreateFromCartDto,
): Promise<CheckoutSessionResponse> {
  return apiPost<CheckoutSessionResponse>(
    `/storefront/checkout/from-cart?${buildContextParams().toString()}`,
    dto,
  );
}

export async function getCheckoutSession(
  checkoutSessionId: string,
): Promise<CheckoutSessionResponse> {
  return apiGet<CheckoutSessionResponse>(
    `/storefront/checkout/${checkoutSessionId}?${buildGuestParam().toString()}`,
  );
}

/** Empty until the zone resolves — callers show a retry state rather than failing. */
export async function listDeliveryMethods(
  checkoutSessionId: string,
): Promise<DeliveryMethodOption[]> {
  const data = await apiGet<DeliveryMethodOption[] | null>(
    `/storefront/checkout/${checkoutSessionId}/delivery-methods?${buildGuestParam().toString()}`,
  );
  return Array.isArray(data) ? data : [];
}

export async function selectDeliveryMethod(
  checkoutSessionId: string,
  deliveryMethodId: string,
): Promise<CheckoutSessionResponse> {
  return apiPost<CheckoutSessionResponse>(
    `/storefront/checkout/${checkoutSessionId}/delivery-method?${buildGuestParam().toString()}`,
    { deliveryMethodId },
  );
}

type PaymentMethodsPayload =
  | PaymentMethodOption[]
  | { items?: PaymentMethodOption[]; paymentMethods?: PaymentMethodOption[] }
  | null;

export async function listPaymentMethods(
  checkoutSessionId: string,
): Promise<PaymentMethodOption[]> {
  const data = await apiGet<PaymentMethodsPayload>(
    `/storefront/checkout/${checkoutSessionId}/payment-methods?${buildGuestParam().toString()}`,
  );
  if (Array.isArray(data)) return data;
  return data?.items ?? data?.paymentMethods ?? [];
}

export async function selectPaymentMethod(
  checkoutSessionId: string,
  paymentMethodId: string,
): Promise<CheckoutSessionResponse> {
  return apiPost<CheckoutSessionResponse>(
    `/storefront/checkout/${checkoutSessionId}/payment-method?${buildGuestParam().toString()}`,
    { paymentMethodId },
  );
}

export type SetAddressDto = {
  /** Saved shipping address — shipping only. */
  customerAddressId?: string;
  /** New / guest shipping snapshot — shipping only. */
  addressSnapshot?: CheckoutAddressSnapshot;
  /** Copy shipping → billing. */
  billingSameAsShipping?: boolean;
  billingCustomerAddressId?: string;
  /** Explicit billing when it differs from shipping. */
  billingAddressSnapshot?: CheckoutAddressSnapshot;
};

export async function setCheckoutAddress(
  checkoutSessionId: string,
  dto: SetAddressDto,
): Promise<CheckoutSessionResponse> {
  return apiPost<CheckoutSessionResponse>(
    `/storefront/checkout/${checkoutSessionId}/address?${buildGuestParam().toString()}`,
    dto,
  );
}

/** A 200 here does not mean valid — read `validation.isValid`. */
export async function validateCheckout(
  checkoutSessionId: string,
): Promise<CheckoutSessionResponse> {
  return apiPost<CheckoutSessionResponse>(
    `/storefront/checkout/${checkoutSessionId}/validate?${buildGuestParam().toString()}`,
    {},
  );
}

/** Cancels the session; the cart survives and can start a new checkout. */
export async function cancelCheckout(
  checkoutSessionId: string,
  reason?: string,
): Promise<CheckoutSessionResponse> {
  return apiPost<CheckoutSessionResponse>(
    `/storefront/checkout/${checkoutSessionId}/cancel?${buildGuestParam().toString()}`,
    reason ? { reason } : {},
  );
}
