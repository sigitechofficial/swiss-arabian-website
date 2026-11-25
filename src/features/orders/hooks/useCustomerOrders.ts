"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelOrder,
  cancelOrderItems,
  getCustomerOrderDetail,
  listOrders,
  type CancelItemInput,
  type CancelOrderResponse,
  type CancellationWindow,
} from "@/features/account/api/customerOrders.service";
import { getOrderTracking, getOrderTrackingTimeline } from "@/features/tracking/api/orderTracking.service";
import { ApiClientError } from "@/lib/api/apiError";
import { knownErrorMessage } from "@/lib/api/userFacingErrors";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { cancelItemsOutcome, cancelOutcome } from "../utils/orderAftercare";
import { readCustomerRefunds, toOrderRefundView } from "../utils/orderRefunds";
import { isActiveOrder, needsPayment } from "../utils/orderStatus";
import { trackingSummaryFromDetail } from "../utils/trackingFallback";

export const ORDERS_PAGE_SIZE = 20;

function newRequestId(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** The signed-in shopper's orders, a page at a time, split into active and past. */
export function useCustomerOrders(pageSize = ORDERS_PAGE_SIZE) {
  const [offset, setOffset] = useState(0);
  const query = useQuery({
    queryKey: ["customer-orders", offset],
    queryFn: () => listOrders({ limit: pageSize, offset }),
    staleTime: 0,
    refetchOnMount: "always",
  });
  const orders = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);
  const currentPage = Math.floor(offset / pageSize) + 1;
  return {
    query,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => void query.refetch(),
    orders,
    active: orders.filter((o) => isActiveOrder(o.status)),
    past: orders.filter((o) => !isActiveOrder(o.status)),
    total,
    totalPages,
    currentPage,
    previous: () => setOffset(Math.max(0, offset - pageSize)),
    next: () => setOffset(offset + pageSize),
  };
}

export type OrderCancelFeedback = ReturnType<typeof cancelOutcome>;
export type OrderCancelError = "closed" | "notFound" | "failed" | { message: string };

/**
 * Backend refusal codes for an online cancel (the order's after-sales policy).
 * Store-policy refusals carry their own copy; timing refusals are "closed".
 */
const CANCEL_REFUSALS: Record<
  string,
  "closed" | "orders.cancel.disabled" | "orders.cancel.preparing" | "orders.cancel.partialDisabled" | "orders.cancel.notPaid"
> = {
  ORDER_PARTIAL_CANCEL_DISABLED: "orders.cancel.partialDisabled",
  ORDER_PARTIAL_CANCEL_NOT_PAID: "orders.cancel.notPaid",
  CUSTOMER_CANCELLATION_DISABLED: "orders.cancel.disabled",
  CUSTOMER_CANCELLATION_FULFILLMENT_STARTED: "orders.cancel.preparing",
  CUSTOMER_CANCELLATION_SHIPMENT_EXISTS: "orders.cancel.preparing",
  CUSTOMER_CANCELLATION_WINDOW_CLOSED: "closed",
  CUSTOMER_CANCELLATION_WINDOW_NOT_STARTED: "closed",
  CUSTOMER_CANCELLATION_ALREADY_CANCELLED: "closed",
  CUSTOMER_CANCELLATION_NOT_ELIGIBLE: "closed",
  ORDER_CANCELLATION_DURING_WINDOW_NOT_ALLOWED: "closed",
  BUSINESS_RULE_FAILED: "closed",
};

function cancelError(error: unknown, copy: ReturnType<typeof useShopCopy>): OrderCancelError {
  if (error instanceof ApiClientError) {
    const refusal = error.code ? CANCEL_REFUSALS[error.code] : undefined;
    if (refusal === "closed") return "closed";
    if (refusal) return { message: copy(refusal) };
    if (error.status === 404) return "notFound";
    const said = knownErrorMessage(error);
    return said ? { message: said } : "failed";
  }
  return "failed";
}

/**
 * One order of the signed-in shopper: the detail, the richer tracking view
 * (with the detail as fallback), the carrier timeline, and cancelling inside
 * the cancellation window.
 */
