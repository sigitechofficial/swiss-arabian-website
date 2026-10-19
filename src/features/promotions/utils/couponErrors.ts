import { ApiClientError } from "@/lib/api/apiError";
import { formatMoney } from "@/features/home/utils/formatMoney";

const CODE_COPY: Record<string, string> = {
  COUPON_NOT_FOUND: "That code isn’t valid.",
  COUPON_INACTIVE: "That code isn’t available right now.",
  COUPON_NOT_STARTED: "That code isn’t active yet.",
  COUPON_EXPIRED: "That code has expired.",
  COUPON_USAGE_LIMIT_REACHED: "This code has reached its usage limit.",
  COUPON_ALREADY_USED_BY_CUSTOMER: "You’ve already used this code.",
  COUPON_REQUIRES_LOGIN: "Sign in to use this code.",
  PRICING_CHANGED: "Prices have changed. We’ve refreshed your bag — check the total before placing the order.",
  REDEMPTION_EXPIRED: "That offer expired. Apply the code again.",
};

const REASON_COPY: Record<string, string> = {
  BRAND_ZONE_MISMATCH: "This code isn’t valid in your region.",
  CURRENCY: "This code isn’t valid for this currency.",
  FIRST_ORDER_ONLY: "This code is for a first order.",
  CUSTOMER_MISMATCH: "This code isn’t for this account.",
  NO_ELIGIBLE_DISCOUNT: "Nothing in your bag qualifies for this code.",
  LOYALTY_NOT_AVAILABLE: "This code isn’t available with your current Rewards status.",
  LOYALTY_MEMBER_REQUIRED: "This code is for Rewards members.",
  LOYALTY_TIER_REQUIRED: "This code isn’t available with your current Rewards status.",
  LOYALTY_TIER_MISMATCH: "This code isn’t available with your current Rewards status.",
  NOT_A_LOYALTY_MEMBER: "This code is for Rewards members.",
  CUSTOMER_TIER: "This code isn’t available with your current Rewards status.",
  REQUIRED_TIER: "This code isn’t available with your current Rewards status.",
  SCOPE: "This code doesn’t apply to the items in your bag.",
  CHANNEL: "This code isn’t valid on this site.",
  PAYMENT_METHOD_REQUIRED: "Select an eligible payment method at checkout to use this code.",
  SHIPPING_METHOD_REQUIRED: "Select an eligible delivery method at checkout to use this code.",
  PAYMENT_METHOD_MISMATCH: "This code doesn’t apply to the selected payment method.",
  SHIPPING_METHOD_MISMATCH: "This code doesn’t apply to the selected delivery method.",
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export function couponErrorContext(error: unknown): Record<string, unknown> {
  if (!(error instanceof ApiClientError)) return {};
  return asRecord(error.context) ?? asRecord(error.details) ?? {};
}

export function couponErrorMessage(error: unknown, currency = "AED"): string {
  if (!(error instanceof ApiClientError)) {
    return "We couldn’t apply that code. Please try again.";
  }

  if (error.code === "COUPON_NOT_APPLICABLE") {
    const ctx = couponErrorContext(error);
    const reason = typeof ctx.reason === "string" ? ctx.reason : "";
    if (reason === "MIN_ORDER") {
      const remaining = typeof ctx.remainingAmount === "string" ? ctx.remainingAmount : "";
      const min = typeof ctx.minOrderAmount === "string" ? ctx.minOrderAmount : "";
      const amount = remaining.trim() || min.trim();
      if (amount) {
        return `Spend ${formatMoney(Number(amount), currency)} to use this code.`;
      }
      return "Your bag doesn’t meet the minimum for this code.";
    }
    return REASON_COPY[reason] ?? "This code doesn’t apply to your bag.";
  }

  if (error.code && REASON_COPY[error.code]) return REASON_COPY[error.code];
  if (error.code && CODE_COPY[error.code]) return CODE_COPY[error.code];
  return "We couldn’t apply that code. Please try again.";
}
