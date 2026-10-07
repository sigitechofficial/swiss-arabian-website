import { describe, expect, it } from "vitest";
import {
  readEarnPreview,
  readLoyaltyTransactions,
  readOrderReward,
} from "./loyalty";

/** Payloads copied from LoyaltyEarnPreviewService / StorefrontLoyaltyService. */
const liveCartPreview = {
  enabled: true,
  presentationState: "ESTIMATE",
  earning: {
    eligibleAmount: "325.00",
    rewardValue: "16.25",
    estimatedPoints: 1625,
    currencyCode: "AED",
    rewardRatePercent: "5.0000",
    pointValue: "0.010000",
  },
};

describe("earn preview reader", () => {
  it("reads the server estimate for a cart", () => {
    const preview = readEarnPreview(liveCartPreview);
    expect(preview.enabled).toBe(true);
    if (!preview.enabled) throw new Error("expected an enabled preview");
    expect(preview.estimatedPoints).toBe(1625);
    expect(preview.eligibleAmount).toBe(325);
    expect(preview.currencyCode).toBe("AED");
  });

  it("never derives points from reward rate or point value", () => {
    // 325.00 x 5% / 0.01 would also be 1625, so prove the server number is the
    // one used by returning a deliberately different estimatedPoints.
    const preview = readEarnPreview({
      enabled: true,
      presentationState: "ESTIMATE",
      earning: {
        eligibleAmount: "325.00",
        rewardValue: "16.25",
        estimatedPoints: 900,
        currencyCode: "AED",
        rewardRatePercent: "5.0000",
        pointValue: "0.010000",
      },
    });
    if (!preview.enabled) throw new Error("expected an enabled preview");
    expect(preview.estimatedPoints).toBe(900);
    expect(preview.estimatedPoints).not.toBe(1625);
  });

  it("separates earning disabled from a disabled program", () => {
    const earning = readEarnPreview({ enabled: false, reason: "EARNING_DISABLED" });
    const program = readEarnPreview({ enabled: false, reason: "PROGRAM_DISABLED" });
    const market = readEarnPreview({ enabled: false, reason: "MARKET_DISABLED" });
    expect(earning).toEqual({ enabled: false, earningDisabled: true });
    expect(program).toEqual({ enabled: false, earningDisabled: false });
    expect(market).toEqual({ enabled: false, earningDisabled: false });
  });

  it("treats a bare disabled payload as no estimate", () => {
    expect(readEarnPreview({ enabled: false })).toEqual({
      enabled: false,
      earningDisabled: false,
    });
    expect(readEarnPreview(null)).toEqual({ enabled: false, earningDisabled: false });
  });

  it("does not present a zero-point estimate as an earning promise", () => {
    const preview = readEarnPreview({
      enabled: true,
      presentationState: "ESTIMATE",
      earning: { eligibleAmount: "0.00", rewardValue: "0.00", estimatedPoints: 0, currencyCode: "AED" },
    });
    expect(preview.enabled).toBe(false);
  });

  it("keeps each market's own estimate and currency", () => {
    const uae = readEarnPreview(liveCartPreview);
    const ksa = readEarnPreview({
      enabled: true,
      presentationState: "ESTIMATE",
      earning: { eligibleAmount: "325.00", estimatedPoints: 487, currencyCode: "SAR" },
    });
    if (!uae.enabled || !ksa.enabled) throw new Error("expected enabled previews");
    expect(uae.estimatedPoints).toBe(1625);
    expect(uae.currencyCode).toBe("AED");
    expect(ksa.estimatedPoints).toBe(487);
    expect(ksa.currencyCode).toBe("SAR");
    expect(uae.estimatedPoints + ksa.estimatedPoints).not.toBe(uae.estimatedPoints);
  });
});

