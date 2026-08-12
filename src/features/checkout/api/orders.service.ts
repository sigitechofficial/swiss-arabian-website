import { getAccessToken } from "@/lib/auth/token";
import { apiGet, apiPost } from "@/lib/api/apiClient";
import { DEFAULT_ZONE_CODE, toAuthSalesChannelCode } from "@/lib/storefront/context";
import { getOrCreateGuestToken } from "@/features/cart/utils/guestToken";
import type { OrderResponse, PaymentInitiationResponse, OrderPaymentStatusResponse } from "../types/checkout";

// ─── Param builders ───────────────────────────────────────────────────────────

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

// ─── Orders service ───────────────────────────────────────────────────────────

type PlaceOrderDto = {
  checkoutSessionId: string;
  idempotencyKey?: string;
};

/**
 * POST /storefront/orders/from-checkout
 * Places an order from a validated checkout session.
 * Returns orderId + guestTracking token (one-time, save immediately).
 */
export async function placeOrder(dto: PlaceOrderDto): Promise<OrderResponse> {
  const params = buildContextParams();
  return apiPost<OrderResponse>(
    `/storefront/orders/from-checkout?${params.toString()}`,
    dto,
  );
}

/**
 * GET /storefront/orders/:orderId
 * Returns full order detail for confirmation page + order detail view.
 */
export async function getOrder(orderId: string): Promise<OrderResponse> {
  const params = buildGuestParam();
  return apiGet<OrderResponse>(
    `/storefront/orders/${orderId}?${params.toString()}`,
  );
}

type InitiatePaymentDto = {
  idempotencyKey?: string;
};

/**
 * POST /storefront/orders/:orderId/payment/initiate
 * Starts the payment flow. If paymentAction === 'REDIRECT', redirect to redirectUrl.
 */
export async function initiatePayment(
  orderId: string,
  dto: InitiatePaymentDto = {},
): Promise<PaymentInitiationResponse> {
  const params = buildGuestParam();
  return apiPost<PaymentInitiationResponse>(
    `/storefront/orders/${orderId}/payment/initiate?${params.toString()}`,
    dto,
  );
}

/**
 * GET /storefront/orders/:orderId/payment-status
 * Returns current payment status. Poll after returning from gateway redirect.
 */
export async function getPaymentStatus(
  orderId: string,
): Promise<OrderPaymentStatusResponse> {
  const params = buildGuestParam();
  return apiGet<OrderPaymentStatusResponse>(
    `/storefront/orders/${orderId}/payment-status?${params.toString()}`,
  );
}

// ─── Payment status polling ───────────────────────────────────────────────────

const POLL_MAX_ATTEMPTS = 10;
const POLL_DELAY_MS = 2000;
const TERMINAL_SUCCESS = new Set(["PAID", "AUTHORIZED"]);
const TERMINAL_FAILURE = new Set(["FAILED", "DECLINED"]);

export async function pollUntilPaymentSettles(
  orderId: string,
): Promise<{ success: boolean; status: string }> {
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
    try {
      const res = await getPaymentStatus(orderId);
      const status = res.orderPaymentStatus;
      if (TERMINAL_SUCCESS.has(status)) return { success: true, status };
      if (TERMINAL_FAILURE.has(status)) return { success: false, status };
    } catch {
      // transient error — continue polling
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_DELAY_MS));
  }
  return { success: false, status: "TIMEOUT" };
}
