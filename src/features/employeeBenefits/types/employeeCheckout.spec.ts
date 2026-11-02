import { describe, expect, it } from "vitest";
import {
  addsFivePercentTax,
  readEmployeeCheckout,
  staffAccountingStageLabel,
  staffDiscountPaymentBlocked,
  staffPricingIsPayable,
  websiteHoldLabel,
} from "./employeeCheckout";

/** Public presenter shape: authorized flag, line status, D365 allowance, websiteHold enum. */
const quotedPurchase = {
  authorized: true,
  eligible: true,
  affiliationName: "Staff Discount 50%",
  pricingApplied: false,
  financialPosting: "DISABLED",
  allowanceConfirmed: false,
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
    includedVat: "9.52",
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
};

const appliedPurchase = {
  ...quotedPurchase,
  pricingApplied: true,
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
    ...quotedPurchase.breakdown,
    staffDiscount: "100.00",
    quotedStaffDiscount: "100.00",
    merchandiseAfterDiscounts: "100.00",
    includedVat: "4.76",
    commerceTotal: "100.00",
    amountPayable: "40.00",
  },
  allowance: {
    ...quotedPurchase.allowance,
    thisPurchaseConsumption: "100.00",
    projectedRemaining: "4395.00",
    websiteHold: "HELD",
  },
};

