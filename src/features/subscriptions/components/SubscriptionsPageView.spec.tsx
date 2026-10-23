import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/stores/useAuthStore";
import { useUiStore } from "@/stores/useUiStore";
import { SubscriptionsPageView } from "./SubscriptionsPageView";

const listSubscriptionPlans = vi.hoisted(() => vi.fn());
const listPlanProducts = vi.hoisted(() => vi.fn());
const routerPush = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
  usePathname: () => "/subscriptions/A",
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

vi.mock("../api/subscription.api", () => ({
  listSubscriptionPlans: (...args: unknown[]) => listSubscriptionPlans(...args),
  listPlanProducts: (...args: unknown[]) => listPlanProducts(...args),
}));

vi.mock("./SubscriptionCardSetup", () => ({
  SubscriptionCardSetup: () => <div>Card payment</div>,
}));

function renderPage(lockedPlanCode?: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <SubscriptionsPageView lockedPlanCode={lockedPlanCode} />
    </QueryClientProvider>,
  );
}

describe("subscription landing", () => {
  beforeEach(() => {
    routerPush.mockReset();
    listPlanProducts.mockReset();
    listPlanProducts.mockResolvedValue([]);
    listSubscriptionPlans.mockReset();
  });

  afterEach(() => {
    cleanup();
    sessionStorage.clear();
    useAuthStore.getState().reset();
    useAuthStore.getState().setBootstrapped(false);
    useUiStore.getState().selectMarket(null, null);
  });

  it("renders every published plan fee from the API", async () => {
    useUiStore.getState().selectMarket("UAE", { zoneCode: "UAE", currencyCode: "AED" });
    listSubscriptionPlans.mockResolvedValue([
      {
        planCode: "A",
        name: "One",
        description: "First",
        amount: "65.00",
        currencyCode: "AED",
        intervalUnit: "MONTH",
        intervalCount: 1,
        versionNumber: 1,
        publishedAt: "2026-10-19T00:00:00.000Z",
      },
      {
        planCode: "B",
        name: "Two",
        description: null,
        amount: "100.00",
        currencyCode: "AED",
        intervalUnit: "MONTH",
        intervalCount: 1,
        versionNumber: 1,
        publishedAt: "2026-10-19T00:00:00.000Z",
      },
      {
        planCode: "C",
        name: "Three",
        description: null,
        amount: "150.00",
        currencyCode: "AED",
        intervalUnit: "MONTH",
        intervalCount: 1,
        versionNumber: 1,
        publishedAt: "2026-10-19T00:00:00.000Z",
      },
      {
        planCode: "D",
        name: "Four",
        description: null,
        amount: "220.00",
        currencyCode: "AED",
        intervalUnit: "MONTH",
        intervalCount: 1,
        versionNumber: 1,
        publishedAt: "2026-10-19T00:00:00.000Z",
      },
    ]);
    renderPage();
    expect(await screen.findByText(/Total AED 65\.00\/month/)).toBeInTheDocument();
    expect(screen.getByText(/Total AED 220\.00\/month/)).toBeInTheDocument();
    expect(screen.getAllByText(/Shipping included/).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Subscribe now" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /One/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Four/ })).toBeInTheDocument();
    expect(screen.queryByText(/1449/)).not.toBeInTheDocument();
    expect(screen.queryByText(/% off/i)).not.toBeInTheDocument();
    expect(listSubscriptionPlans).toHaveBeenCalledWith("UAE");
  });

  it("loads Men and Women pools and removes a pick the new audience does not include", async () => {
    useUiStore.getState().selectMarket("UAE", { zoneCode: "UAE", currencyCode: "AED" });
    listSubscriptionPlans.mockResolvedValue([
      {
        planCode: "A",
        name: "One",
        description: null,
        amount: "65.00",
        currencyCode: "AED",
        intervalUnit: "MONTH",
        intervalCount: 1,
        versionNumber: 1,
        publishedAt: "2026-10-19T00:00:00.000Z",
      },
    ]);
    listPlanProducts.mockImplementation(async (_plan: string, zone: string, audience: string) => {
      expect(zone).toBe("UAE");
      if (audience === "WOMEN") {
        return [{ variantId: "uni", productId: "p", sku: "UNI", name: "Amber" }];
      }
      return [
        { variantId: "men", productId: "p", sku: "MEN", name: "Vetiver" },
        { variantId: "uni", productId: "p", sku: "UNI", name: "Amber" },
      ];
    });
    renderPage();
    expect(await screen.findByText("Vetiver")).toBeInTheDocument();
    expect(screen.getByText("Amber")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Add to queue" })[0]!);
    fireEvent.click(screen.getByRole("button", { name: "Women" }));
    expect(await screen.findByText(/not available for this audience/)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Vetiver")).not.toBeInTheDocument());
    expect(screen.getByText("Amber")).toBeInTheDocument();
    expect(listPlanProducts).toHaveBeenCalledWith("A", "UAE", "WOMEN");
  });

  it("restores a saved audience on the landing page", async () => {
    useUiStore.getState().selectMarket("UAE", { zoneCode: "UAE", currencyCode: "AED" });
    sessionStorage.setItem(
      "sa-sub-draft:A",
      JSON.stringify({ mode: "SURPRISE", selected: [], audience: "WOMEN" }),
    );
    listSubscriptionPlans.mockResolvedValue([
      {
        planCode: "A",
        name: "One",
        description: null,
        amount: "65.00",
        currencyCode: "AED",
        intervalUnit: "MONTH",
        intervalCount: 1,
        versionNumber: 1,
        publishedAt: "2026-10-19T00:00:00.000Z",
      },
    ]);
    listPlanProducts.mockResolvedValue([]);
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Women" })).toHaveAttribute("aria-pressed", "true"),
    );
  });

  it("opens one plan on the new design and does not offer another plan", async () => {
    useUiStore.getState().selectMarket("UAE", { zoneCode: "UAE", currencyCode: "AED", brandCode: "SWISS_ARABIAN" });
    listSubscriptionPlans.mockResolvedValue([
      {
        planCode: "A",
        name: "One",
        description: null,
        amount: "65.00",
        currencyCode: "AED",
        intervalUnit: "MONTH",
        intervalCount: 1,
        versionNumber: 1,
        publishedAt: "2026-10-19T00:00:00.000Z",
      },
      {
        planCode: "B",
        name: "Two",
        description: null,
        amount: "100.00",
        currencyCode: "AED",
        intervalUnit: "MONTH",
        intervalCount: 1,
        versionNumber: 1,
        publishedAt: "2026-10-19T00:00:00.000Z",
      },
    ]);
    renderPage("A");
    expect(await screen.findByText("One")).toBeInTheDocument();
    expect(screen.queryByText("Which plan?")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Two/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Subscribe now" })).toBeInTheDocument();
  });

  it("sends the locked plan to subscription checkout without a card step", async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      bootstrapped: true,
      user: { id: "c", email: "a@b.c" },
    });
    useUiStore.getState().selectMarket("UAE", { zoneCode: "UAE", currencyCode: "AED" });
    sessionStorage.setItem(
      "sa-sub-draft:A",
      JSON.stringify({ mode: "SURPRISE", selected: [], audience: "WOMEN" }),
    );
    listSubscriptionPlans.mockResolvedValue([
      {
        planCode: "A",
        name: "One",
        description: null,
        amount: "65.00",
        currencyCode: "AED",
        shippingMode: "EXTRA_FIXED",
        shippingAmount: "10.00",
        monthlyTotal: "75.00",
        intervalUnit: "MONTH",
        intervalCount: 1,
        versionNumber: 1,
        publishedAt: "2026-10-19T00:00:00.000Z",
      },
    ]);
    renderPage("A");
    fireEvent.click(await screen.findByRole("button", { name: "Subscribe now" }));
    expect(routerPush).toHaveBeenCalledWith("/subscriptions/A/checkout");
    expect(screen.queryByText("Card payment")).not.toBeInTheDocument();
  });

  it("shows an empty state when the market has no plans", async () => {
    useUiStore.getState().selectMarket("UAE", { zoneCode: "UAE" });
    listSubscriptionPlans.mockResolvedValue([]);
    renderPage();
    expect(await screen.findByText(/No subscription plans are published/)).toBeInTheDocument();
  });
});
