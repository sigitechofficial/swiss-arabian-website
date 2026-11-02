import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUiStore } from "@/stores/useUiStore";
import {
  readLoyaltyActivityPage,
  readLoyaltyWallet,
  type LoyaltyWalletView,
} from "../types/loyalty";
import { RewardsAccountView } from "./RewardsAccountView";

const fetchLoyaltyWallet = vi.hoisted(() => vi.fn());
const fetchLoyaltyTransactions = vi.hoisted(() => vi.fn());
const fetchLoyaltyTierHistory = vi.hoisted(() => vi.fn());
const requestOmnichannelRefresh = vi.hoisted(() => vi.fn());

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
  requestOmnichannelRefresh: (...args: unknown[]) => requestOmnichannelRefresh(...args),
}));

function omnichannel(partial: Record<string, unknown> = {}) {
  return {
    source: "D365",
    status: "LINKED",
    identity: { customerGroup: "RETAIL", currency: "AED" },
    balance: {
      activePoints: "95.24",
      usedPoints: "0",
      issuedPoints: "95.24",
      expiredPoints: "0",
      unvestedPoints: "0",
    },
    sync: {
      fetchedAt: "2026-10-15T08:00:00.000Z",
      lastSuccessfulSyncAt: "2026-10-15T08:00:00.000Z",
      isFresh: true,
      source: "CACHE",
    },
    websiteRedemption: { enabled: false, reason: "D365_REDEMPTION_NOT_AVAILABLE" },
    ...partial,
  };
}

function platformWallet(partial: Record<string, unknown> = {}): LoyaltyWalletView {
  return readLoyaltyWallet({
    enabled: true,
    member: true,
    market: { code: "UAE", currencyCode: "AED" },
    wallet: { availablePoints: 5420, pendingPoints: 0, reservedPoints: 0, debtPoints: 0 },
    monetaryEquivalent: { available: "54.20", currencyCode: "AED" },
    omnichannel: omnichannel(),
    ...partial,
  });
}

