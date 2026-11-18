import { describe, expect, it } from "vitest";
import { createTranslator } from "@/lib/i18n/messages";
import ar from "@/messages/ar.json";
import {
  readCustomerRefunds,
  refundHeadlineAmount,
  refundPartText,
  refundStateDisplay,
  toOrderRefundView,
} from "./orderRefunds";

const split = {
  refundId: "rf-1",
  refundNumber: "RFND-1",
  state: "completed",
  requestedAmount: "196.00",
  refundedAmount: "196.00",
  currency: "AED",
  requestedAt: "2026-11-18T08:00:00.000Z",
  completedAt: "2026-11-19T10:00:00.000Z",
  parts: [
    { type: "card", label: "Card ending 4242", amount: "96.00", currency: "AED", points: null, cardLast4: "4242", giftCardMaskedCode: null, state: "done" },
    { type: "gift_card", label: "Gift card ••••N5D5", amount: "100.00", currency: "AED", points: null, cardLast4: null, giftCardMaskedCode: "••••N5D5", state: "done" },
    { type: "points", label: "500 reward points", amount: "5.00", currency: "AED", points: "500", cardLast4: null, giftCardMaskedCode: null, state: "pending" },
  ],
};

describe("order refunds", () => {
  it("reads a split refund and words each part for the customer", () => {
    const [refund] = readCustomerRefunds([split]);
    expect(refund.state).toBe("completed");
    expect(refundHeadlineAmount(refund)).toBe("196.00");
    expect(refund.parts.map((part) => refundPartText(part, "AED"))).toEqual([
      "AED 96.00 to your card ending 4242",
      "AED 100.00 to gift card ••••N5D5",
      "500 points",
    ]);
    expect(refund.parts.map((part) => part.state)).toEqual(["done", "done", "pending"]);
  });

  it("falls back to provider-neutral wording", () => {
    const [refund] = readCustomerRefunds([
      {
        ...split,
        state: "processing",
        parts: [
          { type: "card", amount: "40.00", currency: "AED", cardLast4: null, state: "pending" },
          { type: "cash_on_delivery", amount: "20.00", currency: "AED", state: "pending" },
          { type: "gift_card", amount: "5.00", currency: "AED", giftCardMaskedCode: null, state: "pending" },
          { type: "unknown_tender", amount: "1.00" },
        ],
      },
    ]);
    expect(refund.parts.map((part) => refundPartText(part, "AED"))).toEqual([
      "AED 40.00 to your original payment method",
      "AED 20.00 by bank transfer or cash",
      "AED 5.00 to your gift card",
    ]);
  });

  it("maps every customer state to a label, note and tone", () => {
    expect(refundStateDisplay("processing")).toMatchObject({ label: "Processing", tone: "accent" });
    expect(refundStateDisplay("waiting_for_review")).toMatchObject({ label: "Waiting for review", tone: "warning" });
    expect(refundStateDisplay("completed")).toMatchObject({ label: "Completed", tone: "success" });
    expect(refundStateDisplay("manual_payout")).toMatchObject({ label: "Being sent by our team", tone: "accent" });
    expect(refundStateDisplay("manual_payout").note).toMatch(/our team will send this refund/i);
    expect(refundStateDisplay("manual_payout", undefined, [{ type: "cash_on_delivery" }]).note).toMatch(
      /contact you to arrange this refund by bank transfer or cash/i,
    );
    expect(refundStateDisplay("not_approved")).toMatchObject({ label: "Not approved", tone: "danger" });
    expect(refundStateDisplay("cancelled")).toMatchObject({ label: "Cancelled", tone: "muted" });
  });

  it("words parts in Arabic", () => {
    const t = createTranslator("ar", ar as never);
    const [refund] = readCustomerRefunds([split]);
    expect(refundPartText(refund.parts[0], "AED", t)).toBe("AED 96.00 إلى بطاقتك المنتهية بـ 4242");
    expect(refundStateDisplay("waiting_for_review", t).label).toBe("بانتظار المراجعة");
  });

  it("reads older payloads (status + amount) and ignores junk", () => {
    expect(readCustomerRefunds([{ refundId: "rf-9", amount: "25.00", status: "MANUAL_REVIEW" }])).toEqual([
      expect.objectContaining({ refundId: "rf-9", requestedAmount: "25.00", state: "waiting_for_review", parts: [] }),
    ]);
    expect(readCustomerRefunds([{ status: "REJECTED", amount: "1" }])[0].state).toBe("not_approved");
    expect(readCustomerRefunds(undefined)).toEqual([]);
    expect(readCustomerRefunds([null, "x"])).toEqual([]);
  });

  it("keeps the older one-line shape for views that still read it", () => {
    const [refund] = readCustomerRefunds([split]);
    expect(toOrderRefundView(refund)).toMatchObject({
      refundId: "RFND-1",
      amount: "196.00",
      currency: "AED",
      status: "COMPLETED",
      requiresManualReview: false,
    });
  });
});

describe("refund points label", () => {
  it("groups thousands", () => {
    expect(
      refundPartText(
        { type: "points", amount: "10.00", currency: "AED", points: "1000.0000", cardLast4: null, giftCardMaskedCode: null, state: "done" },
        "AED",
      ),
    ).toBe("1,000 points");
  });
});

describe("exchange credit refund part", () => {
  it("names the original order's payment", () => {
    expect(
      refundPartText(
        { type: "original_order", amount: "80.00", currency: "AED", points: null, cardLast4: null, giftCardMaskedCode: null, state: "pending" },
        "AED",
      ),
    ).toMatch(/to how you paid for your original order$/);
  });
});
