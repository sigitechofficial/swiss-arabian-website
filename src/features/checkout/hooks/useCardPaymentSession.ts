"use client";

import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useHydrated } from "@/hooks/useHydrated";
import { useLocaleRouter } from "@/lib/i18n/useLocaleRouter";
import { getOrder } from "../api/orders.service";
import {
  clearPaymentState,
  getStoredOrderId,
  getStoredPaymobClientSecret,
  getStoredPaymobPublicKey,
  getStoredStripeClientSecret,
  getStoredStripePublishableKey,
} from "../utils/checkoutSession";

const PAID_STATUSES = new Set(["PAID", "AUTHORIZED", "PARTIALLY_REFUNDED", "REFUNDED"]);

/**
 * The card-form pages (`/checkout/payment/stripe`, `/paymob`): the payment
 * session checkout stored in this tab (read once after hydration; the client
 * secret stays in sessionStorage only), the order being paid, and a redirect
 * to its confirmation when it is already paid (e.g. back button after success).
 *
 * `providerKey` is Stripe's publishable key or Paymob's public key; both arrive
 * on the initiate response, never hard-coded. `expired`: nothing to pay here.
 */
export function useCardPaymentSession(provider: "stripe" | "paymob") {
  const hydrated = useHydrated();
  const router = useLocaleRouter();

  const ctx = useMemo(
    () =>
      hydrated
        ? provider === "stripe"
          ? {
              clientSecret: getStoredStripeClientSecret(),
              providerKey: getStoredStripePublishableKey(),
              orderId: getStoredOrderId(),
            }
          : {
              clientSecret: getStoredPaymobClientSecret(),
              providerKey: getStoredPaymobPublicKey(),
              orderId: getStoredOrderId(),
            }
        : null,
    [hydrated, provider],
  );
  const orderId = ctx?.orderId ?? null;
  const clientSecret = ctx?.clientSecret ?? null;
  const providerKey = ctx?.providerKey ?? null;

  const orderQuery = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrder(orderId as string),
    enabled: Boolean(orderId && clientSecret),
    retry: 1,
    staleTime: 60_000,
  });

  // Already paid: don't offer to charge again.
  const paymentStatus = orderQuery.data?.paymentStatus?.toUpperCase();
  const alreadyPaid = paymentStatus ? PAID_STATUSES.has(paymentStatus) : false;
  useEffect(() => {
    if (!alreadyPaid || !orderId) return;
    clearPaymentState();
    router.replace(`/order-confirmation/${orderId}`);
  }, [alreadyPaid, orderId, router]);

  return {
    hydrated,
    orderId,
    clientSecret,
    providerKey,
    order: orderQuery.data,
    orderLoading: orderQuery.isPending,
    alreadyPaid,
    expired: hydrated && !alreadyPaid && (!clientSecret || !providerKey || !orderId),
  };
}
