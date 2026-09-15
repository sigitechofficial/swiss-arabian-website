import { getAccessToken } from "@/lib/auth/token";
import { apiGet, apiPost } from "@/lib/api/apiClient";
import { storefrontContextQuery } from "@/lib/storefront/context";
import { getOrCreateGuestToken } from "@/features/cart/utils/guestToken";
import type {
  OrderPaymentStatusResponse,
  OrderResponse,
  PaymentInitiationResponse,
} from "../types/checkout";

function buildContextParams(): URLSearchParams {
  const params = new URLSearchParams(storefrontContextQuery());
  if (!getAccessToken()) {
    const guestToken = getOrCreateGuestToken();
    if (guestToken) params.set("guestToken", guestToken);
  }
  return params;
}

function buildGuestParam(): URLSearchParams {
  const params = new URLSearchParams();
  if (!getAccessToken()) {
    const guestToken = getOrCreateGuestToken();
    if (guestToken) params.set("guestToken", guestToken);
  }
  return params;
}

/** POST /storefront/orders/from-checkout — the final submit. */
export async function placeOrder(dto: {
  checkoutSessionId: string;
  idempotencyKey?: string;
}): Promise<OrderResponse> {
  return apiPost<OrderResponse>(
    `/storefront/orders/from-checkout?${buildContextParams().toString()}`,
    dto,
  );
}

export async function getOrder(orderId: string): Promise<OrderResponse> {
  return apiGet<OrderResponse>(
    `/storefront/orders/${encodeURIComponent(orderId)}?${buildGuestParam().toString()}`,
  );
}

export type InitiatePaymentDto = {
  idempotencyKey?: string;
  /** Where the gateway sends the browser after paying. */
  returnUrl?: string;
  /** Where the gateway sends the browser when the shopper cancels. */
  cancelUrl?: string;
  /**
   * Both ids are whitelisted by the DTO (verified against the live API): the
   * Paymob/Stripe guides require `zonePaymentMethodId`, the reference sends
   * `paymentMethodId`. Sending both satisfies either reading.
   */
  zonePaymentMethodId?: string;
  paymentMethodId?: string;
};

export async function initiatePayment(
  orderId: string,
  dto: InitiatePaymentDto = {},
): Promise<PaymentInitiationResponse> {
  return apiPost<PaymentInitiationResponse>(
    `/storefront/orders/${encodeURIComponent(orderId)}/payment/initiate?${buildGuestParam().toString()}`,
    dto,
  );
}

export async function getPaymentStatus(
  orderId: string,
): Promise<OrderPaymentStatusResponse> {
  return apiGet<OrderPaymentStatusResponse>(
    `/storefront/orders/${encodeURIComponent(orderId)}/payment-status?${buildGuestParam().toString()}`,
  );
}

const TERMINAL_SUCCESS = new Set(["PAID", "AUTHORIZED"]);
/** Both payment guides list CANCELLED as terminal; the reference omitted it. */
const TERMINAL_FAILURE = new Set(["FAILED", "DECLINED", "CANCELLED"]);

/**
 * Payment is confirmed by the provider webhook, never by the browser redirect
 * (or a gateway's `success=true` query param), so poll the backend. Defaults
 * follow the Paymob brief: every ~2.5s, up to 12 times (~30s, same window the
 * Stripe guide uses).
 */
export async function pollUntilPaymentSettles(
  orderId: string,
  { attempts = 12, delayMs = 2500 }: { attempts?: number; delayMs?: number } = {},
): Promise<{ success: boolean; status: string }> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const res = await getPaymentStatus(orderId);
      const status = res.orderPaymentStatus?.toUpperCase() ?? "";
      if (TERMINAL_SUCCESS.has(status)) return { success: true, status };
      if (TERMINAL_FAILURE.has(status)) return { success: false, status };
    } catch {
      // Transient — keep polling.
    }
    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return { success: false, status: "TIMEOUT" };
}
