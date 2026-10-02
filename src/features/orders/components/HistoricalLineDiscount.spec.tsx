import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HistoricalLineDiscount } from "./HistoricalLineDiscount";

describe("HistoricalLineDiscount", () => {
  it("shows the stored amount and not allocation codes", () => {
    render(
      <HistoricalLineDiscount
        currency="AED"
        className="line-discount"
        snapshot={{
          v: 1,
          discountTotal: "30.00",
          allocations: [
            { kind: "AUTOMATIC", code: "PROD", discountType: "FIXED_AMOUNT", amount: "10.00" },
            { kind: "COUPON", code: "ORDER20", discountType: "PERCENTAGE", amount: "20.00" },
          ],
        }}
      />,
    );
    expect(screen.getByText("−AED 30.00")).toBeInTheDocument();
    expect(screen.queryByText("PROD")).not.toBeInTheDocument();
    expect(screen.queryByText("ORDER20")).not.toBeInTheDocument();
    expect(screen.queryByText(/Buy 2/i)).not.toBeInTheDocument();
  });

  it("renders nothing for a legacy or unknown snapshot", () => {
    const { rerender } = render(
      <HistoricalLineDiscount snapshot={null} currency="AED" className="line-discount" />,
    );
    expect(screen.queryByText(/Discount/)).not.toBeInTheDocument();
    rerender(
      <HistoricalLineDiscount
        snapshot={{ v: 9, discountTotal: "20.00" }}
        currency="AED"
        className="line-discount"
      />,
    );
    expect(screen.queryByText(/Discount/)).not.toBeInTheDocument();
  });
});
