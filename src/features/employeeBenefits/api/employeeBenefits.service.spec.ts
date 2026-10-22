import { beforeEach, describe, expect, it, vi } from "vitest";
import { acceptEmployeeInvitation, fetchEmployeeBenefits, fetchEmployeeLink } from "./employeeBenefits.service";

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
  it("loads link status through the authenticated client", async () => {
    apiGet.mockResolvedValue({ linked: false, status: null });
    const link = await fetchEmployeeLink();
    expect(apiGet).toHaveBeenCalledWith("/storefront/employee-benefits/link");
    expect(link.linked).toBe(false);
  });

  it("loads benefits through the authenticated client", async () => {
    apiGet.mockResolvedValue({
      linked: true,
      eligible: true,
      authority: "D365_STAFF_DISCOUNT",
      financialWriteEnabled: false,
      benefits: [],
    });
    await fetchEmployeeBenefits();
    expect(apiGet).toHaveBeenCalledWith("/storefront/employee-benefits");
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
  });
});
