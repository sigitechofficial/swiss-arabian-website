import { describe, expect, it } from "vitest";
import { formatMoney } from "@/features/home/utils/formatMoney";
import {
  amountPayableFrom,
  checkoutQuoteSnapshot,
  appliedPromotionView,
  giftCardSignature,
  parseGiftCardTender,
  readApplicablePromotions,
  shippingDiscountAmount,
  visibleApplied,
  visibleGiftCards,
} from "./promotions";
import type { PromotionApplied, PromotionSnapshotV1 } from "./promotions";

const snapshot = {
  v: 1,
  computedAt: null,
  context: { brandCode: "SA", zoneCode: "UAE", currencyCode: "AED", salesChannelCode: "platform_uae" },
  applied: [],
  lineAllocations: [],
  totals: { discountTotal: "0.00", amountPayable: "80.00" },
  rejected: [],
  giftCards: [{ usageId: "u1", maskedCode: "••••XM", amount: "50.00" }],
} satisfies PromotionSnapshotV1;

describe("server money formatting", () => {
  it("renders decimal strings through currency formatting", () => {
    expect(formatMoney(Number("0.00"))).toBe("AED 0.00");
    expect(formatMoney(Number("20.00"))).toBe("AED 20.00");
    expect(formatMoney(Number("100.50"))).toBe("AED 100.50");
  });
});

describe("gift card snapshot helpers", () => {
  it("reads tender rows and skips empty objects", () => {
    expect(visibleGiftCards(snapshot)).toEqual([
      {
        usageId: "u1",
        maskedCode: "••••XM",
        amount: "50.00",
        remainingBalance: null,
        currencyCode: null,
        status: null,
      },
    ]);
    expect(parseGiftCardTender({})).toBeNull();
  });

  it("uses server amountPayable and does not subtract the gift card", () => {
    expect(amountPayableFrom(snapshot)).toBe(80);
    expect(giftCardSignature(snapshot)).toBe("u1:50.00");
  });

  it("prefers the checkout payable over a stale promotion snapshot", () => {
    const stale = {
      ...snapshot,
      totals: { ...snapshot.totals, amountPayable: "99.00" },
    };
    expect(amountPayableFrom(stale, ["199.00"])).toBe(199);
    expect(amountPayableFrom(stale, ["100.00"])).toBe(100);
    expect(amountPayableFrom(stale, ["200.00"])).toBe(200);
    expect(amountPayableFrom(stale, ["90.00"])).toBe(90);
    expect(amountPayableFrom(stale, ["150.00"])).toBe(150);
    expect(amountPayableFrom(stale, [null, ""])).toBe(99);
  });

  it("uses the rebuilt checkout quote after delivery selection", () => {
    const cart = {
      ...snapshot,
      totals: { ...snapshot.totals, shippingDiscount: "0.00", amountPayable: "99.00" },
      applied: [],
    };
    const matched = {
      ...snapshot,
      applied: [
        {
          kind: "AUTOMATIC" as const,
          code: "SHIP50",
          label: "50% off shipping",
          discountType: "PERCENTAGE",
          discountValue: "50",
          level: "SHIPPING",
          amount: "50.00",
        },
      ],
      totals: { discountTotal: "0.00", shippingDiscount: "50.00", amountPayable: "149.00" },
    };
    const removed = {
      ...snapshot,
      applied: [],
      totals: { discountTotal: "0.00", shippingDiscount: "0.00", amountPayable: "199.00" },
    };
    expect(checkoutQuoteSnapshot({ promotions: matched }, cart)?.totals.shippingDiscount).toBe("50.00");
    expect(checkoutQuoteSnapshot({ promotions: removed }, cart)?.applied).toEqual([]);
    expect(amountPayableFrom(checkoutQuoteSnapshot({ promotions: matched }, cart), ["149.00"])).toBe(149);
    expect(amountPayableFrom(cart, ["199.00"])).toBe(199);
  });
});

function applied(partial: Partial<PromotionApplied> & Pick<PromotionApplied, "kind" | "amount">): PromotionApplied {
  return {
    code: null,
    label: null,
    discountType: null,
    discountValue: null,
    level: null,
    ...partial,
  };
}

function quote(rows: PromotionApplied[], totals: PromotionSnapshotV1["totals"] = { discountTotal: "0" }): PromotionSnapshotV1 {
  return {
    v: 1,
    computedAt: "2026-09-28T00:00:00.000Z",
    context: { brandCode: null, zoneCode: "UAE", currencyCode: "AED", salesChannelCode: null },
    applied: rows,
    lineAllocations: [],
    totals,
    rejected: [],
  };
}

