import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUiStore } from "@/stores/useUiStore";
import { readLoyaltyWallet } from "../types/loyalty";
import { RewardsAccountView } from "./RewardsAccountView";

const fetchLoyaltyWallet = vi.hoisted(() => vi.fn());
const fetchLoyaltyTransactions = vi.hoisted(() => vi.fn());
const fetchLoyaltyTierHistory = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  usePathname: () => "/account/rewards",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

vi.mock("next/image", () => ({
  default: () => <span />,
}));

vi.mock("../api/loyalty.service", () => ({
  fetchLoyaltyWallet: (...args: unknown[]) => fetchLoyaltyWallet(...args),
  fetchLoyaltyTransactions: (...args: unknown[]) => fetchLoyaltyTransactions(...args),
  fetchLoyaltyTierHistory: (...args: unknown[]) => fetchLoyaltyTierHistory(...args),
}));

function renderRewards() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <RewardsAccountView />
    </QueryClientProvider>,
  );
}

const liveMe = {
  enabled: true,
  member: true,
  market: { code: "UAE", currencyCode: "AED" },
  wallet: { availablePoints: 5420, pendingPoints: 0, reservedPoints: 0, debtPoints: 0 },
  monetaryEquivalent: { available: "54.20", currencyCode: "AED" },
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
  fetchLoyaltyWallet.mockReset();
  fetchLoyaltyTransactions.mockReset();
  fetchLoyaltyTransactions.mockResolvedValue([]);
  fetchLoyaltyTierHistory.mockReset();
  fetchLoyaltyTierHistory.mockResolvedValue([]);
  useAuthStore.setState({
    user: { id: "customer-1", email: "member@example.com" },
    isAuthenticated: true,
    bootstrapped: true,
  });
  useUiStore.setState({
    catalogContext: { zoneCode: "UAE", currencyCode: "AED", languageCode: "en" },
  });
});

afterEach(() => {
  cleanup();
  useAuthStore.getState().reset();
  useUiStore.setState({ catalogContext: null });
});