export function useCustomerOrderDetail(orderId: string) {
  const queryClient = useQueryClient();
  const copy = useShopCopy();
  const [cancelResult, setCancelResult] = useState<OrderCancelFeedback | null>(null);
  const [cancelFailure, setCancelFailure] = useState<OrderCancelError | null>(null);

  const detailQuery = useQuery({
    queryKey: ["customer-order-detail", orderId],
    queryFn: () => getCustomerOrderDetail(orderId),
  });
  const orderNumber = detailQuery.data?.order.orderNumber ?? null;

  // Richer tracking view (carrier, estimated delivery, shipment items). The
  // detail payload is the fallback if it can't be loaded.
  const trackingQuery = useQuery({
    queryKey: ["order-tracking", orderNumber, "account"],
    queryFn: () => getOrderTracking(orderNumber as string),
    enabled: Boolean(orderNumber),
    retry: false,
    staleTime: 60_000,
  });
  const shipmentCount = trackingQuery.data?.shipments.length ?? detailQuery.data?.order.shipments?.length ?? 0;
  const timelineQuery = useQuery({
    queryKey: ["order-tracking-timeline", orderNumber, "account"],
    queryFn: () => getOrderTrackingTimeline(orderNumber as string),
    enabled: Boolean(orderNumber) && shipmentCount > 0,
    retry: false,
    staleTime: 60_000,
  });

  const refreshOrder = () => {
    void queryClient.invalidateQueries({ queryKey: ["customer-order-detail", orderId] });
    void queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
    void queryClient.invalidateQueries({ queryKey: ["order-tracking"] });
  };

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(orderId, "Cancelled by customer"),
    onSuccess: (result: CancelOrderResponse) => {
      setCancelFailure(null);
      setCancelResult(cancelOutcome(result, copy));
    },
    onError: (error) => {
      setCancelResult(null);
      setCancelFailure(cancelError(error, copy));
    },
    onSettled: refreshOrder,
  });

  // One key per confirmed selection: a repeated tap or a retry after a lost
  // response gets the first result back instead of cancelling more units.
  const cancelItemsKey = useRef<string | null>(null);
  const cancelItemsMutation = useMutation({
    mutationFn: (items: CancelItemInput[]) => {
      cancelItemsKey.current ??= `cancel-items-${orderId}-${newRequestId()}`;
      return cancelOrderItems(orderId, items, cancelItemsKey.current);
    },
    onSuccess: (result: CancelOrderResponse) => {
      cancelItemsKey.current = null;
      setCancelFailure(null);
      setCancelResult(
        result.partial === false
          ? cancelOutcome(result, copy)
          : cancelItemsOutcome(result, detailQuery.data?.order.currency ?? null, copy),
      );
    },
    onError: (error) => {
      setCancelResult(null);
      setCancelFailure(cancelError(error, copy));
    },
    onSettled: refreshOrder,
  });

  const data = detailQuery.data;
  const order = data?.order;
  const cancellationWindow = data?.cancellationWindow ?? null;
  const customerRefunds = data ? readCustomerRefunds(data.refunds ?? order?.refunds) : [];
  return {
    detailQuery,
    data,
    order,
    loading: detailQuery.isPending,
    notFound: !detailQuery.isPending && (detailQuery.isError || !data),
    reference: order?.orderNumber ?? orderId.slice(0, 8).toUpperCase(),
    shippingAddress: order?.addresses.find((a) => a.addressType === "SHIPPING"),
    billingAddress: order?.addresses.find((a) => a.addressType === "BILLING"),
    trackingSummary: trackingQuery.data ?? (data ? trackingSummaryFromDetail(data) : null),
    timeline: timelineQuery.data,
    payable: order ? needsPayment(order.status, order.paymentStatus) : false,
    cancellationWindow,
    fetchedAt: detailQuery.dataUpdatedAt,
    showCancel:
      Boolean(cancellationWindow?.canCancel && cancellationWindow.isInsideWindow) && !cancelMutation.isSuccess,
    cancel: () => {
      setCancelResult(null);
      setCancelFailure(null);
      cancelMutation.mutate();
    },
    /** Some items only (cancellationWindow.canCancelItems). */
    cancelItems: (items: CancelItemInput[]) => {
      setCancelResult(null);
      setCancelFailure(null);
      cancelItemsMutation.mutate(items);
    },
    cancellingItems: cancelItemsMutation.isPending,
    /** Bumps after each successful cancel of some items (closes the picker). */
    itemsCancelledAt: cancelItemsMutation.isSuccess ? cancelItemsMutation.submittedAt : 0,
    cancelling: cancelMutation.isPending,
    cancelResult,
    cancelFailure,
    needsSupport: order?.status === "FAILED" || order?.status === "MANUAL_REVIEW",
    itemCount: order?.lines.reduce((sum, line) => sum + (Number.parseInt(line.quantity, 10) || 1), 0) ?? 0,
    /** Each refund with its state and the parts it goes back to. */
    customerRefunds,
    /** Older one-line shape (amount + status words). */
    refunds: customerRefunds.map(toOrderRefundView),
    refreshOrder,
  };
}

/**
 * Seconds left in an order's cancellation window, ticking each second from
 * when the detail was fetched. Calls `onExpired` once when it reaches zero.
 */
export function useCancellationCountdown(window: CancellationWindow, fetchedAt: number, onExpired: () => void) {
  const [now, setNow] = useState(fetchedAt);
  const expiredReported = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const endsAtMs =
    window.remainingSeconds != null
      ? fetchedAt + window.remainingSeconds * 1000
      : window.endsAt
        ? Date.parse(window.endsAt)
        : fetchedAt;
  const remaining = Math.max(0, Math.floor((endsAtMs - now) / 1000));

  useEffect(() => {
    if (remaining > 0 || expiredReported.current) return;
    expiredReported.current = true;
    onExpired();
  }, [remaining, onExpired]);

  return {
    remaining,
    mmss: `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`,
  };
}
