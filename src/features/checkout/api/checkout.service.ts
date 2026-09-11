import { getAccessToken } from "@/lib/auth/token";
import { apiGet, apiPost } from "@/lib/api/apiClient";
import { DEFAULT_ZONE_CODE, toAuthSalesChannelCode } from "@/lib/storefront/context";
import { getOrCreateGuestToken } from "@/features/cart/utils/guestToken";
import type {
  CheckoutAddressSnapshot,
  CheckoutSessionResponse,
  DeliveryMethodOption,
  PaymentMethodOption,
  GuestContact,
} from "../types/checkout";

// ─── Param builders ───────────────────────────────────────────────────────────

/** Full context params (zone + channel) — for session-creating endpoints. */
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

/** Guest-only param — for existing session endpoints (no zone/channel needed). */
function buildGuestParam(): URLSearchParams {
  const params = new URLSearchParams();
  const isAuthenticated = Boolean(getAccessToken());
  if (!isAuthenticated) {
    const guestToken = getOrCreateGuestToken();
    if (guestToken) params.set("guestToken", guestToken);
  }
  return params;
}

// ─── Checkout service ─────────────────────────────────────────────────────────

type CreateFromCartDto = {
  cartId: string;
  customerAddressId?: string;
  guestContact?: GuestContact;
};

/**
 * POST /storefront/checkout/from-cart
 * Creates a new checkout session from a validated cart.
 * If the same cart already has an active session, it is resumed.
 */
export async function createCheckoutFromCart(
  dto: CreateFromCartDto,
): Promise<CheckoutSessionResponse> {
  const params = buildContextParams();
  return apiPost<CheckoutSessionResponse>(
    `/storefront/checkout/from-cart?${params.toString()}`,
    dto,
  );
}

/**
 * GET /storefront/checkout/:checkoutSessionId
 * Returns current state of the checkout session.
 */
export async function getCheckoutSession(
  checkoutSessionId: string,
): Promise<CheckoutSessionResponse> {
  const params = buildGuestParam();
  return apiGet<CheckoutSessionResponse>(
    `/storefront/checkout/${checkoutSessionId}?${params.toString()}`,
  );
}

/**
 * GET /storefront/checkout/:checkoutSessionId/delivery-methods
 * Returns available delivery options for this checkout.
 */
export async function listDeliveryMethods(
  checkoutSessionId: string,
): Promise<DeliveryMethodOption[]> {
  const params = buildGuestParam();
  return apiGet<DeliveryMethodOption[]>(
    `/storefront/checkout/${checkoutSessionId}/delivery-methods?${params.toString()}`,
  );
}

/**
 * POST /storefront/checkout/:checkoutSessionId/delivery-method
 * Selects a delivery method for this checkout session.
 */
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

/**
 * GET /storefront/checkout/:checkoutSessionId/payment-methods
 * Returns available payment options for this checkout.
 */
type PaymentMethodsPayload =
  | PaymentMethodOption[]
  | {
      items?: PaymentMethodOption[];
      paymentMethods?: PaymentMethodOption[];
    };

function unwrapPaymentMethods(data: PaymentMethodsPayload | undefined): PaymentMethodOption[] {
  if (Array.isArray(data)) return data;
  if (data?.items && Array.isArray(data.items)) return data.items;
  if (data?.paymentMethods && Array.isArray(data.paymentMethods)) {
    return data.paymentMethods;
  }
  return [];
}

export async function listPaymentMethods(
  checkoutSessionId: string,
): Promise<PaymentMethodOption[]> {
  const params = buildGuestParam();
  const data = await apiGet<PaymentMethodsPayload>(
    `/storefront/checkout/${checkoutSessionId}/payment-methods?${params.toString()}`,
  );
  return unwrapPaymentMethods(data);
}

/**
 * POST /storefront/checkout/:checkoutSessionId/payment-method
 * Selects a payment method for this checkout session.
 */
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

export type SetAddressDto = {
  /** Saved shipping address — shipping only. */
  customerAddressId?: string;
  /** Guest/new shipping snapshot — shipping only. */
  addressSnapshot?: CheckoutAddressSnapshot;
  /** Copy shipping → billing on the same request. */
  billingSameAsShipping?: boolean;
  /** Saved billing address book id. */
  billingCustomerAddressId?: string;
  /** Explicit billing snapshot when different from shipping. */
  billingAddressSnapshot?: CheckoutAddressSnapshot;
};

/**
 * POST /storefront/checkout/:checkoutSessionId/address
 * Sets shipping (`customerAddressId` / `addressSnapshot`) and optional billing
 * (`billingSameAsShipping` / `billingCustomerAddressId` / `billingAddressSnapshot`).
 * Shipping fields are never used for billing.
 */
export async function setCheckoutAddress(
  checkoutSessionId: string,
  dto: SetAddressDto,
): Promise<CheckoutSessionResponse> {
  const params = buildGuestParam();
  return apiPost<CheckoutSessionResponse>(
    `/storefront/checkout/${checkoutSessionId}/address?${params.toString()}`,
    dto,
  );
}

/**
 * POST /storefront/checkout/:checkoutSessionId/validate
 * Re-validates the entire checkout session before submit.
 */
export async function validateCheckout(
  checkoutSessionId: string,
): Promise<CheckoutSessionResponse> {
  const params = buildGuestParam();
  return apiPost<CheckoutSessionResponse>(
    `/storefront/checkout/${checkoutSessionId}/validate?${params.toString()}`,
    {},
  );
}

/**
 * POST /storefront/checkout/:checkoutSessionId/cancel
 * Cancels the checkout session (cart is not deleted).
 */
export async function cancelCheckout(
  checkoutSessionId: string,
  reason?: string,
): Promise<CheckoutSessionResponse> {
  const params = buildGuestParam();
  return apiPost<CheckoutSessionResponse>(
    `/storefront/checkout/${checkoutSessionId}/cancel?${params.toString()}`,
    reason ? { reason } : {},
  );
}
