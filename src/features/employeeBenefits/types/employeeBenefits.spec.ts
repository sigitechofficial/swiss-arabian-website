import { describe, expect, it } from "vitest";
import {
  acceptInvitationMessage,
  formatBenefitQuantity,
  readEmployeeBenefits,
  readEmployeeContext,
  readEmployeeLink,
} from "./employeeBenefits";

describe("employee benefits readers", () => {
  it("reads an unlinked customer", () => {
    expect(readEmployeeLink({ linked: false, status: null })).toEqual({
      linked: false,
      status: null,
      legalEntityCode: null,
    });
  });

  it("treats only ACTIVE as linked", () => {
    expect(
      readEmployeeLink({ linked: true, status: "ACTIVE", legalEntityCode: "SAUAE" }),
    ).toMatchObject({ linked: true, status: "ACTIVE" });
    expect(readEmployeeLink({ linked: false, status: "SUSPENDED", legalEntityCode: "SAUAE" })).toMatchObject({
      linked: false,
      status: "SUSPENDED",
    });
    expect(readEmployeeLink({ linked: false, status: "REVOKED" })).toMatchObject({
      linked: false,
      status: "REVOKED",
    });
  });

  it("keeps benefit amounts as strings and does not invent a combined wallet", () => {
    const view = readEmployeeBenefits({
      linked: true,
      eligible: true,
      authority: "D365_STAFF_DISCOUNT",
      financialWriteEnabled: true,
      personnelNumber: "000123",
      designation: "SA-RTL",
      legalEntityCode: "SAUAE",
      benefits: [
        {
          affiliationName: "Staff-UAE",
          amountLimit: "5000.00",
          amountUsed: "120.50",
          balanceRemaining: "4879.50",
          lastSyncedAt: "2026-10-21T08:00:00.000Z",
          unitStatus: "NOT_VERIFIED",
        },
        {
          affiliationName: "Staff-QA",
          amountLimit: "1000.00",
          amountUsed: "0",
          balanceRemaining: "1000.00",
          lastSyncedAt: null,
          unitStatus: "NOT_VERIFIED",
        },
      ],
    });
    expect(view.financialWriteEnabled).toBe(false);
    expect(view.authority).toBe("D365_STAFF_DISCOUNT");
    expect(view.benefits).toHaveLength(2);
    expect(view.benefits[0]?.amountLimit).toBe("5000.00");
    expect(view.benefits[1]?.affiliationName).toBe("Staff-QA");
    expect(view.websiteAccounting).toBeNull();
  });

  it("does not turn a missing usage table into zero website usage", () => {
    const view = readEmployeeBenefits({
      linked: true,
      eligible: true,
      benefits: [{ affiliationName: "Staff Discount 50%", amountLimit: "5000", amountUsed: "505", balanceRemaining: "4495" }],
      websiteAccounting: {
        availability: "UNAVAILABLE_SCHEMA",
        currencyCode: "AED",
        activeProvisionalHolds: "0.00",
        paidUsagePendingD365: "0.00",
        websiteAvailableAllowance: "4495.00",
        d365ReconciliationStatus: "NONE",
      },
    });
    expect(view.websiteAccounting).toEqual({
      availability: "UNAVAILABLE_SCHEMA",
      currencyCode: "AED",
      activeProvisionalHolds: null,
      paidUsagePendingD365: null,
      websiteAvailableAllowance: null,
      d365ReconciliationStatus: null,
    });
    expect(view.benefits[0]?.balanceRemaining).toBe("4495");
  });

  it("formats decimal strings without numeric coercion", () => {
    expect(formatBenefitQuantity("4879.50")).toBe("4,879.50");
  });

  it("reads legal-entity context from isEmployee only", () => {
    expect(
      readEmployeeContext({
        isEmployee: true,
        employeeLinkStatus: "ACTIVE",
        legalEntityCode: "URD1",
        employeeId: "emp-1",
        personnelNumber: "000123",
      }),
    ).toMatchObject({ isEmployee: true, personnelNumber: "000123", legalEntityCode: "URD1" });
    expect(
      readEmployeeContext({
        isEmployee: false,
        employeeLinkStatus: null,
        legalEntityCode: "QTR1",
        employeeId: "emp-1",
        personnelNumber: "000123",
      }),
    ).toEqual({
      isEmployee: false,
      employeeLinkStatus: null,
      legalEntityCode: "QTR1",
      employeeId: null,
      personnelNumber: null,
      fullName: null,
    });
  });

  it("maps invitation errors without leaking HR internals", () => {
    expect(acceptInvitationMessage("Invitation cannot be accepted")).toBe(
      "This invitation cannot be accepted with this account.",
    );
    expect(acceptInvitationMessage("Invitation is not active")).toMatch(/expired|used/i);
    expect(acceptInvitationMessage("Employee is not eligible for a new link")).not.toMatch(/personnel|email|phone/i);
  });
});
