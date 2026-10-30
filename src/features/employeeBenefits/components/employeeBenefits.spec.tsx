import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/api/apiError";
import { endSession } from "@/lib/auth/endSession";
import { accountTabNav, primaryNav } from "@/lib/navigation/storeNavigation";
import { queryClient as sessionQueryClient } from "@/lib/api/queryClient";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUiStore } from "@/stores/useUiStore";
import { employeeBenefitsKeys } from "../api/employeeBenefits.keys";
import { EmployeeBenefitsAccountView } from "./EmployeeBenefitsAccountView";
import { AccountTabNav } from "@/features/account/components/AccountTabNav";

const fetchEmployeeLink = vi.hoisted(() => vi.fn());
const fetchEmployeeContext = vi.hoisted(() => vi.fn());
const fetchEmployeeBenefits = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  usePathname: () => "/account/employee-benefits",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

vi.mock("../api/employeeBenefits.service", () => ({
  fetchEmployeeLink: (...args: unknown[]) => fetchEmployeeLink(...args),
  fetchEmployeeContext: (...args: unknown[]) => fetchEmployeeContext(...args),
  fetchEmployeeBenefits: (...args: unknown[]) => fetchEmployeeBenefits(...args),
}));

const loyaltyAccount = vi.hoisted(() => vi.fn());

vi.mock("@/features/loyalty/hooks/useLoyaltyAccount", () => ({
  useLoyaltyAccount: () => loyaltyAccount(),
}));

function createClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderView(client = createClient()) {
  return render(
    <QueryClientProvider client={client}>
      <EmployeeBenefitsAccountView />
    </QueryClientProvider>,
  );
}

const uaeNotEmployee = {
  isEmployee: false,
  employeeLinkStatus: null,
  legalEntityCode: "URD1",
  employeeId: null,
  personnelNumber: null,
};

const uaeEmployee = {
  isEmployee: true,
  employeeLinkStatus: "ACTIVE" as const,
  legalEntityCode: "URD1",
  employeeId: "emp-1",
  personnelNumber: "000123",
};

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
  fetchEmployeeContext.mockReset();
  fetchEmployeeBenefits.mockReset();
  fetchEmployeeContext.mockResolvedValue(uaeNotEmployee);
  fetchEmployeeLink.mockResolvedValue({ linked: false, status: null, legalEntityCode: null });
  loyaltyAccount.mockReset();
  loyaltyAccount.mockReturnValue({
    wallet: {
      data: { availablePoints: 250, availability: "ACTIVE", hasServerWallet: true },
      isSuccess: true,
    },
  });
  useAuthStore.setState({
    user: { id: "customer-1", email: "member@example.com" },
    isAuthenticated: true,
    bootstrapped: true,
  });
  useUiStore.setState({
    catalogContext: { zoneCode: "UAE", legalEntityCode: "URD1", currencyCode: "AED", languageCode: "en" },
  });
});

afterEach(() => {
  cleanup();
  useAuthStore.getState().reset();
  useUiStore.setState({ catalogContext: null });
});

