"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { pollUntilPaymentSettles } from "../api/orders.service";
import { checkoutErrorMessage } from "../utils/checkoutIssues";
import {
  clearPaymentState,
  getStoredOrderId,
  getStoredOrderNumber,
  getStoredPaymentMethodId,
  getStoredPaymentProviderCode,
  getStoredZonePaymentMethodId,
  incrementPayAttempt,
  storeOrderId,
} from "../utils/checkoutSession";
import { PaymentGatewayError, PaymentRejectedError, startPayment } from "../utils/startPayment";
import { tabbyLang } from "../utils/tabby";

/** What the platform said about an order's payment after a provider return. */
export type PaymentSettlement =
  | { kind: "paid" }
  | { kind: "failed"; status: string }
  | { kind: "timeout" };

/**
 * Polls the platform once for `orderId` (null = wait). Paid → clears the
 * stored payment and replaces the page with the order confirmation. The
 * provider's return link proves nothing: only the platform status counts.
 */
export function useSettlePayment(orderId: string | null): PaymentSettlement | null {
  const router = useRouter();
  const [settlement, setSettlement] = useState<PaymentSettlement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!orderId || started.current) return;
    started.current = true;
    void (async () => {
      const result = await pollUntilPaymentSettles(orderId);
      if (result.success) {
        clearPaymentState();
        setSettlement({ kind: "paid" });
        router.replace(`/order-confirmation/${orderId}`);
        return;
      }
      setSettlement(result.status === "TIMEOUT" ? { kind: "timeout" } : { kind: "failed", status: result.status });
    })();
  }, [orderId, router]);

  return settlement;
}

/** Why a retry could not start: the gateway, the provider's own refusal, or anything else. */
export type PaymentRetryError =
  | { kind: "gateway" }
  | { kind: "rejected"; message: string }
  | { kind: "other"; message: string | null };

/**
 * The "retry payment" action for a placed-but-unpaid order (`?orderId=` or the
 * order last placed in this tab). `reason=gateway` in the address opens with
 * the gateway error. `fallback` is the message for unknown errors.
 */
export function usePaymentRetry({
  queryOrderId,
  storedOrderId,
  gatewayReason,
}: {
  queryOrderId: string | null;
  storedOrderId: string | null;
  gatewayReason: boolean;
}) {
  const router = useRouter();
  const orderId = queryOrderId ?? storedOrderId;
  const isStoredOrder = Boolean(orderId && orderId === storedOrderId);
  const orderNumber = isStoredOrder ? getStoredOrderNumber() : null;
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<PaymentRetryError | null>(gatewayReason ? { kind: "gateway" } : null);

  async function retry() {
    if (!orderId) return;
    setRetrying(true);
    setError(null);
    try {
      // The success page recovers the order from storage after the gateway round-trip.
      storeOrderId(orderId);
      // Gateway sessions are single-use — a retry needs a fresh idempotency key.
      incrementPayAttempt();
      await startPayment(
        orderId,
        (href) => router.push(href),
        // Stored method ids belong to the last order placed in this tab; for any
        // other order let the backend use the method saved on the order.
        isStoredOrder
          ? {
              zonePaymentMethodId: getStoredZonePaymentMethodId(),
              paymentMethodId: getStoredPaymentMethodId(),
              providerCode: getStoredPaymentProviderCode(),
            }
          : {},
      );
    } catch (e) {
      setError(
        e instanceof PaymentRejectedError
          ? { kind: "rejected", message: e.messages[tabbyLang(document.documentElement.lang)] }
          : e instanceof PaymentGatewayError
            ? { kind: "gateway" }
            : { kind: "other", message: checkoutErrorMessage(e, "") || null },
      );
      setRetrying(false);
    }
  }

  return { orderId, orderNumber, retrying, error, retry };
}

/** The order this browser placed last (null until hydrated). */
export function storedOrderIdIf(hydrated: boolean): string | null {
  return hydrated ? getStoredOrderId() : null;
}
