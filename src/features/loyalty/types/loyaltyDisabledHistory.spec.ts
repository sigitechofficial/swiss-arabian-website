import { describe, expect, it } from "vitest";
import {
  hasHistoricalRewards,
  hasRewardsFigures,
  readLoyaltyTransactions,
  readLoyaltyWallet,
} from "./loyalty";

const historicalUae = {
  enabled: false,
  member: true,
  reason: "LOYALTY_NOT_AVAILABLE",
  market: { code: "UAE", currencyCode: "AED" },
  wallet: { availablePoints: 5420, pendingPoints: 0, reservedPoints: 0, debtPoints: 0 },
  monetaryEquivalent: { available: "54.20", currencyCode: "AED" },
  policy: { rewardRatePercent: "5.0000", pointValue: "0.010000" },
};

describe("L4.1 disabled-history wallet reader", () => {
  it("keeps a program-disabled historical wallet", () => {
    const wallet = readLoyaltyWallet(historicalUae);
    expect(wallet.availability).toBe("DISABLED");
    expect(wallet.member).toBe(true);
    expect(wallet.hasServerWallet).toBe(true);
    expect(wallet.availablePoints).toBe(5420);
    expect(wallet.availableValue).toBe(54.2);
    expect(wallet.unavailableMessage).toBe(
      "Rewards are currently unavailable for new earning or redemption.",
    );
    expect(hasHistoricalRewards(wallet)).toBe(true);
    expect(hasRewardsFigures(wallet)).toBe(true);
  });

  it("keeps a market-disabled historical wallet", () => {
    const wallet = readLoyaltyWallet({
      ...historicalUae,
      reason: "LOYALTY_NOT_AVAILABLE_IN_THIS_MARKET",
    });
    expect(wallet.availability).toBe("DISABLED");
    expect(wallet.availablePoints).toBe(5420);
    expect(wallet.unavailableMessage).toBe(
      "Rewards are currently unavailable for new earning or redemption in this market.",
    );
  });

  it("does not invent a zero balance when there is no wallet", () => {
    const wallet = readLoyaltyWallet({
      enabled: false,
      member: false,
      reason: "LOYALTY_NOT_AVAILABLE",
    });
    expect(wallet.availability).toBe("DISABLED");
    expect(wallet.member).toBe(false);
    expect(wallet.hasServerWallet).toBe(false);
    expect(wallet.availablePoints).toBe(0);
    expect(wallet.availableValue).toBeNull();
    expect(hasHistoricalRewards(wallet)).toBe(false);
    expect(hasRewardsFigures(wallet)).toBe(false);
    expect(wallet.unavailableMessage).toBe("Swiss Arabian Rewards is not currently available.");
  });

  it("reads a disabled wallet debt without subtracting it from available", () => {
    const wallet = readLoyaltyWallet({
      ...historicalUae,
      wallet: { availablePoints: 200, pendingPoints: 0, reservedPoints: 0, debtPoints: 400 },
      monetaryEquivalent: { available: "2.00", currencyCode: "AED" },
    });
    expect(wallet.availablePoints).toBe(200);
    expect(wallet.availableValue).toBe(2);
    expect(wallet.debtPoints).toBe(400);
    expect(wallet.availableValue).not.toBe(wallet.availablePoints - wallet.debtPoints);
  });

  it("keeps UAE and KSA disabled wallets isolated", () => {
    const ksa = readLoyaltyWallet({
      ...historicalUae,
      reason: "LOYALTY_NOT_AVAILABLE_IN_THIS_MARKET",
      market: { code: "KSA", currencyCode: "SAR" },
      wallet: { availablePoints: 10, pendingPoints: 0, reservedPoints: 0, debtPoints: 0 },
      monetaryEquivalent: { available: "0.20", currencyCode: "SAR" },
    });
    expect(readLoyaltyWallet(historicalUae).availablePoints).toBe(5420);
    expect(readLoyaltyWallet(historicalUae).currencyCode).toBe("AED");
    expect(ksa.zoneCode).toBe("KSA");
    expect(ksa.currencyCode).toBe("SAR");
    expect(ksa.availablePoints).toBe(10);
    expect(ksa.availableValue).toBe(0.2);
  });

  it("does not reconstruct a balance from activity rows", () => {
    const wallet = readLoyaltyWallet(historicalUae);
    const rows = readLoyaltyTransactions({
      enabled: false,
      member: true,
      items: [
        { id: "a", type: "POINTS_EARNED", points: 900 },
        { id: "b", type: "POINTS_REDEEMED", points: -200 },
      ],
    });
    const summed = rows.reduce((total, row) => total + (row.points ?? 0), 0);
    expect(wallet.availablePoints).toBe(5420);
    expect(wallet.availablePoints).not.toBe(summed);
  });

  it("still reads disabled-program transactions", () => {
    const rows = readLoyaltyTransactions({
      enabled: false,
      member: true,
      reason: "LOYALTY_NOT_AVAILABLE",
      items: [
        { id: "a", type: "POINTS_EARNED", points: 950 },
        { id: "b", type: "POINTS_ADJUSTED_AFTER_REFUND", points: -475 },
      ],
    });
    expect(rows.map((row) => row.label)).toEqual([
      "Points earned",
      "Points adjusted after refund",
    ]);
    expect(rows[0]?.label).not.toBe("EARN_REVERSAL");
  });
});
