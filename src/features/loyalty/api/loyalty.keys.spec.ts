import { describe, expect, it } from "vitest";
import { loyaltyKeys } from "./loyalty.keys";

describe("loyalty cache identity", () => {
  it("separates customers and markets", () => {
    expect(loyaltyKeys.wallet("customer-1", "UAE", "AED")).not.toEqual(
      loyaltyKeys.wallet("customer-1", "KSA", "SAR"),
    );
    expect(loyaltyKeys.transactions("customer-1", "UAE", "AED")).not.toEqual(
      loyaltyKeys.transactions("customer-2", "UAE", "AED"),
    );
    expect(loyaltyKeys.wallet("customer-1", "UAE", "AED")[0]).toBe(loyaltyKeys.all[0]);
  });
});
