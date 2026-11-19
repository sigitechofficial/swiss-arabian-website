import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReturnEstimate } from "../types/afterSales";
import { toReturnEstimateDto } from "../utils/requestDtos";
import { ReturnRequestForm } from "./ReturnRequestForm";

const estimateState = vi.hoisted(() => ({
  data: undefined as ReturnEstimate | undefined,
  lastDto: null as unknown,
}));

vi.mock("../hooks/useAfterSales", () => ({
  useAfterSalesMutations: () => ({
    createReturn: { isPending: false, unwrap: vi.fn() },
    createGuestReturn: { isPending: false, unwrap: vi.fn() },
  }),
  useReturnEstimate: (_target: unknown, dto: unknown) => {
    estimateState.lastDto = dto;
    return {
      data: estimateState.data,
      error: null,
      isLoading: false,
      empty: !dto,
      updating: false,
    };
  },
}));

const copy = (key: string, variant: string, text: string) => ({ key, variant, values: {}, text });

function estimate(overrides: Partial<ReturnEstimate> = {}): ReturnEstimate {
  return {
    orderId: "ord-1",
    orderNumber: "SA-1",
    currencyCode: "AED",
    policyVersion: "B1.M0",
    isEstimate: true,
    reasonCode: "CUSTOMER_CHANGED_MIND",
    ourFaultReason: false,
    taxIncluded: true,
    lines: [],
    itemsAmount: "171.43",
    taxAmount: "8.57",
    itemsTotal: "180.00",
    delivery: {
      refunded: false,
      amount: "0.00",
      reason: "REASON_NOT_OUR_FAULT",
      message: copy("ESTIMATE_DELIVERY", "NOT_REFUNDED", "The delivery fee isn't refunded."),
    },
    deductions: {
      returnShippingFee: { amount: "15.00", waived: false },
      restockingFee: { amount: "0.00", percent: "0", waived: false },
      freeGift: { amount: "0.00", gifts: [] },
      spentPoints: { amount: "0.00", points: "0" },
    },
    totalDeductions: "15.00",
    estimatedRefund: "165.00",
    refundDestination: copy("REFUND_DESTINATION", "STORED_VALUE_FIRST", "x"),
    giftRequirement: { required: false, code: null, message: null, gifts: [] },
    notes: [copy("ESTIMATE", "FINAL_AFTER_INSPECTION", "x")],
    ...overrides,
  };
}

const LINES = [
  { orderLineId: "line-1", sku: "OUD", productName: "Oud", variantName: null, quantity: 2 },
  { orderLineId: "gift-1", sku: "MINI", productName: "Mini oud", variantName: null, quantity: 1 },
];

describe("return request form", () => {
  it("offers refund and exchange, not store credit", () => {
    render(<ReturnRequestForm mode="customer" orderId="ord-1" lines={LINES.slice(0, 1)} />);
    const resolution = screen.getByRole("combobox", { name: /preferred resolution/i });
    expect(resolution).toHaveTextContent("Refund");
    expect(resolution).toHaveTextContent("Exchange");
    expect(resolution).not.toHaveTextContent("Store credit");
  });

  it("shows the estimate labelled as an estimate, with fees and VAT", () => {
    estimateState.data = estimate();
    render(<ReturnRequestForm mode="customer" orderId="ord-1" lines={LINES.slice(0, 1)} />);
    expect(screen.getAllByText("Estimated refund").length).toBeGreaterThan(0);
    expect(screen.getByText("AED 165.00")).toBeInTheDocument();
    expect(screen.getByText("− AED 15.00")).toBeInTheDocument();
    expect(screen.getByText("Includes VAT of AED 8.57")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This is an estimate. The final amount is confirmed after we receive and inspect the items.",
      ),
    ).toBeInTheDocument();
    expect(estimateState.lastDto).toEqual({
      items: [{ orderLineId: "line-1", quantity: 2 }],
      reasonCode: "CUSTOMER_CHANGED_MIND",
    });
  });

  it("asks for the free gift when the market needs it back and can add it", () => {
    estimateState.data = estimate({
      giftRequirement: {
        required: true,
        code: "RETURN_GIFT_REQUIRED",
        message: "include the gift",
        gifts: [{ orderLineId: "gift-1", sku: "MINI", productName: "Mini oud", quantity: 1, value: "40.00" }],
      },
    });
    render(<ReturnRequestForm mode="customer" orderId="ord-1" lines={LINES} />);
    // deselect the gift first, then add it from the notice
    const boxes = screen.getAllByRole("checkbox");
    fireEvent.click(boxes[1]);
    expect(boxes[1]).not.toBeChecked();
    expect(screen.getByRole("alert")).toHaveTextContent("Include your free gift");
    fireEvent.click(screen.getByRole("button", { name: "Add the free gift to this return" }));
    expect(boxes[1]).toBeChecked();
  });
});

describe("toReturnEstimateDto", () => {
  const line = (selected: boolean, quantity: number) => ({
    orderLineId: "l1",
    selected,
    quantity,
    maxQty: 2,
    sku: "S",
  });

  it("only refunds, only selected lines with a valid quantity", () => {
    expect(
      toReturnEstimateDto({
        lines: [line(true, 1)],
        reasonCode: "DAMAGED_ITEM",
        requestedResolution: "EXCHANGE",
      }),
    ).toBeNull();
    expect(
      toReturnEstimateDto({
        lines: [line(false, 1), line(true, 3), line(true, Number.NaN)],
        reasonCode: "DAMAGED_ITEM",
        requestedResolution: "REFUND",
      }),
    ).toBeNull();
    expect(
      toReturnEstimateDto({
        lines: [line(true, 2)],
        reasonCode: "DAMAGED_ITEM",
        requestedResolution: "REFUND",
      }),
    ).toEqual({ items: [{ orderLineId: "l1", quantity: 2 }], reasonCode: "DAMAGED_ITEM" });
  });
});
