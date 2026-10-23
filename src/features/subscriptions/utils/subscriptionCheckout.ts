import type { BeginSubscriptionCheckoutBody, SubscriptionCheckoutView } from "../api/subscription.api";
import { selectTestPublishableKey } from "./cardSetup";

export function subscriptionCheckoutPath(planCode: string): string {
  return `/subscriptions/${encodeURIComponent(planCode)}/checkout`;
}

export function beginCheckoutBody(input: {
  zoneCode: string;
  consentTextVersion: string;
  recurringUseAccepted: boolean;
  deliveryMethodCode: string;
}): BeginSubscriptionCheckoutBody | null {
  const zoneCode = input.zoneCode.trim();
  const consentTextVersion = input.consentTextVersion.trim();
  const deliveryMethodCode = input.deliveryMethodCode.trim();
  if (input.recurringUseAccepted !== true || !zoneCode || !consentTextVersion || !deliveryMethodCode) return null;
  return { zoneCode, recurringUseAccepted: true, consentTextVersion, deliveryMethodCode };
}

export function subscriptionDeliveryChoices<T extends { estimatedFee: string | null }>(
  methods: T[],
  shippingAmount: string | null | undefined,
): T[] {
  const fee = Number(shippingAmount);
  const estimatedFee = Number.isFinite(fee) && fee > 0 ? shippingAmount!.trim() : null;
  return methods.map((method) => ({ ...method, estimatedFee }));
}

/** Refresh reads first. POST only when that read has no PaymentIntent yet. */
export function shouldBeginSubscriptionCheckout(input: {
  alreadyPosted: boolean;
  view: SubscriptionCheckoutView | null;
}): boolean {
  if (input.alreadyPosted || !input.view) return false;
  if (input.view.clientSecret) return false;
  if (input.view.paymentState !== "NOT_STARTED") return false;
  return input.view.status !== "ACTIVE";
}

export function subscriptionCheckoutSucceeded(view: {
  paymentState: string;
  status: string;
}): boolean {
  return view.paymentState === "SUCCESS" && view.status === "ACTIVE";
}

export function subscriptionPayToday(view: {
  currencyCode: string;
  amount: string;
  shippingAmount: string;
  monthlyTotal: string;
}): { subscription: string; shipping: string; payToday: string } {
  const currency = view.currencyCode.trim().toUpperCase();
  const shippingAmount = Number(view.shippingAmount);
  return {
    subscription: `${currency} ${view.amount}`,
    shipping: Number.isFinite(shippingAmount) && shippingAmount > 0 ? `${currency} ${view.shippingAmount}` : "Included",
    payToday: `${currency} ${view.monthlyTotal}`,
  };
}

export function lockedCheckoutAddress(agreementAddressId: string | null | undefined): {
  locked: boolean;
  addressId: string | null;
} {
  const addressId = agreementAddressId?.trim() || null;
  return addressId ? { locked: true, addressId } : { locked: false, addressId: null };
}

export function subscriptionCheckoutTestKey(publishableKey: string | null | undefined): string | null {
  return selectTestPublishableKey(publishableKey);
}

export function subscriptionCheckoutResultCopy(view: {
  paymentState: string;
  status: string;
}): string {
  if (subscriptionCheckoutSucceeded(view)) {
    return "Subscription activated. Fulfillment is not confirmed from this page.";
  }
  if (view.paymentState === "SUCCESS") {
    return "Payment received. Future billing is not active yet, and no further charge was started.";
  }
  if (view.paymentState === "PROCESSING" || view.paymentState === "REQUIRES_CUSTOMER_ACTION") {
    return "Payment is still processing. This page will not start another charge.";
  }
  if (view.paymentState === "FAILED") return "Payment failed. No subscription charge was repeated.";
  if (view.paymentState === "RECONCILIATION_REQUIRED") {
    return "Payment needs support review. No further charge was started.";
  }
  return "Confirm the card to pay the saved monthly total.";
}
