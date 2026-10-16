import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/api/apiError";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUiStore } from "@/stores/useUiStore";
import { readLoyaltyActivityPage, readLoyaltyWallet, type LoyaltyWalletView } from "../types/loyalty";
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
    platformActivity: [],
    externalActivity: [],
    pageInfo: { total: 0, limit: 20, offset: 0, hasMore: false },
    externalPageInfo: { total: 0, limit: 20, offset: 0, hasMore: false },
    lastTransactionImportSuccessAt: "2026-10-15T08:00:00.000Z",
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
  fetchLoyaltyTierHistory.mockReset();
  requestOmnichannelRefresh.mockReset();
  fetchLoyaltyTransactions.mockResolvedValue(emptyActivity());
  fetchLoyaltyTierHistory.mockResolvedValue([]);
  requestOmnichannelRefresh.mockResolvedValue({
    status: "QUEUED",
    refreshRequestedAt: "2026-10-15T08:01:00.000Z",
    retryAfterSeconds: null,
  });
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
  vi.useRealTimers();
  useAuthStore.getState().reset();
  useUiStore.setState({ catalogContext: null });
});

describe("omnichannel store rewards refresh", () => {
  it("shows Check for updates on LINKED and stale LINKED", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      platformWallet({
        omnichannel: omnichannel({
          sync: { ...omnichannel().sync, isFresh: false, source: "LAST_KNOWN_GOOD" },
        }),
      }),
    );
    renderRewards();
    expect(await screen.findByRole("button", { name: "Check for updates" })).toBeEnabled();
    expect(screen.getByText("95.24")).toBeInTheDocument();
  });

  it("shows Check for updates when NOT_ENROLLED", async () => {
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
    expect(await screen.findByRole("button", { name: "Check for updates" })).toBeInTheDocument();
  });

  it("does not refresh ACTION_REQUIRED", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      platformWallet({
        omnichannel: omnichannel({
          status: "ACTION_REQUIRED",
          identity: null,
          balance: null,
        }),
      }),
    );
    renderRewards();
    expect(await screen.findByText("We couldn’t link your store rewards to this account.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Check for updates" })).not.toBeInTheDocument();
    expect(requestOmnichannelRefresh).not.toHaveBeenCalled();
  });

  it("shows Refreshing… for QUEUED without claiming the balance is updated", async () => {
    fetchLoyaltyWallet.mockResolvedValue(platformWallet());
    requestOmnichannelRefresh.mockImplementation(() => new Promise(() => undefined));
    renderRewards();
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Check for updates" }));
    expect(await screen.findByRole("button", { name: "Refreshing…" })).toBeDisabled();
    expect(screen.queryByText("Store rewards updated.")).not.toBeInTheDocument();
    expect(screen.getByText("95.24")).toBeInTheDocument();
  });

  it("treats ALREADY_QUEUED as in progress, not an error", async () => {
    fetchLoyaltyWallet.mockResolvedValue(platformWallet());
    requestOmnichannelRefresh.mockResolvedValue({
      status: "ALREADY_QUEUED",
      refreshRequestedAt: "2026-10-15T08:01:00.000Z",
      retryAfterSeconds: null,
    });
    renderRewards();
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Check for updates" }));
    expect(await screen.findByRole("button", { name: "Refreshing…" })).toBeDisabled();
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    expect(screen.queryByText("We couldn’t refresh store rewards.")).not.toBeInTheDocument();
  });

  it("honors THROTTLED cooldown copy without 429 wording", async () => {
    fetchLoyaltyWallet.mockResolvedValue(platformWallet());
    requestOmnichannelRefresh.mockResolvedValue({
      status: "THROTTLED",
      refreshRequestedAt: null,
      retryAfterSeconds: 30,
    });
    renderRewards();
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Check for updates" }));
    expect(await screen.findByText("You can refresh again shortly.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Check for updates" })).toBeDisabled();
    expect(screen.queryByText("429")).not.toBeInTheDocument();
  });

  it("shows a safe NOT_READY message", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      platformWallet({
        omnichannel: omnichannel({
          refresh: { enabled: true, refreshable: true, reason: "READY", retryAfterSeconds: null },
        }),
      }),
    );
    requestOmnichannelRefresh.mockResolvedValue({
      status: "NOT_READY",
      refreshRequestedAt: null,
      retryAfterSeconds: null,
    });
    renderRewards();
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Check for updates" }));
    expect(await screen.findByText("Store rewards can’t be refreshed right now.")).toBeInTheDocument();
    expect(screen.queryByText("You can refresh again shortly.")).not.toBeInTheDocument();
    expect(screen.getByText("95.24")).toBeInTheDocument();
    expect(screen.queryByText(/mapping/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/phone/i)).not.toBeInTheDocument();
  });

  it("keeps the S1 card when refresh is DISABLED", async () => {
    fetchLoyaltyWallet
      .mockResolvedValueOnce(platformWallet())
      .mockResolvedValue(
        platformWallet({
          omnichannel: omnichannel({
            refresh: { enabled: false, refreshable: false, reason: "DISABLED", retryAfterSeconds: null },
          }),
        }),
      );
    requestOmnichannelRefresh.mockResolvedValue({
      status: "DISABLED",
      refreshRequestedAt: null,
      retryAfterSeconds: null,
    });
    renderRewards();
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Check for updates" }));
    expect(await screen.findByText("95.24")).toBeInTheDocument();
    expect(screen.queryByText("You can refresh again shortly.")).not.toBeInTheDocument();
    expect(screen.queryByText("We couldn’t refresh store rewards.")).not.toBeInTheDocument();
    expect(screen.queryByText(/feature flag/i)).not.toBeInTheDocument();
  });

  it("refetches /me and store activity after QUEUED and stops at the bound", async () => {
    fetchLoyaltyWallet.mockResolvedValue(platformWallet());
    requestOmnichannelRefresh.mockResolvedValue({
      status: "QUEUED",
      refreshRequestedAt: "2026-10-15T08:01:00.000Z",
      retryAfterSeconds: null,
    });
    renderRewards();
    const button = await screen.findByRole("button", { name: "Check for updates" });
    const walletCalls = fetchLoyaltyWallet.mock.calls.length;
    const activityCalls = fetchLoyaltyTransactions.mock.calls.length;
    vi.useFakeTimers();
    await act(async () => {
      fireEvent.click(button);
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(fetchLoyaltyWallet.mock.calls.length).toBe(walletCalls + 3);
    expect(fetchLoyaltyTransactions.mock.calls.length).toBe(activityCalls + 3);
    await vi.advanceTimersByTimeAsync(5_000);
    expect(fetchLoyaltyWallet.mock.calls.length).toBe(walletCalls + 3);
    vi.useRealTimers();
  });

  it("treats a newer timestamp as success even when activePoints stay 95.24", async () => {
    fetchLoyaltyWallet
      .mockResolvedValueOnce(platformWallet())
      .mockResolvedValue(
        platformWallet({
          omnichannel: omnichannel({
            sync: {
              fetchedAt: "2026-10-15T08:00:12.000Z",
              lastSuccessfulSyncAt: "2026-10-15T08:00:12.000Z",
              isFresh: true,
              source: "CACHE",
            },
          }),
        }),
      );
    renderRewards();
    const button = await screen.findByRole("button", { name: "Check for updates" });
    vi.useFakeTimers();
    await act(async () => {
      fireEvent.click(button);
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(screen.getByText("Store rewards updated.")).toBeInTheDocument();
    expect(screen.getByText("95.24")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("shows the new activePoints string after a later poll", async () => {
    fetchLoyaltyWallet
      .mockResolvedValueOnce(platformWallet())
      .mockResolvedValue(
        platformWallet({
          omnichannel: omnichannel({
            balance: {
              activePoints: "110.24",
              usedPoints: "0",
              issuedPoints: "110.24",
              expiredPoints: "0",
              unvestedPoints: "0",
            },
            sync: {
              fetchedAt: "2026-10-15T08:00:12.000Z",
              lastSuccessfulSyncAt: "2026-10-15T08:00:12.000Z",
              isFresh: true,
              source: "D365",
            },
          }),
        }),
      );
    renderRewards();
    const button = await screen.findByRole("button", { name: "Check for updates" });
    expect(screen.getByText("95.24")).toBeInTheDocument();
    vi.useFakeTimers();
    await act(async () => {
      fireEvent.click(button);
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(screen.getByText("110.24")).toBeInTheDocument();
    expect(screen.queryByText("95.24")).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("keeps S1 data when the refresh request fails", async () => {
    fetchLoyaltyWallet.mockResolvedValue(platformWallet());
    requestOmnichannelRefresh.mockRejectedValue(new Error("network"));
    renderRewards();
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Check for updates" }));
    expect(await screen.findByText("We couldn’t refresh store rewards.")).toBeInTheDocument();
    expect(screen.getByText("95.24")).toBeInTheDocument();
    expect(screen.getByText("5,420")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Check for updates" })).toBeEnabled();
  });

  it("keeps the Store Rewards balance after an unexpected 500", async () => {
    fetchLoyaltyWallet.mockResolvedValue(platformWallet());
    requestOmnichannelRefresh.mockRejectedValue(new ApiClientError(500, "Request failed"));
    renderRewards();
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Check for updates" }));
    expect(await screen.findByText("We couldn’t refresh store rewards.")).toBeInTheDocument();
    expect(screen.getByText("95.24")).toBeInTheDocument();
    expect(screen.queryByText("feature flag")).not.toBeInTheDocument();
  });

  it("does not keep refresh-failed copy when the session is expired", async () => {
    fetchLoyaltyWallet.mockResolvedValue(platformWallet());
    requestOmnichannelRefresh.mockImplementation(async () => {
      useAuthStore.getState().reset();
      throw new ApiClientError(401, "Your session has expired. Please sign in again.");
    });
    renderRewards();
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Check for updates" }));
    expect(await screen.findByText("Redirecting…")).toBeInTheDocument();
    expect(screen.queryByText("We couldn’t refresh store rewards.")).not.toBeInTheDocument();
  });

  it("enables Check for updates when the server sends READY", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      platformWallet({
        omnichannel: omnichannel({
          refresh: { enabled: true, refreshable: true, reason: "READY", retryAfterSeconds: null },
        }),
      }),
    );
    renderRewards();
    expect(await screen.findByRole("button", { name: "Check for updates" })).toBeEnabled();
  });

  it("disables refresh on a cold COOLDOWN payload using backend retryAfterSeconds", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      platformWallet({
        omnichannel: omnichannel({
          refresh: { enabled: true, refreshable: false, reason: "COOLDOWN", retryAfterSeconds: 45 },
        }),
      }),
    );
    renderRewards();
    expect(await screen.findByRole("button", { name: "Check for updates" })).toBeDisabled();
    expect(screen.getByText("You can refresh again shortly.")).toBeInTheDocument();
    expect(requestOmnichannelRefresh).not.toHaveBeenCalled();
  });

  it("hides the control when the server sends NOT_READY", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      platformWallet({
        omnichannel: omnichannel({
          refresh: { enabled: true, refreshable: false, reason: "NOT_READY", retryAfterSeconds: null },
        }),
      }),
    );
    renderRewards();
    expect(await screen.findByText("95.24")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Check for updates" })).not.toBeInTheDocument();
    expect(screen.queryByText(/mapping/i)).not.toBeInTheDocument();
  });

  it("hides the control when the server sends DISABLED", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      platformWallet({
        omnichannel: omnichannel({
          refresh: { enabled: false, refreshable: false, reason: "DISABLED", retryAfterSeconds: null },
        }),
      }),
    );
    renderRewards();
    expect(await screen.findByText("95.24")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Check for updates" })).not.toBeInTheDocument();
    expect(screen.queryByText(/feature flag/i)).not.toBeInTheDocument();
  });

  it("does not treat LINKED as refreshable when the server disables it", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      platformWallet({
        omnichannel: omnichannel({
          status: "LINKED",
          refresh: { enabled: false, refreshable: false, reason: "DISABLED", retryAfterSeconds: null },
        }),
      }),
    );
    renderRewards();
    expect(await screen.findByText("95.24")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Check for updates" })).not.toBeInTheDocument();
  });

  it("does not treat NOT_ENROLLED as refreshable when the server disables it", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      platformWallet({
        omnichannel: omnichannel({
          status: "NOT_ENROLLED",
          identity: null,
          balance: null,
          refresh: { enabled: false, refreshable: false, reason: "DISABLED", retryAfterSeconds: null },
        }),
      }),
    );
    renderRewards();
    expect(await screen.findByText("No store loyalty membership linked yet")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Check for updates" })).not.toBeInTheDocument();
  });

  it("enters polling when /me is READY but POST returns ALREADY_QUEUED", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      platformWallet({
        omnichannel: omnichannel({
          refresh: { enabled: true, refreshable: true, reason: "READY", retryAfterSeconds: null },
        }),
      }),
    );
    requestOmnichannelRefresh.mockResolvedValue({
      status: "ALREADY_QUEUED",
      refreshRequestedAt: "2026-10-15T08:01:00.000Z",
      retryAfterSeconds: null,
    });
    renderRewards();
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Check for updates" }));
    expect(await screen.findByRole("button", { name: "Refreshing…" })).toBeDisabled();
    expect(screen.queryByText("We couldn’t refresh store rewards.")).not.toBeInTheDocument();
  });

  it("lets POST THROTTLED override a stale READY render and uses server seconds", async () => {
    fetchLoyaltyWallet.mockResolvedValue(
      platformWallet({
        omnichannel: omnichannel({
          refresh: { enabled: true, refreshable: true, reason: "READY", retryAfterSeconds: null },
        }),
      }),
    );
    requestOmnichannelRefresh.mockResolvedValue({
      status: "THROTTLED",
      refreshRequestedAt: null,
      retryAfterSeconds: 12,
    });
    renderRewards();
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Check for updates" }));
    expect(await screen.findByText("You can refresh again shortly.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Check for updates" })).toBeDisabled();
    expect(screen.queryByText("429")).not.toBeInTheDocument();
  });

  it("updates the control after /me refetch returns a new capability", async () => {
    fetchLoyaltyWallet
      .mockResolvedValueOnce(
        platformWallet({
          omnichannel: omnichannel({
            refresh: { enabled: true, refreshable: true, reason: "READY", retryAfterSeconds: null },
          }),
        }),
      )
      .mockResolvedValue(
        platformWallet({
          omnichannel: omnichannel({
            refresh: { enabled: false, refreshable: false, reason: "DISABLED", retryAfterSeconds: null },
            sync: {
              fetchedAt: "2026-10-15T08:00:12.000Z",
              lastSuccessfulSyncAt: "2026-10-15T08:00:12.000Z",
              isFresh: true,
              source: "CACHE",
            },
          }),
        }),
      );
    requestOmnichannelRefresh.mockResolvedValue({
      status: "QUEUED",
      refreshRequestedAt: "2026-10-15T08:01:00.000Z",
      retryAfterSeconds: null,
    });
    renderRewards();
    const button = await screen.findByRole("button", { name: "Check for updates" });
    vi.useFakeTimers();
    await act(async () => {
      fireEvent.click(button);
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(screen.queryByRole("button", { name: "Check for updates" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Refreshing…" })).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("does not poll after POST DISABLED", async () => {
    fetchLoyaltyWallet
      .mockResolvedValueOnce(
        platformWallet({
          omnichannel: omnichannel({
            refresh: { enabled: true, refreshable: true, reason: "READY", retryAfterSeconds: null },
          }),
        }),
      )
      .mockResolvedValue(
        platformWallet({
          omnichannel: omnichannel({
            refresh: { enabled: false, refreshable: false, reason: "DISABLED", retryAfterSeconds: null },
          }),
        }),
      );
    requestOmnichannelRefresh.mockResolvedValue({
      status: "DISABLED",
      refreshRequestedAt: null,
      retryAfterSeconds: null,
    });
    renderRewards();
    const button = await screen.findByRole("button", { name: "Check for updates" });
    const walletCalls = fetchLoyaltyWallet.mock.calls.length;
    vi.useFakeTimers();
    await act(async () => {
      fireEvent.click(button);
    });
    expect(requestOmnichannelRefresh).toHaveBeenCalledTimes(1);
    expect(fetchLoyaltyWallet.mock.calls.length).toBe(walletCalls + 1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(requestOmnichannelRefresh).toHaveBeenCalledTimes(1);
    expect(fetchLoyaltyWallet.mock.calls.length).toBe(walletCalls + 1);
    expect(screen.getByText("95.24")).toBeInTheDocument();
    expect(screen.queryByText("You can refresh again shortly.")).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
