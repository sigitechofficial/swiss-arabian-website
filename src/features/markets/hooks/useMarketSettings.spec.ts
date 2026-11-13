import { describe, expect, it } from "vitest";
import type { StorefrontMarket } from "../types/market";
import { marketSettingsOf } from "./useMarketSettings";

const base = {
  zoneCode: "SAPIL_URD1",
  defaultCurrencyCode: "AED",
  catalogContext: { currencyCode: "AED" },
} as unknown as StorefrontMarket;

describe("marketSettingsOf", () => {
  it("returns nothing invented when the API sends no delivery or tiers", () => {
    expect(marketSettingsOf(base)).toEqual({
      zoneCode: "SAPIL_URD1",
      currencyCode: "AED",
      freeDeliveryThreshold: null,
      cashOnDelivery: null,
      priceEditTiers: [],
    });
    expect(marketSettingsOf(null).zoneCode).toBeNull();
  });

  it("reads the free-delivery threshold, cash on delivery and sorted price tiers", () => {
    const market = {
      ...base,
      priceEditTiers: [199, 50, 99, 99, -1],
      delivery: {
        currencyCode: "AED",
        freeDeliveryThreshold: "100",
        standard: null,
        express: null,
        cashOnDelivery: { available: true, minOrderAmount: null, maxOrderAmount: null, fee: null },
      },
    } as StorefrontMarket;
    expect(marketSettingsOf(market)).toMatchObject({
      freeDeliveryThreshold: 100,
      cashOnDelivery: true,
      priceEditTiers: [50, 99, 199],
    });
  });

  it("treats a missing or zero threshold as no free delivery", () => {
    const market = {
      ...base,
      delivery: { currencyCode: null, freeDeliveryThreshold: "0", standard: null, express: null, cashOnDelivery: { available: false, minOrderAmount: null, maxOrderAmount: null, fee: null } },
    } as StorefrontMarket;
    expect(marketSettingsOf(market)).toMatchObject({ freeDeliveryThreshold: null, cashOnDelivery: false });
  });
});
