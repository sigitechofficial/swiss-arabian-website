import { describe, expect, it } from "vitest";
import ar from "@/messages/ar.json";
import { ApiClientError } from "@/lib/api/apiError";
import { createTranslator } from "@/lib/i18n/messages";
import { couponErrorMessage } from "./couponErrors";

describe("coupon error copy", () => {
  it("shows the server's wording of the reason (already in the page's language)", () => {
    const error = new ApiClientError(422, {
      code: "COUPON_NOT_APPLICABLE_PAYMENT_METHOD_REQUIRED",
      message: "Choose an eligible payment method at checkout to use this code.",
      context: { reason: "PAYMENT_METHOD_REQUIRED" },
    });
    expect(couponErrorMessage(error)).toBe("Choose an eligible payment method at checkout to use this code.");
  });

  it("says how much more to spend on a minimum-order code", () => {
    const error = new ApiClientError(422, {
      code: "COUPON_NOT_APPLICABLE_MIN_ORDER",
      message: "Add more to your bag to use this code.",
      context: { reason: "MIN_ORDER", remainingAmount: "75.00", minOrderAmount: "300.00" },
    });
    expect(couponErrorMessage(error)).toBe("Spend AED 75.00 to use this code.");
    expect(couponErrorMessage(error, "SAR", createTranslator("ar", ar))).toBe("أنفق SAR 75.00 لاستخدام هذا الرمز.");
  });

  it("without the amount, keeps the server's wording", () => {
    const error = new ApiClientError(422, {
      code: "COUPON_NOT_APPLICABLE_MIN_ORDER",
      message: "Add more to your bag to use this code.",
    });
    expect(couponErrorMessage(error)).toBe("Add more to your bag to use this code.");
  });

  it("never shows raw text: no server sentence or not an API error → the shop's fallback", () => {
    expect(couponErrorMessage(new ApiClientError(502, "<html>Bad gateway</html>"))).toBe(
      "We couldn’t apply that code. Please try again.",
    );
    expect(couponErrorMessage(new Error("nope"))).toBe("We couldn’t apply that code. Please try again.");
  });
});
