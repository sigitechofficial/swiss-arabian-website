import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { readEmployeeCheckout } from "../types/employeeCheckout";
import { StaffDiscountSummary } from "./StaffDiscountSummary";

const quotedView = readEmployeeCheckout({
  authorized: true,
  eligible: true,
  affiliationName: "Staff Discount 50%",
  pricingApplied: false,
  financialPosting: "DISABLED",
  stacking: "NO_CONFLICT",
  accounting: { stage: "QUOTED_NOT_APPLIED" },
  lines: [
    {
      sku: "ELIGIBLE",
      status: "NOT_APPLIED",
      percent: "50.00",
      originalUnitPrice: "200.00",
      staffDiscountAmount: "100.00",
      finalLineTotal: "100.00",
    },
    {
      sku: "OTHER",
      status: "INELIGIBLE",
      percent: null,
      originalUnitPrice: "80.00",
      staffDiscountAmount: "0.00",
      finalLineTotal: "80.00",
    },
  ],
  breakdown: {
    originalMerchandiseSubtotal: "200.00",
    staffDiscount: "0.00",
    quotedStaffDiscount: "100.00",
    promotionDiscount: "0.00",
    merchandiseAfterDiscounts: "200.00",
    shipping: "0.00",
    includedVat: "0.00",
    commerceTotal: "200.00",
    giftCardApplied: "40.00",
    loyaltyApplied: "20.00",
    amountPayable: "140.00",
  },
  allowance: {
    d365AmountLimit: "5000",
    d365AmountUsed: "505",
    d365BalanceRemaining: "4495",
    d365BalancesAreAuthoritative: true,
    otherProvisionalHolds: "0.00",
    thisPurchaseConsumption: "0.00",
    projectedRemaining: "4495.00",
    projectedIsAuthoritative: false,
    fits: true,
    websiteHold: "NONE",
  },
});

const appliedView = readEmployeeCheckout({
  authorized: true,
  eligible: true,
  affiliationName: "Staff Discount 50%",
  pricingApplied: true,
  financialPosting: "DISABLED",
  accounting: { stage: "PROVISIONAL_HOLD" },
  lines: [
    {
      sku: "ELIGIBLE",
      status: "APPLIED",
      percent: "50.00",
      originalUnitPrice: "200.00",
      staffDiscountAmount: "100.00",
      finalLineTotal: "100.00",
    },
  ],
  breakdown: {
    originalMerchandiseSubtotal: "200.00",
    staffDiscount: "100.00",
    quotedStaffDiscount: "100.00",
    promotionDiscount: "0.00",
    merchandiseAfterDiscounts: "100.00",
    shipping: "0.00",
    includedVat: "4.76",
    commerceTotal: "100.00",
    giftCardApplied: "40.00",
    loyaltyApplied: "20.00",
    amountPayable: "40.00",
  },
  allowance: {
    d365AmountLimit: "5000",
    d365AmountUsed: "505",
    d365BalanceRemaining: "4495",
    d365BalancesAreAuthoritative: true,
    otherProvisionalHolds: "25.00",
    thisPurchaseConsumption: "100.00",
    projectedRemaining: "4370.00",
    projectedIsAuthoritative: false,
    fits: true,
    websiteHold: "HELD",
  },
});

const noDiscountView = readEmployeeCheckout({
  authorized: true,
  eligible: true,
  affiliationName: "Staff",
  pricingApplied: false,
  financialPosting: "DISABLED",
  lines: [
    {
      sku: "PLAIN",
      status: "INELIGIBLE",
      percent: null,
      originalUnitPrice: "200.00",
      staffDiscountAmount: "0.00",
      finalLineTotal: "200.00",
    },
  ],
  breakdown: {
    originalMerchandiseSubtotal: "200.00",
    staffDiscount: "0.00",
    quotedStaffDiscount: "0.00",
    merchandiseAfterDiscounts: "200.00",
    includedVat: "9.52",
    amountPayable: "200.00",
  },
  allowance: {
    d365AmountLimit: "5000",
    d365AmountUsed: "505",
    d365BalanceRemaining: "4495",
    thisPurchaseConsumption: "0.00",
    projectedRemaining: "4495.00",
    websiteHold: "NONE",
  },
  accounting: { stage: "NONE" },
});