describe("applied promotion rows", () => {
  it("renders a percentage coupon from the server amount", () => {
    const view = appliedPromotionView(
      applied({
        kind: "COUPON",
        code: "EID10",
        label: "Eid 10%",
        discountType: "PERCENTAGE",
        amount: "25.00",
      }),
    );
    expect(view.label).toBe("Eid 10%");
    expect(view.amount).toBe(25);
  });

  it("renders a coupon BXGY label and server amount without counting units", () => {
    const view = appliedPromotionView(
      applied({
        kind: "COUPON",
        code: "EID3FOR2",
        label: "Buy 2 Perfumes, Get 1 Body Spray Free",
        discountType: "BUY_X_GET_Y",
        amount: "50",
        metadata: { maxRewardQuantity: 1, buyQty: 2, getQty: 1 },
      }),
      quote([], { discountTotal: "50.00" }),
    );
    expect(view.label).toBe("Buy 2 Perfumes, Get 1 Body Spray Free");
    expect(view.amount).toBe(50);
    expect(JSON.stringify(view)).not.toContain("maxRewardQuantity");
  });

  it("renders a free-shipping coupon without a zero merchandise amount", () => {
    const snap = quote(
      [
        applied({
          kind: "COUPON",
          code: "FREESHIP",
          label: "Weekend delivery",
          discountType: "FREE_SHIPPING",
          level: "SHIPPING",
          amount: "0",
        }),
      ],
      { discountTotal: "0.00", shippingDiscount: "25.00" },
    );
    const view = appliedPromotionView(snap.applied[0], snap);
    expect(view.label).toBe("Weekend delivery");
    expect(view.amount).toBeNull();
    expect(view.status).toBe("Free shipping");
    expect(shippingDiscountAmount(snap)).toBe(25);
  });

  it("renders an automatic BXGY row from the server amount", () => {
    const view = appliedPromotionView(
      applied({
        kind: "AUTOMATIC",
        code: "BXGY_3FOR2",
        label: "3 for 2",
        discountType: "BUY_X_GET_Y",
        amount: "40.00",
      }),
    );
    expect(view.label).toBe("3 for 2");
    expect(view.amount).toBe(40);
  });

  it("renders an automatic free-shipping row from the shipping total", () => {
    const snap = quote(
      [
        applied({
          kind: "FREE_SHIPPING",
          code: "SHIP_FREE_300",
          label: null,
          discountType: "FREE_SHIPPING",
          amount: "0",
        }),
      ],
      { discountTotal: "0", shippingDiscount: "18.00" },
    );
    const view = appliedPromotionView(snap.applied[0], snap);
    expect(view.label).toBe("SHIP_FREE_300");
    expect(view.amount).toBe(18);
    expect(view.status).toBeNull();
  });

  it("skips unknown kinds", () => {
    const snap = quote([
      applied({ kind: "LOYALTY", code: "POINTS", label: "Points", amount: "5" }),
      applied({ kind: "AUTOMATIC", code: "AUTO", label: "Auto", amount: "5" }),
    ]);
    expect(visibleApplied(snap).map((item) => item.kind)).toEqual(["AUTOMATIC"]);
  });
});

describe("applicable promotions parsing", () => {
  it("keeps additive eligibility metadata and ignores unknown kinds at render time", () => {
    const parsed = readApplicablePromotions({
      promotions: {
        v: 1,
        futureField: "kept",
        applied: [{ kind: "MYSTERY", code: "X", label: "Nope", amount: "1", discountType: "NOPE" }],
        totals: { discountTotal: "0", shippingDiscount: "0" },
      },
      offers: [
        {
          title: "Free shipping",
          selected: false,
          rejected: { reason: "MIN_ORDER", minOrderAmount: "300" },
          eligibility: { thresholdAmount: "300", remainingAmount: "40", reason: "MIN_ORDER" },
          futureOfferField: true,
        },
      ],
    });
    expect(parsed.promotions.totals.discountTotal).toBe("0");
    expect(parsed.offers[0]?.eligibility?.remainingAmount).toBe("40");
    expect(parsed.offers[0]?.eligibility?.thresholdAmount).toBe("300");
    expect(visibleApplied(parsed.promotions)).toEqual([]);
    expect((parsed.promotions as { futureField?: string }).futureField).toBe("kept");
  });
});
