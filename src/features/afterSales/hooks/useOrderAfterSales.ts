"use client";

import { useMemo } from "react";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import type { AfterSalesOptions } from "../types/afterSales";
import { afterSalesFlowHref } from "../utils/afterSalesFlow";
import { resolveAfterSalesActions } from "../utils/afterSalesOptions";
import { isOrderEligibleForAfterSales } from "../utils/eligibility";
import {
  useCustomerAfterSalesOptions,
  useCustomerExchangesFeed,
  useCustomerReturnsFeed,
  useGuestAfterSalesOptions,
  useGuestExchanges,
  useGuestReturns,
} from "./useAfterSales";
import { useLastDayFormat } from "./useRequestDate";

/** The later of the return / exchange deadlines among those offered. */
function lastDayToAsk(options: AfterSalesOptions | undefined): string | null {
  if (!options) return null;
  const days = [options.returns, options.exchanges]
    .filter((option) => option.allowed && option.eligibleUntil)
    .map((option) => option.eligibleUntil as string)
    .sort();
  return days.at(-1) ?? null;
}

/**
 * The order page's returns and exchanges for a signed-in customer, for every
 * brand: whether a return or exchange can be started (the market's settings,
 * from the backend), why not, until when, where the guided flow is, and this
 * order's requests so far.
 */
export function useOrderAfterSales({
  orderId,
  status,
  fulfillmentStatus,
}: {
  orderId: string;
  status: string;
  fulfillmentStatus?: string | null;
}) {
  const t = useShopCopy();
  const lastDay = useLastDayFormat();
  const eligible = isOrderEligibleForAfterSales(status, fulfillmentStatus);
  const returns = useCustomerReturnsFeed(null, orderId);
  const exchanges = useCustomerExchangesFeed(null, orderId);
  const options = useCustomerAfterSalesOptions(orderId);
  const actions = resolveAfterSalesActions(options.data, eligible, t, lastDay);
  const returnItems = useMemo(() => returns.data?.pages.flatMap((page) => page.items) ?? [], [returns.data]);
  const exchangeItems = useMemo(() => exchanges.data?.pages.flatMap((page) => page.items) ?? [], [exchanges.data]);

  return {
    eligible,
    canStart: actions.canReturn || actions.canExchange,
    canReturn: actions.canReturn,
    canExchange: actions.canExchange,
    eligibleUntil: lastDayToAsk(options.data),
    flowHref: afterSalesFlowHref({ orderId }),
    notes: actions.notes,
    returnItems,
    exchangeItems,
  };
}

/** The same for a guest's order (tracking page, order number + access token). */
export function useGuestOrderAfterSales({
  orderNumber,
  orderAccessToken,
  status,
  fulfillmentStatus,
}: {
  orderNumber: string;
  orderAccessToken: string;
  status: string;
  fulfillmentStatus?: string | null;
}) {
  const t = useShopCopy();
  const lastDay = useLastDayFormat();
  const eligible = isOrderEligibleForAfterSales(status, fulfillmentStatus);
  const returns = useGuestReturns(orderNumber, orderAccessToken);
  const exchanges = useGuestExchanges(orderNumber, orderAccessToken);
  const options = useGuestAfterSalesOptions(orderNumber, orderAccessToken);
  const actions = resolveAfterSalesActions(options.data, eligible, t, lastDay);

  return {
    eligible,
    canStart: actions.canReturn || actions.canExchange,
    canReturn: actions.canReturn,
    canExchange: actions.canExchange,
    eligibleUntil: lastDayToAsk(options.data),
    flowHref: afterSalesFlowHref({ orderNumber }),
    notes: actions.notes,
    returnItems: returns.data?.items ?? [],
    exchangeItems: exchanges.data?.items ?? [],
  };
}
