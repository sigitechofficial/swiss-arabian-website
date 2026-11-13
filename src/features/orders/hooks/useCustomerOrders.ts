"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelOrder,
  getCustomerOrderDetail,
  listOrders,
  type CancelOrderResponse,
  type CancellationWindow,
} from "@/features/account/api/customerOrders.service";
import { getOrderTracking, getOrderTrackingTimeline } from "@/features/tracking/api/orderTracking.service";
import { ApiClientError } from "@/lib/api/apiError";
import { cancelOutcome, readOrderRefunds } from "../utils/orderAftercare";
import { isActiveOrder, needsPayment } from "../utils/orderStatus";
import { trackingSummaryFromDetail } from "../utils/trackingFallback";

export const ORDERS_PAGE_SIZE = 20;

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

function cancelError(error: unknown): OrderCancelError {
  if (error instanceof ApiClientError) {
    if (error.code === "BUSINESS_RULE_FAILED") return "closed";
    if (error.status === 404) return "notFound";
    return { message: error.message };
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
  const [cancelResult, setCancelResult] = useState<OrderCancelFeedback | null>(null);
  const [cancelFailure, setCancelFailure] = useState<OrderCancelError | null>(null);

  const detailQuery = useQuery({
    queryKey: ["customer-order-detail", orderId],
    queryFn: () => getCustomerOrderDetail(orderId),
    retry: 1,
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
      setCancelResult(cancelOutcome(result));
    },
    onError: (error) => {
      setCancelResult(null);
      setCancelFailure(cancelError(error));
    },
    onSettled: refreshOrder,
  });

  const data = detailQuery.data;
  const order = data?.order;
  const cancellationWindow = data?.cancellationWindow ?? null;
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
    cancelling: cancelMutation.isPending,
    cancelResult,
    cancelFailure,
    needsSupport: order?.status === "FAILED" || order?.status === "MANUAL_REVIEW",
    itemCount: order?.lines.reduce((sum, line) => sum + (Number.parseInt(line.quantity, 10) || 1), 0) ?? 0,
    refunds: order ? readOrderRefunds(order.refunds) : [],
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
