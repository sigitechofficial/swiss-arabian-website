import { describe, expect, it } from "vitest";
import {
  isLoyaltyRedemptionHidden,
  readLoyaltyRedemption,
  readLoyaltyTransactions,
  readOrderReward,
  redemptionReasonMessage,
} from "./loyalty";

const quote = {
  enabled: true,
  eligible: true,
  availablePoints: 5420,
  minimumRedeemPoints: 100,
  incrementPoints: 50,
  maxRedeemablePoints: 400,
  appliedPoints: 0,
  appliedAmount: "3.00",
  currencyCode: "AED",
  reason: null,
};

describe("loyalty redemption reader", () => {
  it("reads the server quote as sent", () => {
    const view = readLoyaltyRedemption(quote);
    expect(view).toMatchObject({
      enabled: true,
      eligible: true,
      availablePoints: 5420,
      minimumRedeemPoints: 100,
      incrementPoints: 50,
      maxRedeemablePoints: 400,
      appliedPoints: 0,
      appliedAmount: 3,
      currencyCode: "AED",
    });
  });

  it("does not price appliedAmount from points or point value", () => {
    const view = readLoyaltyRedemption({
      ...quote,
      appliedPoints: 1000,
      appliedAmount: "3.00",
    });
    expect(view?.appliedAmount).toBe(3);
    expect(view?.appliedAmount).not.toBe(10);
    expect(view?.appliedAmount).not.toBe(1000);
  });

  it("does not invent maxRedeemablePoints from available points or coverage", () => {
    const view = readLoyaltyRedemption({
      ...quote,
      availablePoints: 5420,
      maxRedeemablePoints: 400,
    });
    expect(view?.maxRedeemablePoints).toBe(400);
    expect(view?.maxRedeemablePoints).not.toBe(5420);
  });

  it("reads a nested cart or checkout snapshot quote", () => {
    const view = readLoyaltyRedemption({
      v: 1,
      loyaltyRedemption: { ...quote, appliedPoints: 200, appliedAmount: "2.00" },
    });
    expect(view?.appliedPoints).toBe(200);
    expect(view?.appliedAmount).toBe(2);
  });

  it("shows customer-safe copy for a promotion restriction", () => {
    const view = readLoyaltyRedemption({
      ...quote,
      eligible: false,
      reason: "REDEMPTION_NOT_AVAILABLE_WITH_CURRENT_OFFERS",
    });
    expect(view?.reasonMessage).toBe("Reward points can’t be used with the current offer.");
    expect(view?.reasonMessage).not.toMatch(/campaign/i);
    expect(view?.reasonMessage).not.toMatch(/stack/i);
  });

  it("hides Use Points when loyalty is not available", () => {
    const view = readLoyaltyRedemption({
      enabled: false,
      eligible: false,
      reason: "LOYALTY_NOT_AVAILABLE",
    });
    expect(isLoyaltyRedemptionHidden(view)).toBe(true);
  });

  it("maps every redemption reason to customer copy", () => {
    for (const reason of [
      "REDEMPTION_DISABLED",
      "BELOW_MINIMUM",
      "INVALID_INCREMENT",
      "INSUFFICIENT_POINTS",
      "EXCEEDS_ORDER_COVERAGE",
      "RESERVATION_EXPIRED",
      "CART_NOT_QUALIFIED",
    ]) {
      expect(redemptionReasonMessage(reason)).toBeTruthy();
      expect(redemptionReasonMessage(reason)).not.toBe(reason);
    }
  });
});

describe("order redemption snapshot", () => {
  it("reads redeemed points and the frozen earn together", () => {
    const reward = readOrderReward({
      earned: true,
      orderId: "order-1",
      points: 1625,
      presentationState: "PENDING",
      currencyCode: "AED",
      vestedAt: null,
      redemption: { redeemed: true, points: 1000, amount: "10.00", currencyCode: "AED" },
    });
    expect(reward.earned).toBe(true);
    if (!reward.earned || !reward.redemption.redeemed) throw new Error("expected both");
    expect(reward.points).toBe(1625);
    expect(reward.redemption.points).toBe(1000);
    expect(reward.redemption.amount).toBe(10);
  });

  it("reads a redeemed order that earned nothing", () => {
    const reward = readOrderReward({
      earned: false,
      redemption: { redeemed: true, points: 400, amount: "4.00", currencyCode: "AED" },
    });
    expect(reward.earned).toBe(false);
    expect(reward.redemption).toEqual({
      redeemed: true,
      points: 400,
      amount: 4,
      currencyCode: "AED",
    });
  });
});

describe("reservation activity", () => {
  it("hides temporary reserve and release rows unless the server marks them visible", () => {
    const hidden = readLoyaltyTransactions({
      items: [
        { id: "r1", type: "POINTS_RESERVED", points: -200 },
        { id: "r2", type: "POINTS_RELEASED", points: 200 },
        { id: "r3", type: "POINTS_REDEEMED", points: -200 },
      ],
    });
    expect(hidden.map((row) => row.label)).toEqual(["Points redeemed"]);

    const shown = readLoyaltyTransactions({
      items: [{ id: "r1", type: "POINTS_RESERVED", points: -200, customerVisible: true }],
    });
    expect(shown[0]?.label).toBe("Points reserved");
  });
});
