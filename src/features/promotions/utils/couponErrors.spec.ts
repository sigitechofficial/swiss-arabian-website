import { describe, expect, it } from "vitest";
import { ApiClientError } from "@/lib/api/apiError";
import { couponErrorMessage } from "./couponErrors";

describe("coupon error copy", () => {
  it("keeps NO_ELIGIBLE_DISCOUNT generic", () => {
    const error = new ApiClientError(422, {
      code: "COUPON_NOT_APPLICABLE",
      context: { reason: "NO_ELIGIBLE_DISCOUNT" },
    });
    expect(couponErrorMessage(error)).toBe("Nothing in your bag qualifies for this code.");
  });

  it("maps method qualification reasons", () => {
    const reason = (name: string) =>
      new ApiClientError(422, {
        code: "COUPON_NOT_APPLICABLE",
        context: { reason: name },
      });
    expect(couponErrorMessage(reason("PAYMENT_METHOD_REQUIRED"))).toBe(
      "Select an eligible payment method at checkout to use this code.",
    );
    expect(couponErrorMessage(reason("SHIPPING_METHOD_REQUIRED"))).toBe(
      "Select an eligible delivery method at checkout to use this code.",
    );
    expect(couponErrorMessage(reason("PAYMENT_METHOD_MISMATCH"))).toBe(
      "This code doesn’t apply to the selected payment method.",
    );
    expect(couponErrorMessage(reason("SHIPPING_METHOD_MISMATCH"))).toBe(
      "This code doesn’t apply to the selected delivery method.",
    );
    expect(couponErrorMessage(reason("FUTURE_REASON"))).toBe("This code doesn’t apply to your bag.");
  });

  it("prefers remainingAmount on a minimum-order coupon error", () => {
    const error = new ApiClientError(422, {
      code: "COUPON_NOT_APPLICABLE",
      context: { reason: "MIN_ORDER", remainingAmount: "75.00", minOrderAmount: "300.00" },
    });
    expect(couponErrorMessage(error)).toBe("Spend AED 75.00 to use this code.");
  });

  it("maps Backend Loyalty coupon reasons without naming the required tier", () => {
    const reason = (name: string) =>
      new ApiClientError(422, {
        code: "COUPON_NOT_APPLICABLE",
        context: { reason: name },
      });
    expect(couponErrorMessage(reason("LOYALTY_TIER_REQUIRED"))).toBe(
      "This code isn’t available with your current Rewards status.",
    );
    expect(couponErrorMessage(reason("LOYALTY_TIER_MISMATCH"))).toBe(
      "This code isn’t available with your current Rewards status.",
    );
    expect(couponErrorMessage(reason("LOYALTY_NOT_AVAILABLE"))).toBe(
      "This code isn’t available with your current Rewards status.",
    );
    expect(couponErrorMessage(reason("LOYALTY_MEMBER_REQUIRED"))).toBe(
      "This code is for Rewards members.",
    );
    expect(couponErrorMessage(reason("NOT_A_LOYALTY_MEMBER"))).toBe(
      "This code is for Rewards members.",
    );
    expect(couponErrorMessage(reason("LOYALTY_TIER_REQUIRED"))).not.toMatch(/Gold|Silver|tier code/i);
  });

  it("uses a safe fallback for an unknown code", () => {
    const error = new ApiClientError(422, {
      code: "COUPON_FUTURE_RULE",
      message: "internal target pool mismatch",
    });
    expect(couponErrorMessage(error)).toBe("We couldn’t apply that code. Please try again.");
    expect(couponErrorMessage(new Error("nope"))).toBe(
      "We couldn’t apply that code. Please try again.",
    );
  });
});
