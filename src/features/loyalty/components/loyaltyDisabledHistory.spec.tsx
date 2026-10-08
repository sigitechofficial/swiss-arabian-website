import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUiStore } from "@/stores/useUiStore";
import { readLoyaltyTransactions, readLoyaltyWallet } from "../types/loyalty";
import { EarnPreviewNote } from "./EarnPreviewNote";
import { OrderRewardNote } from "./OrderRewardNote";
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

function noActions() {
  expect(screen.queryByRole("button", { name: /use points/i })).not.toBeInTheDocument();
  expect(screen.queryByText(/earn approximately/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/claim/i)).not.toBeInTheDocument();
  expect(screen.queryByRole("slider")).not.toBeInTheDocument();
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

describe("L4.1 historical rewards while disabled", () => {
  it("shows program-disabled balances from the server wallet", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      readLoyaltyWallet({
        enabled: false,
        member: true,
        reason: "LOYALTY_NOT_AVAILABLE",
        market: { code: "UAE", currencyCode: "AED" },
        wallet: { availablePoints: 5420, pendingPoints: 0, reservedPoints: 0, debtPoints: 0 },
        monetaryEquivalent: { available: "54.20", currencyCode: "AED" },
      }),
    );
    renderRewards();
    expect(await screen.findByText("5,420")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Available points" })).toBeInTheDocument();
    expect(screen.getByText("AED 54.20")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Reserved")).toBeInTheDocument();
    expect(
      screen.getByText("Rewards are currently unavailable for new earning or redemption."),
    ).toBeInTheDocument();
    noActions();
  });

  it("shows program-disabled transactions", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      readLoyaltyWallet({
        enabled: false,
        member: true,
        reason: "LOYALTY_NOT_AVAILABLE",
        wallet: { availablePoints: 5420, pendingPoints: 0, reservedPoints: 0, debtPoints: 0 },
        monetaryEquivalent: { available: "54.20", currencyCode: "AED" },
      }),
    );
    fetchLoyaltyTransactions.mockResolvedValue(
      readLoyaltyTransactions({
        enabled: false,
        member: true,
        items: [
          { id: "e", type: "POINTS_EARNED", points: 950 },
          { id: "r", type: "POINTS_REDEEMED", points: -200 },
        ],
      }),
    );
    renderRewards();
    expect(await screen.findByText("Points earned")).toBeInTheDocument();
    expect(screen.getByText("Points redeemed")).toBeInTheDocument();
    expect(screen.getByText("+950 points")).toBeInTheDocument();
    expect(screen.getByText("−200 points")).toBeInTheDocument();
    expect(screen.queryByText("POINTS_EARNED")).not.toBeInTheDocument();
  });

  it("shows market-disabled balances and activity", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      readLoyaltyWallet({
        enabled: false,
        member: true,
        reason: "LOYALTY_NOT_AVAILABLE_IN_THIS_MARKET",
        market: { code: "UAE", currencyCode: "AED" },
        wallet: { availablePoints: 5420, pendingPoints: 0, reservedPoints: 0, debtPoints: 0 },
        monetaryEquivalent: { available: "54.20", currencyCode: "AED" },
      }),
    );
    fetchLoyaltyTransactions.mockResolvedValue(
      readLoyaltyTransactions({
        enabled: false,
        member: true,
        items: [{ id: "ret", type: "POINTS_RETURNED", points: 1000 }],
      }),
    );
    renderRewards();
    expect(await screen.findByText("5,420")).toBeInTheDocument();
    expect(await screen.findByText("Reward points returned")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Rewards are currently unavailable for new earning or redemption in this market.",
      ),
    ).toBeInTheDocument();
    noActions();
  });

  it("keeps a simple unavailable state when there is no wallet", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      readLoyaltyWallet({
        enabled: false,
        member: false,
        reason: "LOYALTY_NOT_AVAILABLE",
      }),
    );
    renderRewards();
    expect(
      await screen.findByText("Swiss Arabian Rewards is not currently available."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Available points" })).not.toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
    expect(screen.queryByText("No reward activity yet.")).not.toBeInTheDocument();
    noActions();
  });

  it("shows a disabled wallet debt without inventing a negative available", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      readLoyaltyWallet({
        enabled: false,
        member: true,
        reason: "LOYALTY_NOT_AVAILABLE",
        wallet: { availablePoints: 0, pendingPoints: 0, reservedPoints: 0, debtPoints: 400 },
        monetaryEquivalent: { available: "0.00", currencyCode: "AED" },
      }),
    );
    renderRewards();
    expect(await screen.findByText("Rewards adjustment")).toBeInTheDocument();
    expect(screen.getByText("400 points")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.queryByText("−400")).not.toBeInTheDocument();
    noActions();
  });

  it("does not reconstruct available points from activity", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      readLoyaltyWallet({
        enabled: false,
        member: true,
        reason: "LOYALTY_NOT_AVAILABLE",
        wallet: { availablePoints: 5420, pendingPoints: 0, reservedPoints: 0, debtPoints: 0 },
        monetaryEquivalent: { available: "54.20", currencyCode: "AED" },
      }),
    );
    fetchLoyaltyTransactions.mockResolvedValue(
      readLoyaltyTransactions({
        items: [
          { id: "a", type: "POINTS_EARNED", points: 100 },
          { id: "b", type: "POINTS_REDEEMED", points: -40 },
        ],
      }),
    );
    renderRewards();
    expect(await screen.findByText("5,420")).toBeInTheDocument();
    expect(await screen.findByText("Points earned")).toBeInTheDocument();
    expect(screen.queryByText("60")).not.toBeInTheDocument();
  });

  it("still renders a historical order Loyalty summary", () => {
    render(
      <OrderRewardNote
        reward={{
          earned: true,
          orderId: "order-1",
          points: 950,
          state: "AVAILABLE",
          currencyCode: "AED",
          vestedAt: null,
          redemption: { redeemed: false },
          earnAdjustment: null,
        }}
      />,
    );
    expect(screen.getByText("You earned")).toBeInTheDocument();
    expect(screen.getByText("950 points available")).toBeInTheDocument();
    expect(screen.queryByText(/not currently available/i)).not.toBeInTheDocument();
  });

  it("does not show an earning claim when current Loyalty is disabled", () => {
    render(
      <EarnPreviewNote
        preview={{ enabled: false, earningDisabled: false }}
        variant="block"
      />,
    );
    expect(screen.queryByText(/you'll earn/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId("earn-preview")).not.toBeInTheDocument();
  });
});
