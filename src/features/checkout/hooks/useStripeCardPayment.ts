"use client";

import { useEffect, useState } from "react";
import { useCheckoutElements } from "@stripe/react-stripe-js/checkout";
import { toE164Phone } from "@/features/auth/api/auth.service";
import { clearPaymentState } from "../utils/checkoutSession";
import { checkoutHref } from "../utils/checkoutLocale";

/**
 * Why a Stripe card payment did not go through. Each brand words the codes;
 * `message` carries the provider's own sentence when there is no code for it.
 */
export type StripePayError =
  | {
      code:
        | "insufficient_funds"
        | "card_declined"
        | "expired_card"
        | "incorrect_cvc"
        | "invalid_number"
        | "processing_error"
        | "failed"
        | "session_has_email"
        | "needs_email"
        | "needs_phone"
        | "needs_name";
    }
  | { code: "message"; message: string };

function stripeDeclineError(code?: string, declineCode?: string): StripePayError {
  if (declineCode === "insufficient_funds") return { code: "insufficient_funds" };
  if (code === "card_declined" || declineCode === "generic_decline") return { code: "card_declined" };
  if (code === "expired_card") return { code: "expired_card" };
  if (code === "incorrect_cvc") return { code: "incorrect_cvc" };
  if (code === "incorrect_number" || code === "invalid_number") return { code: "invalid_number" };
  if (code === "processing_error") return { code: "processing_error" };
  return { code: "failed" };
}

/** A Stripe Checkout confirm / load error as a code. */
export function stripeConfirmError(error: {
  message: string;
  code?: string | null;
  paymentFailed?: { declineCode: string | null };
}): StripePayError {
  if (error.code === "paymentFailed") {
    return stripeDeclineError("card_declined", error.paymentFailed?.declineCode ?? undefined);
  }
  const message = error.message || "";
  if (/customer_email|already set on the Checkout Session/i.test(message)) return { code: "session_has_email" };
  if (/email/i.test(message)) return { code: "needs_email" };
  if (/phone_number_collection|phone number/i.test(message)) return { code: "needs_phone" };
  return message ? { code: "message", message } : { code: "failed" };
}

/** Swiss Arabian's sentences (also the default for any brand without its own). */
export function stripePayErrorText(error: StripePayError): string {
  switch (error.code) {
    case "insufficient_funds":
      return "Insufficient funds. Please try another card.";
    case "card_declined":
      return "Your card was declined. Please try another card.";
    case "expired_card":
      return "Your card has expired.";
    case "incorrect_cvc":
      return "The security code is incorrect.";
    case "invalid_number":
      return "The card number is invalid.";
    case "processing_error":
      return "A processing error occurred. Please try again.";
    case "session_has_email":
      return "Payment session already has your email. Tap Pay now again, or refresh and try once more.";
    case "needs_email":
      return "Enter your email in delivery details, then tap Pay now.";
    case "needs_phone":
      return "Enter your phone in delivery details, then tap Pay now.";
    case "needs_name":
      return "Enter your name in delivery details, then tap Pay now.";
    case "message":
      return error.message;
    default:
      return "Payment failed. Please try another card or contact your bank.";
  }
}

function readCheckoutControl(name: string): string {
  const form = document.getElementById("checkout-form");
  if (!(form instanceof HTMLFormElement)) return "";
  const field = form.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${name}"]`);
  return field?.value?.trim() || "";
}

/**
 * The email to hand `confirm()`: only when the session has none. A session
 * created with the customer's email rejects a second one.
 */
export function confirmEmail(checkout: { email?: string | null }, email: string): { email?: string } {
  if (!email.includes("@")) return {};
  return checkout.email ? {} : { email };
}

export async function ignoreIfAlreadyOnSession(run: () => Promise<unknown>) {
  try {
    await run();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/already set|cannot update the (email|phone)/i.test(message)) throw error;
  }
}

function toStripePhone(value?: string | null): string {
  const trimmed = value?.trim() || "";
  if (!trimmed.startsWith("+")) return "";
  const e164 = toE164Phone(trimmed);
  return e164.startsWith("+") && e164.replace(/\D/g, "").length >= 8 ? e164 : "";
}

