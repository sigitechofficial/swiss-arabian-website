import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUiStore } from "@/stores/useUiStore";
import {
  readLoyaltyTransactions,
  readLoyaltyWallet,
  readOrderReward,
  type LoyaltyWalletView,
} from "../types/loyalty";
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

function wallet(partial: Partial<LoyaltyWalletView> = {}): LoyaltyWalletView {
  return {
    availability: "ACTIVE",
    unavailableMessage: null,
    member: true,
    hasServerWallet: true,
    zoneCode: "UAE",
    currencyCode: "AED",
    availablePoints: 0,
    pendingPoints: 0,
    reservedPoints: 0,
    availableValue: null,
    debtPoints: 0,
    debtLabel: null,
    tier: null,
    ...partial,
  };
}

function renderRewards() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <RewardsAccountView />
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

describe("L4 rewards debt presentation", () => {
  it("does not show a rewards adjustment card when debt is zero", async () => {
    fetchLoyaltyWallet.mockResolvedValue(wallet({ availablePoints: 200, availableValue: 2 }));
    renderRewards();
    expect(await screen.findByText("200")).toBeInTheDocument();
    expect(screen.queryByText("Rewards adjustment")).not.toBeInTheDocument();
    expect(screen.queryByText(/You owe/i)).not.toBeInTheDocument();
  });

  it("shows a rewards adjustment when the server reports debt", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      wallet({
        availablePoints: 0,
        debtPoints: 400,
        debtLabel: "Future reward points will first be applied to this adjustment before becoming available.",
      }),
    );
    renderRewards();
    expect(await screen.findByText("Rewards adjustment")).toBeInTheDocument();
    expect(screen.getByText("400 points")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Future reward points will first be applied to this adjustment before becoming available.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/You owe/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/debt collection/i)).not.toBeInTheDocument();
  });

  it("renders available points beside debt without subtracting them", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      wallet({ availablePoints: 200, availableValue: 2, debtPoints: 300 }),
    );
    renderRewards();
    expect(await screen.findByText("200")).toBeInTheDocument();
    expect(screen.getByText("AED 2.00")).toBeInTheDocument();
    expect(screen.getByText("300 points")).toBeInTheDocument();
    expect(screen.queryByText("−100")).not.toBeInTheDocument();
  });
});

describe("L4 activity rendering", () => {
  it("renders refund, return, manual and repayment rows as written", async () => {
    fetchLoyaltyWallet.mockResolvedValue(wallet({ availablePoints: 200 }));
    fetchLoyaltyTransactions.mockResolvedValue(
      readLoyaltyTransactions({
        items: [
          { id: "e", type: "POINTS_EARNED", points: 950 },
          { id: "a", type: "REFUND_ADJUSTMENT", points: -475, state: "PENDING" },
          { id: "r", type: "REWARD_POINTS_RETURNED", points: 1000 },
          { id: "c", type: "MANUAL_CREDIT", points: 500 },
          { id: "d", type: "MANUAL_DEBIT", points: -200 },
          { id: "p", type: "DEBT_REPAYMENT", points: -300 },
        ],
      }),
    );
    renderRewards();
    expect(await screen.findByText("Points earned")).toBeInTheDocument();
    expect(screen.getByText("Points adjusted after refund")).toBeInTheDocument();
    expect(screen.getAllByText("Pending").length).toBeGreaterThan(0);
    expect(screen.getByText("Reward points returned")).toBeInTheDocument();
    expect(screen.getByText("Manual points credit")).toBeInTheDocument();
    expect(screen.getByText("Manual points adjustment")).toBeInTheDocument();
    expect(screen.getByText("Points applied to previous adjustment")).toBeInTheDocument();
    expect(screen.getByText("−475 points")).toBeInTheDocument();
    expect(screen.getByText("+1,000 points")).toBeInTheDocument();
    expect(screen.queryByText("EARN_REVERSAL")).not.toBeInTheDocument();
    expect(screen.queryByText("REDEMPTION_REFUND")).not.toBeInTheDocument();
    expect(screen.queryByText("DEBT_REPAYMENT")).not.toBeInTheDocument();
    expect(screen.queryByText("Expired")).not.toBeInTheDocument();
    expect(screen.queryByText("Points redeemed")).not.toBeInTheDocument();
  });
});

describe("L4 disabled program history", () => {
  it("keeps balances and activity visible when the program is disabled", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      readLoyaltyWallet({
        enabled: false,
        member: true,
        reason: "LOYALTY_NOT_AVAILABLE",
        wallet: { availablePoints: 180, pendingPoints: 0, reservedPoints: 0, debtPoints: 40 },
        monetaryEquivalent: { available: "1.80", currencyCode: "AED" },
      }),
    );
    fetchLoyaltyTransactions.mockResolvedValue(
      readLoyaltyTransactions({ items: [{ id: "a", type: "REFUND_ADJUSTMENT", points: -40 }] }),
    );
    renderRewards();
    expect(await screen.findByText("180")).toBeInTheDocument();
    expect(screen.getByText("Rewards adjustment")).toBeInTheDocument();
    expect(
      screen.getByText("Rewards are currently unavailable for new earning or redemption."),
    ).toBeInTheDocument();
    expect(await screen.findByText("Points adjusted after refund")).toBeInTheDocument();
    expect(screen.queryByText(/You owe/i)).not.toBeInTheDocument();
  });

  it("keeps market-disabled history visible", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      readLoyaltyWallet({
        enabled: false,
        member: true,
        reason: "LOYALTY_NOT_AVAILABLE_IN_THIS_MARKET",
        wallet: { availablePoints: 12, pendingPoints: 0, reservedPoints: 0, debtPoints: 0 },
        monetaryEquivalent: { available: "0.12", currencyCode: "AED" },
      }),
    );
    fetchLoyaltyTransactions.mockResolvedValue(
      readLoyaltyTransactions({
        items: [{ id: "ret", type: "REWARD_POINTS_RETURNED", points: 1000 }],
      }),
    );
    renderRewards();
    expect(await screen.findByText("12")).toBeInTheDocument();
    expect(await screen.findByText("Reward points returned")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Rewards are currently unavailable for new earning or redemption in this market.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /use points/i })).not.toBeInTheDocument();
  });
});

