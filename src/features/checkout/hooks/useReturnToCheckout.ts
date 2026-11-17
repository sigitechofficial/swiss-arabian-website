"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { checkoutHref } from "../utils/checkoutLocale";
import { clearPaymentState, storeOrderId } from "../utils/checkoutSession";
import { returnToCheckout } from "../utils/returnToCheckout";

/**
 * "Choose another payment method" on a Tabby return page (every brand).
 * Cancelled: back to checkout with the bag, Tabby still offered.
 * Declined: back to checkout with the bag, Tabby not offered again.
 * Paid after all: the confirmation. Order still open: stay, with `failed` set.
 */
export function useReturnToCheckout(orderId: string | null) {
  const router = useRouter();
  const [returning, setReturning] = useState(false);
  const [failed, setFailed] = useState(false);

  const go = useCallback(
    async (declined: boolean) => {
      if (!orderId) {
        router.push(checkoutHref("/cart"));
        return;
      }
      setReturning(true);
      setFailed(false);
      try {
        const result = await returnToCheckout(orderId, { declined });
        if (result.kind === "paid") {
          clearPaymentState();
          router.replace(checkoutHref(`/order-confirmation/${encodeURIComponent(orderId)}`));
          return;
        }
        if (result.kind === "checkout") {
          router.push(checkoutHref("/checkout"));
          return;
        }
      } catch {
        // Fall through: the order stays as it is and the shopper is told.
      }
      storeOrderId(orderId);
      setFailed(true);
      setReturning(false);
    },
    [orderId, router],
  );

  return { returning, failed, go };
}
