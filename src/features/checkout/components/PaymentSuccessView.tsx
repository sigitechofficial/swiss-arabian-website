"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { pollUntilPaymentSettles } from "../api/orders.service";
import { getStoredOrderId, clearPaymentState } from "../utils/checkoutSession";
import { clearCartId } from "@/features/cart/utils/guestToken";
import { CheckoutShell } from "./CheckoutShell";

type PollState = "polling" | "success" | "failed" | "timeout" | "no_order";

export function PaymentSuccessView() {
  const router = useRouter();
  const [state, setState] = useState<PollState>("polling");
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  useEffect(() => {
    const orderId = getStoredOrderId();
    if (!orderId) { setState("no_order"); return; }

    async function verify() {
      const result = await pollUntilPaymentSettles(orderId!);
      setPaymentStatus(result.status);
      if (result.success) {
        clearPaymentState();
        clearCartId();
        setState("success");
        router.push(`/order-confirmation/${orderId}`);
      } else if (result.status === "TIMEOUT") {
        setState("timeout");
      } else {
        setState("failed");
      }
    }
    verify();
  }, [router]);

  if (state === "polling" || state === "success") {
    return (
      <CheckoutShell step={2}>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 py-24 text-center">
          <span className="size-10 animate-spin rounded-full border-2 border-sa-border border-t-terra" />
          <div>
            <p className="text-[15px] font-medium text-sa-primary">Verifying your payment…</p>
            <p className="mt-1 text-[13px] text-sa-muted">Please wait, do not close or refresh this page.</p>
          </div>
        </div>
      </CheckoutShell>
    );
  }

  if (state === "timeout") {
    return (
      <CheckoutShell step={2}>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <svg className="size-8 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-[24px] font-bold text-sa-primary">Payment still processing</h1>
            <p className="mt-2 max-w-sm text-[14px] text-sa-muted">Your payment is taking longer than expected. We&apos;ll send a confirmation email once it&apos;s complete.</p>
          </div>
          <button type="button" onClick={() => router.push("/")} className="flex h-10 items-center justify-center rounded-md bg-terra px-6 text-[12px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-[#a25e48]">
            Return to Home
          </button>
        </div>
      </CheckoutShell>
    );
  }

  if (state === "no_order") {
    return (
      <CheckoutShell step={2}>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
          <p className="text-[15px] text-sa-primary">Session expired or order not found.</p>
          <button type="button" onClick={() => router.push("/")} className="text-[13px] text-terra underline underline-offset-4">Return to Home</button>
        </div>
      </CheckoutShell>
    );
  }

  return (
    <CheckoutShell step={2}>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <svg className="size-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <div>
          <h1 className="text-[24px] font-bold text-sa-primary">Payment Failed</h1>
          <p className="mt-2 max-w-sm text-[14px] text-sa-muted">
            {paymentStatus === "DECLINED" ? "Your card was declined by the issuer." : "Your payment could not be processed. Please try again or use a different payment method."}
          </p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <button type="button" onClick={() => router.push("/checkout/payment/cancel")} className="flex h-10 items-center justify-center rounded-md bg-terra px-6 text-[12px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-[#a25e48]">
            Try Again
          </button>
          <button type="button" onClick={() => router.push("/")} className="text-[13px] text-sa-muted underline underline-offset-4 hover:text-sa-primary">
            Return to Home
          </button>
        </div>
      </div>
    </CheckoutShell>
  );
}
