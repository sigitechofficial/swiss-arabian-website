import { describe, expect, it } from "vitest";
import type { AfterSalesEligibilityLine, ExchangeOptionsLine } from "../types/afterSales";
import {
  EMPTY_DRAFT,
  afterSalesFlowHref,
  distinctVariantName,
  exchangeEstimateBody,
  exchangeRequestDto,
  flowKindParam,
  flowSteps,
  pickedLines,
  returnEstimateBody,
  returnRequestDto,
  stepComplete,
  visibleLines,
  withOnlyOptionsPicked,
  type FlowDraft,
} from "./afterSalesFlow";

function line(over: Partial<AfterSalesEligibilityLine> = {}): AfterSalesEligibilityLine {
  return {
    orderLineId: "l1",
    sku: "OUD-100",
    productName: "Oud",
    variantName: "100 ml",
    orderedQty: 3,
    isGift: false,
    imageUrl: null,
    returnableQty: 2,
    ...over,
  };
}

const LINES = [
  line(),
  line({ orderLineId: "l2", sku: "MINI", productName: "Mini", isGift: true, orderedQty: 1, returnableQty: 1 }),
  line({ orderLineId: "l3", sku: "GONE", returnableQty: 0, blockedReason: "QTY_EXCEEDED" }),
  line({ orderLineId: "l4", sku: "CANCELLED", orderedQty: 0, returnableQty: 0, blockedReason: "QTY_EXCEEDED" }),
];

const OPTIONS: ExchangeOptionsLine[] = [
  {
    orderLineId: "l1",
    sku: "OUD-100",
    sameItemOnly: false,
    options: [
      { sku: "OUD-100", variantId: "v100", productName: "Oud", variantName: "100 ml", imageUrl: null, sameItem: true, inStock: true, unitDifference: { direction: "EVEN", amount: "0.00" } },
      { sku: "OUD-50", variantId: "v50", productName: "Oud", variantName: "50 ml", imageUrl: null, sameItem: false, inStock: true, unitDifference: { direction: "REFUND_DUE", amount: "42.00" } },
      { sku: "OUD-200", variantId: "v200", productName: "Oud", variantName: "200 ml", imageUrl: null, sameItem: false, inStock: false, unitDifference: null },
    ],
  },
  {
    orderLineId: "l2",
    sku: "MINI",
    sameItemOnly: true,
    options: [{ sku: "MINI", variantId: null, productName: "Mini", variantName: null, imageUrl: null, sameItem: true, inStock: true, unitDifference: { direction: "EVEN", amount: "0.00" } }],
  },
];

const draft = (over: Partial<FlowDraft>): FlowDraft => ({ ...EMPTY_DRAFT, ...over });

