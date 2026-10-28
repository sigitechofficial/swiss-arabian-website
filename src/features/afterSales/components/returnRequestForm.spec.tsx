import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReturnRequestForm } from "./ReturnRequestForm";

vi.mock("../hooks/useAfterSales", () => ({
  useAfterSalesMutations: () => ({
    createReturn: { isPending: false, unwrap: vi.fn() },
    createGuestReturn: { isPending: false, unwrap: vi.fn() },
  }),
}));

describe("return request form", () => {
  it("offers refund and exchange, not store credit", () => {
    render(
      <ReturnRequestForm
        mode="customer"
        orderId="ord-1"
        lines={[
          {
            orderLineId: "line-1",
            sku: "OUD",
            productName: "Oud",
            variantName: null,
            quantity: 1,
          },
        ]}
      />,
    );
    const resolution = screen.getByRole("combobox", { name: /preferred resolution/i });
    expect(resolution).toHaveTextContent("Refund");
    expect(resolution).toHaveTextContent("Exchange");
    expect(resolution).not.toHaveTextContent("Store credit");
  });
});
