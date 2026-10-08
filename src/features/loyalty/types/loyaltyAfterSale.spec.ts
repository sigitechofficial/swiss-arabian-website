import { describe, expect, it } from "vitest";
import {
  DEFAULT_DEBT_COPY,
  hasRewardsFigures,
  isEmptyRewardsWallet,
  readLoyaltyTransactions,
  readLoyaltyWallet,
  readOrderReward,
} from "./loyalty";

const uaeWallet = {
  enabled: true,
  member: true,
  program: { code: "SWISS_ARABIAN_LOYALTY", name: "Swiss Arabian Loyalty" },
  market: { code: "UAE", currencyCode: "AED" },
  wallet: { availablePoints: 200, pendingPoints: 0, reservedPoints: 0, debtPoints: 0 },
  monetaryEquivalent: { available: "2.00", currencyCode: "AED" },
  policy: { rewardRatePercent: "5.0000", pointValue: "0.010000" },
};

describe("L4 wallet and debt", () => {
  it("hides a debt card when debt is zero", () => {
    const wallet = readLoyaltyWallet(uaeWallet);
    expect(wallet.debtPoints).toBe(0);
    expect(wallet.debtLabel).toBeNull();
    expect(isEmptyRewardsWallet({ ...wallet, availablePoints: 0 })).toBe(true);
  });

  it("reads a positive debt from the server wallet", () => {
    const wallet = readLoyaltyWallet({
      ...uaeWallet,
      wallet: { availablePoints: 0, pendingPoints: 0, reservedPoints: 0, debtPoints: 400 },
      monetaryEquivalent: { available: "0.00", currencyCode: "AED" },
    });
    expect(wallet.debtPoints).toBe(400);
    expect(wallet.availablePoints).toBe(0);
    expect(wallet.debtLabel).toBe(DEFAULT_DEBT_COPY);
    expect(hasRewardsFigures(wallet)).toBe(true);
    expect(isEmptyRewardsWallet(wallet)).toBe(false);
  });

  it("does not subtract debt from available value", () => {
    const wallet = readLoyaltyWallet({
      ...uaeWallet,
      wallet: { availablePoints: 200, pendingPoints: 0, reservedPoints: 0, debtPoints: 300 },
      monetaryEquivalent: { available: "2.00", currencyCode: "AED" },
    });
    expect(wallet.availablePoints).toBe(200);
    expect(wallet.availableValue).toBe(2);
    expect(wallet.debtPoints).toBe(300);
    expect(wallet.availableValue).not.toBe(-1);
  });

  it("keeps UAE and KSA wallets isolated", () => {
    const ksa = readLoyaltyWallet({
      ...uaeWallet,
      market: { code: "KSA", currencyCode: "SAR" },
      wallet: { availablePoints: 0, pendingPoints: 0, reservedPoints: 0, debtPoints: 80 },
      monetaryEquivalent: { available: "0.00", currencyCode: "SAR" },
    });
    expect(readLoyaltyWallet(uaeWallet).debtPoints).toBe(0);
    expect(ksa.zoneCode).toBe("KSA");
    expect(ksa.currencyCode).toBe("SAR");
    expect(ksa.debtPoints).toBe(80);
  });
});