describe("staffPurchase public contract", () => {
  it("hides a normal customer and any envelope that is not authorized", () => {
    expect(readEmployeeCheckout(undefined)).toBeNull();
    expect(readEmployeeCheckout(null)).toBeNull();
    expect(readEmployeeCheckout({})).toBeNull();
    expect(readEmployeeCheckout({ staffPurchase: null })).toBeNull();
    expect(
      readEmployeeCheckout({
        eligible: true,
        affiliationName: "Staff Discount 50%",
        breakdown: quotedPurchase.breakdown,
        allowance: quotedPurchase.allowance,
        accounting: quotedPurchase.accounting,
        lines: quotedPurchase.lines,
      }),
    ).toBeNull();
    expect(readEmployeeCheckout({ ...quotedPurchase, authorized: false })).toBeNull();
    expect(readEmployeeCheckout({ employeeCheckout: quotedPurchase, personnelNumber: "E02783" })).toBeNull();
  });

  it("does not treat eligible false as authorization", () => {
    expect(readEmployeeCheckout({ eligible: false, affiliationName: "Staff", breakdown: quotedPurchase.breakdown })).toBeNull();
  });

  it("reads an authorized quote without applying the discount or consuming allowance", () => {
    const view = readEmployeeCheckout(quotedPurchase);
    expect(view?.authorized).toBe(true);
    expect(view?.eligible).toBe(true);
    expect(view?.affiliationName).toBe("Staff Discount 50%");
    expect(view?.pricingApplied).toBe(false);
    expect(view?.lines[0]).toMatchObject({
      sku: "ELIGIBLE",
      status: "NOT_APPLIED",
      percent: "50.00",
      originalUnitPrice: "200.00",
      staffDiscountAmount: "100.00",
      finalLineTotal: "100.00",
    });
    expect(view?.lines[1]?.status).toBe("INELIGIBLE");
    expect(view?.breakdown).toMatchObject({
      staffDiscount: "0.00",
      quotedStaffDiscount: "100.00",
      giftCardApplied: "40.00",
      loyaltyApplied: "20.00",
      amountPayable: "140.00",
      includedVat: "9.52",
    });
    expect(view?.allowance).toMatchObject({
      amountLimit: "5000",
      amountUsed: "505",
      balanceRemaining: "4495",
      thisPurchaseConsumption: "0.00",
      websiteHold: "NONE",
      d365BalancesAreAuthoritative: true,
      projectedIsAuthoritative: false,
    });
    expect(staffDiscountPaymentBlocked(view)).toBe(false);
    expect(staffPricingIsPayable(view)).toBe(false);
    expect(JSON.stringify(view)).not.toContain("E02783");
  });

  it("keeps a financially applied discount blocked while posting is DISABLED", () => {
    const view = readEmployeeCheckout(appliedPurchase);
    expect(view?.pricingApplied).toBe(true);
    expect(view?.accountingStage).toBe("PROVISIONAL_HOLD");
    expect(staffAccountingStageLabel(view?.accountingStage)).toBe("Website allowance temporarily reserved");
    expect(view?.breakdown.staffDiscount).toBe("100.00");
    expect(view?.breakdown.amountPayable).toBe("40.00");
    expect(view?.allowance?.websiteHold).toBe("HELD");
    expect(websiteHoldLabel(view?.allowance?.websiteHold)).toBe("Website allowance temporarily reserved");
    expect(staffDiscountPaymentBlocked(view)).toBe(true);
    expect(staffPricingIsPayable(view)).toBe(false);
  });

  it("allows checkout only when the Backend marks a platform purchase while D365 posting stays pending", () => {
    const blocked = readEmployeeCheckout(appliedPurchase);
    expect(staffDiscountPaymentBlocked(blocked)).toBe(true);
    const allowed = readEmployeeCheckout({
      ...appliedPurchase,
      platformPurchase: "ALLOWED_D365_POSTING_PENDING",
    });
    expect(allowed?.financialPostingEnabled).toBe(false);
    expect(staffDiscountPaymentBlocked(allowed)).toBe(false);
    expect(staffPricingIsPayable(allowed)).toBe(false);
  });

  it("allows a normal-price employee order when pricing is not applied", () => {
    const view = readEmployeeCheckout({
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
      allowance: { ...quotedPurchase.allowance, thisPurchaseConsumption: "0.00", websiteHold: "NONE" },
      accounting: { stage: "NONE" },
    });
    expect(view?.pricingApplied).toBe(false);
    expect(staffDiscountPaymentBlocked(view)).toBe(false);
    expect(staffAccountingStageLabel(view?.accountingStage)).toBeNull();
  });

  it("keeps line percentages distinct and ignores a monetary websiteHold", () => {
    const view = readEmployeeCheckout({
      ...quotedPurchase,
      lines: [
        { ...quotedPurchase.lines[0], sku: "FIFTY", percent: "50.00" },
        {
          sku: "THIRTY",
          status: "NOT_APPLIED",
          percent: "30.00",
          originalUnitPrice: "200.00",
          staffDiscountAmount: "60.00",
          finalLineTotal: "140.00",
        },
        {
          sku: "BOGO",
          status: "BLOCKED_BY_PROMOTION",
          percent: "50.00",
          originalUnitPrice: "200.00",
          staffDiscountAmount: "0.00",
          finalLineTotal: "200.00",
        },
      ],
      allowance: { ...quotedPurchase.allowance, websiteHold: "100.00" },
    });
    expect(view?.lines.map((line) => line.percent)).toEqual(["50.00", "30.00", "50.00"]);
    expect(view?.lines[2]?.status).toBe("BLOCKED_BY_PROMOTION");
    expect(view?.allowance?.websiteHold).toBe("NONE");
  });

  it("reads a historical authorized order without using another employment payload", () => {
    const historical = readEmployeeCheckout({
      staffPurchase: {
        ...appliedPurchase,
        affiliationName: "Staff Discount 30%",
        lines: [
          {
            sku: "ELIGIBLE",
            status: "APPLIED",
            percent: "30.00",
            originalUnitPrice: "200.00",
            staffDiscountAmount: "60.00",
            finalLineTotal: "140.00",
          },
        ],
      },
      currentEmployment: { affiliationName: "Staff Discount 50%", percent: "50.00", personnelNumber: "E02783" },
    });
    expect(historical?.affiliationName).toBe("Staff Discount 30%");
    expect(historical?.lines[0]?.percent).toBe("30.00");
    expect(historical?.lines[0]?.staffDiscountAmount).toBe("60.00");
    expect(JSON.stringify(historical)).not.toContain("E02783");
  });

  it("does not add a second 5% on top of a tax-inclusive price", () => {
    expect(addsFivePercentTax("100.00", "100.00")).toBe(false);
    expect(addsFivePercentTax("100.00", "105.00")).toBe(true);
  });
});
