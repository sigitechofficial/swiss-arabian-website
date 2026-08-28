"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { initiatePayment } from "../api/orders.service";
import { getStoredOrderId, incrementPayAttempt, storePaymentTransactionId } from "../utils/checkoutSession";
import { CheckoutShell } from "./CheckoutShell";

export function PaymentCancelView() {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRetry() {
    const orderId = getStoredOrderId();
    if (!orderId) { setError("Order session expired. Please start a new order."); return; }

    setRetrying(true);
    setError(null);
    try {
      const attempt = incrementPayAttempt();
      const payment = await initiatePayment(orderId, {
        returnUrl: `${window.location.origin}/checkout/payment/success`,
        cancelUrl: `${window.location.origin}/checkout/payment/cancel`,
        idempotencyKey: `pay-${orderId}-${attempt}`,
      });
      if (payment.paymentAction === "REDIRECT" && payment.redirectUrl) {
        if (payment.paymentTransactionId) storePaymentTransactionId(payment.paymentTransactionId);
        window.location.href = payment.redirectUrl;
        return;
      }
      router.push(`/order-confirmation/${orderId}`);
    } catch {
      setError("Could not restart payment. Please contact support.");
    } finally {
      setRetrying(false);
    }
  }

  return (
    <CheckoutShell step={2}>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-sa-border/40 dark:bg-sa-border/20">
          <svg className="size-8 text-sa-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <div>
          <h1 className="text-[24px] font-bold text-sa-primary">Payment Cancelled</h1>
          <p className="mt-2 max-w-sm text-[14px] text-sa-muted">
            You cancelled the payment. Your order is still saved — you can retry payment below or come back later.
          </p>
        </div>
        {error ? (
          <div className="w-full max-w-sm rounded-md border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">{error}</div>
        ) : null}
        <div className="flex flex-col items-center gap-3">
          <button type="button" onClick={handleRetry} disabled={retrying} className="flex h-10 min-w-44 items-center justify-center gap-2 rounded-md bg-terra px-6 text-[12px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-[#a25e48] disabled:opacity-60">
            {retrying ? (
              <><span className="size-3.5 animate-spin rounded-full border border-white/40 border-t-white" />Redirecting…</>
            ) : "Retry Payment"}
          </button>
          <button type="button" onClick={() => router.push("/")} className="text-[13px] text-sa-muted underline underline-offset-4 hover:text-sa-primary">
            Return to Home
          </button>
        </div>
      </div>
    </CheckoutShell>
  );
}
