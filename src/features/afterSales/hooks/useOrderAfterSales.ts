"use client";

import { useMemo, useState } from "react";
import { getStoredGuestOrderLines } from "@/features/checkout/utils/checkoutSession";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import type { AfterSalesOrderLine } from "../types/afterSales";
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

export type AfterSalesFormKind = "return" | "exchange";

/**
 * The order page's returns and exchanges for a signed-in customer, for every
 * brand: what can be asked for (the market's settings, from the backend), why
 * not, the form that is open, and this order's requests so far.
 */
export function useOrderAfterSales({
  orderId,
  status,
  fulfillmentStatus,
  lines,
}: {
  orderId: string;
  status: string;
  fulfillmentStatus?: string | null;
  lines: AfterSalesOrderLine[];
}) {
  const t = useShopCopy();
  const [form, setForm] = useState<AfterSalesFormKind | null>(null);
  const eligible = isOrderEligibleForAfterSales(status, fulfillmentStatus);
  const returns = useCustomerReturnsFeed(null, orderId);
  const exchanges = useCustomerExchangesFeed(null, orderId);
  const options = useCustomerAfterSalesOptions(orderId);
  const actions = resolveAfterSalesActions(options.data, eligible, t);
  const returnItems = useMemo(() => returns.data?.pages.flatMap((page) => page.items) ?? [], [returns.data]);
  const exchangeItems = useMemo(() => exchanges.data?.pages.flatMap((page) => page.items) ?? [], [exchanges.data]);

  return {
    form,
    setForm,
    eligible,
    canReturn: actions.canReturn && lines.length > 0,
    canExchange: actions.canExchange && lines.length > 0,
    notes: actions.notes,
    returnItems,
    exchangeItems,
  };
}

/**
 * The same for a guest's order (tracking page, order number + access token).
 * Lines come from the order, else from this browser's checkout (a guest's
 * order summary may not list them).
 */
export function useGuestOrderAfterSales({
  orderNumber,
  orderAccessToken,
  status,
  fulfillmentStatus,
  lines,
}: {
  orderNumber: string;
  orderAccessToken: string;
  status: string;
  fulfillmentStatus?: string | null;
  lines: AfterSalesOrderLine[];
}) {
  const t = useShopCopy();
  const [form, setForm] = useState<AfterSalesFormKind | null>(null);
  const eligible = isOrderEligibleForAfterSales(status, fulfillmentStatus);
  const returns = useGuestReturns(orderNumber, orderAccessToken);
  const exchanges = useGuestExchanges(orderNumber, orderAccessToken);
  const options = useGuestAfterSalesOptions(orderNumber, orderAccessToken);
  const actions = resolveAfterSalesActions(options.data, eligible, t);
  const creatableLines = lines.length > 0 ? lines : getStoredGuestOrderLines(orderNumber);
  const hasLines = creatableLines.length > 0;

  return {
    form,
    setForm,
    eligible,
    lines: creatableLines,
    canReturn: actions.canReturn && hasLines,
    canExchange: actions.canExchange && hasLines,
    /** Allowed, but this browser doesn't know the order's lines. */
    noLines: (actions.canReturn || actions.canExchange) && !hasLines,
    notes: actions.notes,
    returnItems: returns.data?.items ?? [],
    exchangeItems: exchanges.data?.items ?? [],
  };
}