describe("employee benefits account", () => {
  it("keeps Rewards and Gift Cards available, and hides Employee Benefits until the backend confirms a link", async () => {
    expect(accountTabNav.some((item) => item.href === "/account/rewards")).toBe(true);
    expect(accountTabNav.some((item) => item.href === "/account/employee-benefits")).toBe(true);
    expect(primaryNav.some((item) => item.href === "/gift-cards")).toBe(true);
    render(
      <QueryClientProvider client={createClient()}>
        <AccountTabNav />
      </QueryClientProvider>,
    );
    expect(await screen.findByRole("link", { name: "Rewards" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Employee Benefits" })).not.toBeInTheDocument();
  });

  it("shows Employee Benefits in account navigation only after isEmployee is true", async () => {
    fetchEmployeeContext.mockResolvedValue(uaeEmployee);
    fetchEmployeeLink.mockResolvedValue({ linked: true, status: "ACTIVE", legalEntityCode: "URD1" });
    render(
      <QueryClientProvider client={createClient()}>
        <AccountTabNav />
      </QueryClientProvider>,
    );
    expect(await screen.findByRole("link", { name: "Employee Benefits" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Rewards" })).toBeInTheDocument();
  });

  it("does not fetch until the selected market zone is available", async () => {
    useUiStore.setState({ catalogContext: null });
    renderView();
    expect(await screen.findByText("Waiting for the current market…")).toBeInTheDocument();
    expect(fetchEmployeeLink).not.toHaveBeenCalled();
    expect(fetchEmployeeContext).not.toHaveBeenCalled();
    expect(fetchEmployeeBenefits).not.toHaveBeenCalled();
  });

  it("asks a signed-in customer without a link to accept an invitation", async () => {
    renderView();
    expect(await screen.findByText(/Swiss Arabian Admin verification/i)).toBeInTheDocument();
    expect(fetchEmployeeLink).toHaveBeenCalledWith("UAE");
    expect(fetchEmployeeContext).toHaveBeenCalledWith("UAE");
    expect(screen.queryByLabelText("Invitation ID")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Invitation claim code")).not.toBeInTheDocument();
    expect(screen.queryByText("Amount limit")).not.toBeInTheDocument();
    expect(fetchEmployeeBenefits).not.toHaveBeenCalled();
  });

  it("shows connected URD1 benefits after an ACTIVE link in the UAE zone", async () => {
    fetchEmployeeLink.mockResolvedValue({ linked: true, status: "ACTIVE", legalEntityCode: "URD1" });
    fetchEmployeeContext.mockResolvedValue(uaeEmployee);
    fetchEmployeeBenefits.mockResolvedValue({
      linked: true,
      eligible: true,
      authority: "D365_STAFF_DISCOUNT",
      financialWriteEnabled: false,
      personnelNumber: "000123",
      designation: "SA-RTL",
      legalEntityCode: "URD1",
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
    expect(screen.getByText("Personnel number")).toBeInTheDocument();
    expect(screen.getByText("000123")).toBeInTheDocument();
    expect(screen.queryByText("emp-1")).not.toBeInTheDocument();
    expect(fetchEmployeeBenefits).toHaveBeenCalledWith("UAE");
    expect(screen.getByText("URD1")).toBeInTheDocument();
    expect(screen.getAllByText("Amount limit").length).toBe(2);
    expect(screen.getAllByText("Amount used in D365").length).toBe(2);
    expect(screen.getAllByText("Balance remaining in D365").length).toBe(2);
    expect(screen.getAllByText("D365 units — not verified").length).toBeGreaterThan(0);
    expect(screen.getByText("Staff-UAE")).toBeInTheDocument();
    expect(screen.getByText("Staff-QA")).toBeInTheDocument();
    expect(screen.getByText("4,879.50")).toBeInTheDocument();
    expect(screen.queryByText(/loyalty points/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/gift card/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/checkout discount/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/AED cash/i)).not.toBeInTheDocument();
    expect(screen.getByText("Online rewards")).toBeInTheDocument();
    expect(screen.getByText("250")).toBeInTheDocument();
    expect(screen.getByText(/not the store loyalty balance/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Customer Rewards" })).toHaveAttribute("href", "/account/rewards");
  });

  it("shows the linked personnel number E04097 and not the employee id", async () => {
    fetchEmployeeLink.mockResolvedValue({ linked: true, status: "ACTIVE", legalEntityCode: "URD1" });
    fetchEmployeeContext.mockResolvedValue({
      ...uaeEmployee,
      employeeId: "8d6c2c1a-1111-4222-8333-444455556666",
      personnelNumber: "E04097",
      fullName: "Browser fixture",
    });
    fetchEmployeeBenefits.mockResolvedValue({
      linked: true,
      eligible: true,
      authority: "D365_STAFF_DISCOUNT",
      financialWriteEnabled: false,
      personnelNumber: "E04097",
      fullName: "Browser fixture",
      designation: "SA-RTL",
      legalEntityCode: "URD1",
      benefits: [],
    });
    renderView();
    expect(await screen.findByText("E04097")).toBeInTheDocument();
    expect(screen.getByText("Personnel number")).toBeInTheDocument();
    expect(screen.getByText("Browser fixture")).toBeInTheDocument();
    expect(screen.queryByText("8d6c2c1a-1111-4222-8333-444455556666")).not.toBeInTheDocument();
  });

  it("does not present a disabled platform wallet as a zero loyalty balance", async () => {
    loyaltyAccount.mockReturnValue({
      wallet: {
        data: { availablePoints: 0, availability: "DISABLED", hasServerWallet: false },
        isSuccess: true,
      },
    });
    fetchEmployeeLink.mockResolvedValue({ linked: true, status: "ACTIVE", legalEntityCode: "URD1" });
    fetchEmployeeContext.mockResolvedValue(uaeEmployee);
    fetchEmployeeBenefits.mockResolvedValue({
      linked: true,
      eligible: true,
      authority: "D365_STAFF_DISCOUNT",
      financialWriteEnabled: false,
      personnelNumber: "E02783",
      fullName: "Amina Rahman",
      designation: null,
      legalEntityCode: "URD1",
      benefits: [
        {
          affiliationName: "Staff Discount 50%",
          amountLimit: "5000",
          amountUsed: "505",
          balanceRemaining: "4495",
          lastSyncedAt: null,
          unitStatus: "NOT_VERIFIED",
        },
      ],
    });
    renderView();
    expect(await screen.findByText("E02783")).toBeInTheDocument();
    expect(screen.getByText("Amina Rahman")).toBeInTheDocument();
    expect(screen.getByText("Staff Discount 50%")).toBeInTheDocument();
    expect(screen.getByText("5,000")).toBeInTheDocument();
    expect(screen.getByText("505")).toBeInTheDocument();
    expect(screen.getByText("4,495")).toBeInTheDocument();
    expect(screen.getByText("Online rewards")).toBeInTheDocument();
    expect(screen.getByText(/aren’t available for this account/i)).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Customer Rewards" })).toHaveAttribute("href", "/account/rewards");
  });

  it("shows D365 benefits and a notice when website allowance tracking is not deployed", async () => {
    fetchEmployeeLink.mockResolvedValue({ linked: true, status: "ACTIVE", legalEntityCode: "URD1" });
    fetchEmployeeContext.mockResolvedValue(uaeEmployee);
    fetchEmployeeBenefits.mockResolvedValue({
      linked: true,
      eligible: true,
      authority: "D365_STAFF_DISCOUNT",
      financialWriteEnabled: false,
      personnelNumber: "E02783",
      fullName: "Amina Rahman",
      designation: null,
      legalEntityCode: "URD1",
      benefits: [
        {
          affiliationName: "Staff Discount 50%",
          amountLimit: "5000",
          amountUsed: "505",
          balanceRemaining: "4495",
          lastSyncedAt: null,
          unitStatus: "NOT_VERIFIED",
        },
      ],
      websiteAccounting: {
        availability: "UNAVAILABLE_SCHEMA",
        currencyCode: "AED",
        activeProvisionalHolds: null,
        paidUsagePendingD365: null,
        websiteAvailableAllowance: null,
        d365ReconciliationStatus: null,
      },
    });
    renderView();
    expect(await screen.findByText("5,000")).toBeInTheDocument();
    expect(
      screen.getByRole("status"),
    ).toHaveTextContent("Your D365 employee benefit information is available. Website allowance tracking is temporarily unavailable.");
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });

  it("shows D365 benefits and a notice when website allowance tracking is not deployed", async () => {
    fetchEmployeeLink.mockResolvedValue({ linked: true, status: "ACTIVE", legalEntityCode: "URD1" });
    fetchEmployeeContext.mockResolvedValue(uaeEmployee);
    fetchEmployeeBenefits.mockResolvedValue({
      linked: true,
      eligible: true,
      authority: "D365_STAFF_DISCOUNT",
      financialWriteEnabled: false,
      personnelNumber: "E02783",
      fullName: "Amina Rahman",
      designation: null,
      legalEntityCode: "URD1",
      benefits: [
        {
          affiliationName: "Staff Discount 50%",
          amountLimit: "5000",
          amountUsed: "505",
          balanceRemaining: "4495",
          lastSyncedAt: null,
          unitStatus: "NOT_VERIFIED",
        },
      ],
      websiteAccounting: {
        availability: "UNAVAILABLE_SCHEMA",
        currencyCode: "AED",
        activeProvisionalHolds: null,
        paidUsagePendingD365: null,
        websiteAvailableAllowance: null,
        d365ReconciliationStatus: null,
      },
    });
    renderView();
    expect(await screen.findByText("Staff Discount 50%")).toBeInTheDocument();
    expect(screen.getByText("5,000")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your D365 employee benefit information is available. Website allowance tracking is temporarily unavailable.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("We couldn’t load Employee Benefits right now.")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });

  it("shows an empty benefit record without inventing an allowance", async () => {
    fetchEmployeeLink.mockResolvedValue({ linked: true, status: "ACTIVE", legalEntityCode: "URD1" });
    fetchEmployeeContext.mockResolvedValue(uaeEmployee);
    fetchEmployeeBenefits.mockResolvedValue({
      linked: true,
      eligible: true,
      authority: "D365_STAFF_DISCOUNT",
      financialWriteEnabled: false,
      personnelNumber: "000123",
      designation: null,
      legalEntityCode: "URD1",
      benefits: [],
    });
    renderView();
    expect(await screen.findByText(/No staff benefit record/i)).toBeInTheDocument();
  });

  it("does not show benefits when the link is revoked or suspended", async () => {
    fetchEmployeeLink.mockResolvedValue({ linked: false, status: "REVOKED", legalEntityCode: "URD1" });
    renderView();
    expect(await screen.findByText(/currently unavailable/i)).toBeInTheDocument();
    expect(fetchEmployeeBenefits).not.toHaveBeenCalled();
    expect(screen.queryByText("Amount limit")).not.toBeInTheDocument();
  });

  it("does not claim the customer is not an employee when the API fails with 5xx", async () => {
    fetchEmployeeContext.mockRejectedValue(new ApiClientError(500, "Request failed"));
    renderView();
    expect(await screen.findByText("We couldn’t load Employee Benefits right now.")).toBeInTheDocument();
    expect(screen.queryByText(/not an employee/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("treats a 400 from context as a load failure, not as a non-employee", async () => {
    fetchEmployeeContext.mockRejectedValue(new ApiClientError(400, "zoneCode is required"));
    renderView();
    expect(await screen.findByText("We couldn’t load Employee Benefits right now.")).toBeInTheDocument();
    expect(screen.queryByText(/not an employee/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("treats 403 as unavailable without retrying employee inference", async () => {
    fetchEmployeeContext.mockRejectedValue(new ApiClientError(403, "Forbidden"));
    renderView();
    expect(await screen.findByText(/currently unavailable for this account/i)).toBeInTheDocument();
    expect(screen.queryByText("Amount limit")).not.toBeInTheDocument();
  });

  it("does not offer retry after 401", async () => {
    fetchEmployeeContext.mockRejectedValue(new ApiClientError(401, "Unauthorized"));
    renderView();
    expect(await screen.findByText("We couldn’t load Employee Benefits right now.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });

  it("does not collect an invitation secret or show another employee's record", async () => {
    renderView();
    expect(await screen.findByText(/Swiss Arabian Admin verification/i)).toBeInTheDocument();
    expect(screen.queryByLabelText("Invitation ID")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Invitation claim code")).not.toBeInTheDocument();
    expect(screen.queryByText("000123")).not.toBeInTheDocument();
  });

  it("refreshes employee context for the current zone after sign-in clears the cache", () => {
    sessionQueryClient.setQueryData(employeeBenefitsKeys.context("customer-1", "UAE"), uaeNotEmployee);
    endSession();
    expect(sessionQueryClient.getQueryData(employeeBenefitsKeys.context("customer-1", "UAE"))).toBeUndefined();
  });

  it("does not treat an ACTIVE URD1 employee as an employee in the QA zone", async () => {
    useUiStore.setState({
      catalogContext: { zoneCode: "QA", legalEntityCode: "QTR1", currencyCode: "QAR", languageCode: "en" },
    });
    fetchEmployeeLink.mockResolvedValue({ linked: false, status: null, legalEntityCode: null });
    fetchEmployeeContext.mockResolvedValue({
      isEmployee: false,
      employeeLinkStatus: null,
      legalEntityCode: "QTR1",
      employeeId: null,
      personnelNumber: null,
    });
    renderView();
    expect(await screen.findByText(/Swiss Arabian Admin verification/i)).toBeInTheDocument();
    expect(fetchEmployeeLink).toHaveBeenCalledWith("QA");
    expect(fetchEmployeeContext).toHaveBeenCalledWith("QA");
    expect(fetchEmployeeBenefits).not.toHaveBeenCalled();
    expect(screen.queryByText("Amount limit")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Customer Rewards" })).toBeInTheDocument();
  });

  it("does not keep UAE staff balances after switching to QA", async () => {
    fetchEmployeeLink.mockImplementation(async (zone: string) =>
      zone === "UAE"
        ? { linked: true, status: "ACTIVE", legalEntityCode: "URD1" }
        : { linked: false, status: null, legalEntityCode: null },
    );
    fetchEmployeeContext.mockImplementation(async (zone: string) =>
      zone === "UAE"
        ? uaeEmployee
        : {
            isEmployee: false,
            employeeLinkStatus: null,
            legalEntityCode: "QTR1",
            employeeId: null,
            personnelNumber: null,
          },
    );
    fetchEmployeeBenefits.mockResolvedValue({
      linked: true,
      eligible: true,
      authority: "D365_STAFF_DISCOUNT",
      financialWriteEnabled: false,
      personnelNumber: "000123",
      designation: null,
      legalEntityCode: "URD1",
      benefits: [
        {
          affiliationName: "Staff-UAE",
          amountLimit: "5000.00",
          amountUsed: "120.50",
          balanceRemaining: "4879.50",
          lastSyncedAt: null,
          unitStatus: "NOT_VERIFIED",
        },
      ],
    });
    const client = createClient();
    renderView(client);
    expect(await screen.findByText("Staff-UAE")).toBeInTheDocument();
    await act(async () => {
      useUiStore.setState({
        catalogContext: { zoneCode: "QA", legalEntityCode: "QTR1", currencyCode: "QAR", languageCode: "en" },
      });
    });
    expect(await screen.findByText(/Swiss Arabian Admin verification/i)).toBeInTheDocument();
    expect(screen.queryByText("Staff-UAE")).not.toBeInTheDocument();
    expect(screen.queryByText("4,879.50")).not.toBeInTheDocument();
    expect(fetchEmployeeContext).toHaveBeenCalledWith("QA");
  });

  it("does not reuse another customer's employee context", async () => {
    fetchEmployeeLink.mockResolvedValue({ linked: true, status: "ACTIVE", legalEntityCode: "URD1" });
    fetchEmployeeContext.mockResolvedValue(uaeEmployee);
    fetchEmployeeBenefits.mockResolvedValue({
      linked: true,
      eligible: true,
      authority: "D365_STAFF_DISCOUNT",
      financialWriteEnabled: false,
      personnelNumber: "000123",
      designation: null,
      legalEntityCode: "URD1",
      benefits: [],
    });
    const client = createClient();
    renderView(client);
    expect(await screen.findByText(/No staff benefit record/i)).toBeInTheDocument();
    fetchEmployeeLink.mockResolvedValue({ linked: false, status: null, legalEntityCode: null });
    fetchEmployeeContext.mockResolvedValue({
      isEmployee: false,
      employeeLinkStatus: null,
      legalEntityCode: "URD1",
      employeeId: null,
      personnelNumber: null,
    });
    await act(async () => {
      useAuthStore.setState({
        user: { id: "customer-2", email: "other@example.com" },
        isAuthenticated: true,
        bootstrapped: true,
      });
    });
    expect(await screen.findByText(/Swiss Arabian Admin verification/i)).toBeInTheDocument();
    expect(screen.queryByText(/No staff benefit record/i)).not.toBeInTheDocument();
    expect(employeeBenefitsKeys.context("customer-1", "UAE")).not.toEqual(
      employeeBenefitsKeys.context("customer-2", "UAE"),
    );
  });

  it("clears employee-benefit cache on logout", () => {
    sessionQueryClient.setQueryData(employeeBenefitsKeys.context("customer-1", "UAE"), uaeEmployee);
    endSession();
    expect(sessionQueryClient.getQueryData(employeeBenefitsKeys.context("customer-1", "UAE"))).toBeUndefined();
  });

  it("shows Redirecting when the customer is signed out", () => {
    useAuthStore.setState({ user: null, isAuthenticated: false, bootstrapped: true });
    renderView();
    expect(screen.getByText("Redirecting…")).toBeInTheDocument();
    expect(fetchEmployeeLink).not.toHaveBeenCalled();
    expect(fetchEmployeeContext).not.toHaveBeenCalled();
  });
});
