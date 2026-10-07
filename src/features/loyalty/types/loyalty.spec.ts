import { describe, expect, it } from "vitest";
import { readLoyaltyTransactions, readLoyaltyWallet } from "./loyalty";

const active = {
  membership: { status: "ACTIVE" },
  market: { zoneCode: "UAE", currencyCode: "AED", enabled: true },
  policy: { rewardRate: "0.05", pointValue: "0.01" },
  wallet: {
    availablePoints: 5420,
    pendingPoints: 800,
    reservedPoints: 0,
    availableValue: "54.20",
    currencyCode: "AED",
  },
};

describe("loyalty wallet reader", () => {
  it("reads an active member from the server wallet", () => {
    const wallet = readLoyaltyWallet(active);
    expect(wallet.availability).toBe("ACTIVE");
    expect(wallet.availablePoints).toBe(5420);
    expect(wallet.pendingPoints).toBe(800);
    expect(wallet.reservedPoints).toBe(0);
    expect(wallet.availableValue).toBe(54.2);
    expect(wallet.currencyCode).toBe("AED");
    expect(wallet.zoneCode).toBe("UAE");
  });

  it("keeps a new member at zero without inventing a monetary equivalent", () => {
    const wallet = readLoyaltyWallet({
      ...active,
      wallet: {
        availablePoints: 0,
        pendingPoints: 0,
        reservedPoints: 0,
        currencyCode: "AED",
      },
    });
    expect(wallet.availablePoints).toBe(0);
    expect(wallet.availableValue).toBeNull();
  });

  it("does not price points from point value", () => {
    const wallet = readLoyaltyWallet({
      ...active,
      wallet: {
        availablePoints: 5420,
        pendingPoints: 0,
        reservedPoints: 0,
        currencyCode: "AED",
      },
    });
    expect(wallet.availableValue).toBeNull();
    expect(wallet.availableValue).not.toBe(54.2);
  });

  it("uses the server equivalent when a clamp or override differs from point value", () => {
    const wallet = readLoyaltyWallet({
      ...active,
      policy: { pointValue: "0.01" },
      wallet: { availablePoints: 1000, availableValue: "8.00", currencyCode: "SAR" },
    });
    expect(wallet.availableValue).toBe(8);
    expect(wallet.currencyCode).toBe("SAR");
  });

  it("treats a disabled market as unavailable instead of a zero balance", () => {
    const wallet = readLoyaltyWallet({
      status: "DISABLED",
      wallet: { availablePoints: 0, pendingPoints: 0, reservedPoints: 0 },
    });
    expect(wallet.availability).toBe("DISABLED");
    expect(wallet.unavailableMessage).toBe(
      "Swiss Arabian Rewards is not currently available in this market.",
    );
  });

  it("keeps a customer debt sentence and drops raw ledger language", () => {
    const shown = readLoyaltyWallet({
      wallet: {
        availablePoints: 10,
        debtLabel: "A previous reward adjustment is still open.",
      },
    });
    const hidden = readLoyaltyWallet({
      wallet: { availablePoints: -20, debtLabel: "RECONCILIATION_ADJUSTMENT" },
    });
    expect(shown.debtLabel).toBe("A previous reward adjustment is still open.");
    expect(hidden.debtLabel).toBeNull();
  });
});

