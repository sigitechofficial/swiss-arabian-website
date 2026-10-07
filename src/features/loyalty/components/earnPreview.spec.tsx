import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCartStore } from "@/stores/useCartStore";
import { useUiStore } from "@/stores/useUiStore";
import { readEarnPreview, readOrderReward } from "../types/loyalty";
import { EarnPreviewNote } from "./EarnPreviewNote";
import { OrderRewardNote } from "./OrderRewardNote";
import { useEarnPreview, useProductEarnPreview } from "../hooks/useEarnPreview";
import { useOrderReward } from "../hooks/useOrderReward";

const fetchEarnPreview = vi.hoisted(() => vi.fn());
const fetchProductEarnPreview = vi.hoisted(() => vi.fn());
const fetchOrderReward = vi.hoisted(() => vi.fn());

vi.mock("../api/loyalty.service", () => ({
  fetchEarnPreview: (...args: unknown[]) => fetchEarnPreview(...args),
  fetchProductEarnPreview: (...args: unknown[]) => fetchProductEarnPreview(...args),
  fetchOrderReward: (...args: unknown[]) => fetchOrderReward(...args),
  fetchLoyaltyWallet: vi.fn(),
  fetchLoyaltyTransactions: vi.fn(),
}));

function preview(points: number, currencyCode = "AED", eligibleAmount: string | null = null) {
  return readEarnPreview({
    enabled: true,
    presentationState: "ESTIMATE",
    earning: {
      estimatedPoints: points,
      currencyCode,
      ...(eligibleAmount ? { eligibleAmount } : {}),
    },
  });
}

function Wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function CartEarn() {
  const { preview: data } = useEarnPreview({ cartId: "cart-1" });
  return <EarnPreviewNote preview={data} variant="block" showBasis />;
}

function CheckoutEarn() {
  const { preview: data } = useEarnPreview({ checkoutSessionId: "sess-1" });
  return <EarnPreviewNote preview={data} variant="block" />;
}

function ProductEarn({ price, qty = 1 }: { price: number | null; qty?: number }) {
  const { preview: data } = useProductEarnPreview({ unitPrice: price, quantity: qty });
  return <EarnPreviewNote preview={data} />;
}

function OrderEarn({ orderId }: { orderId: string }) {
  return <OrderRewardNote reward={useOrderReward(orderId)} />;
}

function signIn() {
  useAuthStore.setState({
    user: { id: "customer-1", email: "member@example.com" },
    isAuthenticated: true,
    bootstrapped: true,
  });
}

beforeEach(() => {
  fetchEarnPreview.mockReset();
  fetchProductEarnPreview.mockReset();
  fetchOrderReward.mockReset();
  signIn();
  useUiStore.setState({
    catalogContext: { zoneCode: "UAE", currencyCode: "AED", languageCode: "en" },
  });
  useCartStore.setState({
    cartId: "cart-1",
    promotions: null,
    totals: {
      subtotal: 325,
      total: 325,
      discount: 0,
      shipping: 0,
      tax: 0,
      amountPayable: 325,
      currency: "AED",
      itemCount: 1,
      totalQty: 1,
    },
  });
});

afterEach(() => {
  cleanup();
  useAuthStore.getState().reset();
  useUiStore.setState({ catalogContext: null });
  useCartStore.getState().clear();
});

describe("PDP earning estimate", () => {
  it("shows the server estimate for a signed-in shopper", async () => {
    fetchProductEarnPreview.mockResolvedValue(preview(600));
    render(
      <Wrapper>
        <ProductEarn price={120} />
      </Wrapper>,
    );
    expect(await screen.findByText("Earn approximately 600 reward points")).toBeInTheDocument();
    expect(fetchProductEarnPreview).toHaveBeenCalledWith(
      { zoneCode: "UAE", currencyCode: "AED" },
      { unitPrice: "120.00", quantity: 1 },
    );
  });

  it("does not call the estimate for a guest", async () => {
    useAuthStore.setState({ user: null, isAuthenticated: false, bootstrapped: true });
    render(
      <Wrapper>
        <ProductEarn price={120} />
      </Wrapper>,
    );
    await waitFor(() => {
      expect(fetchProductEarnPreview).not.toHaveBeenCalled();
    });
    expect(screen.queryByTestId("earn-preview")).not.toBeInTheDocument();
    expect(screen.queryByText(/reward points/)).not.toBeInTheDocument();
  });

  it("shows nothing when earning is disabled", async () => {
    fetchProductEarnPreview.mockResolvedValue(
      readEarnPreview({ enabled: false, reason: "EARNING_DISABLED" }),
    );
    render(
      <Wrapper>
        <ProductEarn price={120} />
      </Wrapper>,
    );
    await waitFor(() => expect(fetchProductEarnPreview).toHaveBeenCalled());
    expect(screen.queryByTestId("earn-preview")).not.toBeInTheDocument();
    expect(screen.queryByText(/Earn approximately 0/)).not.toBeInTheDocument();
  });

  it("sends the quantity and never prices it in the browser", async () => {
    fetchProductEarnPreview.mockResolvedValue(preview(1200));
    render(
      <Wrapper>
        <ProductEarn price={120} qty={2} />
      </Wrapper>,
    );
    expect(await screen.findByText("Earn approximately 1,200 reward points")).toBeInTheDocument();
    expect(fetchProductEarnPreview).toHaveBeenCalledWith(
      { zoneCode: "UAE", currencyCode: "AED" },
      { unitPrice: "120.00", quantity: 2 },
    );
  });
});

