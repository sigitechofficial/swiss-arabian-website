import { apiGet, apiPost } from "@/lib/api/apiClient";
import type {
  AfterSalesOptions,
  CreateExchangeDto,
  CreateReturnDto,
  ExchangeDifferencePaymentResult,
  GuestProofDto,
  StorefrontExchangeDetailView,
  StorefrontExchangeListView,
  StorefrontReturnDetailView,
  StorefrontReturnListView,
} from "../types/afterSales";

export const AFTER_SALES_PAGE_SIZE = 20;

export async function listCustomerReturns(opts: {
  status?: string | null;
  orderId?: string | null;
  limit?: number;
  offset?: number;
} = {}): Promise<StorefrontReturnListView> {
  const params = new URLSearchParams();
  params.set("limit", String(opts.limit ?? AFTER_SALES_PAGE_SIZE));
  params.set("offset", String(opts.offset ?? 0));
  if (opts.status?.trim()) params.set("status", opts.status.trim());
  if (opts.orderId?.trim()) params.set("orderId", opts.orderId.trim());
  return apiGet<StorefrontReturnListView>(
    `/storefront/customer/returns?${params.toString()}`,
  );
}

export async function getCustomerReturn(
  returnRequestId: string,
): Promise<StorefrontReturnDetailView> {
  return apiGet<StorefrontReturnDetailView>(
    `/storefront/customer/returns/${encodeURIComponent(returnRequestId)}`,
  );
}

export async function createCustomerReturn(
  orderId: string,
  dto: CreateReturnDto,
): Promise<StorefrontReturnDetailView> {
  return apiPost<StorefrontReturnDetailView>(
    `/storefront/customer/orders/${encodeURIComponent(orderId)}/returns`,
    dto,
  );
}

export async function listCustomerExchanges(opts: {
  status?: string | null;
  orderId?: string | null;
  limit?: number;
  offset?: number;
} = {}): Promise<StorefrontExchangeListView> {
  const params = new URLSearchParams();
  params.set("limit", String(opts.limit ?? AFTER_SALES_PAGE_SIZE));
  params.set("offset", String(opts.offset ?? 0));
  if (opts.status?.trim()) params.set("status", opts.status.trim());
  if (opts.orderId?.trim()) params.set("orderId", opts.orderId.trim());
  return apiGet<StorefrontExchangeListView>(
    `/storefront/customer/exchanges?${params.toString()}`,
  );
}

export async function getCustomerExchange(
  exchangeRequestId: string,
): Promise<StorefrontExchangeDetailView> {
  return apiGet<StorefrontExchangeDetailView>(
    `/storefront/customer/exchanges/${encodeURIComponent(exchangeRequestId)}`,
  );
}

export async function createCustomerExchange(
  orderId: string,
  dto: CreateExchangeDto,
): Promise<StorefrontExchangeDetailView> {
  return apiPost<StorefrontExchangeDetailView>(
    `/storefront/customer/orders/${encodeURIComponent(orderId)}/exchanges`,
    dto,
  );
}

/** Which of return / exchange the signed-in customer may request for this order. */
export async function getCustomerAfterSalesOptions(
  orderId: string,
): Promise<AfterSalesOptions> {
  return apiGet<AfterSalesOptions>(
    `/storefront/customer/orders/${encodeURIComponent(orderId)}/after-sales-options`,
  );
}

function guestQuery(orderAccessToken: string): string {
  return new URLSearchParams({ orderAccessToken }).toString();
}

export async function listGuestReturns(
  orderNumber: string,
  orderAccessToken: string,
): Promise<StorefrontReturnListView> {
  return apiGet<StorefrontReturnListView>(
    `/storefront/returns/order/${encodeURIComponent(orderNumber)}?${guestQuery(orderAccessToken)}`,
    { skipAuth: true },
  );
}

/**
 * Same for the order-tracking page. Sent with the customer's session when there is one,
 * so a signed-in owner counts as signed in (matters when a market allows signed-in only).
 */
export async function getGuestAfterSalesOptions(
  orderNumber: string,
  orderAccessToken: string,
): Promise<AfterSalesOptions> {
  return apiGet<AfterSalesOptions>(
    `/storefront/returns/order/${encodeURIComponent(orderNumber)}/options?${guestQuery(orderAccessToken)}`,
  );
}

export async function createGuestReturn(
  orderNumber: string,
  dto: CreateReturnDto & GuestProofDto,
): Promise<StorefrontReturnDetailView> {
  return apiPost<StorefrontReturnDetailView>(
    `/storefront/returns/order/${encodeURIComponent(orderNumber)}`,
    dto,
    { skipAuth: true },
  );
}

export async function listGuestExchanges(
  orderNumber: string,
  orderAccessToken: string,
): Promise<StorefrontExchangeListView> {
  return apiGet<StorefrontExchangeListView>(
    `/storefront/exchanges/order/${encodeURIComponent(orderNumber)}?${guestQuery(orderAccessToken)}`,
    { skipAuth: true },
  );
}

export async function createGuestExchange(
  orderNumber: string,
  dto: CreateExchangeDto & GuestProofDto,
): Promise<StorefrontExchangeDetailView> {
  return apiPost<StorefrontExchangeDetailView>(
    `/storefront/exchanges/order/${encodeURIComponent(orderNumber)}`,
    dto,
    { skipAuth: true },
  );
}

export type DifferencePaymentDto = {
  /** Where the payment page sends the shopper back (same origin as the shop). */
  returnUrl?: string;
  cancelUrl?: string;
};

/**
 * Open (or reuse) the hosted payment page for an exchange price difference.
 * Only for `money.action` PAY_DIFFERENCE / AWAITING_PAYMENT. The amount is the
 * backend's — never sent from here.
 */
export async function requestCustomerDifferencePayment(
  exchangeRequestId: string,
  dto: DifferencePaymentDto = {},
): Promise<ExchangeDifferencePaymentResult> {
  return apiPost<ExchangeDifferencePaymentResult>(
    `/storefront/customer/exchanges/${encodeURIComponent(exchangeRequestId)}/difference-payment`,
    dto,
  );
}

/** Has the difference been paid? The backend asks the payment provider. */
export async function syncCustomerDifferencePayment(
  exchangeRequestId: string,
): Promise<ExchangeDifferencePaymentResult> {
  return apiPost<ExchangeDifferencePaymentResult>(
    `/storefront/customer/exchanges/${encodeURIComponent(exchangeRequestId)}/sync-difference-payment`,
    {},
  );
}

export async function requestGuestDifferencePayment(
  orderNumber: string,
  exchangeRequestId: string,
  dto: DifferencePaymentDto & GuestProofDto,
): Promise<ExchangeDifferencePaymentResult> {
  return apiPost<ExchangeDifferencePaymentResult>(
    `/storefront/exchanges/order/${encodeURIComponent(orderNumber)}/${encodeURIComponent(exchangeRequestId)}/difference-payment`,
    dto,
    { skipAuth: true },
  );
}

export async function syncGuestDifferencePayment(
  orderNumber: string,
  exchangeRequestId: string,
  orderAccessToken: string,
): Promise<ExchangeDifferencePaymentResult> {
  return apiPost<ExchangeDifferencePaymentResult>(
    `/storefront/exchanges/order/${encodeURIComponent(orderNumber)}/${encodeURIComponent(exchangeRequestId)}/sync-difference-payment`,
    { orderAccessToken },
    { skipAuth: true },
  );
}