describe("L5.1 live Rewards tier presentation", () => {
  it("shows a base Member snapshot from /me.tier", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      readLoyaltyWallet({
        ...liveMe,
        wallet: { availablePoints: 0, pendingPoints: 0, reservedPoints: 0, debtPoints: 0 },
        monetaryEquivalent: { available: "0.00", currencyCode: "AED" },
        tier: {
          enabled: true,
          current: { code: "MEMBER", name: "Member", rank: 1 },
          qualifyingSpend: { amount: "0.00", currencyCode: "AED" },
          qualificationWindowDays: 365,
          progressPercent: 0,
          next: {
            code: "SILVER",
            name: "Silver",
            threshold: "1000.00",
            remainingAmount: "1000.00",
          },
        },
      }),
    );
    renderRewards();
    expect(await screen.findByText("Member")).toBeInTheDocument();
    expect(screen.getAllByText("AED 0.00").length).toBeGreaterThan(0);
    expect(screen.getByText("AED 1000.00 away from Silver")).toBeInTheDocument();
    expect(screen.getByText("Qualification period: Last 365 days")).toBeInTheDocument();
  });

  it("shows Gold remaining spend and progressPercent from next", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      readLoyaltyWallet({
        ...liveMe,
        tier: {
          enabled: true,
          current: { code: "GOLD", name: "Gold", rank: 3 },
          qualifyingSpend: { amount: "3450.00", currencyCode: "AED" },
          qualificationWindowDays: 365,
          progressPercent: 46,
          next: {
            code: "PLATINUM",
            name: "Platinum",
            threshold: "7500.00",
            remainingAmount: "4050.00",
          },
        },
      }),
    );
    renderRewards();
    expect(await screen.findByText("Gold")).toBeInTheDocument();
    expect(screen.getByText("AED 3450.00")).toBeInTheDocument();
    expect(screen.getByText("AED 4050.00 away from Platinum")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Progress toward Platinum" })).toHaveAttribute(
      "aria-valuenow",
      "46",
    );
  });

  it("shows highest-tier copy when next is null", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      readLoyaltyWallet({
        ...liveMe,
        tier: {
          enabled: true,
          current: { code: "PLATINUM", name: "Platinum", rank: 4 },
          qualifyingSpend: { amount: "12000.00", currencyCode: "AED" },
          progressPercent: 100,
          next: null,
        },
      }),
    );
    renderRewards();
    expect(await screen.findByText("Platinum")).toBeInTheDocument();
    expect(screen.getByText("You've reached the highest current Rewards tier.")).toBeInTheDocument();
    expect(screen.queryByText(/away from/i)).not.toBeInTheDocument();
  });

  it("renders live tier-history rows", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      readLoyaltyWallet({
        ...liveMe,
        wallet: { availablePoints: 200, pendingPoints: 0, reservedPoints: 0, debtPoints: 0 },
        monetaryEquivalent: { available: "2.00", currencyCode: "AED" },
        tier: {
          enabled: true,
          current: { code: "SILVER", name: "Silver", rank: 2 },
          qualifyingSpend: { amount: "800.00", currencyCode: "AED" },
          next: null,
        },
      }),
    );
    fetchLoyaltyTierHistory.mockResolvedValue([
      { id: "1", tierName: "Gold", label: "Reached after a qualifying purchase", occurredAt: "2026-10-08T00:00:00.000Z" },
      { id: "2", tierName: "Silver", label: "Adjusted after a refund", occurredAt: "2026-10-08T01:00:00.000Z" },
      { id: "3", tierName: "Gold", label: "Updated after an exchange adjustment", occurredAt: "2026-10-08T02:00:00.000Z" },
    ]);
    renderRewards();
    expect(await screen.findByText("Reached after a qualifying purchase")).toBeInTheDocument();
    expect(screen.getByText("Tier history")).toBeInTheDocument();
    expect(screen.getByText("Reached after a qualifying purchase")).toBeInTheDocument();
    expect(screen.getByText("Adjusted after a refund")).toBeInTheDocument();
    expect(screen.getByText("Updated after an exchange adjustment")).toBeInTheDocument();
    expect(screen.queryByText("PURCHASE")).not.toBeInTheDocument();
    expect(fetchLoyaltyTierHistory).toHaveBeenCalled();
  });

  it("keeps Gold after a redeemed available-points payload", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      readLoyaltyWallet({
        ...liveMe,
        wallet: { availablePoints: 2000, pendingPoints: 0, reservedPoints: 0, debtPoints: 0 },
        monetaryEquivalent: { available: "20.00", currencyCode: "AED" },
        giftCard: { appliedAmount: "50.00" },
        tier: {
          enabled: true,
          current: { code: "GOLD", name: "Gold", rank: 3 },
          qualifyingSpend: { amount: "3450.00", currencyCode: "AED" },
          next: null,
        },
      }),
    );
    renderRewards();
    expect(await screen.findByText("2,000")).toBeInTheDocument();
    expect(screen.getByText("Gold")).toBeInTheDocument();
    expect(screen.getByText("AED 3450.00")).toBeInTheDocument();
  });

  it("shows historical Gold when the program is disabled", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      readLoyaltyWallet({
        enabled: false,
        member: true,
        reason: "LOYALTY_NOT_AVAILABLE",
        wallet: liveMe.wallet,
        monetaryEquivalent: liveMe.monetaryEquivalent,
        tier: {
          enabled: true,
          current: { code: "GOLD", name: "Gold", rank: 3 },
          qualifyingSpend: { amount: "3450.00", currencyCode: "AED" },
          next: null,
        },
      }),
    );
    renderRewards();
    expect(await screen.findByText("Gold")).toBeInTheDocument();
    expect(
      screen.getByText("Rewards are currently unavailable for new earning or redemption."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /use points/i })).not.toBeInTheDocument();
  });

  it("drops the previous market tier while the next market loads", async () => {
    fetchLoyaltyWallet.mockImplementation((market: { zoneCode: string }) => {
      if (market.zoneCode === "KSA") return new Promise(() => undefined);
      return Promise.resolve(
        readLoyaltyWallet({
          ...liveMe,
          tier: {
            enabled: true,
            current: { code: "GOLD", name: "Gold", rank: 3 },
            qualifyingSpend: { amount: "3450.00", currencyCode: "AED" },
            next: null,
          },
        }),
      );
    });
    renderRewards();
    expect(await screen.findByText("Gold")).toBeInTheDocument();
    useUiStore.getState().setCatalogContext({ zoneCode: "KSA", currencyCode: "SAR", languageCode: "en" });
    await waitFor(() => {
      expect(screen.queryByText("Gold")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("status")).toHaveTextContent("Loading your rewards…");
  });
});
