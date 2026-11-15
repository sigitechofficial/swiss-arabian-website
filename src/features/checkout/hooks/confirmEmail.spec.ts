import { describe, expect, it } from "vitest";
import { confirmEmail } from "./useStripeCardPayment";

describe("confirmEmail", () => {
  it("passes the shopper's email when the Stripe session has none", () => {
    expect(confirmEmail({ email: null }, "a@b.co")).toEqual({ email: "a@b.co" });
  });
  it("leaves it out when the session already has an email", () => {
    expect(confirmEmail({ email: "x@y.co" }, "a@b.co")).toEqual({});
  });
  it("leaves out an invalid email", () => {
    expect(confirmEmail({ email: null }, "")).toEqual({});
  });
});