describe("L4 order reward after-sale presentation", () => {
  it("shows a partial earn reversal from the live order Loyalty payload", () => {
    render(
      <OrderRewardNote
        reward={readOrderReward({
          earned: true,
          orderId: "order-1",
          points: 950,
          pointsReversed: 475,
          netEarnedPoints: 475,
          presentationState: "AVAILABLE",
          currencyCode: "AED",
          redemption: {
            redeemed: false,
            points: 0,
            amount: "0.00",
            pointsRefunded: 0,
            netPointsUsed: 0,
          },
        })}
      />,
    );
    expect(screen.getByText("You earned")).toBeInTheDocument();
    expect(screen.getByText("950 points")).toBeInTheDocument();
    expect(screen.getByText("Adjusted after refund")).toBeInTheDocument();
    expect(screen.getByText("−475 points")).toBeInTheDocument();
    expect(screen.getByText("Current reward from this order")).toBeInTheDocument();
  });

  it("shows a full earn reversal", () => {
    render(
      <OrderRewardNote
        reward={{
          earned: false,
          redemption: { redeemed: false },
          earnAdjustment: { originalPoints: 900, adjustedPoints: 900, currentPoints: 0 },
        }}
      />,
    );
    expect(screen.getByText("900 points")).toBeInTheDocument();
    expect(screen.getByText("−900 points")).toBeInTheDocument();
    expect(screen.getByText("0 points")).toBeInTheDocument();
  });

  it("shows a partial redeemed-points return", () => {
    render(
      <OrderRewardNote
        reward={{
          earned: false,
          redemption: {
            redeemed: true,
            points: 2000,
            amount: 20,
            currencyCode: "AED",
            returnedPoints: 1000,
            returnedAmount: 10,
            netPoints: 1000,
          },
          earnAdjustment: null,
        }}
      />,
    );
    expect(screen.getByText("You used")).toBeInTheDocument();
    expect(screen.getByText("2,000 points")).toBeInTheDocument();
    expect(screen.getByText("AED 20.00")).toBeInTheDocument();
    expect(screen.getByText("Returned after refund")).toBeInTheDocument();
    expect(screen.getByText("1,000 points")).toBeInTheDocument();
    expect(screen.getByText("AED 10.00")).toBeInTheDocument();
    expect(screen.getByText("Net points used")).toBeInTheDocument();
    expect(screen.getByText("1,000")).toBeInTheDocument();
  });

  it("shows a full redeemed-points return", () => {
    render(
      <OrderRewardNote
        reward={{
          earned: false,
          redemption: {
            redeemed: true,
            points: 2000,
            amount: 20,
            currencyCode: "AED",
            returnedPoints: 2000,
            returnedAmount: 20,
            netPoints: 0,
          },
          earnAdjustment: null,
        }}
      />,
    );
    expect(screen.getByText("Returned after refund")).toBeInTheDocument();
    expect(screen.getAllByText("2,000 points")).toHaveLength(2);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("keeps earn reversal and redemption return both visible", () => {
    render(
      <OrderRewardNote
        reward={{
          earned: false,
          redemption: {
            redeemed: true,
            points: 2000,
            amount: 20,
            currencyCode: "AED",
            returnedPoints: 2000,
            returnedAmount: 20,
            netPoints: 0,
          },
          earnAdjustment: { originalPoints: 900, adjustedPoints: 900, currentPoints: 0 },
        }}
      />,
    );
    expect(screen.getByText("You used")).toBeInTheDocument();
    expect(screen.getByText("Returned after refund")).toBeInTheDocument();
    expect(screen.getByText("You earned")).toBeInTheDocument();
    expect(screen.getByText("Adjusted after refund")).toBeInTheDocument();
    expect(screen.getByText("900 points")).toBeInTheDocument();
    expect(screen.getByText("−900 points")).toBeInTheDocument();
  });

  it("wraps long point values on a narrow viewport", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 375 });
    render(
      <OrderRewardNote
        reward={{
          earned: false,
          redemption: {
            redeemed: true,
            points: 1_250_000,
            amount: 12500,
            currencyCode: "AED",
            returnedPoints: 1_000_000,
            returnedAmount: 10000,
            netPoints: 250000,
          },
          earnAdjustment: null,
        }}
      />,
    );
    const used = screen.getByText("1,250,000 points");
    expect(used.className).toMatch(/break-words/);
    expect(used.className).toMatch(/tabular-nums/);
  });
});
