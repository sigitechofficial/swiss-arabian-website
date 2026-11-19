import { describe, expect, it } from "vitest";
import { englishTranslator } from "@/lib/i18n/messages";
import { afterSalesLineErrors } from "../hooks/useAfterSalesForms";
import type { ReturnEstimate } from "../types/afterSales";
import { toExchangeDto, toReturnDto } from "./requestDtos";
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

describe("request conversions", () => {
  const line = { orderLineId: "l1", selected: true, quantity: 1, maxQty: 2, sku: "RO" };

  it("sends only the selected lines, and notes only when written", () => {
    expect(
      toReturnDto({
        reasonCode: "DAMAGED",
        requestedResolution: "REFUND",
        reasonText: "  ",
        customerNote: " Box was open ",
        lines: [line, { ...line, orderLineId: "l2", selected: false }],
      } as never),
    ).toEqual({
      items: [{ orderLineId: "l1", quantity: 1, reasonCode: "DAMAGED" }],
      reasonCode: "DAMAGED",
      requestedResolution: "REFUND",
      customerNote: "Box was open",
    });
  });

  it("keeps the line's own SKU when no replacement is typed", () => {
    const dto = toExchangeDto({
      reasonCode: "WRONG_VARIANT",
      exchangeType: "SIZE_OR_COLOR_CHANGE",
      customerNote: "",
      lines: [{ ...line, replacementSku: " ", replacementSize: " 50 ml " }],
    } as never);
    expect(dto.items).toEqual([{ orderLineId: "l1", quantity: 1, replacementSku: "RO", reasonCode: "WRONG_VARIANT", replacementSize: "50 ml" }]);
    expect(dto).not.toHaveProperty("customerNote");
  });
});

describe("afterSalesLineErrors", () => {
  it("reads the list message (either shape) and each line's messages", () => {
    const errors = afterSalesLineErrors({
      lines: { root: { message: "afterSales.err.selectItem" }, 1: { quantity: { message: "afterSales.err.qty" } } },
    } as never);
    expect(errors.list).toBe("afterSales.err.selectItem");
    expect(errors.line(1)).toEqual({ quantity: "afterSales.err.qty", replacementSku: null });
    expect(errors.line(0)).toEqual({ quantity: null, replacementSku: null });
    expect(afterSalesLineErrors({} as never).list).toBeNull();
  });
});
