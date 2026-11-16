"use client";

import { useMemo } from "react";
import type { StripeCheckoutElementsSdkOptions } from "@stripe/stripe-js";
import { getStripe } from "@/lib/stripe/getStripe";
import type { OrderResponse } from "../types/checkout";
import { stripeCheckoutElementsOptions, type StripeElementsLook } from "../utils/stripeCheckoutAppearance";

/** Stripe.js for the publishable key the initiate response returned (never hard-coded). */
export function useStripePromise(publishableKey: string | null) {
  return useMemo(() => (publishableKey ? getStripe(publishableKey) : null), [publishableKey]);
}

/**
 * Stripe Checkout Elements options for the card-form page: the session's
 * client secret, the order's customer as defaults, and the brand's look.
 */
export function useStripeSessionOptions(
  clientSecret: string | null,
  order: OrderResponse | undefined,
  look?: StripeElementsLook,
): StripeCheckoutElementsSdkOptions | null {
  const shipping = order?.addresses?.find((address) => address.addressType === "SHIPPING");
  const billingCountry = shipping?.countryCode ?? null;
  const customerName = order?.customer?.fullName ?? shipping?.fullName ?? null;
  const customerEmail = order?.customer?.email ?? null;
  const customerPhone = typeof order?.metadata?.customerPhone === "string" ? order.metadata.customerPhone : null;
  return useMemo(() => {
    if (!clientSecret || typeof window === "undefined") return null;
    return stripeCheckoutElementsOptions(
      clientSecret,
      { billingCountry, customerName, email: customerEmail, phoneNumber: customerPhone },
      look,
    );
  }, [billingCountry, clientSecret, customerEmail, customerName, customerPhone, look]);
}
