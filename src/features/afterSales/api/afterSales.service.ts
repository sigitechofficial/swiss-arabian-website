import { apiGet, apiPost } from "@/lib/api/apiClient";
import type {
  CreateExchangeDto,
  CreateReturnDto,
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
