import { describe, expect, it } from "vitest";
import type { SapilTranslator } from "../../i18n/SapilCopy";
import type { SapilMoney } from "../commerce/shared";
import { orderTenders } from "./orderParts";

const t = ((key: string) => key) as unknown as SapilTranslator;
const money = ((value: number, currency: string) => `${currency} ${value.toFixed(2)}`) as SapilMoney;
const base = { subtotal: "216", discount: "0", shipping: "0", tax: "0", total: "216" };

describe("orderTenders", () => {
  it("shows nothing when the payment method paid everything", () => {
    expect(orderTenders(t, money, { ...base, amountPayable: "216" }, "AED", "Card")).toEqual({ rows: [], charged: null });
    expect(orderTenders(t, money, { ...base, giftCardApplied: "50" }, "AED", "Card").rows).toEqual([]);
  });

  it("lists gift card, points and what the payment method took", () => {
    const out = orderTenders(t, money, { ...base, giftCardApplied: "200", loyaltyApplied: "6", amountPayable: "10" }, "AED", "Card");
    expect(out.charged).toBe(10);
    expect(out.rows.map((row) => [row.key, row.label, row.value])).toEqual([
      ["gc", "account.odPaidGiftCard", "−AED 200.00"],
      ["points", "account.odPaidPoints", "−AED 6.00"],
      ["charged", "Card", "AED 10.00"],
    ]);
  });

  it("handles an order paid in full by gift card", () => {
    const out = orderTenders(t, money, { ...base, giftCardApplied: "216", amountPayable: "0" }, "AED", "Gift card");
    expect(out.charged).toBe(0);
    expect(out.rows.at(-1)?.value).toBe("AED 0.00");
  });
});
