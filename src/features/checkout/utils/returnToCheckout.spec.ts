import { afterEach, describe, expect, it } from "vitest";
import { clearDeclinedPayments, markDeclined, offeredPaymentMethods } from "./returnToCheckout";

const tabby = { providerCode: "tabby", methodCode: "tabby_installments" };
const tamara = { providerCode: "tamara", methodCode: "tamara_installments" };
const card = { providerCode: "stripe", methodCode: "stripe_card" };

describe("offeredPaymentMethods", () => {
  afterEach(() => clearDeclinedPayments());

  it("offers everything for a bag nobody declined", () => {
    expect(offeredPaymentMethods([tabby, tamara, card], "cart-1")).toEqual([tabby, tamara, card]);
  });

  it("drops only the provider that declined this bag", () => {
    markDeclined("tamara", "cart-1");
    expect(offeredPaymentMethods([tabby, tamara, card], "cart-1")).toEqual([tabby, card]);
    markDeclined("tabby", "cart-1");
    expect(offeredPaymentMethods([tabby, tamara, card], "cart-1")).toEqual([card]);
    // Another bag is not affected.
    expect(offeredPaymentMethods([tabby, tamara, card], "cart-2")).toEqual([tabby, tamara, card]);
  });

  it("offers both again once the order is placed", () => {
    markDeclined("tabby", "cart-1");
    markDeclined("tamara", "cart-1");
    clearDeclinedPayments();
    expect(offeredPaymentMethods([tabby, tamara, card], "cart-1")).toEqual([tabby, tamara, card]);
  });
});