describe("staff discount summary", () => {
  it("shows a quote without applied allowance consumption or a second percentage", () => {
    render(<StaffDiscountSummary checkout={quotedView} currency="AED" />);
    expect(screen.getByText("Staff Discount 50%")).toBeInTheDocument();
    expect(screen.getByText("Staff Discount preview only")).toBeInTheDocument();
    expect(screen.getByText("Quoted Staff Discount")).toBeInTheDocument();
    expect(screen.getByText("Quoted Staff Discount 50.00%")).toBeInTheDocument();
    expect(screen.getByText("Applied Staff Discount")).toBeInTheDocument();
    expect(screen.getByText("AED 0.00")).toBeInTheDocument();
    expect(screen.getByText(/No staff agreement/i)).toBeInTheDocument();
    expect(screen.queryByText("Estimated consumption for this purchase")).not.toBeInTheDocument();
    expect(screen.queryByText("Projected remaining. Not yet deducted in D365")).not.toBeInTheDocument();
    expect(screen.queryByText(/E02783/)).not.toBeInTheDocument();
    expect(screen.getByText("Amount limit")).toBeInTheDocument();
    expect(screen.getByText("AED 5000.00")).toBeInTheDocument();
  });

  it("shows gift card and loyalty once and keeps included VAT", () => {
    render(<StaffDiscountSummary checkout={quotedView} currency="AED" surface="checkout" />);
    expect(screen.getByText("Gift card payment")).toBeInTheDocument();
    expect(screen.getAllByText("AED 40.00")).toHaveLength(1);
    expect(screen.getByText("Loyalty redemption")).toBeInTheDocument();
    expect(screen.getAllByText("AED 20.00")).toHaveLength(1);
    expect(screen.getByText("AED 140.00")).toBeInTheDocument();
    expect(screen.getByText("Included in these prices")).toBeInTheDocument();
  });

  it("shows D365 balances, website projection, and hold status only when the discount is applied", () => {
    render(<StaffDiscountSummary checkout={appliedView} currency="AED" surface="checkout" />);
    expect(screen.getAllByText("Website allowance temporarily reserved").length).toBeGreaterThan(0);
    expect(screen.getByText("D365 balance")).toBeInTheDocument();
    expect(screen.getByText("Website projection")).toBeInTheDocument();
    expect(screen.getByText("Estimated consumption for this purchase")).toBeInTheDocument();
    expect(screen.getByText("Balance remaining (authoritative)")).toBeInTheDocument();
    expect(screen.getByText("Projected remaining. Not yet deducted in D365")).toBeInTheDocument();
    expect(screen.getByText("AED 4.76")).toBeInTheDocument();
    expect(screen.getAllByText("Gift card payment")).toHaveLength(1);
    expect(screen.getAllByText("Amount still to pay before this preview")).toHaveLength(1);
    expect(screen.queryByText("AED 100.00%")).not.toBeInTheDocument();
  });

  it("does not invent a discount or allowance consumption for an authorized employee without one", () => {
    render(<StaffDiscountSummary checkout={noDiscountView} currency="AED" surface="checkout" />);
    expect(screen.getByText("Staff discount is not available on this order.")).toBeInTheDocument();
    expect(screen.queryByText("Quoted Staff Discount")).not.toBeInTheDocument();
    expect(screen.queryByText("Estimated consumption for this purchase")).not.toBeInTheDocument();
    expect(screen.queryByText("Amount limit")).not.toBeInTheDocument();
    expect(screen.queryByText("AED 100.00")).not.toBeInTheDocument();
  });

  it("says staff pricing was not applied when allowance tracking is unavailable", () => {
    const view = readEmployeeCheckout({
      authorized: true,
      eligible: true,
      affiliationName: "Staff Discount 50%",
      pricingApplied: false,
      financialPosting: "DISABLED",
      support: { retailMirror: "UNAVAILABLE", allowanceLedger: "UNAVAILABLE" },
      lines: [{ sku: "ARSH099001", status: "SYNC_INCOMPLETE", percent: null, originalUnitPrice: "280.00", staffDiscountAmount: "0.00", finalLineTotal: "280.00" }],
    });
    render(<StaffDiscountSummary checkout={view} currency="AED" surface="checkout" />);
    expect(screen.getByText("Staff Discount 50%")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Staff pricing was not applied. The retail discount offer and website allowance tracking are temporarily unavailable.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("50%")).not.toBeInTheDocument();
  });

  it("keeps different line percentages on their own lines", () => {
    const mixed = readEmployeeCheckout({
      authorized: true,
      eligible: true,
      affiliationName: "Staff",
      pricingApplied: false,
      financialPosting: "DISABLED",
      accounting: { stage: "QUOTED_NOT_APPLIED" },
      lines: [
        {
          sku: "FIFTY",
          status: "NOT_APPLIED",
          percent: "50.00",
          originalUnitPrice: "200.00",
          staffDiscountAmount: "100.00",
          finalLineTotal: "100.00",
        },
        {
          sku: "THIRTY",
          status: "NOT_APPLIED",
          percent: "30.00",
          originalUnitPrice: "200.00",
          staffDiscountAmount: "60.00",
          finalLineTotal: "140.00",
        },
      ],
      breakdown: {
        originalMerchandiseSubtotal: "400.00",
        staffDiscount: "0.00",
        quotedStaffDiscount: "160.00",
        merchandiseAfterDiscounts: "400.00",
        includedVat: "0.00",
        amountPayable: "400.00",
      },
    });
    render(<StaffDiscountSummary checkout={mixed} currency="AED" />);
    expect(screen.getByText("Quoted Staff Discount 50.00%")).toBeInTheDocument();
    expect(screen.getByText("Quoted Staff Discount 30.00%")).toBeInTheDocument();
    expect(screen.queryByText("Staff 50.00%")).not.toBeInTheDocument();
  });

  it("renders nothing for a normal customer and for a denied employee", () => {
    const { container, rerender } = render(<StaffDiscountSummary checkout={null} currency="AED" />);
    expect(container).toBeEmptyDOMElement();
    rerender(
      <StaffDiscountSummary
        checkout={readEmployeeCheckout({ ...quotedView, authorized: false, personnelNumber: "E02783" })}
        currency="AED"
      />,
    );
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText(/E02783/)).not.toBeInTheDocument();
  });
});
