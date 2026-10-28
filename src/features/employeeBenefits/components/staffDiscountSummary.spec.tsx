import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { readEmployeeCheckout } from "../types/employeeCheckout";
import { StaffDiscountSummary } from "./StaffDiscountSummary";

const view = readEmployeeCheckout({
  personnelNumber: "E02783",
  benefit: { affiliationName: "Staff Discount 50%" },
  financialPosting: false,
  staffQuote: {
    pricingApplied: false,
    staffDiscountTotal: "100.00",
    stacking: "NON_STACKING",
    allowance: {
      amountLimit: "5000.00",
      amountUsed: "505.00",
      authoritativeRemaining: "4495.00",
      provisionalOrderConsumption: "100.00",
      projectedRemaining: "4395.00",
    },
    lines: [
      {
        sku: "OUD-50",
        productName: "Oud",
        eligible: true,
        originalPrice: "200.00",
        staffDiscount: "100.00",
        priceAfter: "100.00",
      },
    ],
  },
});

describe("staff discount summary", () => {
  it("shows a preview and does not present the projection as deducted", () => {
    render(<StaffDiscountSummary checkout={view} currency="AED" />);
    expect(screen.getByText("Staff Discount 50%")).toBeInTheDocument();
    expect(screen.getByText("Preview only. This is not the amount you pay, and it is not deducted in D365.")).toBeInTheDocument();
    expect(screen.getByText("AED 200.00")).toBeInTheDocument();
    expect(screen.getAllByText("AED 100.00").length).toBeGreaterThan(0);
    expect(screen.getByText("Projected remaining. Not yet deducted in D365")).toBeInTheDocument();
    expect(screen.getByText("AED 4395.00")).toBeInTheDocument();
    expect(screen.getByText("Promotion status: NON_STACKING")).toBeInTheDocument();
    expect(screen.queryByText(/AED 105/)).not.toBeInTheDocument();
  });

  it("renders nothing for a normal customer", () => {
    const { container } = render(<StaffDiscountSummary checkout={null} currency="AED" />);
    expect(container).toBeEmptyDOMElement();
  });
});
