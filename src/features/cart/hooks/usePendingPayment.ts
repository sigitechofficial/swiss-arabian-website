"use client";

import { useCartStore } from "@/stores/useCartStore";

export type PendingPaymentNotice = {
  orderNumber: string;
  /** Back into the payment step for that order (same for every payment method). */
  href: string;
};

/**
 * The server says an unpaid order holds this bag (checkout QA-006): the shopper
 * started paying and didn't finish, on this device or another. Each brand draws
 * its own notice from this; changing the bag cancels that order on the server.
 */
export function usePendingPayment(): PendingPaymentNotice | null {
  const pending = useCartStore((s) => s.pendingPayment);
  if (!pending) return null;
  return {
    orderNumber: pending.orderNumber,
    href: `/checkout/payment/cancel?orderId=${encodeURIComponent(pending.orderId)}`,
  };
}
