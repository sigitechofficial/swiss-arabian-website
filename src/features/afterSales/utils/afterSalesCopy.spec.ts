import { describe, expect, it } from "vitest";
import ar from "@/messages/ar.json";
import { createTranslator, englishTranslator, type MessageValue } from "@/lib/i18n/messages";
import { afterSalesCopyText } from "./afterSalesCopy";

const arabic = createTranslator("ar", ar as unknown as Record<string, MessageValue>);

describe("afterSalesCopyText", () => {
  it("renders the window with a plural day count", () => {
    const item = {
      key: "RETURN_WINDOW",
      variant: "DELIVERED",
      values: { days: 14 },
      text: "You can request a return within 14 days of delivery.",
    };
    expect(afterSalesCopyText(item, englishTranslator, "en")).toBe(
      "You can request a return within 14 days of delivery.",
    );
    expect(afterSalesCopyText({ ...item, values: { days: 1 } }, englishTranslator, "en")).toBe(
      "You can request a return within 1 day of delivery.",
    );
    expect(afterSalesCopyText(item, arabic, "ar")).toContain("14");
  });

  it("formats money and lists our-fault reasons in the page language", () => {
    const item = {
      key: "RETURN_SHIPPING_FEE",
      variant: "FLAT",
      values: { amount: "15.00", currencyCode: "AED" },
      reasonCodes: ["DAMAGED_ITEM", "WRONG_ITEM"],
      text: "backend text",
    };
    expect(afterSalesCopyText(item, englishTranslator, "en")).toBe(
      "A return shipping fee of AED 15.00 is deducted from your refund. It is waived when the return is our fault (Damaged item or Wrong item received).",
    );
    const inArabic = afterSalesCopyText(item, arabic, "ar");
    expect(inArabic).toContain("AED 15.00");
    expect(inArabic).not.toContain("{reasons}");
    expect(inArabic).not.toBe("backend text");
  });

  it("falls back to the backend's English for wording the site does not know yet", () => {
    expect(
      afterSalesCopyText(
        { key: "NEW_RULE", variant: "X", values: {}, text: "A brand new rule." },
        englishTranslator,
        "en",
      ),
    ).toBe("A brand new rule.");
  });

  it("covers every variant the backend sends", () => {
    const variants = [
      "RETURN_WINDOW.DELIVERED", "RETURN_WINDOW.SHIPPED", "RETURN_WINDOW.DISABLED",
      "LATE_REQUESTS.CLOSED", "LATE_REQUESTS.REVIEWED",
      "WHO_CAN_REQUEST.EVERYONE", "WHO_CAN_REQUEST.SIGNED_IN", "WHO_CAN_REQUEST.STAFF_ONLY",
      "OPENED_ITEMS.RETURNABLE", "OPENED_ITEMS.OUR_FAULT_ONLY", "OPENED_ITEMS.UNOPENED_ONLY",
      "NON_RETURNABLE_ITEMS.SOME",
      "RETURN_SHIPPING_FEE.FREE", "RETURN_SHIPPING_FEE.FLAT", "RETURN_SHIPPING_FEE.FLAT_ALWAYS",
      "RESTOCKING_FEE.NONE", "RESTOCKING_FEE.PERCENT", "RESTOCKING_FEE.PERCENT_ALWAYS",
      "DELIVERY_REFUND.ALWAYS", "DELIVERY_REFUND.OUR_FAULT_ONLY", "DELIVERY_REFUND.NEVER",
      "FREE_GIFT.DEDUCT_UNLESS_RETURNED", "FREE_GIFT.MUST_RETURN", "FREE_GIFT.KEEP_FREE",
      "EXCHANGES.AVAILABLE", "EXCHANGES.DISABLED",
      "REFUND_TIMING.ON_INSPECTION", "REFUND_TIMING.STAFF_REQUEST",
      "REFUND_DESTINATION.STORED_VALUE_FIRST", "REFUND_DESTINATION.CARD_FIRST",
      "REFUND_DESTINATION.PROPORTIONAL",
      "EARNED_POINTS.NEGATIVE_BALANCE", "EARNED_POINTS.DEDUCT_FROM_REFUND",
      "REDEEMED_POINTS.ORIGINAL_EXPIRY", "REDEEMED_POINTS.MARKET_EXPIRY_FROM_RESTORE",
      "ESTIMATE.FINAL_AFTER_INSPECTION",
      "ESTIMATE_OPENED_ITEMS.OUR_FAULT_ONLY", "ESTIMATE_OPENED_ITEMS.NOT_REFUNDED",
      "ESTIMATE_FEES.WAIVED_OUR_FAULT", "ESTIMATE_FREE_GIFT.DEDUCTED",
      "ESTIMATE_SPENT_POINTS.DEDUCTED",
      "ESTIMATE_DELIVERY.REFUNDED", "ESTIMATE_DELIVERY.NO_FEE", "ESTIMATE_DELIVERY.ALREADY_REFUNDED",
      "ESTIMATE_DELIVERY.NOT_FULL_ORDER", "ESTIMATE_DELIVERY.NOT_FULL_ORDER_OUR_FAULT",
      "ESTIMATE_DELIVERY.REASON_NOT_OUR_FAULT", "ESTIMATE_DELIVERY.NOT_REFUNDED",
    ];
    for (const kv of variants) {
      const [key, variant] = kv.split(".");
      const item = {
        key,
        variant,
        values: { days: 7, amount: "5.00", currencyCode: "AED", percent: "10", points: "50" },
        reasonCodes: ["DAMAGED_ITEM"],
        text: "FALLBACK",
      };
      for (const [t, locale] of [[englishTranslator, "en"], [arabic, "ar"]] as const) {
        const text = afterSalesCopyText(item, t, locale);
        expect(text, `${kv} (${locale})`).not.toBe("FALLBACK");
        expect(text, `${kv} (${locale})`).not.toMatch(/\{\w+\}/);
      }
    }
  });
});