describe("L4 activity labels", () => {
  it("keeps refund reversal and redemption return as separate rows", () => {
    const rows = readLoyaltyTransactions({
      items: [
        { id: "earn", type: "POINTS_EARNED", points: 950 },
        { id: "rev", type: "REFUND_ADJUSTMENT", points: -475 },
        { id: "ret", type: "REFUND_ADJUSTMENT", points: 1000 },
      ],
    });
    expect(rows.map((row) => row.label)).toEqual([
      "Points earned",
      "Points adjusted after refund",
      "Reward points returned",
    ]);
    expect(rows.map((row) => row.points)).toEqual([950, -475, 1000]);
    expect(rows).toHaveLength(3);
  });

  it("maps an earn reversal without calling it expired or redeemed", () => {
    const rows = readLoyaltyTransactions({
      items: [{ id: "r1", type: "EARN_REVERSAL", points: -475, state: "PENDING" }],
    });
    expect(rows[0]?.label).toBe("Points adjusted after refund");
    expect(rows[0]?.state).toBe("Pending");
    expect(rows[0]?.label).not.toMatch(/Expired|Redeemed/i);
    expect(rows[0]?.label).not.toBe("EARN_REVERSAL");
  });

  it("maps a redemption refund return", () => {
    const rows = readLoyaltyTransactions({
      items: [{ id: "r1", type: "REDEMPTION_REVERSAL", points: 1000 }],
    });
    expect(rows[0]?.label).toBe("Reward points returned");
    expect(rows[0]?.label).not.toBe("REDEMPTION_REFUND");
    expect(rows[0]?.label).not.toBe("REDEMPTION_REVERSAL");
  });

  it("maps manual credit and debit from server keys", () => {
    const rows = readLoyaltyTransactions({
      items: [
        { id: "c", type: "MANUAL_CREDIT", points: 500 },
        { id: "d", type: "MANUAL_DEBIT", points: -200 },
      ],
    });
    expect(rows[0]?.label).toBe("Manual points credit");
    expect(rows[1]?.label).toBe("Manual points adjustment");
  });

  it("maps debt repayment without exposing the ledger enum", () => {
    const rows = readLoyaltyTransactions({
      items: [{ id: "pay", type: "DEBT_REPAYMENT", points: -300 }],
    });
    expect(rows[0]?.label).toBe("Points applied to previous adjustment");
    expect(rows[0]?.label).not.toBe("DEBT_REPAYMENT");
  });

  it("uses a server-provided customer label for customer care", () => {
    const rows = readLoyaltyTransactions({
      items: [{ id: "care", type: "POINTS_ADJUSTMENT", label: "Customer care points", points: 500 }],
    });
    expect(rows[0]?.label).toBe("Customer care points");
  });

  it("maps live Backend L4 presentation keys", () => {
    const rows = readLoyaltyTransactions({
      items: [
        { id: "a", type: "POINTS_ADJUSTED_AFTER_REFUND", points: -475 },
        { id: "b", type: "POINTS_RETURNED", points: 1000 },
        { id: "c", type: "POINTS_APPLIED_TO_ADJUSTMENT", points: -300 },
        { id: "d", type: "POINTS_ADJUSTMENT", points: 500 },
      ],
    });
    expect(rows.map((row) => row.label)).toEqual([
      "Points adjusted after refund",
      "Reward points returned",
      "Points applied to previous adjustment",
      "Points adjustment",
    ]);
  });

  it("still reads history when the program payload is disabled", () => {
    const rows = readLoyaltyTransactions({
      enabled: false,
      member: false,
      reason: "LOYALTY_NOT_AVAILABLE",
      items: [{ id: "a", type: "POINTS_ADJUSTED_AFTER_REFUND", points: -40 }],
    });
    expect(rows[0]?.label).toBe("Points adjusted after refund");
  });

  it("never prints raw L4 ledger enums", () => {
    const rows = readLoyaltyTransactions({
      items: [
        { id: "1", type: "EARN_REVERSAL", points: -10 },
        { id: "2", type: "REDEMPTION_REFUND", points: 10 },
        { id: "3", type: "DEBT_REPAYMENT", points: -5 },
      ],
    });
    for (const row of rows) {
      expect(row.label).not.toMatch(/^[A-Z0-9]+(?:_[A-Z0-9]+)+$/);
    }
  });
});

