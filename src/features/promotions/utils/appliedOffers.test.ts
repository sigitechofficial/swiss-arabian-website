import { describe, expect, it } from "vitest";
import ar from "@/messages/ar.json";
import { createTranslator } from "@/lib/i18n/messages";
import type { PromotionApplied, PromotionSnapshotV1 } from "../types/promotions";
import { appliedOfferRows } from "./appliedOffers";

const applied = (over: Partial<PromotionApplied>): PromotionApplied => ({
  kind: "AUTOMATIC",
  code: null,
  label: "Offer",
  discountType: "PERCENTAGE",
  discountValue: "10",
  level: "ORDER",
  amount: "0",
  ...over,
});

const snapshot = (items: PromotionApplied[]): PromotionSnapshotV1 =>
  ({
    v: 1,
    computedAt: null,
    context: { currencyCode: "AED" },
    applied: items,
    lineAllocations: [],
    totals: { discountTotal: "0" },
    rejected: [],
  }) as unknown as PromotionSnapshotV1;

describe("appliedOfferRows", () => {
  it("lists savings with the chosen tier's percent, and leaves out coupons", () => {
    const rows = appliedOfferRows(
      snapshot([
        applied({ label: "Spend more, save more", amount: "24.00", metadata: { selectedTier: { percentage: "15.00" } } }),
        applied({ kind: "COUPON", code: "WELCOME", amount: "10" }),
      ]),
    );
    expect(rows).toEqual([
      expect.objectContaining({ label: "Spend more, save more", kind: "saving", amount: 24, tierPercent: "15" }),
    ]);
  });

  it("shows a fixed-amount buy-X-get-Y and part of delivery as 'applied' amounts", () => {
    const rows = appliedOfferRows(
      snapshot([
        applied({ discountType: "BUY_X_GET_Y", amount: "40", metadata: { rewardType: "FIXED_AMOUNT" } }),
        applied({ level: "SHIPPING", discountType: "FIXED_AMOUNT", amount: "5" }),
      ]),
    );
    expect(rows.map((r) => r.kind)).toEqual(["applied", "applied"]);
  });

  it("drops free gifts at checkout (they are order lines there)", () => {
    const items = [applied({ discountType: "GIFT_WITH_PURCHASE", label: "Free mini" })];
    expect(appliedOfferRows(snapshot(items))).toHaveLength(1);
    expect(appliedOfferRows(snapshot(items), { hideGifts: true })).toHaveLength(0);
  });

  it("words free delivery and fallback labels in the page's language", () => {
    const t = createTranslator("ar", ar as unknown as Parameters<typeof createTranslator>[1]);
    const [row] = appliedOfferRows(
      snapshot([applied({ kind: "FREE_SHIPPING", discountType: "FREE_SHIPPING", label: null, amount: "0" })]),
      { t },
    );
    expect(row).toMatchObject({ kind: "status", label: "توصيل مجاني", status: "توصيل مجاني" });
    // English stays the default (server code and older callers).
    expect(appliedOfferRows(snapshot([applied({ label: null, amount: "0" })]))[0]).toMatchObject({ label: "Offer", status: "Applied" });
  });
});