/** Shapes copied from `StorefrontLoyaltyService` (Backend L1/L1.1). */
describe("live backend contract", () => {
  const liveActive = {
    enabled: true,
    member: true,
    program: { code: "SWISS_LOYALTY", name: "Swiss Arabian Rewards" },
    market: { code: "UAE", currencyCode: "AED" },
    wallet: {
      availablePoints: 5420,
      pendingPoints: 800,
      reservedPoints: 0,
      debtPoints: 0,
    },
    monetaryEquivalent: { available: "54.20", currencyCode: "AED" },
    policy: { rewardRatePercent: "5.0000", pointValue: "0.010000" },
  };

  it("reads monetaryEquivalent.available for the money figure", () => {
    const wallet = readLoyaltyWallet(liveActive);
    expect(wallet.availability).toBe("ACTIVE");
    expect(wallet.availablePoints).toBe(5420);
    expect(wallet.pendingPoints).toBe(800);
    expect(wallet.reservedPoints).toBe(0);
    expect(wallet.availableValue).toBe(54.2);
    expect(wallet.currencyCode).toBe("AED");
    expect(wallet.zoneCode).toBe("UAE");
  });

  it("does not multiply points by the policy point value", () => {
    const wallet = readLoyaltyWallet({
      ...liveActive,
      wallet: { availablePoints: 5420, pendingPoints: 0, reservedPoints: 0, debtPoints: 0 },
      monetaryEquivalent: { available: "40.00", currencyCode: "AED" },
      policy: { rewardRatePercent: "5.0000", pointValue: "0.010000" },
    });
    expect(wallet.availableValue).toBe(40);
    expect(wallet.availableValue).not.toBe(54.2);
  });

  it("keeps a second market wallet in its own currency with no FX", () => {
    // Verified live: the same customer has UAE 5420/AED 54.20 and KSA 0/SAR 0.00.
    const second = readLoyaltyWallet({
      ...liveActive,
      market: { code: "KSA", currencyCode: "SAR" },
      wallet: { availablePoints: 0, pendingPoints: 0, reservedPoints: 0, debtPoints: 0 },
      monetaryEquivalent: { available: "0.00", currencyCode: "SAR" },
      policy: { rewardRatePercent: "3.0000", pointValue: "0.020000" },
    });
    expect(second.zoneCode).toBe("KSA");
    expect(second.currencyCode).toBe("SAR");
    expect(second.availablePoints).toBe(0);
    expect(readLoyaltyWallet(liveActive).availablePoints).toBe(5420);
  });

  it("reads the program-disabled reason", () => {
    const wallet = readLoyaltyWallet({
      enabled: false,
      member: false,
      reason: "LOYALTY_NOT_AVAILABLE",
    });
    expect(wallet.availability).toBe("DISABLED");
    expect(wallet.unavailableMessage).toBe("Swiss Arabian Rewards is not currently available.");
    expect(wallet.availableValue).toBeNull();
  });

  it("reads the market-disabled reason", () => {
    const wallet = readLoyaltyWallet({
      enabled: false,
      member: false,
      reason: "LOYALTY_NOT_AVAILABLE_IN_THIS_MARKET",
    });
    expect(wallet.availability).toBe("DISABLED");
    expect(wallet.unavailableMessage).toBe(
      "Swiss Arabian Rewards is not currently available in this market.",
    );
  });

  it("leaves debt points out of the summary without a customer-safe label", () => {
    const wallet = readLoyaltyWallet({
      ...liveActive,
      wallet: { availablePoints: 0, pendingPoints: 0, reservedPoints: 0, debtPoints: 40 },
    });
    expect(wallet.debtLabel).toBeNull();
  });

  it("renders a real ledger row from the presentation key", () => {
    // Payload copied from a live MANUAL_CREDIT entry: the server sends the
    // presentation key `POINTS_ADJUSTMENT`, never the ledger enum, and omits
    // reasonCode / metadata entirely.
    const rows = readLoyaltyTransactions({
      enabled: true,
      member: true,
      items: [
        {
          id: "33ef73dc-3d42-4462-93e3-d340b616846a",
          type: "POINTS_ADJUSTMENT",
          points: 5420,
          currencyCode: "AED",
          moneyEquivalent: "54.20",
          occurredAt: "2026-10-05T11:42:03.652Z",
        },
      ],
      pageInfo: { total: 1, limit: 20, offset: 0, hasMore: false },
      currencyCode: "AED",
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: "33ef73dc-3d42-4462-93e3-d340b616846a",
      label: "Points adjustment",
      points: 5420,
      occurredAt: "2026-10-05T11:42:03.652Z",
    });
    expect(rows[0]?.label).not.toBe("POINTS_ADJUSTMENT");
    expect(rows[0]?.label).not.toBe("MANUAL_CREDIT");
    expect(rows[0]?.detail).toBeNull();
  });

  it("returns an empty live history for a new wallet", () => {
    expect(
      readLoyaltyTransactions({
        enabled: true,
        member: true,
        items: [],
        pageInfo: { total: 0, limit: 20, offset: 0, hasMore: false },
        currencyCode: "AED",
      }),
    ).toEqual([]);
  });

  it("returns no rows for a disabled transactions response", () => {
    expect(
      readLoyaltyTransactions({
        enabled: false,
        member: false,
        reason: "LOYALTY_NOT_AVAILABLE",
        items: [],
        pageInfo: { total: 0, limit: 20, offset: 0, hasMore: false },
      }),
    ).toEqual([]);
  });

  it("maps every backend presentation key to customer copy", () => {
    const keys = [
      "POINTS_ADJUSTMENT",
      "POINTS_PENDING",
      "POINTS_EARNED",
      "POINTS_RESERVED",
      "POINTS_RELEASED",
      "POINTS_REDEEMED",
      "POINTS_EXPIRED",
      "REFUND_ADJUSTMENT",
    ];
    const rows = readLoyaltyTransactions({
      items: keys.map((type, index) => ({
        id: `row-${index}`,
        type,
        points: 1,
        customerVisible: type === "POINTS_RESERVED" || type === "POINTS_RELEASED" ? true : undefined,
      })),
    });
    expect(rows).toHaveLength(keys.length);
    for (const row of rows) {
      expect(row.label).not.toMatch(/^[A-Z0-9_]+$/);
      expect(row.label).not.toBe("Reward activity");
    }
  });
});

describe("loyalty transaction reader", () => {
  it("returns an empty history", () => {
    expect(readLoyaltyTransactions({ items: [] })).toEqual([]);
  });

  it("uses customer labels and hides raw ledger enums", () => {
    const rows = readLoyaltyTransactions({
      items: [
        {
          id: "tx-1",
          label: "Order earned",
          detail: "Order 10842",
          points: 150,
          occurredAt: "2026-07-24T00:00:00.000Z",
        },
        { id: "tx-2", type: "MANUAL_CREDIT", pointsDelta: 20 },
      ],
    });
    expect(rows[0]).toMatchObject({ label: "Order earned", detail: "Order 10842", points: 150 });
    expect(rows[1]?.label).toBe("Reward activity");
    expect(rows[1]?.label).not.toBe("MANUAL_CREDIT");
  });
});