export type StripeContact = { email?: string | null; name?: string | null; phone?: string | null; country?: string | null };

/** Contact and billing address for Stripe: the order's, else the checkout form's fields. */
export function resolveStripeContact(explicit: StripeContact) {
  const email = explicit.email?.trim() || readCheckoutControl("email");
  const name = explicit.name?.trim() || readCheckoutControl("delName");
  const phone = toStripePhone(explicit.phone);
  const country = (explicit.country?.trim() || "AE").toUpperCase();
  const line1 = readCheckoutControl("delAddr1");
  const city = readCheckoutControl("delCity");
  const billingAddress = {
    name: name || undefined,
    address: {
      country,
      ...(line1 ? { line1 } : {}),
      ...(readCheckoutControl("delAddr2") ? { line2: readCheckoutControl("delAddr2") } : {}),
      ...(city ? { city } : {}),
      ...(readCheckoutControl("delEmirate") ? { state: readCheckoutControl("delEmirate") } : {}),
      postal_code: readCheckoutControl("delPostal") || "00000",
    },
  };
  return { email, name, phone, billingAddress };
}

/**
 * Stripe Payment Element card payment (inside `CheckoutElementsProvider`):
 * checks the contact, confirms with Stripe, then opens the order confirmation
 * in the shopper's language. Also pays on the checkout page's `sa-inline-pay`
 * event (the order id in its detail). The view renders the Payment Element and
 * reports `onReady` / `onLoadError`.
 */
export function useStripeCardPayment({
  orderId,
  onNeedOrder,
  ...contactProps
}: StripeContact & { orderId: string; onNeedOrder?: () => void }) {
  const checkoutState = useCheckoutElements();
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [phase, setPhase] = useState<"idle" | "confirming" | "polling">("idle");
  const [error, setError] = useState<StripePayError | null>(null);

  async function confirm(payingOrderId = orderId) {
    if (checkoutState.type !== "success" || phase !== "idle") return;
    if (!payingOrderId) {
      onNeedOrder?.();
      return;
    }
    const { checkout } = checkoutState;
    const contact = resolveStripeContact(contactProps);
    if (!contact.email.includes("@")) {
      setError({ code: "needs_email" });
      return;
    }
    if (!contact.phone) {
      setError({ code: "needs_phone" });
      return;
    }
    if (!contact.name) {
      setError({ code: "needs_name" });
      return;
    }
    setPhase("confirming");
    setError(null);

    try {
      await ignoreIfAlreadyOnSession(() => checkout.updatePhoneNumber(contact.phone));
      await ignoreIfAlreadyOnSession(() => checkout.updateBillingAddress(contact.billingAddress));
      const confirmResult = await checkout.confirm({
        redirect: "if_required",
        ...confirmEmail(checkout, contact.email),
        phoneNumber: contact.phone,
        billingAddress: contact.billingAddress,
      });
      if (confirmResult.type === "error") {
        setError(stripeConfirmError(confirmResult.error));
        setPhase("idle");
        return;
      }
    } catch (caught) {
      setError(caught instanceof Error ? { code: "message", message: caught.message } : { code: "failed" });
      setPhase("idle");
      return;
    }

    setPhase("polling");
    clearPaymentState();
    window.location.replace(checkoutHref(`/order-confirmation/${payingOrderId}`));
  }

  useEffect(() => {
    function onPay(event: Event) {
      const id = (event as CustomEvent<{ orderId?: string }>).detail?.orderId;
      void confirm(id || orderId);
    }
    window.addEventListener("sa-inline-pay", onPay);
    return () => window.removeEventListener("sa-inline-pay", onPay);
  });

  return {
    checkoutState,
    /** the session could not be loaded (expired, provider error) */
    sessionError: checkoutState.type === "error" ? stripeConfirmError(checkoutState.error) : null,
    ready,
    loadFailed,
    onReady: () => setReady(true),
    onLoadError: () => setLoadFailed(true),
    phase,
    error,
    canPay: checkoutState.type === "success" && phase === "idle",
    confirm,
  };
}
