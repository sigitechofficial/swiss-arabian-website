import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/api/apiError";
import { accountTabNav, primaryNav } from "@/lib/navigation/storeNavigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { EmployeeBenefitsAccountView } from "./EmployeeBenefitsAccountView";

const fetchEmployeeLink = vi.hoisted(() => vi.fn());
const fetchEmployeeBenefits = vi.hoisted(() => vi.fn());
const acceptEmployeeInvitation = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  usePathname: () => "/account/employee-benefits",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

vi.mock("../api/employeeBenefits.service", () => ({
  fetchEmployeeLink: (...args: unknown[]) => fetchEmployeeLink(...args),
  fetchEmployeeBenefits: (...args: unknown[]) => fetchEmployeeBenefits(...args),
  acceptEmployeeInvitation: (...args: unknown[]) => acceptEmployeeInvitation(...args),
}));

function renderView() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <EmployeeBenefitsAccountView />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  class IntersectionObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
  fetchEmployeeLink.mockReset();
  fetchEmployeeBenefits.mockReset();
  acceptEmployeeInvitation.mockReset();
  useAuthStore.setState({
    user: { id: "customer-1", email: "member@example.com" },
    isAuthenticated: true,
    bootstrapped: true,
  });
});

afterEach(() => {
  cleanup();
  useAuthStore.getState().reset();
});

describe("employee benefits account", () => {
  it("keeps Rewards, Gift Cards, and checkout navigation unchanged", () => {
    expect(accountTabNav.some((item) => item.href === "/account/rewards")).toBe(true);
    expect(accountTabNav.some((item) => item.href === "/account/employee-benefits")).toBe(true);
    expect(primaryNav.some((item) => item.href === "/gift-cards")).toBe(true);
  });

  it("asks a signed-in customer without a link to accept an invitation", async () => {
    fetchEmployeeLink.mockResolvedValue({ linked: false, status: null, legalEntityCode: null });
    renderView();
    expect(await screen.findByText(/available only to verified/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Invitation ID")).toBeInTheDocument();
    expect(screen.getByLabelText("Invitation claim code")).toBeInTheDocument();
    expect(screen.queryByText("Staff Benefit Limit")).not.toBeInTheDocument();
    expect(fetchEmployeeBenefits).not.toHaveBeenCalled();
  });

  it("shows connected benefits after an ACTIVE link", async () => {
    fetchEmployeeLink.mockResolvedValue({ linked: true, status: "ACTIVE", legalEntityCode: "SAUAE" });
    fetchEmployeeBenefits.mockResolvedValue({
      linked: true,
      eligible: true,
      authority: "D365_STAFF_DISCOUNT",
      financialWriteEnabled: false,
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
    renderView();
    expect(await screen.findByText("Connected")).toBeInTheDocument();
    expect(screen.getAllByText("Staff Benefit Limit").length).toBe(2);
    expect(screen.getAllByText("Recorded Usage").length).toBe(2);
    expect(screen.getAllByText("Remaining Staff Benefit").length).toBe(2);
    expect(screen.getAllByText("D365 units — not verified").length).toBeGreaterThan(0);
    expect(screen.getByText("Staff-UAE")).toBeInTheDocument();
    expect(screen.getByText("Staff-QA")).toBeInTheDocument();
    expect(screen.getByText("4,879.50")).toBeInTheDocument();
    expect(screen.queryByText(/loyalty points/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/gift card/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/checkout discount/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/AED cash/i)).not.toBeInTheDocument();
  });

  it("shows an empty benefit record without inventing an allowance", async () => {
    fetchEmployeeLink.mockResolvedValue({ linked: true, status: "ACTIVE", legalEntityCode: "SAUAE" });
    fetchEmployeeBenefits.mockResolvedValue({
      linked: true,
      eligible: true,
      authority: "D365_STAFF_DISCOUNT",
      financialWriteEnabled: false,
      personnelNumber: "000123",
      designation: null,
      legalEntityCode: "SAUAE",
      benefits: [],
    });
    renderView();
    expect(await screen.findByText(/No staff benefit record/i)).toBeInTheDocument();
  });

  it("does not show benefits when the link is revoked or suspended", async () => {
    fetchEmployeeLink.mockResolvedValue({ linked: false, status: "REVOKED", legalEntityCode: "SAUAE" });
    renderView();
    expect(await screen.findByText(/currently unavailable/i)).toBeInTheDocument();
    expect(fetchEmployeeBenefits).not.toHaveBeenCalled();
    expect(screen.queryByText("Staff Benefit Limit")).not.toBeInTheDocument();
  });

  it("does not claim the customer is not an employee when the API fails", async () => {
    fetchEmployeeLink.mockRejectedValue(new ApiClientError(500, "Request failed"));
    renderView();
    expect(await screen.findByText("We couldn’t load Employee Benefits right now.")).toBeInTheDocument();
    expect(screen.queryByText(/not an employee/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("maps an invalid invitation without storing the secret in the URL", async () => {
    fetchEmployeeLink.mockResolvedValue({ linked: false, status: null, legalEntityCode: null });
    acceptEmployeeInvitation.mockRejectedValue(
      new ApiClientError(422, { message: "Invitation cannot be accepted" }),
    );
    renderView();
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Invitation ID"), "inv-1");
    await user.type(screen.getByLabelText("Invitation claim code"), "abcdefghijklmnopqrstuvwxyz");
    await user.click(screen.getByRole("button", { name: "Connect account" }));
    expect(await screen.findByText("This invitation cannot be accepted with this account.")).toBeInTheDocument();
    expect(acceptEmployeeInvitation.mock.calls[0]?.[0]).toEqual({
      invitationId: "inv-1",
      claimSecret: "abcdefghijklmnopqrstuvwxyz",
    });
  });

  it("shows Redirecting when the customer is signed out", () => {
    fetchEmployeeLink.mockResolvedValue({ linked: false, status: null, legalEntityCode: null });
    useAuthStore.setState({ user: null, isAuthenticated: false, bootstrapped: true });
    renderView();
    expect(screen.getByText("Redirecting…")).toBeInTheDocument();
    expect(fetchEmployeeLink).not.toHaveBeenCalled();
  });
});
