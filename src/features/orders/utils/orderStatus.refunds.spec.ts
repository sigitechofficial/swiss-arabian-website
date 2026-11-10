import { describe, expect, it } from "vitest";
import { needsPayment, orderPrimaryAction } from "./orderStatus";

describe("refunded orders never ask for payment again", () => {
  it.each(["PARTIALLY_REFUNDED", "REFUNDED", "PAID", "AUTHORIZED"])("%s → no Pay now", (pay) => {
    expect(needsPayment("PAYMENT_PENDING", pay)).toBe(false);
    expect(orderPrimaryAction("PAYMENT_PENDING", pay)).toBe("view");
  });

  it("an unpaid order still offers Pay now", () => {
    expect(needsPayment("PAYMENT_PENDING", "PENDING")).toBe(true);
  });
});
