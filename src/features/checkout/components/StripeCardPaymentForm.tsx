"use client";

import { useEffect, useState } from "react";
import { PaymentElement, useCheckoutElements } from "@stripe/react-stripe-js/checkout";
import { LoaderMark } from "@/components/ui/PageLoading";
import { toE164Phone } from "@/features/auth/api/auth.service";
import { clearPaymentState } from "../utils/checkoutSession";
import {
  checkoutCta,
  checkoutError,
  checkoutLink,
  checkoutNote,
  stripePayCta,
  stripePayElementLoading,
  stripePayState,
  stripePayStateTitle,
  stripePayTrust,
} from "@/styles/checkoutChrome";

function stripeErrorMessage(code?: string, declineCode?: string): string {
  if (declineCode === "insufficient_funds") return "Insufficient funds. Please try another card.";
  if (code === "card_declined" || declineCode === "generic_decline") {
    return "Your card was declined. Please try another card.";
  }
  if (code === "expired_card") return "Your card has expired.";
  if (code === "incorrect_cvc") return "The security code is incorrect.";
  if (code === "incorrect_number" || code === "invalid_number") return "The card number is invalid.";
  if (code === "processing_error") return "A processing error occurred. Please try again.";
  return "Payment failed. Please try another card or contact your bank.";
}

function checkoutConfirmMessage(error: {
  message: string;
  code?: string | null;
  paymentFailed?: { declineCode: string | null };
}): string {
  if (error.code === "paymentFailed") {
    return stripeErrorMessage("card_declined", error.paymentFailed?.declineCode ?? undefined);
  }
  const message = error.message || "";
  if (/customer_email|already set on the Checkout Session/i.test(message)) {
    return "Payment session already has your email. Tap Pay now again, or refresh and try once more.";
  }
  if (/email/i.test(message)) {
    return "Enter your email in delivery details, then tap Pay now.";
  }
  if (/phone_number_collection|phone number/i.test(message)) {
    return "Enter your phone in delivery details, then tap Pay now.";
  }
  return message || "Payment failed. Please try another card or contact your bank.";
}

function readCheckoutControl(name: string): string {
  const form = document.getElementById("checkout-form");
  if (!(form instanceof HTMLFormElement)) return "";
  const field = form.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${name}"]`);
  return field?.value?.trim() || "";
}

