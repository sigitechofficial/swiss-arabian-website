"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listOrders, type OrderSummaryApi } from "@/features/account/api/customerOrders.service";

export type PaymentFilter = "all" | "paid" | "pending" | "refunded";

/** Which history tab a payment status belongs to. */
export function paymentFilterOf(status: string): PaymentFilter {
  switch (status.toUpperCase()) {
    case "PAID":
    case "AUTHORIZED":
    case "NOT_REQUIRED":
      return "paid";
    case "PENDING":
    case "FAILED":
      return "pending";
    case "REFUNDED":
    case "PARTIALLY_REFUNDED":
      return "refunded";
    default:
      return "all";
  }
}

/** Placed but unpaid (pending or failed): offer "Pay now". */
export function orderNeedsPaying(order: OrderSummaryApi): boolean {
  const pay = order.paymentStatus.toUpperCase();
  return order.status === "PAYMENT_PENDING" && (pay === "PENDING" || pay === "FAILED");
}

/** Payment history from the shopper's orders (the storefront has no saved-card API). */
export function usePaymentHistory() {
  const [filter, setFilter] = useState<PaymentFilter>("all");
  const query = useQuery({
    queryKey: ["customer-orders", "payments"],
    queryFn: () => listOrders({ limit: 50, offset: 0 }),
    staleTime: 60_000,
  });
  const rows = useMemo(() => {
    const orders = query.data?.items ?? [];
    if (filter === "all") return orders;
    return orders.filter((o) => paymentFilterOf(o.paymentStatus) === filter);
  }, [query.data, filter]);
  return { query, filter, setFilter, rows, hasAny: Boolean(query.data?.items.length) };
}
