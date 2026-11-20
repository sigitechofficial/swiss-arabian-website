import { describe, expect, it } from "vitest";
import { englishTranslator } from "@/lib/i18n/messages";
import type { ReturnEstimate } from "../types/afterSales";
import { requestUnitCount } from "./requestUnits";
import { returnEstimateView } from "./returnEstimateView";

const copy = (key: string) => ({ key, variant: "default", values: {}, text: key });

const estimate = (over: Partial<ReturnEstimate> = {}): ReturnEstimate => ({
  orderId: "o1",
  orderNumber: "SA-1",
  currencyCode: "AED",
  policyVersion: null,
  isEstimate: true,
  reasonCode: "CUSTOMER_CHANGED_MIND",
  ourFaultReason: false,
  taxIncluded: true,
  lines: [],
  itemsAmount: "95.24",
  taxAmount: "4.76",
  itemsTotal: "100.00",
  delivery: { refunded: false, amount: "0", reason: "x", message: copy("delivery") },
  deductions: {
    returnShippingFee: { amount: "10", waived: false },
    restockingFee: { amount: "0", percent: "0", waived: false },
    freeGift: { amount: "0", gifts: [] },
    spentPoints: { amount: "0", points: "0" },
  },
  totalDeductions: "10",
  estimatedRefund: "90.00",
  refundDestination: copy("destination"),
  giftRequirement: { required: false, code: null, message: null, gifts: [] },
  notes: [copy("note")],
  ...over,
});

describe("returnEstimateView", () => {
  it("lays out items with VAT, delivery, each fee and the refund", () => {
    const view = returnEstimateView(estimate(), englishTranslator, "en");
    expect(view.rows.map((r) => r.key)).toEqual(["items", "delivery", "returnShipping", "total"]);
    expect(view.rows[0].hint).toMatch(/VAT/);
    expect(view.rows.find((r) => r.key === "returnShipping")?.value).toMatch(/^− /);
    expect(view.rows.at(-1)).toMatchObject({ strong: true });
    expect(view.giftRequired).toBeNull();
    expect(view.notes).toHaveLength(1);
  });

  it("names a waived fee and says which free gift has to come back", () => {
    const view = returnEstimateView(
      estimate({
        taxIncluded: false,
        deductions: {
          returnShippingFee: { amount: "0", waived: true },
          restockingFee: { amount: "0", percent: "0", waived: false },
          freeGift: { amount: "20", gifts: [{ orderLineId: "g1", sku: "G", productName: "Mini", quantity: 1, value: "20" }] },
          spentPoints: { amount: "5", points: "500" },
        },
        giftRequirement: { required: true, code: "RETURN_GIFT_REQUIRED", message: null, gifts: [{ orderLineId: "g1", sku: "G", productName: "Mini", quantity: 1, value: "20" }] },
      }),
      englishTranslator,
      "en",
    );
    const keys = view.rows.map((r) => r.key);
    expect(keys).toEqual(["items", "vat", "delivery", "returnShipping", "freeGift", "spentPoints", "total"]);
    expect(view.rows.find((r) => r.key === "freeGift")?.hint).toBe("Mini");
    expect(view.giftRequired).toEqual({ lineIds: ["g1"] });
  });
});

describe("requestUnitCount", () => {
  it("counts units asked for, falling back to lines on older APIs", () => {
    expect(requestUnitCount({ itemCount: 1, unitCount: 3 })).toBe(3);
    expect(requestUnitCount({ itemCount: 2 })).toBe(2);
  });
});

describe("returnEstimateView delivery", () => {
  it("says there is no fee when none was charged, and 'not refunded' only when one was", () => {
    const row = (reason: string) =>
      returnEstimateView(estimate({ delivery: { refunded: false, amount: "0", reason, message: copy("d") } }), englishTranslator, "en").rows.find(
        (r) => r.key === "delivery",
      )?.value;
    expect(row("NO_SHIPPING_CHARGED")).toBe("None");
    expect(row("NOT_FULL_ORDER")).toBe("Not refunded");
  });
});
