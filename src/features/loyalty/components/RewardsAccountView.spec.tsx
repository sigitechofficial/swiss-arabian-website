import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUiStore } from "@/stores/useUiStore";
import {
  readLoyaltyTransactions,
  readLoyaltyWallet,
  type LoyaltyTransactionView,
  type LoyaltyWalletView,
} from "../types/loyalty";
import { RewardsAccountView } from "./RewardsAccountView";

const fetchLoyaltyWallet = vi.hoisted(() => vi.fn());
const fetchLoyaltyTransactions = vi.hoisted(() => vi.fn());

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
}));

function wallet(partial: Partial<LoyaltyWalletView>): LoyaltyWalletView {
  return {
    availability: "ACTIVE",
    unavailableMessage: null,
    zoneCode: "UAE",
    currencyCode: "AED",
    availablePoints: 0,
    pendingPoints: 0,
    reservedPoints: 0,
    availableValue: null,
    debtLabel: null,
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

describe("rewards account", () => {
  it("shows an authenticated member's server balances", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      wallet({
        availablePoints: 5420,
        pendingPoints: 800,
        reservedPoints: 0,
        availableValue: 54.2,
      }),
    );
    renderRewards();
    expect(await screen.findByText("5,420")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "My rewards" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Available points" })).toBeInTheDocument();
    expect(screen.getByText("AED 54.20")).toBeInTheDocument();
    expect(screen.getByText("800 points")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("0 points")).toBeInTheDocument();
    expect(screen.getByText("Reserved")).toBeInTheDocument();
    expect(await screen.findByText("No reward activity yet.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /redeem/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("shows a new member with no sample activity", async () => {
    fetchLoyaltyWallet.mockResolvedValue(wallet({}));
    renderRewards();
    expect(await screen.findByText("Start earning rewards with eligible purchases.")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.queryByText("Pending")).not.toBeInTheDocument();
    expect(screen.queryByText(/Worth/)).not.toBeInTheDocument();
    expect(await screen.findByText("No reward activity yet.")).toBeInTheDocument();
    expect(screen.queryByText("1,240")).not.toBeInTheDocument();
    expect(screen.queryByText(/Gold/)).not.toBeInTheDocument();
  });

  it("shows returned reward activity", async () => {
    const rows: LoyaltyTransactionView[] = [
      {
        id: "tx-1",
        label: "Order earned",
        detail: "Order 10842",
        points: 150,
        occurredAt: "2026-07-24T00:00:00.000Z",
        state: null,
      },
    ];
    fetchLoyaltyWallet.mockResolvedValue(wallet({ availablePoints: 150, availableValue: 1.5 }));
    fetchLoyaltyTransactions.mockResolvedValue(rows);
    renderRewards();
    expect(await screen.findByText("Order earned")).toBeInTheDocument();
    expect(screen.getByText("Order 10842")).toBeInTheDocument();
    expect(screen.getByText("+150 points")).toBeInTheDocument();
    expect(screen.queryByText("MANUAL_CREDIT")).not.toBeInTheDocument();
  });

  it("shows a disabled market without a zero balance", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      wallet({
        availability: "DISABLED",
        unavailableMessage: "Swiss Arabian Rewards is not currently available in this market.",
      }),
    );
    renderRewards();
    expect(
      await screen.findByText("Swiss Arabian Rewards is not currently available in this market."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Available points" })).not.toBeInTheDocument();
    expect(screen.queryByText("No reward activity yet.")).not.toBeInTheDocument();
    expect(fetchLoyaltyTransactions).not.toHaveBeenCalled();
  });

  it("shows a loading state without static points", async () => {
    fetchLoyaltyWallet.mockReturnValue(new Promise(() => undefined));
    renderRewards();
    expect(await screen.findByRole("status")).toHaveTextContent("Loading your rewards…");
    expect(screen.queryByText("1,240")).not.toBeInTheDocument();
    expect(screen.queryByText("5,420")).not.toBeInTheDocument();
  });

  it("recovers from an error without dummy points", async () => {
    const user = userEvent.setup();
    fetchLoyaltyWallet.mockRejectedValueOnce(new Error("network"));
    fetchLoyaltyWallet.mockResolvedValueOnce(wallet({ availablePoints: 20, availableValue: 0.2 }));
    renderRewards();
    expect(await screen.findByText("We couldn't load your rewards right now.")).toBeInTheDocument();
    expect(screen.queryByText("1,240")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("20")).toBeInTheDocument();
  });

  it("does not call the wallet for a signed-out customer", async () => {
    useAuthStore.setState({ user: null, isAuthenticated: false, bootstrapped: true });
    renderRewards();
    expect(await screen.findByText("Redirecting…")).toBeInTheDocument();
    expect(fetchLoyaltyWallet).not.toHaveBeenCalled();
    expect(fetchLoyaltyTransactions).not.toHaveBeenCalled();
  });

  it("drops the previous market wallet while the next market loads", async () => {
    fetchLoyaltyWallet.mockImplementation((market: { zoneCode: string }) => {
      if (market.zoneCode === "QA") return new Promise(() => undefined);
      return Promise.resolve(
        wallet({ availablePoints: 5420, pendingPoints: 800, availableValue: 54.2, currencyCode: "AED" }),
      );
    });
    renderRewards();
    expect(await screen.findByText("5,420")).toBeInTheDocument();
    useUiStore.getState().setCatalogContext({ zoneCode: "QA", currencyCode: "QAR", languageCode: "en" });
    await waitFor(() => {
      expect(screen.queryByText("5,420")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("status")).toHaveTextContent("Loading your rewards…");
    expect(screen.queryByText("AED 54.20")).not.toBeInTheDocument();
    expect(fetchLoyaltyWallet).toHaveBeenCalledWith({ zoneCode: "QA", currencyCode: "QAR" });
  });

  it("renders the live backend payload end to end", async () => {
    // Captured from GET /storefront/loyalty/me and /transactions on the real service.
    fetchLoyaltyWallet.mockResolvedValue(
      readLoyaltyWallet({
        enabled: true,
        member: true,
        program: { code: "SWISS_ARABIAN_LOYALTY", name: "Swiss Arabian Loyalty" },
        market: { code: "UAE", currencyCode: "AED" },
        wallet: { availablePoints: 5420, pendingPoints: 0, reservedPoints: 0, debtPoints: 0 },
        monetaryEquivalent: { available: "54.20", currencyCode: "AED" },
        policy: { rewardRatePercent: "5.0000", pointValue: "0.010000" },
      }),
    );
    fetchLoyaltyTransactions.mockResolvedValue(
      readLoyaltyTransactions({
        enabled: true,
        member: true,
        items: [
          {
            id: "33ef73dc-3d42-4462-93e3-d340b616846a",
            type: "POINTS_ADJUSTMENT",
            points: 5420,
            currencyCode: "AED",
            moneyEquivalent: "54.20",
            occurredAt: "2026-10-05T11:42:03.652Z",
          },
        ],
        pageInfo: { total: 1, limit: 20, offset: 0, hasMore: false },
        currencyCode: "AED",
      }),
    );
    renderRewards();
    expect(await screen.findByText("5,420")).toBeInTheDocument();
    expect(screen.getByText("AED 54.20")).toBeInTheDocument();
    expect(await screen.findByText("Points adjustment")).toBeInTheDocument();
    expect(screen.getByText("+5,420 points")).toBeInTheDocument();
    expect(screen.queryByText("POINTS_ADJUSTMENT")).not.toBeInTheDocument();
    expect(screen.queryByText(/FE_L11_VERIFICATION/)).not.toBeInTheDocument();
    expect(screen.queryByText(/0\.010000/)).not.toBeInTheDocument();
  });

  it("renders the live disabled payload", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      readLoyaltyWallet({ enabled: false, member: false, reason: "LOYALTY_NOT_AVAILABLE" }),
    );
    renderRewards();
    expect(
      await screen.findByText("Swiss Arabian Rewards is not currently available."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Available points" })).not.toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("shows reserved points while a reservation is active", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      wallet({ availablePoints: 5220, reservedPoints: 200, availableValue: 52.2 }),
    );
    fetchLoyaltyTransactions.mockResolvedValue([
      {
        id: "tx-redeem",
        label: "Points redeemed",
        detail: null,
        points: -200,
        occurredAt: "2026-10-06T00:00:00.000Z",
        state: null,
      },
    ]);
    renderRewards();
    expect(await screen.findByText("200 points")).toBeInTheDocument();
    expect(screen.getByText("Reserved")).toBeInTheDocument();
    expect(await screen.findByText("Points redeemed")).toBeInTheDocument();
    expect(screen.getByText("−200 points")).toBeInTheDocument();
    expect(screen.queryByText("Points reserved")).not.toBeInTheDocument();
    expect(screen.queryByText("Points released")).not.toBeInTheDocument();
  });

  it("shows the Qatar wallet after the market changes", async () => {
    fetchLoyaltyWallet.mockImplementation((market: { zoneCode: string }) => {
      if (market.zoneCode === "QA") {
        return Promise.resolve(
          wallet({
            zoneCode: "QA",
            currencyCode: "QAR",
            availablePoints: 10,
            availableValue: 1,
          }),
        );
      }
      return Promise.resolve(wallet({ availablePoints: 5420, availableValue: 54.2 }));
    });
    renderRewards();
    expect(await screen.findByText("5,420")).toBeInTheDocument();
    useUiStore.getState().setCatalogContext({ zoneCode: "QA", currencyCode: "QAR", languageCode: "en" });
    expect(await screen.findByText("QAR 1.00")).toBeInTheDocument();
    expect(screen.queryByText("5,420")).not.toBeInTheDocument();
    expect(screen.queryByText("AED 54.20")).not.toBeInTheDocument();
  });
});