function emptyActivity(extra: Record<string, unknown> = {}) {
  return readLoyaltyActivityPage({
    items: [],
    pageInfo: { total: 0, limit: 20, offset: 0, hasMore: false },
    platformActivity: [],
    externalActivity: [],
    externalPageInfo: { total: 0, limit: 20, offset: 0, hasMore: false },
    lastTransactionImportSuccessAt: null,
    activityIsFresh: true,
    ...extra,
  });
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
  fetchLoyaltyTransactions.mockResolvedValue(emptyActivity());
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

describe("omnichannel rewards account", () => {
  it("renders LINKED 95.24 beside the platform wallet", async () => {
    fetchLoyaltyWallet.mockResolvedValue(platformWallet());
    renderRewards();
    expect(await screen.findByText("5,420")).toBeInTheDocument();
    expect(screen.getByText("95.24")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Available points" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Active points" })).toBeInTheDocument();
    expect(screen.getByText("Online rewards")).toBeInTheDocument();
    expect(screen.getByText("Store rewards")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /redeem/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /use store points/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Check for updates" })).toBeInTheDocument();
    expect(screen.queryByText(/D365/)).not.toBeInTheDocument();
  });

  it("renders LINKED zero as an enrolled member", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      platformWallet({
        omnichannel: omnichannel({
          balance: {
            activePoints: "0",
            usedPoints: "0",
            issuedPoints: "0",
            expiredPoints: "0",
            unvestedPoints: "0",
          },
        }),
      }),
    );
    renderRewards();
    expect(await screen.findByRole("heading", { name: "Active points" })).toBeInTheDocument();
    expect(screen.getByLabelText("0 store reward points")).toBeInTheDocument();
    expect(screen.queryByText("No store loyalty membership linked yet")).not.toBeInTheDocument();
  });

  it("keeps a last-known balance visible and does not label it as confirmed", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      platformWallet({
        omnichannel: omnichannel({
          balance: {
            activePoints: "80",
            usedPoints: "0",
            issuedPoints: "80",
            expiredPoints: "0",
            unvestedPoints: "0",
          },
          sync: {
            fetchedAt: "2026-10-15T08:00:00.000Z",
            lastSuccessfulSyncAt: "2026-10-15T08:00:00.000Z",
            isFresh: false,
            source: "LAST_KNOWN_GOOD",
          },
        }),
      }),
    );
    renderRewards();
    expect(await screen.findByText("80")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Last known active points" })).toBeInTheDocument();
    expect(screen.getByText(/newer balance was not confirmed/i)).toBeInTheDocument();
    expect(screen.queryByText("No store loyalty membership linked yet")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Active points" })).not.toBeInTheDocument();
  });

  it("shows linked membership without a zero when the balance is missing", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      platformWallet({
        omnichannel: omnichannel({
          balance: null,
        }),
      }),
    );
    renderRewards();
    expect(await screen.findByText("Store point balance is not available yet.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Active points" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/store reward points/i)).not.toBeInTheDocument();
    expect(screen.queryByText("No store loyalty membership linked yet")).not.toBeInTheDocument();
    expect(screen.getByText("5,420")).toBeInTheDocument();
  });

  it("renders NOT_ENROLLED without a zero balance", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      platformWallet({
        omnichannel: omnichannel({
          status: "NOT_ENROLLED",
          identity: null,
          balance: null,
        }),
      }),
    );
    renderRewards();
    expect(await screen.findByText("No store loyalty membership linked yet")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Active points" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /enrol/i })).not.toBeInTheDocument();
    expect(screen.getByText("5,420")).toBeInTheDocument();
  });

  it("keeps platform rewards when store rewards are unavailable", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      platformWallet({
        omnichannel: omnichannel({
          status: "UNAVAILABLE",
          identity: null,
          balance: null,
        }),
      }),
    );
    renderRewards();
    expect(await screen.findByText("5,420")).toBeInTheDocument();
    expect(screen.getByText("Store rewards are temporarily unavailable.")).toBeInTheDocument();
    expect(screen.queryByText(/429/)).not.toBeInTheDocument();
    expect(screen.queryByText(/F&O/)).not.toBeInTheDocument();
  });

  it("renders ACTION_REQUIRED without identity internals", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      platformWallet({
        omnichannel: omnichannel({
          status: "ACTION_REQUIRED",
          identity: { customerGroup: "RETAIL", currency: "AED" },
          balance: null,
        }),
      }),
    );
    renderRewards();
    expect(
      await screen.findByText("We couldn’t link your store rewards to this account."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Contact us" })).toHaveAttribute("href", "/faq#contact");
    expect(screen.queryByText(/mismatch/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/CustomersV3/i)).not.toBeInTheDocument();
    expect(screen.queryByText("RETAIL")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Check for updates" })).not.toBeInTheDocument();
  });

  it("shows a stale LINKED balance without hiding it", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      platformWallet({
        omnichannel: omnichannel({
          sync: {
            fetchedAt: "2026-10-14T08:00:00.000Z",
            lastSuccessfulSyncAt: "2026-10-14T08:00:00.000Z",
            isFresh: false,
            source: "LAST_KNOWN_GOOD",
          },
        }),
      }),
    );
    renderRewards();
    expect(await screen.findByText("95.24")).toBeInTheDocument();
    expect(await screen.findByText(/Last synced 14 Oct 2026/)).toBeInTheDocument();
  });

  it("does not warn when the LINKED balance is fresh", async () => {
    fetchLoyaltyWallet.mockResolvedValue(platformWallet());
    renderRewards();
    expect(await screen.findByText("95.24")).toBeInTheDocument();
    expect(screen.queryByText(/delayed/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Last synced/)).not.toBeInTheDocument();
  });

  it("renders platform and store activity separately", async () => {
    fetchLoyaltyWallet.mockResolvedValue(platformWallet());
    fetchLoyaltyTransactions.mockResolvedValue(
      emptyActivity({
        items: [
          {
            id: "p1",
            type: "POINTS_ADJUSTMENT",
            points: 40,
            occurredAt: "2026-10-01T00:00:00.000Z",
          },
        ],
        platformActivity: [
          {
            id: "p1",
            type: "POINTS_ADJUSTMENT",
            points: 40,
            occurredAt: "2026-10-01T00:00:00.000Z",
          },
        ],
        externalActivity: [
          {
            source: "D365",
            entryType: "Earn",
            category: "EARN",
            points: "95.24",
            remainingPoints: "95.24",
            entryDate: "2026-10-01T00:00:00.000Z",
            expirationDate: null,
            receiptId: "R1",
            origin: "STORE",
            operatorId: "OP-9",
            channel: { terminal: "T1", operatingUnit: "OU" },
          },
          {
            source: "D365",
            entryType: "Redeem",
            category: "REDEEM",
            points: "20.5",
            remainingPoints: "0",
            entryDate: "2026-10-02T00:00:00.000Z",
            origin: "STORE",
          },
          {
            source: "D365",
            entryType: "ReturnEarned",
            category: "OTHER",
            points: "1",
            remainingPoints: "1",
            entryDate: "2026-10-03T00:00:00.000Z",
            origin: "UNKNOWN",
          },
        ],
        activityIsFresh: false,
      }),
    );
    renderRewards();
    expect(await screen.findByText("Points adjustment")).toBeInTheDocument();
    expect(screen.getByText("Store points earned")).toBeInTheDocument();
    expect(screen.getByText("+95.24 points")).toBeInTheDocument();
    expect(screen.getByText("Store points redeemed")).toBeInTheDocument();
    expect(screen.getByText("−20.5 points")).toBeInTheDocument();
    expect(screen.getByText("Store reward activity")).toBeInTheDocument();
    expect(screen.getByText("Store activity may be delayed.")).toBeInTheDocument();
    expect(screen.queryByText("OP-9")).not.toBeInTheDocument();
    expect(screen.queryByText("ReturnEarned")).not.toBeInTheDocument();
    expect(screen.queryByText("Earn")).not.toBeInTheDocument();
  });

  it("paginates store activity with the external offset", async () => {
    const user = userEvent.setup();
    fetchLoyaltyWallet.mockResolvedValue(platformWallet());
    fetchLoyaltyTransactions.mockImplementation(async (_market: unknown, page?: { offset?: number }) => {
      const offset = page?.offset ?? 0;
      if (offset === 0) {
        return emptyActivity({
          externalActivity: [
            {
              source: "D365",
              entryType: "Earn",
              category: "EARN",
              points: "10",
              remainingPoints: "10",
              entryDate: "2026-10-01T00:00:00.000Z",
              origin: "STORE",
            },
          ],
          externalPageInfo: { total: 2, limit: 20, offset: 0, hasMore: true },
        });
      }
      return emptyActivity({
        platformActivity: [{ id: "should-not-merge", type: "POINTS_EARNED", points: 99 }],
        externalActivity: [
          {
            source: "D365",
            entryType: "Earn",
            category: "EARN",
            points: "11",
            remainingPoints: "21",
            entryDate: "2026-10-04T00:00:00.000Z",
            origin: "STORE",
          },
        ],
        externalPageInfo: { total: 2, limit: 20, offset: 20, hasMore: false },
      });
    });
    renderRewards();
    expect(await screen.findByText("+10 points")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Load more store activity" }));
    expect(await screen.findByText("+11 points")).toBeInTheDocument();
    expect(screen.getByText("+10 points")).toBeInTheDocument();
    expect(screen.queryByText("+99 points")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Load more store activity" })).not.toBeInTheDocument();
  });

  it("keeps platform activity when the activity request fails", async () => {
    fetchLoyaltyWallet.mockResolvedValue(platformWallet());
    fetchLoyaltyTransactions.mockRejectedValue(new Error("timeout"));
    renderRewards();
    expect(await screen.findByText("95.24")).toBeInTheDocument();
    expect(screen.getByText("5,420")).toBeInTheDocument();
    expect(await screen.findByText("We couldn't load your rewards right now.")).toBeInTheDocument();
    expect(screen.queryByText("Store activity may be delayed.")).not.toBeInTheDocument();
  });

  it("shows an empty store activity state", async () => {
    fetchLoyaltyWallet.mockResolvedValue(platformWallet());
    renderRewards();
    expect(await screen.findByText("No store reward activity yet.")).toBeInTheDocument();
    expect(screen.getByText("No reward activity yet.")).toBeInTheDocument();
  });
});
