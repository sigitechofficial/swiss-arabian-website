import { describe, expect, it } from "vitest";
import { stripeConfirmError, stripePayErrorText } from "./useStripeCardPayment";

describe("Stripe card errors as codes", () => {
  it("maps declines, session and contact problems to codes", () => {
    expect(stripeConfirmError({ message: "", code: "paymentFailed", paymentFailed: { declineCode: "insufficient_funds" } })).toEqual({ code: "insufficient_funds" });
    expect(stripeConfirmError({ message: "", code: "paymentFailed", paymentFailed: { declineCode: "do_not_honor" } })).toEqual({ code: "card_declined" });
    expect(stripeConfirmError({ message: "customer_email is already set on the Checkout Session" })).toEqual({ code: "session_has_email" });
    expect(stripeConfirmError({ message: "Missing email" })).toEqual({ code: "needs_email" });
    expect(stripeConfirmError({ message: "phone_number_collection is enabled" })).toEqual({ code: "needs_phone" });
    expect(stripeConfirmError({ message: "Something odd" })).toEqual({ code: "message", message: "Something odd" });
    expect(stripeConfirmError({ message: "" })).toEqual({ code: "failed" });
  });

  it("keeps Swiss Arabian's sentences", () => {
    expect(stripePayErrorText({ code: "card_declined" })).toBe("Your card was declined. Please try another card.");
    expect(stripePayErrorText({ code: "needs_phone" })).toBe("Enter your phone in delivery details, then tap Pay now.");
    expect(stripePayErrorText({ code: "message", message: "Provider says no" })).toBe("Provider says no");
    expect(stripePayErrorText({ code: "failed" })).toBe("Payment failed. Please try another card or contact your bank.");
  });
});
