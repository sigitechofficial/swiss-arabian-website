import { describe, expect, it } from "vitest";
import { addsFivePercentTax, readEmployeeCheckout, staffPricingIsPayable } from "./employeeCheckout";

const quote = {
  personnelNumber: "E02783",
  employeeLinkStatus: "ACTIVE",
  benefit: { affiliationName: "Staff Discount 50%", amountLimit: "5000.00", amountUsed: "505.00", balanceRemaining: "4495.00" },
  allowanceConfirmed: false,
  financialPosting: { enabled: false, captureAllowed: false },
  staffQuote: {
    pricingApplied: false,
    staffDiscountTotal: "100.00",
    tax: "0.00",
    stacking: { status: "NON_STACKING" },
    allowance: {
      authoritativeRemaining: "4495.00",
      provisionalOrderConsumption: "100.00",
      projectedRemaining: "4395.00",
      sufficient: true,
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
      {
        sku: "ROSE-50",
        productName: "Rose",
        eligible: false,
        originalPrice: "150.00",
      },
    ],
  },
};

describe("employee checkout quote", () => {
  it("keeps the AED 200 tax-inclusive example at AED 100 with no added tax", () => {
    const view = readEmployeeCheckout(quote);
    expect(view?.lines[0]).toMatchObject({
      originalPrice: "200.00",
      staffDiscount: "100.00",
      priceAfter: "100.00",
    });
    expect(view?.taxContractMismatch).toBe(false);
    expect(addsFivePercentTax("100.00", "100.00")).toBe(false);
    expect(staffPricingIsPayable(view)).toBe(false);
  });

  it("reports a duplicated 5% tax instead of correcting the price", () => {
    const view = readEmployeeCheckout({
      ...quote,
      staffQuote: {
        ...quote.staffQuote,
        lines: [
          {
            ...quote.staffQuote.lines[0],
            payable: "105.00",
          },
        ],
      },
    });
    expect(view?.taxContractMismatch).toBe(true);
    expect(view?.lines[0]?.priceAfter).toBe("100.00");
    expect(staffPricingIsPayable(view)).toBe(false);
  });

  it("projects allowance without treating it as deducted", () => {
    const view = readEmployeeCheckout(quote);
    expect(view?.allowance).toMatchObject({
      amountLimit: "5000.00",
      amountUsed: "505.00",
      balanceRemaining: "4495.00",
      estimatedConsumption: "100.00",
      projectedRemaining: "4395.00",
      insufficient: false,
    });
  });

  it("marks an insufficient allowance from the server flag", () => {
    const view = readEmployeeCheckout({
      ...quote,
      staffQuote: {
        ...quote.staffQuote,
        allowance: { ...quote.staffQuote.allowance, sufficient: false },
      },
    });
    expect(view?.allowance?.insufficient).toBe(true);
  });

  it("does not show a revoked link as an eligible quote", () => {
    expect(readEmployeeCheckout({ ...quote, employeeLinkStatus: "REVOKED" })?.eligible).toBe(false);
  });

  it("returns nothing for a normal customer payload", () => {
    expect(readEmployeeCheckout(undefined)).toBeNull();
    expect(readEmployeeCheckout(null)).toBeNull();
  });
});