describe("L4 order after-sale reader", () => {
  it("reads a partial earn reversal from the live order Loyalty contract", () => {
    const reward = readOrderReward({
      earned: true,
      orderId: "order-1",
      points: 950,
      pointsReversed: 475,
      netEarnedPoints: 475,
      presentationState: "AVAILABLE",
      currencyCode: "AED",
      redemption: { redeemed: false, points: 0, amount: "0.00", pointsRefunded: 0, netPointsUsed: 0 },
    });
    expect(reward.earnAdjustment).toEqual({
      originalPoints: 950,
      adjustedPoints: 475,
      currentPoints: 475,
    });
  });

  it("reads a partial earn reversal only when all three server values exist", () => {
    const reward = readOrderReward({
      earned: true,
      points: 475,
      presentationState: "AVAILABLE",
      originalPoints: 950,
      adjustedPoints: 475,
      currentPoints: 475,
    });
    expect(reward.earnAdjustment).toEqual({
      originalPoints: 950,
      adjustedPoints: 475,
      currentPoints: 475,
    });
  });

  it("reads a full earn reversal without inventing a current balance", () => {
    const reward = readOrderReward({
      earned: false,
      originalPoints: 900,
      adjustedPoints: 900,
      currentPoints: 0,
    });
    expect(reward.earned).toBe(false);
    expect(reward.earnAdjustment).toEqual({
      originalPoints: 900,
      adjustedPoints: 900,
      currentPoints: 0,
    });
  });

  it("reads after-sale numbers from a nested server object without using earning estimates", () => {
    const reward = readOrderReward({
      earned: true,
      points: 475,
      presentationState: "AVAILABLE",
      earning: { estimatedPoints: 950 },
      afterSale: { originalPoints: 950, adjustedPoints: 475, currentPoints: 475 },
    });
    expect(reward.earnAdjustment).toEqual({
      originalPoints: 950,
      adjustedPoints: 475,
      currentPoints: 475,
    });
  });

  it("does not compute a missing current reward", () => {
    const reward = readOrderReward({
      earned: true,
      points: 950,
      presentationState: "AVAILABLE",
      pointsReversed: 475,
    });
    expect(reward.earnAdjustment).toBeNull();
    if (!reward.earned) throw new Error("expected earned");
    expect(reward.points).toBe(950);
  });

  it("does not reconcile mismatched server after-sale numbers", () => {
    const reward = readOrderReward({
      earned: true,
      points: 950,
      pointsReversed: 400,
      netEarnedPoints: 600,
      presentationState: "AVAILABLE",
    });
    expect(reward.earnAdjustment).toEqual({
      originalPoints: 950,
      adjustedPoints: 400,
      currentPoints: 600,
    });
    expect(reward.earnAdjustment?.currentPoints).not.toBe(950 - 400);
  });

  it("reads a partial redeemed-points return from the live order Loyalty contract", () => {
    const reward = readOrderReward({
      earned: false,
      redemption: {
        redeemed: true,
        points: 2000,
        amount: "20.00",
        pointsRefunded: 1000,
        amountRefunded: "10.00",
        netPointsUsed: 1000,
        currencyCode: "AED",
      },
    });
    expect(reward.redemption).toMatchObject({
      redeemed: true,
      points: 2000,
      returnedPoints: 1000,
      returnedAmount: 10,
      netPoints: 1000,
    });
  });

  it("does not invent a redemption return when the server sent no refund", () => {
    const reward = readOrderReward({
      earned: false,
      redemption: {
        redeemed: true,
        points: 2000,
        amount: "20.00",
        pointsRefunded: 0,
        amountRefunded: "0.00",
        netPointsUsed: 2000,
        currencyCode: "AED",
      },
    });
    expect(reward.redemption).toMatchObject({
      redeemed: true,
      points: 2000,
      returnedPoints: null,
      netPoints: null,
    });
  });

  it("reads a partial redeemed-points return from the server", () => {
    const reward = readOrderReward({
      earned: false,
      redemption: {
        redeemed: true,
        points: 2000,
        amount: "20.00",
        returnedPoints: 1000,
        returnedAmount: "10.00",
        netPoints: 1000,
        currencyCode: "AED",
      },
    });
    expect(reward.redemption).toMatchObject({
      redeemed: true,
      points: 2000,
      returnedPoints: 1000,
      returnedAmount: 10,
      netPoints: 1000,
    });
  });

  it("reads a full redeemed-points return", () => {
    const reward = readOrderReward({
      earned: false,
      redemption: {
        redeemed: true,
        points: 2000,
        amount: "20.00",
        returnedPoints: 2000,
        returnedAmount: "20.00",
        netPoints: 0,
        currencyCode: "AED",
      },
    });
    expect(reward.redemption.redeemed).toBe(true);
    if (!reward.redemption.redeemed) throw new Error("expected redemption");
    expect(reward.redemption.returnedPoints).toBe(2000);
    expect(reward.redemption.netPoints).toBe(0);
  });

  it("reads a live order with both earn reversal and redemption return", () => {
    const reward = readOrderReward({
      earned: true,
      points: 900,
      pointsReversed: 900,
      netEarnedPoints: 0,
      presentationState: "AVAILABLE",
      redemption: {
        redeemed: true,
        points: 2000,
        amount: "20.00",
        pointsRefunded: 2000,
        amountRefunded: "20.00",
        netPointsUsed: 0,
        currencyCode: "AED",
      },
    });
    expect(reward.earnAdjustment).toEqual({
      originalPoints: 900,
      adjustedPoints: 900,
      currentPoints: 0,
    });
    expect(reward.redemption).toMatchObject({
      redeemed: true,
      points: 2000,
      returnedPoints: 2000,
      netPoints: 0,
    });
  });

  it("reads earn reversal and redemption return together without merging them", () => {
    const reward = readOrderReward({
      earned: true,
      points: 0,
      presentationState: "AVAILABLE",
      originalPoints: 900,
      adjustedPoints: 900,
      currentPoints: 0,
      redemption: {
        redeemed: true,
        points: 2000,
        amount: "20.00",
        returnedPoints: 2000,
        returnedAmount: "20.00",
        netPoints: 0,
        currencyCode: "AED",
      },
    });
    expect(reward.earned).toBe(false);
    expect(reward.earnAdjustment?.originalPoints).toBe(900);
    expect(reward.earnAdjustment?.adjustedPoints).toBe(900);
    expect(reward.redemption.redeemed).toBe(true);
    if (!reward.redemption.redeemed) throw new Error("expected redemption");
    expect(reward.redemption.returnedPoints).toBe(2000);
    expect(reward.earnAdjustment?.adjustedPoints).not.toBe(reward.redemption.returnedPoints);
  });
});