describe("guided return / exchange", () => {
  it("has a replacement step only for an exchange", () => {
    expect(flowSteps("return")).toEqual(["choose", "items", "reason", "review"]);
    expect(flowSteps("exchange")).toEqual(["choose", "items", "reason", "replacement", "review"]);
  });

  it("hides fully cancelled lines and never picks blocked ones or more than is free", () => {
    expect(visibleLines(LINES).map((l) => l.orderLineId)).toEqual(["l1", "l2", "l3"]);
    const picked = pickedLines(draft({ quantities: { l1: 5, l3: 1 } }), LINES);
    expect(picked).toEqual([{ line: LINES[0], quantity: 2 }]);
  });

  it("needs a choice, an item, and a reason the shopper picked (none is pre-selected)", () => {
    expect(stepComplete("choose", EMPTY_DRAFT, LINES)).toBe(false);
    expect(stepComplete("items", draft({ kind: "return" }), LINES)).toBe(false);
    expect(stepComplete("items", draft({ kind: "return", quantities: { l1: 1 } }), LINES)).toBe(true);
    expect(stepComplete("reason", draft({ kind: "return" }), LINES)).toBe(false);
    expect(stepComplete("reason", draft({ kind: "return", reasonCode: "DAMAGED_ITEM" }), LINES)).toBe(true);
  });

  it("an exchange needs an in-stock replacement for every item", () => {
    const base = draft({ kind: "exchange", quantities: { l1: 1 }, reasonCode: "CUSTOMER_PREFERENCE" });
    expect(stepComplete("replacement", base, LINES, OPTIONS)).toBe(false);
    expect(stepComplete("replacement", { ...base, replacements: { l1: "OUD-200" } }, LINES, OPTIONS)).toBe(false);
    expect(stepComplete("replacement", { ...base, replacements: { l1: "OUD-50" } }, LINES, OPTIONS)).toBe(true);
  });

  it("picks the only possible replacement for the shopper (a free gift)", () => {
    const next = withOnlyOptionsPicked(draft({ kind: "exchange", quantities: { l1: 1, l2: 1 } }), LINES, OPTIONS);
    expect(next.replacements).toEqual({ l2: "MINI" });
  });

  it("sends a refund return with the picked lines and the shopper's words only when written", () => {
    expect(
      returnRequestDto(draft({ kind: "return", quantities: { l1: 2 }, reasonCode: "DAMAGED_ITEM", reasonText: "  ", note: " Box open " }), LINES),
    ).toEqual({
      items: [{ orderLineId: "l1", quantity: 2 }],
      reasonCode: "DAMAGED_ITEM",
      reasonText: undefined,
      customerNote: "Box open",
      requestedResolution: "REFUND",
    });
  });

  it("sends an exchange with each replacement, typed as same item or another size", () => {
    const same = exchangeRequestDto(draft({ kind: "exchange", quantities: { l1: 1 }, reasonCode: "DAMAGED_ITEM", replacements: { l1: "OUD-100" } }), LINES);
    expect(same).toMatchObject({ exchangeType: "SAME_ITEM", items: [{ orderLineId: "l1", quantity: 1, replacementSku: "OUD-100" }] });
    const other = exchangeRequestDto(draft({ kind: "exchange", quantities: { l1: 1 }, reasonCode: "CUSTOMER_PREFERENCE", replacements: { l1: "OUD-50" } }), LINES);
    expect(other.exchangeType).toBe("DIFFERENT_VARIANT");
  });

  it("asks for an estimate only once there is something exact to price", () => {
    expect(returnEstimateBody(draft({ kind: "return", quantities: { l1: 1 } }), LINES)).toBeNull();
    expect(returnEstimateBody(draft({ kind: "return", quantities: { l1: 1 }, reasonCode: "OTHER" }), LINES)).toEqual({
      items: [{ orderLineId: "l1", quantity: 1 }],
      reasonCode: "OTHER",
    });
    const exchange = draft({ kind: "exchange", quantities: { l1: 1 }, reasonCode: "OTHER" });
    expect(exchangeEstimateBody(exchange, LINES, OPTIONS)).toBeNull();
    expect(exchangeEstimateBody({ ...exchange, replacements: { l1: "OUD-50" } }, LINES, OPTIONS)).toEqual({
      items: [{ orderLineId: "l1", quantity: 1, replacementSku: "OUD-50" }],
      reasonCode: "OTHER",
    });
  });

  it("links to the flow for a customer or a guest, with a choice made when asked", () => {
    expect(afterSalesFlowHref({ orderId: "o 1" })).toBe("/account/orders/o%201/return");
    expect(afterSalesFlowHref({ orderNumber: "SA-1" }, "exchange")).toBe("/track/SA-1/return?type=exchange");
    expect(flowKindParam("exchange")).toBe("exchange");
    expect(flowKindParam("refund")).toBeNull();
  });

  it("shows a size only when it adds something to the name", () => {
    expect(distinctVariantName("Berry Crush", " berry crush ")).toBeNull();
    expect(distinctVariantName("Oud", "Default Title")).toBeNull();
    expect(distinctVariantName("Oud", "100 ml")).toBe("100 ml");
  });
});
