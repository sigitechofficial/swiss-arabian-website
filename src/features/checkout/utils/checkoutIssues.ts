import { ApiClientError } from "@/lib/api/apiError";
import type { CheckoutValidationIssue } from "../types/checkout";

/** `issueType` → shopper copy. Guide §4.8 types first, then codes the reference observed live. */
const ISSUE_MESSAGES: Record<string, string> = {
  ITEM_NOT_SELLABLE: "One of your items is no longer available. Please review your bag.",
  ITEM_PRICE_MISSING: "One of your items doesn’t have a price right now. Please review your bag.",
  ITEM_INSUFFICIENT_INVENTORY: "One of your items is out of stock. Please review your bag.",
  ITEM_PRICE_CHANGED: "Prices have been updated since you added these items.",
  ADDRESS_MISSING: "Please enter a delivery address.",
  DELIVERY_METHOD_MISSING: "Choose a shipping method to continue.",
  PAYMENT_METHOD_MISSING: "Choose a payment method to continue.",
  PRICE_MISSING: "One of your items doesn’t have a price right now. Please review your bag.",
  PRODUCT_NOT_SELLABLE: "One of your items is no longer available. Please review your bag.",
  PRODUCT_NOT_VISIBLE: "One of your items isn’t available in your region.",
  INSUFFICIENT_INVENTORY: "One of your items is out of stock. Please review your bag.",
  INVENTORY_MISSING: "One of your items has no available stock.",
  VARIANT_INACTIVE: "One of your items is no longer sold. Please remove it from your bag.",
  CURRENCY_MISMATCH: "Your bag’s currency changed. Please refresh and try again.",
  ADDRESS_INVALID: "Your delivery address looks incomplete. Please check it.",
  PAYMENT_METHOD_UNAVAILABLE: "That payment method isn’t available. Please choose another.",
  DELIVERY_METHOD_UNAVAILABLE: "That shipping method isn’t available. Please choose another.",
  MANUAL_REVIEW_REQUIRED: "Your order needs a manual review. Please contact us to complete it.",
};

/** Envelope `error.code` → shopper copy. */
const ERROR_CODE_MESSAGES: Record<string, string> = {
  CHECKOUT_CART_EMPTY: "Your bag is empty.",
  CHECKOUT_NOT_FOUND: "Your checkout session has ended. Please try again.",
  CHECKOUT_SESSION_NOT_ACTIVE: "Your checkout session has expired. Please try again.",
  CHECKOUT_ADDRESS_INPUT_REQUIRED: "Please enter a delivery address.",
  CHECKOUT_BILLING_REQUIRES_SHIPPING:
    "Add a delivery address before using it for billing.",
  CHECKOUT_DELIVERY_METHOD_UNAVAILABLE:
    "That shipping method isn’t available for this order. Please choose another.",
  CHECKOUT_PAYMENT_METHOD_UNAVAILABLE:
    "That payment method isn’t available for this order. Please choose another.",
  BUSINESS_RULE_FAILED:
    "We couldn’t place your order. Please review your details and try again.",
  ORDER_NOT_PAYABLE: "This order can’t be paid — it may already be paid or cancelled.",
  PAYMENT_METHOD_VALIDATION_FAILED:
    "That payment method is unavailable. Please refresh and try again.",
  PRICING_CHANGED:
    "Prices have changed. We’ve refreshed your bag — check the total before placing the order.",
  REDEMPTION_EXPIRED: "That offer expired. Apply the code again.",
  FORBIDDEN: "This checkout belongs to another session. Please start again from your bag.",
};

const GENERIC = "Something went wrong. Please try again.";

function isError(issue: CheckoutValidationIssue): boolean {
  return (issue.severity ?? "").toUpperCase() === "ERROR";
}

function issueCopy(issue: CheckoutValidationIssue): string {
  return (
    ISSUE_MESSAGES[issue.issueType] ??
    (issue.code ? ISSUE_MESSAGES[issue.code] : undefined) ??
    issue.message ??
    GENERIC
  );
}

/** The one message to show when validation blocks placement. */
export function checkoutIssueMessage(issues: CheckoutValidationIssue[] | undefined): string {
  const list = issues ?? [];
  const blocking = list.find(isError) ?? list[0];
  return blocking
    ? issueCopy(blocking)
    : "Some details need attention before we can place your order.";
}

/** Non-blocking notices (e.g. price changed) — shown, but checkout proceeds. */
export function checkoutWarningMessages(
  issues: CheckoutValidationIssue[] | undefined,
): string[] {
  const warnings = (issues ?? []).filter(
    (i) => (i.severity ?? "").toUpperCase() === "WARNING",
  );
  return [...new Set(warnings.map(issueCopy))];
}

export function checkoutErrorMessage(error: unknown, fallback = GENERIC): string {
  if (error instanceof ApiClientError) {
    return (error.code && ERROR_CODE_MESSAGES[error.code]) || error.message || fallback;
  }
  if (error instanceof TypeError) {
    return "We couldn’t reach the store. Check your connection and try again.";
  }
  return fallback;
}
