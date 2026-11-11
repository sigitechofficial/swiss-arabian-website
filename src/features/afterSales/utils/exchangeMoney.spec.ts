import { describe, expect, it } from "vitest";
import type { ExchangeMoneyView } from "../types/afterSales";
import {
  exchangeMoneyCopy,
  exchangePaymentReturnUrl,
  hasExchangePaymentReturn,
  isReturningFromExchangePayment,
} from "./exchangeMoney";

const base: ExchangeMoneyView = {
  currencyCode: "AED",
  additionalPaymentRequired: false,
  refundDifferenceRequired: false,
  customerPayableAmount: "0.00",
  refundableDifferenceAmount: "0.00",
  action: "NONE",
};

describe("exchangeMoneyCopy", () => {
  it("shows nothing for an even swap", () => {
    expect(exchangeMoneyCopy(base)).toBeNull();
  });

  it("offers Pay with the amount when the customer owes the difference", () => {
    const copy = exchangeMoneyCopy({
      ...base,
      additionalPaymentRequired: true,
      customerPayableAmount: "40.00",
      action: "PAY_DIFFERENCE",
    });
    expect(copy).toMatchObject({ canPay: true, amount: "40.00" });
  });

  it("keeps Pay available while a session exists but its link is not ready", () => {
    expect(
      exchangeMoneyCopy({ ...base, customerPayableAmount: "40.00", action: "AWAITING_PAYMENT" })?.canPay,
    ).toBe(true);
  });

  it("never offers Pay when a refund is due or the difference is already paid", () => {
    for (const action of ["REFUND_PENDING", "REFUND_COMPLETE", "PAYMENT_COMPLETE", "CONTACT_SUPPORT"] as const) {
      const copy = exchangeMoneyCopy({
        ...base,
        customerPayableAmount: "40.00",
        refundableDifferenceAmount: "130.00",
        action,
      });
      expect(copy?.canPay).toBe(false);
    }
    expect(
      exchangeMoneyCopy({ ...base, refundableDifferenceAmount: "130.00", action: "REFUND_PENDING" })?.amount,
    ).toBe("130.00");
  });
});

describe("exchange payment return address", () => {
  const location = { origin: "https://shop.example", pathname: "/track/UAE-1" };

  it("returns to the same page and leaves the page's own query out (no tracking token to the provider)", () => {
    expect(exchangePaymentReturnUrl("ex-1", location)).toBe(
      "https://shop.example/track/UAE-1?exchangePayment=ex-1",
    );
  });

  it("recognises the return for the right exchange only", () => {
    const search = "?exchangePayment=ex-1&result=success&payment_id=p1";
    expect(isReturningFromExchangePayment("ex-1", search)).toBe(true);
    expect(isReturningFromExchangePayment("ex-2", search)).toBe(false);
    expect(hasExchangePaymentReturn(search)).toBe(true);
    expect(hasExchangePaymentReturn("?paid=1")).toBe(false);
  });
});
