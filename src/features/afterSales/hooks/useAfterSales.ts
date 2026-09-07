"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { ApiClientError } from "@/lib/api/apiError";
import { useApiMutation, useApiQuery } from "@/lib/api/queryHooks";
import { afterSalesKeys } from "../api/afterSales.keys";
import {
  AFTER_SALES_PAGE_SIZE,
  createCustomerExchange,
  createCustomerReturn,
  createGuestExchange,
  createGuestReturn,
  getCustomerExchange,
  getCustomerReturn,
  listCustomerExchanges,
  listCustomerReturns,
  listGuestExchanges,
  listGuestReturns,
} from "../api/afterSales.service";
import type {
  CreateExchangeDto,
  CreateReturnDto,
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

export function useAfterSalesMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () =>
    queryClient.invalidateQueries({ queryKey: afterSalesKeys.all });

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
