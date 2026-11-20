import { englishTranslator, type Translator } from "@/lib/i18n/messages";
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
  // The plan's shipping amount: 0 → "0" (shown as Free), missing → null (no price shown).
  const trimmed = shippingAmount?.trim() ?? "";
  const fee = Number(trimmed);
  const estimatedFee = trimmed !== "" && Number.isFinite(fee) ? (fee > 0 ? trimmed : "0") : null;
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

export function subscriptionPayToday(
  view: {
    currencyCode: string;
    amount: string;
    shippingAmount: string;
    monthlyTotal: string;
  },
  t: Translator = englishTranslator,
): { subscription: string; shipping: string; payToday: string } {
  const currency = view.currencyCode.trim().toUpperCase();
  const shippingAmount = Number(view.shippingAmount);
  return {
    subscription: `${currency} ${view.amount}`,
    shipping: Number.isFinite(shippingAmount) && shippingAmount > 0 ? `${currency} ${view.shippingAmount}` : t("subs.included"),
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

export function subscriptionCheckoutResultCopy(
  view: {
    paymentState: string;
    status: string;
  },
  t: Translator = englishTranslator,
): string {
  if (subscriptionCheckoutSucceeded(view)) return t("subs.checkout.result.activated");
  if (view.paymentState === "SUCCESS") return t("subs.checkout.result.received");
  if (view.paymentState === "PROCESSING" || view.paymentState === "REQUIRES_CUSTOMER_ACTION") {
    return t("subs.checkout.result.processing");
  }
  if (view.paymentState === "FAILED") return t("subs.checkout.result.failed");
  if (view.paymentState === "RECONCILIATION_REQUIRED") return t("subs.checkout.result.review");
  return t("subs.checkout.result.confirmCard");
}
