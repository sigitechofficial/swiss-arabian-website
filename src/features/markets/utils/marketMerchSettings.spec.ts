import { describe, expect, it } from "vitest";
import {
  DEFAULT_PRICE_EDIT_TIERS,
  readMarketDelivery,
  readMarketMerchSettings,
  readPriceEditTiers,
} from "./marketMerchSettings";

describe("readPriceEditTiers", () => {
  it("falls back to 50/99/199 when missing or unusable", () => {
    expect(readPriceEditTiers(undefined)).toEqual([...DEFAULT_PRICE_EDIT_TIERS]);
    expect(readPriceEditTiers([])).toEqual([50, 99, 199]);
    expect(readPriceEditTiers(["x", -1, 0])).toEqual([50, 99, 199]);
  });

  it("sorts, de-duplicates and accepts numeric strings", () => {
    expect(readPriceEditTiers([149, "49", 99, 49])).toEqual([49, 99, 149]);
  });
});

describe("readMarketDelivery", () => {
  it("is null without a delivery object", () => {
    expect(readMarketDelivery(null)).toBeNull();
  });

  it("reads promises and cash on delivery", () => {
    const delivery = readMarketDelivery({
      currencyCode: "AED",
      freeDeliveryThreshold: "100.00",
      standard: { methodCode: "STD", methodType: "STANDARD", displayName: "Standard", fee: "15", estimatedMinDays: 1, estimatedMaxDays: "3" },
      express: null,
      cashOnDelivery: { available: true, minOrderAmount: null, maxOrderAmount: "2000", fee: null },
    });
    expect(delivery?.freeDeliveryThreshold).toBe("100.00");
    expect(delivery?.standard?.estimatedMaxDays).toBe(3);
    expect(delivery?.express).toBeNull();
    expect(delivery?.cashOnDelivery).toEqual({ available: true, minOrderAmount: null, maxOrderAmount: "2000", fee: null });
  });
});

describe("readMarketMerchSettings", () => {
  it("reads a market row", () => {
    expect(readMarketMerchSettings({ priceEditTiers: [30, 60] })).toEqual({
      priceEditTiers: [30, 60],
      delivery: null,
    });
  });
});
