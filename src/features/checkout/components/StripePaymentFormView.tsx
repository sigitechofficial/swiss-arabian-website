"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import type { StripeElementsOptions } from "@stripe/stripe-js";
import { pollUntilPaymentSettles } from "../api/orders.service";
import {
  getStoredOrderId,
  getStoredStripeClientSecret,
  getStoredStripePublishableKey,
  clearStripeClientSecret,
  clearPaymentState,
} from "../utils/checkoutSession";
import { clearCartId } from "@/features/cart/utils/guestToken";
import { CheckoutShell } from "./CheckoutShell";

// ─── Error message mapper ─────────────────────────────────────────────────────

function mapStripeError(code?: string | null, declineCode?: string | null): string {
  if (declineCode === "insufficient_funds") return "Insufficient funds. Please try another card.";
  if (code === "card_declined" || declineCode === "generic_decline") return "Your card was declined. Please try another card.";
  if (code === "expired_card") return "Your card has expired.";
  if (code === "incorrect_cvc") return "Incorrect CVC. Please check and try again.";
  if (code === "incorrect_number" || code === "invalid_number") return "Invalid card number. Please check and try again.";
  if (code === "processing_error") return "A processing error occurred. Please try again.";
  return "Payment failed. Please try another card or contact your bank.";
}

// ─── Inner form (needs Stripe context) ───────────────────────────────────────

function StripeForm({ orderId, returnUrl }: { orderId: string; returnUrl: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [polling, setPolling] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setErrorMsg(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: "if_required",
    });

    if (error) {
      setErrorMsg(mapStripeError(error.code, error.decline_code));
      setSubmitting(false);
      return;
    }

    // No error — payment confirmed (or 3DS handled inline)
    setSubmitting(false);
    setPolling(true);

    const result = await pollUntilPaymentSettles(orderId);
    clearStripeClientSecret();
    clearPaymentState();
    clearCartId();

    if (result.success) {
      router.push(`/order-confirmation/${orderId}`);
    } else if (result.status === "TIMEOUT") {
      setPolling(false);
      setErrorMsg(
        "Your payment was received but confirmation is taking longer than expected. " +
        "Please check your email — we'll notify you once the order is confirmed.",
      );
    } else if (result.status === "DECLINED") {
      setPolling(false);
      setErrorMsg("Your card was declined. Please try another card.");
    } else {
      // FAILED / CANCELLED — payment may still have gone through on Stripe side.
      // Show a soft message instead of "try again" to avoid double-charging.
      setPolling(false);
      setErrorMsg(
        "We couldn't confirm your payment status. If your card was charged, " +
        "please check your email or contact support before retrying.",
      );
    }
  }

  if (polling) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <span className="size-8 animate-spin rounded-full border-2 border-sa-border border-t-terra" />
        <p className="text-[14px] text-sa-muted">Confirming your payment…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <PaymentElement />

      {errorMsg ? (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {errorMsg}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className="flex h-11 w-full items-center justify-center gap-2 bg-terra text-[12px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-[#a25e48] disabled:opacity-60"
      >
        {submitting ? (
          <>
            <span className="size-3.5 animate-spin rounded-full border border-white/40 border-t-white" />
            Processing…
          </>
        ) : (
          "Pay Now"
        )}
      </button>

      <p className="text-center text-[11px] text-sa-muted">
        Secured by{" "}
        <span className="font-semibold text-sa-primary">Stripe</span>. Your card details are
        never stored on our servers.
      </p>
    </form>
  );
}

// ─── Outer view — loads Stripe + wraps Elements ───────────────────────────────

export function StripePaymentFormView() {
  const router = useRouter();

  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [missingCtx, setMissingCtx] = useState(false);

  useEffect(() => {
    const secret = getStoredStripeClientSecret();
    const pubKey = getStoredStripePublishableKey();
    const oid = getStoredOrderId();

    if (!secret || !pubKey || !oid) {
      setMissingCtx(true);
      return;
    }

    setClientSecret(secret);
    setOrderId(oid);
    setStripePromise(loadStripe(pubKey));
    setReady(true);
  }, []);

  // ── Missing context ──
  if (missingCtx) {
    return (
      <CheckoutShell step={2}>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
          <p className="text-[15px] text-sa-primary">Session expired. Please start a new order.</p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-[13px] text-terra underline underline-offset-4"
          >
            Return to Home
          </button>
        </div>
      </CheckoutShell>
    );
  }

  // ── Loading Stripe ──
  if (!ready || !stripePromise || !clientSecret || !orderId) {
    return (
      <CheckoutShell step={2}>
        <div className="flex flex-1 items-center justify-center py-20">
          <span className="size-8 animate-spin rounded-full border-2 border-sa-border border-t-terra" />
        </div>
      </CheckoutShell>
    );
  }

  const returnUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/checkout/payment/stripe`;

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#B46E57",
        colorBackground: "#ffffff",
        colorText: "#2c241d",
        colorDanger: "#dc2626",
        fontFamily: "inherit",
        borderRadius: "6px",
      },
    },
  };

  return (
    <CheckoutShell step={2}>
      <div className="flex flex-1 items-start justify-center px-4 py-10 lg:py-14">
        <div className="w-full max-w-lg">

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-[24px] font-bold tracking-tight text-sa-primary">
              Secure Card Payment
            </h1>
            <p className="mt-1 text-[14px] text-sa-muted">
              Your card details are encrypted and never stored on our servers.
            </p>
          </div>

          {/* Card form */}
          <div className="rounded-xl border border-sa-border bg-white px-6 py-6 shadow-sm dark:bg-page">
            <Elements stripe={stripePromise} options={options}>
              <StripeForm orderId={orderId} returnUrl={returnUrl} />
            </Elements>
          </div>

          {/* Cancel */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => router.push("/checkout/payment/cancel")}
              className="text-[13px] text-sa-muted underline underline-offset-4 hover:text-sa-primary"
            >
              Cancel and return
            </button>
          </div>
        </div>
      </div>
    </CheckoutShell>
  );
}
