"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { orderProgressStep } from "@/features/orders/utils/orderStatus";
import { trackPromotion } from "@/features/promotions/utils/promotionAnalytics";
import { getOrder, pollUntilPaymentSettles } from "../api/orders.service";
import type { OrderAddressSummary, OrderResponse } from "../types/checkout";

export type OrderPaymentState = "success" | "pending" | "failed";

export function orderPaymentState(status?: string | null): OrderPaymentState {
  const s = status?.toUpperCase() ?? "";
  // A refund (partial or full) only happens after the payment was confirmed.
  if (s === "PAID" || s === "AUTHORIZED" || s === "PARTIALLY_REFUNDED" || s === "REFUNDED") {
    return "success";
  }
  if (s === "FAILED" || s === "DECLINED" || s === "CANCELLED") return "failed";
  return "pending";
}

/** Cash on delivery has no gateway step to wait for. */
export function paysOffline(method: OrderResponse["selectedPaymentMethod"] | null | undefined): boolean {
  return /\bcod\b|cash/i.test(`${method?.providerCode ?? ""} ${method?.methodCode ?? ""}`);
}

export function sameOrderAddress(a?: OrderAddressSummary, b?: OrderAddressSummary): boolean {
  if (!a || !b) return false;
  return (
    a.fullName === b.fullName &&
    a.address1 === b.address1 &&
    a.city === b.city &&
    a.countryCode === b.countryCode
  );
}

/** What the confirmation page shows for a placed order, derived from the frozen order. */
export function orderConfirmationDetails(order: OrderResponse, state: OrderPaymentState) {
  const shippingAddress = order.addresses?.find((a) => a.addressType === "SHIPPING");
  const billingAddress = order.addresses?.find((a) => a.addressType === "BILLING");
  const firstName = (order.customer?.fullName ?? shippingAddress?.fullName ?? "").trim().split(/\s+/)[0];
  const isGuest = Boolean(order.customer?.isGuest);
  const rawStep = orderProgressStep(order.status);
  // A just-paid order can still read PAYMENT_PENDING for a moment — never show it behind "Confirmed".
  const currentStep = state === "success" ? Math.max(rawStep, 1) : rawStep;
  return {
    shippingAddress,
    billingAddress,
    billingSameAsShipping: sameOrderAddress(shippingAddress, billingAddress),
    firstName,
    email: order.customer?.email ?? null,
    isGuest,
    retryHref: `/checkout/payment/cancel?orderId=${encodeURIComponent(order.orderId)}`,
    trackHref: order.orderNumber
      ? isGuest
        ? `/track/${encodeURIComponent(order.orderNumber)}`
        : `/account/orders/${encodeURIComponent(order.orderId)}#tracking`
      : null,
    itemCount: order.lines.reduce((sum, line) => sum + (Number.parseInt(line.quantity, 10) || 1), 0),
    currentStep,
    showProgress: state !== "failed" && currentStep >= 0,
  };
}

/**
 * The order-confirmation page: loads the placed order and, while an online
 * payment still reads pending (gateways send the shopper back before the
 * webhook lands), polls payment status until it settles.
 */
export function useOrderConfirmation(orderId: string) {
  const searchParams = useSearchParams();
  const verify = searchParams.get("verify") === "1";

  const orderQuery = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrder(orderId),
    retry: 1,
  });

  const loadedOrder = orderQuery.data;
  const payOffline = paysOffline(loadedOrder?.selectedPaymentMethod);

  // Gateways (Paymob, Stripe 3DS) send the shopper here straight after paying —
  // that proves nothing. While an online payment still reads pending, poll
  // payment-status until the webhook settles it (or we time out).
  const shouldPoll =
    Boolean(loadedOrder) && !payOffline && (verify || orderPaymentState(loadedOrder?.paymentStatus) === "pending");

  const settle = useQuery({
    queryKey: ["order-payment-settle", orderId],
    queryFn: () => pollUntilPaymentSettles(orderId),
    enabled: shouldPoll,
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  });
  const polling = shouldPoll && !settle.data && !settle.isError;
  const purchaseSent = useRef(false);

  useEffect(() => {
    const placed = orderQuery.data;
    if (!placed || purchaseSent.current) return;
    const offline = paysOffline(placed.selectedPaymentMethod);
    const raw = orderPaymentState(settle.data?.status ?? placed.paymentStatus);
    const paid = offline && raw === "pending" ? "success" : raw;
    if (paid !== "success") return;
    purchaseSent.current = true;
    trackPromotion("promotion_order_completed", { surface: "order" });
  }, [orderQuery.data, settle.data?.status]);

  const order = orderQuery.data;
  const rawState = orderPaymentState(settle.data?.status ?? order?.paymentStatus);
  // A cash-on-delivery order is confirmed on placement; payment comes later.
  const state: OrderPaymentState = payOffline && rawState === "pending" ? "success" : rawState;

  return {
    orderQuery,
    order,
    loading: orderQuery.isPending || polling,
    polling,
    failedToLoad: !orderQuery.isPending && (orderQuery.isError || !order),
    state,
    payOffline,
    details: order ? orderConfirmationDetails(order, state) : null,
    checking: settle.isFetching,
    checkAgain: () => {
      void settle.refetch();
      void orderQuery.refetch();
    },
  };
}