describe("cart earning estimate", () => {
  it("shows the server cart estimate and eligible merchandise", async () => {
    fetchEarnPreview.mockResolvedValue(preview(1625, "AED", "325.00"));
    render(
      <Wrapper>
        <CartEarn />
      </Wrapper>,
    );
    expect(await screen.findByText("You'll earn approximately 1,625 points")).toBeInTheDocument();
    expect(screen.getByText("Based on AED 325.00 of eligible merchandise")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Rewards" })).toBeInTheDocument();
    expect(screen.queryByText(/eligibleEarnAmount/)).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("refetches after a requote instead of keeping the old number", async () => {
    fetchEarnPreview.mockResolvedValueOnce(preview(1625, "AED", "325.00"));
    render(
      <Wrapper>
        <CartEarn />
      </Wrapper>,
    );
    expect(await screen.findByText("You'll earn approximately 1,625 points")).toBeInTheDocument();

    // A promotion lands: the server quote changes, so the estimate must reload.
    fetchEarnPreview.mockResolvedValueOnce(preview(1225, "AED", "245.00"));
    useCartStore.setState({
      promotions: {
        v: 1,
        computedAt: "2026-10-05T12:30:00.000Z",
        context: { brandCode: null, zoneCode: "UAE", currencyCode: "AED", salesChannelCode: null },
        applied: [],
        lineAllocations: [],
        totals: { discountTotal: "80.00" },
        rejected: [],
      },
      totals: {
        subtotal: 325,
        total: 245,
        discount: 80,
        shipping: 0,
        tax: 0,
        amountPayable: 245,
        currency: "AED",
        itemCount: 1,
        totalQty: 1,
      },
    });

    expect(await screen.findByText("You'll earn approximately 1,225 points")).toBeInTheDocument();
    expect(screen.queryByText("You'll earn approximately 1,625 points")).not.toBeInTheDocument();
    expect(fetchEarnPreview).toHaveBeenCalledTimes(2);
  });

  it("keeps the drawer line compact with no progress bar", async () => {
    fetchEarnPreview.mockResolvedValue(preview(1625));
    function DrawerEarn() {
      const { preview: data } = useEarnPreview({ cartId: "cart-1" });
      return <EarnPreviewNote preview={data} />;
    }
    render(
      <Wrapper>
        <DrawerEarn />
      </Wrapper>,
    );
    expect(await screen.findByText("Earn approximately 1,625 reward points")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("does not change the estimate when gift card tender is applied", async () => {
    fetchEarnPreview.mockResolvedValue(preview(1625, "AED", "325.00"));
    render(
      <Wrapper>
        <CartEarn />
      </Wrapper>,
    );
    expect(await screen.findByText("You'll earn approximately 1,625 points")).toBeInTheDocument();
    const callsBefore = fetchEarnPreview.mock.calls.length;

    // Gift card is tender: it moves amountPayable, not the merchandise quote.
    useCartStore.setState({
      totals: {
        subtotal: 325,
        total: 325,
        discount: 0,
        shipping: 0,
        tax: 0,
        amountPayable: 275,
        currency: "AED",
        itemCount: 1,
        totalQty: 1,
      },
    });

    await waitFor(() => {
      expect(screen.getByText("You'll earn approximately 1,625 points")).toBeInTheDocument();
    });
    expect(fetchEarnPreview.mock.calls.length).toBe(callsBefore);
  });
});

describe("checkout earning estimate", () => {
  it("estimates from the checkout session", async () => {
    fetchEarnPreview.mockResolvedValue(preview(1625));
    render(
      <Wrapper>
        <CheckoutEarn />
      </Wrapper>,
    );
    expect(await screen.findByText("You'll earn approximately 1,625 points")).toBeInTheDocument();
    expect(fetchEarnPreview).toHaveBeenCalledWith(
      { zoneCode: "UAE", currencyCode: "AED" },
      { checkoutSessionId: "sess-1" },
    );
  });

  it("follows a checkout requote", async () => {
    fetchEarnPreview.mockResolvedValueOnce(preview(1625));
    render(
      <Wrapper>
        <CheckoutEarn />
      </Wrapper>,
    );
    expect(await screen.findByText("You'll earn approximately 1,625 points")).toBeInTheDocument();

    fetchEarnPreview.mockResolvedValueOnce(preview(800));
    useCartStore.setState({
      totals: {
        subtotal: 160,
        total: 160,
        discount: 0,
        shipping: 0,
        tax: 0,
        amountPayable: 160,
        currency: "AED",
        itemCount: 1,
        totalQty: 1,
      },
    });
    expect(await screen.findByText("You'll earn approximately 800 points")).toBeInTheDocument();
    expect(screen.queryByText("You'll earn approximately 1,625 points")).not.toBeInTheDocument();
  });

  it("shows no earn claim when the market is disabled", async () => {
    fetchEarnPreview.mockResolvedValue(
      readEarnPreview({ enabled: false, reason: "MARKET_DISABLED" }),
    );
    render(
      <Wrapper>
        <CheckoutEarn />
      </Wrapper>,
    );
    await waitFor(() => expect(fetchEarnPreview).toHaveBeenCalled());
    expect(screen.queryByTestId("earn-preview")).not.toBeInTheDocument();
  });

  it("shows no earn claim when the brand program is disabled", async () => {
    fetchEarnPreview.mockResolvedValue(
      readEarnPreview({ enabled: false, reason: "PROGRAM_DISABLED" }),
    );
    render(
      <Wrapper>
        <CheckoutEarn />
      </Wrapper>,
    );
    await waitFor(() => expect(fetchEarnPreview).toHaveBeenCalled());
    expect(screen.queryByTestId("earn-preview")).not.toBeInTheDocument();
  });
});

describe("market isolation", () => {
  it("re-estimates for the new market and drops the old number", async () => {
    fetchEarnPreview.mockImplementation((market: { zoneCode: string }) =>
      Promise.resolve(
        market.zoneCode === "QA" ? preview(300, "QAR") : preview(1625, "AED"),
      ),
    );
    render(
      <Wrapper>
        <CartEarn />
      </Wrapper>,
    );
    expect(await screen.findByText("You'll earn approximately 1,625 points")).toBeInTheDocument();

    useUiStore.getState().setCatalogContext({
      zoneCode: "QA",
      currencyCode: "QAR",
      languageCode: "en",
    });

    expect(await screen.findByText("You'll earn approximately 300 points")).toBeInTheDocument();
    expect(screen.queryByText("You'll earn approximately 1,625 points")).not.toBeInTheDocument();
    expect(fetchEarnPreview).toHaveBeenCalledWith(
      { zoneCode: "QA", currencyCode: "QAR" },
      { cartId: "cart-1" },
    );
  });
});

describe("order confirmation rewards", () => {
  it("shows frozen pending points from the order snapshot", async () => {
    fetchOrderReward.mockResolvedValue(
      readOrderReward({
        earned: true,
        orderId: "order-1",
        points: 1625,
        presentationState: "PENDING",
        currencyCode: "AED",
        vestedAt: null,
      }),
    );
    render(
      <Wrapper>
        <OrderEarn orderId="order-1" />
      </Wrapper>,
    );
    expect(await screen.findByText("1,625 points pending")).toBeInTheDocument();
    expect(
      screen.getByText("Your points will become available after this order qualifies."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/points added/)).not.toBeInTheDocument();
    expect(screen.queryByText(/approximately/)).not.toBeInTheDocument();
  });

  it("shows a vesting date when the server supplies one", async () => {
    fetchOrderReward.mockResolvedValue(
      readOrderReward({
        earned: true,
        orderId: "order-1",
        points: 1625,
        presentationState: "PENDING",
        currencyCode: "AED",
        vestedAt: "2026-10-20T00:00:00.000Z",
      }),
    );
    render(
      <Wrapper>
        <OrderEarn orderId="order-1" />
      </Wrapper>,
    );
    expect(await screen.findByText("Available from approximately 20 October")).toBeInTheDocument();
  });

  it("does not fall back to a cart estimate", async () => {
    fetchEarnPreview.mockResolvedValue(preview(1625));
    fetchOrderReward.mockResolvedValue(readOrderReward({ earned: false }));
    render(
      <Wrapper>
        <OrderEarn orderId="order-1" />
      </Wrapper>,
    );
    await waitFor(() => expect(fetchOrderReward).toHaveBeenCalledWith("order-1"));
    expect(screen.queryByText(/1,625/)).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Rewards" })).not.toBeInTheDocument();
    expect(fetchEarnPreview).not.toHaveBeenCalled();
  });

  it("stays silent for a cancelled order", async () => {
    fetchOrderReward.mockResolvedValue(
      readOrderReward({
        earned: true,
        orderId: "order-1",
        points: 1625,
        presentationState: "CANCELLED",
        currencyCode: "AED",
        vestedAt: null,
      }),
    );
    render(
      <Wrapper>
        <OrderEarn orderId="order-1" />
      </Wrapper>,
    );
    await waitFor(() => expect(fetchOrderReward).toHaveBeenCalled());
    expect(screen.queryByText(/points pending/)).not.toBeInTheDocument();
  });
});

describe("no redemption surface", () => {
  it("offers no redeem control or slider anywhere in the earn presentation", () => {
    render(
      <Wrapper>
        <EarnPreviewNote preview={preview(1625, "AED", "325.00")} variant="block" showBasis />
      </Wrapper>,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByText(/Use points/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Redeem/i)).not.toBeInTheDocument();
  });
});
