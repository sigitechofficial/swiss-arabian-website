import { describe, expect, it } from "vitest";
import type { CancelItemsPreview } from "@/features/account/api/customerOrders.service";
import { englishTranslator } from "@/lib/i18n/messages";
import { cancelPreviewLines, cancellableOrderLines, cancellableUnits } from "./cancelItems";

const line = (over: Partial<Parameters<typeof cancellableOrderLines>[0][number]> = {}) => ({
  orderLineId: "l1",
  productName: "Royale Oud",
  sku: "RO-100",
  quantity: "2",
  unitPrice: "120.00",
  isGift: false,
  cancelled: false,
  ...over,
});

const preview = (over: Partial<CancelItemsPreview> = {}): CancelItemsPreview => ({
  wholeOrder: false,
  cashOnDelivery: false,
  cancelledAmount: "120.00",
  offerAdjustmentAmount: "0",
  deliveryChargeAmount: "0",
  refundAmount: "120.00",
  totalBefore: "240.00",
  totalAfter: "120.00",
  giftsRemoved: [],
  ...over,
});

const money = (value: string) => `AED ${Number(value).toFixed(2)}`;

describe("cancellableOrderLines", () => {
  it("keeps active paid lines and leaves out gifts and cancelled lines", () => {
    const lines = cancellableOrderLines([
      line(),
      line({ orderLineId: "gift", isGift: true }),
      line({ orderLineId: "gone", cancelled: true }),
      line({ orderLineId: "l2", productName: null, sku: "MU-50", quantity: "x", unitPrice: "80" }),
    ]);
    expect(lines).toEqual([
      { orderLineId: "l1", name: "Royale Oud", quantity: 2, unitPrice: 120 },
      // A missing name falls back to the SKU; an unreadable quantity counts as one.
      { orderLineId: "l2", name: "MU-50", quantity: 1, unitPrice: 80 },
    ]);
    expect(cancellableUnits(lines)).toBe(3);
  });
});

describe("cancelPreviewLines", () => {
  it("says the whole order goes when every item is picked", () => {
    expect(cancelPreviewLines(preview({ wholeOrder: true }), money, englishTranslator)).toEqual([
      expect.objectContaining({ key: "whole", tone: "strong" }),
    ]);
  });

  it("lists offer and delivery changes, gifts that go, the refund and the new total", () => {
    const lines = cancelPreviewLines(
      preview({
        offerAdjustmentAmount: "10",
        deliveryChargeAmount: "15",
        refundAmount: "95",
        giftsRemoved: [{ orderLineId: "g", sku: "GIFT-1", productName: "Mini Musk" }],
      }),
      money,
      englishTranslator,
    );
    expect(lines.map((l) => l.key)).toEqual(["items", "offer", "delivery", "gifts", "refund", "newTotal"]);
    expect(lines.find((l) => l.key === "gifts")?.text).toContain("Mini Musk");
    expect(lines.find((l) => l.key === "refund")).toMatchObject({ tone: "strong" });
    expect(lines.find((l) => l.key === "refund")?.text).toContain("AED 95.00");
  });

  it("gives cash on delivery the new amount to pay and no refund line", () => {
    const keys = cancelPreviewLines(preview({ cashOnDelivery: true, refundAmount: "0" }), money, englishTranslator).map((l) => l.key);
    expect(keys).toEqual(["items", "cod"]);
  });

  it("says when nothing comes back", () => {
    const keys = cancelPreviewLines(preview({ refundAmount: "0" }), money, englishTranslator).map((l) => l.key);
    expect(keys).toContain("noRefund");
  });
});
