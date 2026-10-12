import { describe, expect, it } from "vitest";
import { setBundleLineLabel, setBundleNotes } from "./setBundlePresentation";
import type { PromotionOffer, PromotionSnapshotV1 } from "../types/promotions";

const snapshot = {
  v: 1,
  computedAt: null,
  context: { brandCode: null, zoneCode: null, currencyCode: "AED", salesChannelCode: null },
  applied: [
    {
      kind: "AUTOMATIC",
      code: "SET",
      label: "Set",
      discountType: "PERCENTAGE",
      discountValue: "25",
      level: "ORDER",
      amount: "105.00",
      metadata: {
        setBundle: {
          completedSets: 1,
          message: "You saved 25% on 1 set. Add 1 Body Spray to complete another set.",
          lines: [{ ref: "p1", sku: "VAN", label: "Part of set · 25% off" }],
        },
      },
    },
  ],
  lineAllocations: [],
  totals: { discountTotal: "105.00" },
  rejected: [],
} as PromotionSnapshotV1;

describe("set bundle presentation", () => {
  it("prints a near-miss sentence and does not invent a line badge", () => {
    const offers: PromotionOffer[] = [
      {
        applied: false,
        setBundle: {
          completedSets: 0,
          message: "Add 1 Body Spray to complete your set and get 25% off.",
        },
      },
    ];
    expect(setBundleNotes(offers, null)).toEqual([
      "Add 1 Body Spray to complete your set and get 25% off.",
    ]);
    expect(setBundleLineLabel(null, { cartItemId: "p1", sku: "VAN" })).toBeNull();
  });

  it("hides a savings sentence when that set lost the stack", () => {
    const offers: PromotionOffer[] = [
      {
        applied: false,
        setBundle: {
          completedSets: 1,
          message: "You saved 25% on 1 set. Add 1 Body Spray to complete another set.",
        },
      },
    ];
    expect(setBundleNotes(offers, { ...snapshot, applied: [] })).toEqual([]);
  });

  it("badges only the cart line the quote placed in the set", () => {
    expect(setBundleLineLabel(snapshot, { cartItemId: "p1", sku: "VAN" })).toBe("Part of set · 25% off");
    expect(setBundleLineLabel(snapshot, { cartItemId: "extra", sku: "VAN" })).toBeNull();
    expect(setBundleNotes([], snapshot)).toEqual([
      "You saved 25% on 1 set. Add 1 Body Spray to complete another set.",
    ]);
  });

  it("badges a line counted toward an unfinished set only when the offers are passed", () => {
    const offers: PromotionOffer[] = [
      {
        applied: false,
        setBundle: {
          completedSets: 0,
          pendingLines: [{ ref: "p2", sku: "OUD", label: "Part of bundle" }],
        },
      },
    ];
    expect(setBundleLineLabel(null, { cartItemId: "p2", sku: "OUD" })).toBeNull();
    expect(setBundleLineLabel(null, { cartItemId: "p2", sku: "OUD" }, offers)).toBe("Part of bundle");
    expect(setBundleLineLabel(null, { cartItemId: "other", sku: "OUD" }, offers)).toBeNull();
    // A line inside a discounted set keeps that badge.
    expect(
      setBundleLineLabel(snapshot, { cartItemId: "p1", sku: "VAN" }, [
        { setBundle: { pendingLines: [{ ref: "p1", sku: "VAN", label: "Part of bundle" }] } },
      ]),
    ).toBe("Part of set · 25% off");
  });
});
