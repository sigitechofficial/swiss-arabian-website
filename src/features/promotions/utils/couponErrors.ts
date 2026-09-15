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
  SCOPE: "This code doesn’t apply to the items in your bag.",
  CHANNEL: "This code isn’t valid on this site.",
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
      const min = typeof ctx.minOrderAmount === "string" ? ctx.minOrderAmount : "";
      if (min) {
        return `Spend ${formatMoney(Number(min), currency)} to use this code.`;
      }
      return "Your bag doesn’t meet the minimum for this code.";
    }
    return REASON_COPY[reason] ?? "This code doesn’t apply to your bag.";
  }

  if (error.code && CODE_COPY[error.code]) return CODE_COPY[error.code];
  return error.message || "We couldn’t apply that code. Please try again.";
}
