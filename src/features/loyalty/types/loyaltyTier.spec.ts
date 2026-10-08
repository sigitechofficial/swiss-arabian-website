import { describe, expect, it } from "vitest";
import { readLoyaltyTier, readLoyaltyTierHistory, readLoyaltyWallet } from "./loyalty";

const liveGold = {
  enabled: true,
  member: true,
  market: { code: "UAE", currencyCode: "AED" },
  wallet: { availablePoints: 5420, pendingPoints: 0, reservedPoints: 0, debtPoints: 0 },
  monetaryEquivalent: { available: "54.20", currencyCode: "AED" },
  policy: { rewardRatePercent: "5.0000", pointValue: "0.010000" },
  tier: {
    enabled: true,
    current: { code: "GOLD", name: "Gold", rank: 3 },
    qualifyingSpend: { amount: "3450.00", currencyCode: "AED" },
    qualificationWindowDays: 365,
    progressPercent: 46,
    next: {
      code: "PLATINUM",
      name: "Platinum",
      threshold: "7500.00",
      remainingAmount: "4050.00",
    },
  },
};

describe("L5.1 live /me.tier contract", () => {
  it("treats enabled:false as no current tier", () => {
    expect(readLoyaltyWallet({ ...liveGold, tier: { enabled: false } }).tier).toBeNull();
  });

  it("reads a base Member snapshot", () => {
    const wallet = readLoyaltyWallet({
      ...liveGold,
      wallet: { availablePoints: 0, pendingPoints: 0, reservedPoints: 0, debtPoints: 0 },
      monetaryEquivalent: { available: "0.00", currencyCode: "AED" },
      tier: {
        enabled: true,
        current: { code: "MEMBER", name: "Member", rank: 1 },
        qualifyingSpend: { amount: "0.00", currencyCode: "AED" },
        qualificationWindowDays: 365,
        progressPercent: 0,
        next: {
          code: "SILVER",
          name: "Silver",
          threshold: "1000.00",
          remainingAmount: "1000.00",
        },
      },
    });
    expect(wallet.tier?.current?.name).toBe("Member");
    expect(wallet.tier?.qualifyingSpend).toBe(0);
    expect(wallet.tier?.remainingAmount).toBe(1000);
    expect(wallet.tier?.next?.name).toBe("Silver");
  });

  it("reads Gold remainingAmount from next, not by subtracting spend", () => {
    const wallet = readLoyaltyWallet(liveGold);
    expect(wallet.tier?.current?.name).toBe("Gold");
    expect(wallet.tier?.qualifyingSpend).toBe(3450);
    expect(wallet.tier?.remainingAmount).toBe(4050);
    expect(wallet.tier?.progressPercent).toBe(46);
    expect(wallet.tier?.qualificationWindowDays).toBe(365);
    expect(wallet.tier?.remainingAmount).not.toBe(wallet.tier?.qualifyingSpend);
  });

  it("hides remaining spend when next is null", () => {
    const wallet = readLoyaltyWallet({
      ...liveGold,
      tier: {
        enabled: true,
        current: { code: "PLATINUM", name: "Platinum", rank: 4 },
        qualifyingSpend: { amount: "12000.00", currencyCode: "AED" },
        qualificationWindowDays: 365,
        progressPercent: 100,
        next: null,
      },
    });
    expect(wallet.tier?.current?.name).toBe("Platinum");
    expect(wallet.tier?.next).toBeNull();
    expect(wallet.tier?.remainingAmount).toBeNull();
    expect(wallet.tier?.progressPercent).toBeNull();
  });

  it("does not invent remaining spend from threshold", () => {
    const wallet = readLoyaltyWallet({
      ...liveGold,
      tier: {
        ...liveGold.tier,
        next: {
          code: "PLATINUM",
          name: "Platinum",
          threshold: "7500.00",
        },
      },
    });
    expect(wallet.tier?.remainingAmount).toBeNull();
  });

  it("maps the live tier-history endpoint without raw enums", () => {
    const rows = readLoyaltyTierHistory({
      items: [
        {
          from: null,
          to: { code: "GOLD", name: "Gold" },
          changedAt: "2026-10-08T00:00:00.000Z",
          reason: "PURCHASE",
        },
        {
          from: { code: "GOLD", name: "Gold" },
          to: { code: "SILVER", name: "Silver" },
          changedAt: "2026-10-08T01:00:00.000Z",
          reason: "REFUND",
        },
        {
          from: { code: "SILVER", name: "Silver" },
          to: { code: "GOLD", name: "Gold" },
          changedAt: "2026-10-08T02:00:00.000Z",
          reason: "EXCHANGE",
        },
      ],
    });
    expect(rows.map((row) => row.label)).toEqual([
      "Reached after a qualifying purchase",
      "Adjusted after a refund",
      "Updated after an exchange adjustment",
    ]);
    expect(rows.map((row) => row.tierName)).toEqual(["Gold", "Silver", "Gold"]);
    for (const row of rows) {
      expect(row.label).not.toMatch(/^[A-Z0-9]+(?:_[A-Z0-9]+)+$/);
    }
  });

  it("keeps Gold after a lower available-points payload", () => {
    const wallet = readLoyaltyWallet({
      ...liveGold,
      wallet: { availablePoints: 2000, pendingPoints: 0, reservedPoints: 0, debtPoints: 0 },
      monetaryEquivalent: { available: "20.00", currencyCode: "AED" },
      giftCard: { appliedAmount: "100.00" },
    });
    expect(wallet.availablePoints).toBe(2000);
    expect(wallet.tier?.current?.name).toBe("Gold");
    expect(wallet.tier?.qualifyingSpend).toBe(3450);
  });

  it("keeps historical Gold when Program or Market is disabled", () => {
    const program = readLoyaltyWallet({
      enabled: false,
      member: true,
      reason: "LOYALTY_NOT_AVAILABLE",
      wallet: liveGold.wallet,
      monetaryEquivalent: liveGold.monetaryEquivalent,
      tier: liveGold.tier,
    });
    const market = readLoyaltyWallet({
      enabled: false,
      member: true,
      reason: "LOYALTY_NOT_AVAILABLE_IN_THIS_MARKET",
      wallet: { availablePoints: 10, pendingPoints: 0, reservedPoints: 0, debtPoints: 0 },
      monetaryEquivalent: { available: "0.10", currencyCode: "AED" },
      tier: {
        enabled: true,
        current: { code: "SILVER", name: "Silver", rank: 2 },
        qualifyingSpend: { amount: "800.00", currencyCode: "AED" },
        next: null,
      },
    });
    expect(program.availability).toBe("DISABLED");
    expect(program.tier?.current?.name).toBe("Gold");
    expect(market.tier?.current?.name).toBe("Silver");
  });

  it("keeps UAE and KSA live tiers isolated", () => {
    const ksa = readLoyaltyWallet({
      ...liveGold,
      market: { code: "KSA", currencyCode: "SAR" },
      wallet: { availablePoints: 200, pendingPoints: 0, reservedPoints: 0, debtPoints: 0 },
      monetaryEquivalent: { available: "4.00", currencyCode: "SAR" },
      tier: {
        enabled: true,
        current: { code: "SILVER", name: "Silver", rank: 2 },
        qualifyingSpend: { amount: "800.00", currencyCode: "SAR" },
        next: null,
      },
    });
    expect(readLoyaltyWallet(liveGold).tier?.current?.name).toBe("Gold");
    expect(ksa.zoneCode).toBe("KSA");
    expect(ksa.currencyCode).toBe("SAR");
    expect(ksa.tier?.current?.name).toBe("Silver");
    expect(ksa.tier?.qualifyingSpend).toBe(800);
  });

  it("does not flatten a Promotion remainingAmount into Loyalty remaining spend", () => {
    const wallet = readLoyaltyWallet({
      ...liveGold,
      offers: [{ qualification: { remainingAmount: "50.00" } }],
    });
    expect(wallet.tier?.remainingAmount).toBe(4050);
    expect(wallet.tier?.remainingAmount).not.toBe(50);
  });
});
