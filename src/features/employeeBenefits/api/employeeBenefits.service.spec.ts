import { beforeEach, describe, expect, it, vi } from "vitest";
import { employeeBenefitsKeys } from "./employeeBenefits.keys";
import {
  acceptEmployeeInvitation,
  fetchEmployeeBenefits,
  fetchEmployeeContext,
  fetchEmployeeLink,
} from "./employeeBenefits.service";

const apiGet = vi.hoisted(() => vi.fn());
const apiPost = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/apiClient", () => ({
  apiGet: (...args: unknown[]) => apiGet(...args),
  apiPost: (...args: unknown[]) => apiPost(...args),
}));

beforeEach(() => {
  apiGet.mockReset();
  apiPost.mockReset();
});

describe("employee benefits API", () => {
  it("loads link status with zoneCode, not legalEntityCode", async () => {
    apiGet.mockResolvedValue({ linked: false, status: null });
    const link = await fetchEmployeeLink("UAE");
    expect(apiGet).toHaveBeenCalledWith("/storefront/employee-benefits/link?zoneCode=UAE");
    expect(String(apiGet.mock.calls[0]?.[0])).not.toContain("legalEntityCode");
    expect(link.linked).toBe(false);
  });

  it("loads context with zoneCode from the selected market", async () => {
    apiGet.mockResolvedValue({
      isEmployee: true,
      employeeLinkStatus: "ACTIVE",
      legalEntityCode: "URD1",
      employeeId: "emp-1",
      personnelNumber: "000123",
    });
    const context = await fetchEmployeeContext("UAE");
    expect(apiGet).toHaveBeenCalledWith("/storefront/employee-benefits/context?zoneCode=UAE");
    expect(String(apiGet.mock.calls[0]?.[0])).not.toContain("legalEntityCode");
    expect(context.isEmployee).toBe(true);
    expect(context.personnelNumber).toBe("000123");
    expect(context.legalEntityCode).toBe("URD1");
  });

  it("loads benefits with zoneCode from the selected market", async () => {
    apiGet.mockResolvedValue({
      linked: true,
      eligible: true,
      authority: "D365_STAFF_DISCOUNT",
      financialWriteEnabled: false,
      benefits: [],
    });
    await fetchEmployeeBenefits("UAE");
    expect(apiGet).toHaveBeenCalledWith("/storefront/employee-benefits?zoneCode=UAE");
    expect(String(apiGet.mock.calls[0]?.[0])).not.toContain("legalEntityCode");
  });

  it("does not invent a zoneCode from a legal entity", async () => {
    await expect(fetchEmployeeContext("")).rejects.toThrow(/current market zone/i);
    expect(apiGet).not.toHaveBeenCalled();
  });

  it("isolates cache keys by customer, zone, and resolved legal entity", () => {
    expect(employeeBenefitsKeys.context("customer-1", "UAE")).not.toEqual(
      employeeBenefitsKeys.context("customer-1", "QA"),
    );
    expect(employeeBenefitsKeys.context("customer-1", "UAE")).not.toEqual(
      employeeBenefitsKeys.context("customer-2", "UAE"),
    );
    expect(employeeBenefitsKeys.benefits("customer-1", "UAE", "URD1")).not.toEqual(
      employeeBenefitsKeys.benefits("customer-1", "QA", "QTR1"),
    );
  });

  it("accepts an invitation with id and secret in the body, not the URL", async () => {
    apiPost.mockResolvedValue({ status: "ACTIVE", alreadyAccepted: false });
    const result = await acceptEmployeeInvitation({
      invitationId: "inv-1",
      claimSecret: "abcdefghijklmnopqrstuvwxyz",
    });
    expect(result.status).toBe("ACTIVE");
    const [path, body] = apiPost.mock.calls[0] ?? [];
    expect(path).toBe("/storefront/employee-benefits/invitations/accept");
    expect(String(path)).not.toContain("claimSecret");
    expect(String(path)).not.toContain("abcdefghijklmnopqrstuvwxyz");
    expect(body).toEqual({
      invitationId: "inv-1",
      claimSecret: "abcdefghijklmnopqrstuvwxyz",
    });
    expect(body).not.toHaveProperty("customerId");
    expect(body).not.toHaveProperty("employeeId");
    expect(body).not.toHaveProperty("zoneCode");
  });
});