async function ignoreIfAlreadyOnSession(run: () => Promise<unknown>) {
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

function resolveContact(explicit: { email?: string | null; name?: string | null; phone?: string | null; country?: string | null }) {
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

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Same Stripe Payment Element as `/checkout/payment/stripe`:
 * accordion, wallets, Pay now, then confirmation.
 */
export function StripeCardPaymentForm({
  orderId,
  email,
  name,
  phone,
  country,
  onNeedOrder,
  cancelHref = "/checkout/payment/cancel",
}: {
  orderId: string;
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  country?: string | null;
  onNeedOrder?: () => void;
  cancelHref?: string;
}) {
  const checkoutState = useCheckoutElements();
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [phase, setPhase] = useState<"idle" | "confirming" | "polling">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [needsRetry, setNeedsRetry] = useState(false);

  async function confirmStripePayment(payingOrderId = orderId) {
    if (checkoutState.type !== "success" || phase !== "idle" || needsRetry) return;
    if (!payingOrderId) {
      onNeedOrder?.();
      return;
    }
    const { checkout } = checkoutState;
    const contact = resolveContact({ email, name, phone, country });
    if (!contact.email.includes("@")) {
      setErrorMsg("Enter your email in delivery details, then tap Pay now.");
      return;
    }
    if (!contact.phone) {
      setErrorMsg("Enter your phone in delivery details, then tap Pay now.");
      return;
    }
    if (!contact.name) {
      setErrorMsg("Enter your name in delivery details, then tap Pay now.");
      return;
    }
    setPhase("confirming");
    setErrorMsg(null);

    try {
      await ignoreIfAlreadyOnSession(() => checkout.updatePhoneNumber(contact.phone));
      await ignoreIfAlreadyOnSession(() => checkout.updateBillingAddress(contact.billingAddress));
      const confirmResult = await checkout.confirm({
        redirect: "if_required",
        phoneNumber: contact.phone,
        billingAddress: contact.billingAddress,
      });
      if (confirmResult.type === "error") {
        setErrorMsg(checkoutConfirmMessage(confirmResult.error));
        setPhase("idle");
        return;
      }
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Payment failed. Please try another card or contact your bank.");
      setPhase("idle");
      return;
    }

    setPhase("polling");
    clearPaymentState();
    window.location.replace(`/order-confirmation/${payingOrderId}`);
  }

  useEffect(() => {
    function onPay(event: Event) {
      const id = (event as CustomEvent<{ orderId?: string }>).detail?.orderId;
      void confirmStripePayment(id || orderId);
    }
    window.addEventListener("sa-inline-pay", onPay);
    return () => window.removeEventListener("sa-inline-pay", onPay);
  });

  return (
    <div className="flex flex-col gap-3">
      {checkoutState.type === "error" ? (
        <p className={checkoutError} role="alert">
          {checkoutConfirmMessage(checkoutState.error)}{" "}
          <a className={checkoutLink} href={cancelHref}>
            choose another way to pay
          </a>
        </p>
      ) : null}

      {phase === "polling" ? (
        <div className={stripePayState} aria-live="polite" aria-busy="true">
          <LoaderMark size={84} />
          <p className={stripePayStateTitle}>Confirming your payment…</p>
          <p className={checkoutNote}>This usually takes a few seconds. Please don’t close this page.</p>
        </div>
      ) : (
        <>
          {!ready && !loadFailed && checkoutState.type !== "error" ? (
            <div className={stripePayState} role="status" aria-live="polite">
              <LoaderMark size={72} />
              <p className={checkoutNote}>Loading secure card form…</p>
            </div>
          ) : null}

          {loadFailed ? (
            <p className={checkoutError} role="alert">
              We couldn’t load the secure card form. Please refresh the page or{" "}
              <a className={checkoutLink} href={cancelHref}>
                choose another way to pay
              </a>
              .
            </p>
          ) : null}

          <div className={ready ? undefined : stripePayElementLoading}>
            <PaymentElement
              options={{
                layout: {
                  type: "accordion",
                  defaultCollapsed: false,
                  radios: "always",
                  spacedAccordionItems: true,
                },
                paymentMethodOrder: ["card", "apple_pay", "google_pay"],
                wallets: { applePay: "auto", googlePay: "auto", link: "never" },
                fields: {
                  billingDetails: {
                    name: "never",
                    email: "never",
                    phone: "never",
                    address: "never",
                  },
                },
              }}
              onReady={() => setReady(true)}
              onLoadError={() => setLoadFailed(true)}
            />
          </div>

          {errorMsg ? (
            <p className={checkoutError} role="alert">
              {errorMsg}
              {needsRetry ? (
                <>
                  {" "}
                  <a className={checkoutLink} href={cancelHref}>
                    Start a new attempt
                  </a>
                </>
              ) : null}
            </p>
          ) : null}
          <button
            type="button"
            className={`${checkoutCta} ${stripePayCta}`}
            disabled={checkoutState.type !== "success" || phase !== "idle" || needsRetry}
            onClick={() => void confirmStripePayment(orderId)}
          >
            <span>{phase === "confirming" ? "Processing…" : "Pay now"}</span>
            <b aria-hidden="true">↗</b>
          </button>
        </>
      )}
      <p className={stripePayTrust}>
        <LockIcon />
        <span>Secured by Stripe — your card details never touch our servers.</span>
      </p>
    </div>
  );
}

export function StripePayLockIcon() {
  return <LockIcon />;
}