describe("live L2 payloads", () => {
  it("reads the PDP estimate captured from product-earn-preview", () => {
    const preview = readEarnPreview({
      enabled: true,
      presentationState: "ESTIMATE",
      earning: {
        eligibleAmount: "120.00",
        rewardValue: "6.00",
        estimatedPoints: 600,
        currencyCode: "AED",
        rewardRatePercent: "5.0000",
        pointValue: "0.010000",
      },
    });
    if (!preview.enabled) throw new Error("expected an enabled preview");
    expect(preview.estimatedPoints).toBe(600);
  });

  it("reads a cart estimate the server already reduced by a promotion", () => {
    // Live: cart subtotal 495.00, promotion -50.00, so the server basis is
    // 445.00 and the points follow from it. The browser subtracts nothing.
    const preview = readEarnPreview({
      enabled: true,
      presentationState: "ESTIMATE",
      earning: {
        eligibleAmount: "445.00",
        rewardValue: "22.25",
        estimatedPoints: 2225,
        currencyCode: "AED",
        rewardRatePercent: "5.0000",
        pointValue: "0.010000",
      },
    });
    if (!preview.enabled) throw new Error("expected an enabled preview");
    expect(preview.eligibleAmount).toBe(445);
    expect(preview.eligibleAmount).not.toBe(495);
    expect(preview.estimatedPoints).toBe(2225);
  });

  it("reads earning disabled for a market where earning is off", () => {
    expect(readEarnPreview({ enabled: false, reason: "EARNING_DISABLED" })).toEqual({
      enabled: false,
      earningDisabled: true,
    });
  });

  it("reads an empty earn-preview target and an unearned order", () => {
    expect(readEarnPreview({ enabled: false })).toEqual({
      enabled: false,
      earningDisabled: false,
    });
    expect(readOrderReward({ earned: false })).toEqual({
      earned: false,
      redemption: { redeemed: false },
    });
  });
});

describe("order reward reader", () => {
  it("reads frozen pending points", () => {
    const reward = readOrderReward({
      earned: true,
      orderId: "order-1",
      points: 1625,
      presentationState: "PENDING",
      currencyCode: "AED",
      rewardValue: "16.25",
      eligibleAmount: "325.00",
      vestedAt: null,
    });
    expect(reward).toEqual({
      earned: true,
      orderId: "order-1",
      points: 1625,
      state: "PENDING",
      currencyCode: "AED",
      vestedAt: null,
      redemption: { redeemed: false },
    });
  });

  it("reads a vested order as available", () => {
    const reward = readOrderReward({
      earned: true,
      orderId: "order-1",
      points: 1625,
      presentationState: "AVAILABLE",
      currencyCode: "AED",
      vestedAt: "2026-10-20T00:00:00.000Z",
    });
    if (!reward.earned) throw new Error("expected an earned order");
    expect(reward.state).toBe("AVAILABLE");
    expect(reward.vestedAt).toBe("2026-10-20T00:00:00.000Z");
  });

  it("returns nothing for an order that earned nothing", () => {
    expect(readOrderReward({ earned: false })).toEqual({
      earned: false,
      redemption: { redeemed: false },
    });
    expect(readOrderReward({ earned: true, points: 0, presentationState: "PENDING" })).toEqual({
      earned: false,
      redemption: { redeemed: false },
    });
    expect(readOrderReward(null)).toEqual({
      earned: false,
      redemption: { redeemed: false },
    });
  });
});

describe("transaction lifecycle state", () => {
  it("reads a pending earn row", () => {
    const rows = readLoyaltyTransactions({
      items: [
        {
          id: "ledger-1",
          type: "POINTS_PENDING",
          state: "PENDING",
          points: 1625,
          currencyCode: "AED",
          occurredAt: "2026-10-05T12:00:00.000Z",
        },
      ],
    });
    expect(rows[0]).toMatchObject({ label: "Points pending", state: "Pending", points: 1625 });
  });

  it("reads a vested earn row as available", () => {
    const rows = readLoyaltyTransactions({
      items: [
        { id: "ledger-2", type: "POINTS_AVAILABLE", state: "AVAILABLE", points: 1625 },
      ],
    });
    expect(rows[0]).toMatchObject({ label: "Points available", state: "Available" });
    expect(rows[0]?.label).not.toBe("EARN_VEST");
    expect(rows[0]?.label).not.toBe("POINTS_AVAILABLE");
  });

  it("reads an expiry row only from the server state", () => {
    const rows = readLoyaltyTransactions({
      items: [
        { id: "ledger-3", type: "POINTS_EXPIRED", state: "EXPIRED", points: -250 },
        { id: "ledger-4", type: "POINTS_ADJUSTMENT", points: 10 },
      ],
    });
    expect(rows[0]).toMatchObject({ label: "Points expired", state: "Expired", points: -250 });
    expect(rows[1]?.state).toBeNull();
  });
});
