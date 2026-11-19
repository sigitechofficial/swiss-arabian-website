"use client";

import {
  keepPreviousData,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { ApiClientError } from "@/lib/api/apiError";
import { useApiMutation, useApiQuery } from "@/lib/api/queryHooks";
import { afterSalesKeys, isReturnEstimateKey } from "../api/afterSales.keys";
import {
  AFTER_SALES_PAGE_SIZE,
  createCustomerExchange,
  createCustomerReturn,
  createGuestExchange,
  createGuestReturn,
  estimateCustomerReturn,
  estimateGuestReturn,
  getCustomerAfterSalesOptions,
  getCustomerOrderReturnsPolicy,
  getGuestOrderReturnsPolicy,
  getMarketReturnsPolicy,
  getCustomerExchange,
  getCustomerReturn,
  getGuestAfterSalesOptions,
  listCustomerExchanges,
  listCustomerReturns,
  listGuestExchanges,
  listGuestReturns,
} from "../api/afterSales.service";
import type {
  CreateExchangeDto,
  CreateReturnDto,
  ReturnEstimateDto,
} from "../types/afterSales";

function retryUnlessNotFound(failureCount: number, error: Error) {
  if (error instanceof ApiClientError && error.status === 404) return false;
  return failureCount < 2;
}

export function useCustomerReturnsFeed(
  status?: string | null,
  orderId?: string | null,
) {
  return useInfiniteQuery({
    queryKey: afterSalesKeys.returnList(status, orderId),
    queryFn: ({ pageParam }) =>
      listCustomerReturns({
        status,
        orderId,
        limit: AFTER_SALES_PAGE_SIZE,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const next = (lastPage.offset ?? 0) + lastPage.items.length;
      return next < lastPage.total ? next : undefined;
    },
    retry: retryUnlessNotFound,
  });
}

export function useCustomerExchangesFeed(
  status?: string | null,
  orderId?: string | null,
) {
  return useInfiniteQuery({
    queryKey: afterSalesKeys.exchangeList(status, orderId),
    queryFn: ({ pageParam }) =>
      listCustomerExchanges({
        status,
        orderId,
        limit: AFTER_SALES_PAGE_SIZE,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const next = (lastPage.offset ?? 0) + lastPage.items.length;
      return next < lastPage.total ? next : undefined;
    },
    retry: retryUnlessNotFound,
  });
}

export function useCustomerReturnDetail(returnRequestId: string | null) {
  return useApiQuery(
    afterSalesKeys.returnDetail(returnRequestId ?? ""),
    () => getCustomerReturn(returnRequestId!),
    {
      enabled: Boolean(returnRequestId),
      retry: retryUnlessNotFound,
    },
  );
}

export function useCustomerExchangeDetail(exchangeRequestId: string | null) {
  return useApiQuery(
    afterSalesKeys.exchangeDetail(exchangeRequestId ?? ""),
    () => getCustomerExchange(exchangeRequestId!),
    {
      enabled: Boolean(exchangeRequestId),
      retry: retryUnlessNotFound,
    },
  );
}

export function useGuestReturns(orderNumber: string, orderAccessToken: string | null) {
  return useApiQuery(
    afterSalesKeys.guestReturns(orderNumber),
    () => listGuestReturns(orderNumber, orderAccessToken!),
    {
      enabled: Boolean(orderNumber && orderAccessToken),
      retry: retryUnlessNotFound,
    },
  );
}

export function useGuestExchanges(
  orderNumber: string,
  orderAccessToken: string | null,
) {
  return useApiQuery(
    afterSalesKeys.guestExchanges(orderNumber),
    () => listGuestExchanges(orderNumber, orderAccessToken!),
    {
      enabled: Boolean(orderNumber && orderAccessToken),
      retry: retryUnlessNotFound,
    },
  );
}

/** Which of return / exchange the signed-in customer may request (drives the buttons). */
export function useCustomerAfterSalesOptions(orderId: string, enabled = true) {
  return useApiQuery(
    afterSalesKeys.customerOptions(orderId),
    () => getCustomerAfterSalesOptions(orderId),
    { enabled: Boolean(orderId) && enabled, retry: retryUnlessNotFound },
  );
}

export function useGuestAfterSalesOptions(
  orderNumber: string,
  orderAccessToken: string | null,
  enabled = true,
) {
  return useApiQuery(
    afterSalesKeys.guestOptions(orderNumber),
    () => getGuestAfterSalesOptions(orderNumber, orderAccessToken!),
    {
      enabled: Boolean(orderNumber && orderAccessToken) && enabled,
      retry: retryUnlessNotFound,
    },
  );
}

export function useAfterSalesMutations() {
  const queryClient = useQueryClient();

  // Refresh requests, options and summaries after a change. Estimates are
  // left alone: they describe a draft, and re-running one for lines that were
  // just submitted would only be refused as no longer eligible.
  const invalidateAll = () =>
    queryClient.invalidateQueries({
      queryKey: afterSalesKeys.all,
      predicate: (query) => !isReturnEstimateKey(query.queryKey),
    });

  const createReturn = useApiMutation(
    (vars: { orderId: string; dto: CreateReturnDto }) =>
      createCustomerReturn(vars.orderId, vars.dto),
    { onSuccess: invalidateAll },
  );

  const createExchange = useApiMutation(
    (vars: { orderId: string; dto: CreateExchangeDto }) =>
      createCustomerExchange(vars.orderId, vars.dto),
    { onSuccess: invalidateAll },
  );

  const createGuestReturnMut = useApiMutation(
    (vars: {
      orderNumber: string;
      dto: CreateReturnDto;
      orderAccessToken: string;
    }) =>
      createGuestReturn(vars.orderNumber, {
        ...vars.dto,
        orderAccessToken: vars.orderAccessToken,
      }),
    { onSuccess: invalidateAll },
  );

  const createGuestExchangeMut = useApiMutation(
    (vars: {
      orderNumber: string;
      dto: CreateExchangeDto;
      orderAccessToken: string;
    }) =>
      createGuestExchange(vars.orderNumber, {
        ...vars.dto,
        orderAccessToken: vars.orderAccessToken,
      }),
    { onSuccess: invalidateAll },
  );

  return {
    createReturn,
    createExchange,
    createGuestReturn: createGuestReturnMut,
    createGuestExchange: createGuestExchangeMut,
  };
}

/** The order a return form is for: the signed-in owner's, or a guest order with its proof. */
export type ReturnOrderTarget =
  | { mode: "customer"; orderId: string }
  | { mode: "guest"; orderNumber: string; orderAccessToken: string };

const ESTIMATE_DEBOUNCE_MS = 400;

/**
 * Refund estimate for what the return form currently asks for. Waits until the
 * customer stops changing lines / quantities / reason, keeps the last figures
 * on screen while the next ones load. `null` = nothing to estimate.
 */
export function useReturnEstimate(
  target: ReturnOrderTarget,
  dto: ReturnEstimateDto | null,
) {
  const payload = dto && dto.items.length > 0 ? JSON.stringify(dto) : "";
  const settled = useDebounce(payload, ESTIMATE_DEBOUNCE_MS);
  const ref = target.mode === "customer" ? target.orderId : target.orderNumber;
  const query = useApiQuery(
    afterSalesKeys.returnEstimate(ref, settled),
    () => {
      const body = JSON.parse(settled) as ReturnEstimateDto;
      return target.mode === "customer"
        ? estimateCustomerReturn(target.orderId, body)
        : estimateGuestReturn(target.orderNumber, {
            ...body,
            orderAccessToken: target.orderAccessToken,
          });
    },
    {
      enabled: Boolean(settled) && Boolean(ref),
      placeholderData: keepPreviousData,
      retry: false,
      staleTime: 30_000,
    },
  );
  return {
    ...query,
    /** Nothing selected: no estimate to show. */
    empty: !payload,
    /** The figures shown are for an earlier selection (a newer one is on its way). */
    updating: Boolean(payload) && (payload !== settled || query.isPlaceholderData || query.isFetching),
  };
}

export type ReturnsPolicySource =
  | ReturnOrderTarget
  | { mode: "market"; zoneCode: string };

/** Return terms in plain words: the order's frozen rules, or a market's rules today. */
export function useReturnsPolicy(source: ReturnsPolicySource, enabled = true) {
  const key =
    source.mode === "customer"
      ? afterSalesKeys.returnsPolicy("order", source.orderId)
      : source.mode === "guest"
        ? afterSalesKeys.returnsPolicy("guest", source.orderNumber)
        : afterSalesKeys.returnsPolicy("market", source.zoneCode);
  const ready =
    source.mode === "customer"
      ? Boolean(source.orderId)
      : source.mode === "guest"
        ? Boolean(source.orderNumber && source.orderAccessToken)
        : Boolean(source.zoneCode);
  return useApiQuery(
    key,
    () =>
      source.mode === "customer"
        ? getCustomerOrderReturnsPolicy(source.orderId)
        : source.mode === "guest"
          ? getGuestOrderReturnsPolicy(source.orderNumber, source.orderAccessToken)
          : getMarketReturnsPolicy(source.zoneCode),
    {
      enabled: ready && enabled,
      retry: retryUnlessNotFound,
      staleTime: 5 * 60_000,
    },
  );
}
