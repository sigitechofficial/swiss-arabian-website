"use client";

import { useState } from "react";
import { useCheckoutElements } from "@stripe/react-stripe-js/checkout";
import type { StripeExpressCheckoutElementConfirmEvent } from "@stripe/stripe-js";
import { clearPaymentState } from "../utils/checkoutSession";
import { checkoutHref } from "../utils/checkoutLocale";
import {
  confirmEmail,
  ignoreIfAlreadyOnSession,
  resolveStripeContact,
  stripeConfirmError,
  type StripeContact,
  type StripePayError,
} from "./useStripeCardPayment";

/**
 * Apple Pay / Google Pay through Stripe's Express Checkout Element (inside
 * `CheckoutElementsProvider`): sets the contact on the session, confirms
 * with the wallet event, then opens the order confirmation in the shopper's
 * language. With no order yet, `onNeedOrder` places it first. The view
 * renders the element and words `error` (a code, like card payments).
 */
export function useStripeWalletPayment({
  orderId,
  onNeedOrder,
  ...contactProps
}: StripeContact & { orderId: string | null | undefined; onNeedOrder?: () => void }) {
  const checkoutState = useCheckoutElements();
  const [error, setError] = useState<StripePayError | null>(null);
  const [busy, setBusy] = useState(false);

  async function pay(event: StripeExpressCheckoutElementConfirmEvent) {
    if (checkoutState.type !== "success" || busy) return;
    if (!orderId) {
      onNeedOrder?.();
      return;
    }
    const { checkout } = checkoutState;
    const contact = resolveStripeContact(contactProps);
    setBusy(true);
    setError(null);
    try {
      if (contact.phone) {
        await ignoreIfAlreadyOnSession(() => checkout.updatePhoneNumber(contact.phone));
      }
      if (contact.billingAddress.name) {
        await ignoreIfAlreadyOnSession(() => checkout.updateBillingAddress(contact.billingAddress));
      }
      const confirmResult = await checkout.confirm({
        redirect: "if_required",
        expressCheckoutConfirmEvent: event,
        ...confirmEmail(checkout, contact.email),
        ...(contact.phone ? { phoneNumber: contact.phone } : {}),
        billingAddress: contact.billingAddress,
      });
      if (confirmResult.type === "error") {
        setError(stripeConfirmError(confirmResult.error));
        setBusy(false);
        return;
      }
    } catch (caught) {
      setError(caught instanceof Error ? { code: "message", message: caught.message } : { code: "failed" });
      setBusy(false);
      return;
    }
    clearPaymentState();
    window.location.replace(checkoutHref(`/order-confirmation/${orderId}`));
  }

  return { error, busy, pay };
}
