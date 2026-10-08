import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CheckoutPayment } from "@/features/checkout/components/checkout/CheckoutPayment";
import { MoneySummary } from "@/features/promotions/components/MoneySummary";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCartStore } from "@/stores/useCartStore";
import { useUiStore } from "@/stores/useUiStore";
import {
  readLoyaltyRedemption,
  readLoyaltyWallet,
  type LoyaltyRedemptionView,
} from "../types/loyalty";
import { LoyaltyDrawerNote } from "./LoyaltyDrawerNote";
import { LoyaltyRedemptionEditor } from "./LoyaltyRedemptionEditor";
import { hasOrderLoyaltySection, OrderRewardNote } from "./OrderRewardNote";

const applyCartLoyaltyRedemption = vi.hoisted(() => vi.fn());
const removeCartLoyaltyRedemption = vi.hoisted(() => vi.fn());
const fetchLoyaltyWallet = vi.hoisted(() => vi.fn());
const fetchLoyaltyTransactions = vi.hoisted(() => vi.fn());
const fetchLoyaltyTierHistory = vi.hoisted(() => vi.fn());

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

vi.mock("@/features/cart/api/cart.service", () => ({
  applyCartLoyaltyRedemption: (...args: unknown[]) => applyCartLoyaltyRedemption(...args),
  removeCartLoyaltyRedemption: (...args: unknown[]) => removeCartLoyaltyRedemption(...args),
  getActiveCart: vi.fn(),
}));

vi.mock("@/features/cart/api/optimisticCart", () => ({
  runQueuedCart: (run: () => Promise<unknown>) => run(),
}));

vi.mock("../api/loyalty.service", () => ({
  fetchLoyaltyWallet: (...args: unknown[]) => fetchLoyaltyWallet(...args),
  fetchLoyaltyTransactions: (...args: unknown[]) => fetchLoyaltyTransactions(...args),
  fetchLoyaltyTierHistory: (...args: unknown[]) => fetchLoyaltyTierHistory(...args),
}));

function quote(partial: Partial<LoyaltyRedemptionView> = {}): LoyaltyRedemptionView {
  return {
    enabled: true,
    eligible: true,
    availablePoints: 5420,
    minimumRedeemPoints: 100,
    incrementPoints: 50,
    maxRedeemablePoints: 400,
    appliedPoints: 0,
    appliedAmount: 0,
    currencyCode: "AED",
    reason: null,
    reasonMessage: null,
    ...partial,
  };
}

function Wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function signIn() {
  useAuthStore.setState({
    user: { id: "customer-1", email: "member@example.com" },
    isAuthenticated: true,
    bootstrapped: true,
  });
}

beforeEach(() => {
  applyCartLoyaltyRedemption.mockReset();
  removeCartLoyaltyRedemption.mockReset();
  fetchLoyaltyWallet.mockReset();
  fetchLoyaltyTransactions.mockReset();
  fetchLoyaltyTierHistory.mockReset();
  fetchLoyaltyTierHistory.mockResolvedValue([]);
  fetchLoyaltyWallet.mockResolvedValue(
    readLoyaltyWallet({
      enabled: true,
      member: true,
      market: { code: "UAE", currencyCode: "AED" },
      wallet: { availablePoints: 5420, pendingPoints: 0, reservedPoints: 0 },
      monetaryEquivalent: { available: "54.20", currencyCode: "AED" },
      policy: { pointValue: "0.010000" },
    }),
  );
  fetchLoyaltyTransactions.mockResolvedValue([]);
  signIn();
  useUiStore.setState({
    catalogContext: { zoneCode: "UAE", currencyCode: "AED", languageCode: "en" },
  });
  useCartStore.setState({
    cartId: "cart-1",
    loyaltyRedemption: quote(),
    loyaltyAdjusted: false,
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
  useCartStore.getState().clear();
  useUiStore.setState({ catalogContext: null });
});

describe("cart rewards editor", () => {
  it("hides Use Points for a guest", () => {
    useAuthStore.setState({ user: null, isAuthenticated: false, bootstrapped: true });
    render(
      <Wrapper>
        <LoyaltyRedemptionEditor />
      </Wrapper>,
    );
    expect(screen.queryByText("Reward points")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Use maximum" })).not.toBeInTheDocument();
  });

  it("shows available points and the server worth, never a priced figure", async () => {
    render(
      <Wrapper>
        <LoyaltyRedemptionEditor />
      </Wrapper>,
    );
    expect(await screen.findByText(/Available 5,420 points · worth AED 54.20/)).toBeInTheDocument();
    expect(screen.queryByText(/0\.010000/)).not.toBeInTheDocument();
  });

  it("Use maximum fills the server maxRedeemablePoints", async () => {
    const user = userEvent.setup();
    render(
      <Wrapper>
        <LoyaltyRedemptionEditor />
      </Wrapper>,
    );
    await user.click(await screen.findByRole("button", { name: "Use maximum" }));
    expect(screen.getByLabelText("Reward points to use")).toHaveValue(400);
  });

  it("follows the server increment on the step control", async () => {
    render(
      <Wrapper>
        <LoyaltyRedemptionEditor />
      </Wrapper>,
    );
    expect(await screen.findByLabelText("Reward points to use")).toHaveAttribute("step", "50");
    expect(screen.getByLabelText("Reward points to use")).toHaveAttribute("min", "100");
    expect(screen.getByLabelText("Reward points to use")).toHaveAttribute("max", "400");
  });

  it("applies POINTS only", async () => {
    const user = userEvent.setup();
    applyCartLoyaltyRedemption.mockResolvedValue({ cartId: "cart-1" });
    render(
      <Wrapper>
        <LoyaltyRedemptionEditor />
      </Wrapper>,
    );
    await user.type(await screen.findByLabelText("Reward points to use"), "200");
    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(applyCartLoyaltyRedemption).toHaveBeenCalledWith("cart-1", 200);
    const [, points] = applyCartLoyaltyRedemption.mock.calls[0] ?? [];
    expect(points).toBe(200);
  });

  it("shows applied points and the server appliedAmount", async () => {
    useCartStore.setState({
      loyaltyRedemption: quote({ appliedPoints: 200, appliedAmount: 2 }),
    });
    render(
      <Wrapper>
        <LoyaltyRedemptionEditor />
      </Wrapper>,
    );
    expect(await screen.findByText("200 points applied")).toBeInTheDocument();
    expect(screen.getByText("−AED 2.00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });

  it("removes the reservation through the cart endpoint", async () => {
    const user = userEvent.setup();
    useCartStore.setState({
      loyaltyRedemption: quote({ appliedPoints: 200, appliedAmount: 2 }),
    });
    removeCartLoyaltyRedemption.mockResolvedValue({ cartId: "cart-1" });
    render(
      <Wrapper>
        <LoyaltyRedemptionEditor />
      </Wrapper>,
    );
    await user.click(await screen.findByRole("button", { name: "Remove" }));
    expect(removeCartLoyaltyRedemption).toHaveBeenCalledWith("cart-1");
  });

  it("shows a promotion restriction without reading campaign flags", async () => {
    useCartStore.setState({
      loyaltyRedemption: readLoyaltyRedemption({
        enabled: true,
        eligible: false,
        availablePoints: 5420,
        minimumRedeemPoints: 100,
        incrementPoints: 50,
        maxRedeemablePoints: 0,
        appliedPoints: 0,
        appliedAmount: "0.00",
        currencyCode: "AED",
        reason: "REDEMPTION_NOT_AVAILABLE_WITH_CURRENT_OFFERS",
      }),
    });
    render(
      <Wrapper>
        <LoyaltyRedemptionEditor />
      </Wrapper>,
    );
    expect(await screen.findByText("Reward points can’t be used with the current offer.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Apply" })).not.toBeInTheDocument();
    expect(screen.queryByText(/STACK/)).not.toBeInTheDocument();
    expect(screen.queryByText(/campaign/i)).not.toBeInTheDocument();
  });

  it("shows the clamp notice when the server reduced applied points", async () => {
    useCartStore.setState({
      loyaltyRedemption: quote({ appliedPoints: 200, appliedAmount: 2 }),
      loyaltyAdjusted: true,
    });
    render(
      <Wrapper>
        <LoyaltyRedemptionEditor />
      </Wrapper>,
    );
    expect(
      await screen.findByText("Your reward points were adjusted after your bag changed."),
    ).toBeInTheDocument();
  });

  it("does not auto-increase the typed amount when the server max grows", async () => {
    const user = userEvent.setup();
    render(
      <Wrapper>
        <LoyaltyRedemptionEditor />
      </Wrapper>,
    );
    await user.type(await screen.findByLabelText("Reward points to use"), "200");
    useCartStore.setState({
      loyaltyRedemption: quote({ maxRedeemablePoints: 800 }),
    });
    expect(screen.getByLabelText("Reward points to use")).toHaveValue(200);
  });
});

describe("bag drawer compact state", () => {
  it("links to the bag instead of offering an editor", async () => {
    render(
      <Wrapper>
        <LoyaltyDrawerNote />
      </Wrapper>,
    );
    expect(await screen.findByRole("link", { name: "Use points" })).toHaveAttribute("href", "/cart");
    expect(screen.queryByLabelText("Reward points to use")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Apply" })).not.toBeInTheDocument();
  });

  it("shows reserved points without an editor", async () => {
    useCartStore.setState({
      loyaltyRedemption: quote({ appliedPoints: 200, appliedAmount: 2 }),
    });
    render(
      <Wrapper>
        <LoyaltyDrawerNote />
      </Wrapper>,
    );
    expect(await screen.findByText(/Using 200 points/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Change in bag" })).toHaveAttribute("href", "/cart");
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  });

  it("hides Use Points for a guest", () => {
    useAuthStore.setState({ user: null, isAuthenticated: false, bootstrapped: true });
    render(
      <Wrapper>
        <LoyaltyDrawerNote />
      </Wrapper>,
    );
    expect(screen.queryByText(/Use points/i)).not.toBeInTheDocument();
  });
});

describe("money summary loyalty line", () => {
  it("prints Total, Reward points, Gift card, then Amount due from the server payable", () => {
    const { container } = render(
      <MoneySummary
        className="cart-totals"
        currency="AED"
        subtotal={200}
        discount={0}
        shippingDiscount={0}
        total={200}
        amountPayable={140}
        loyalty={{ points: 1000, amount: 10, currency: "AED" }}
        giftCards={[{ usageId: "u1", maskedCode: "••••XM", amount: "50.00" }]}
      />,
    );
    const labels = Array.from(container.querySelectorAll("dt")).map((node) => node.textContent);
    expect(labels).toEqual(["Subtotal", "Total", "Reward points", "Gift card (••••XM)", "Amount due"]);
    expect(screen.getByText("Amount due").nextElementSibling).toHaveTextContent("AED 140.00");
    expect(screen.getByText("Reward points").nextElementSibling).toHaveTextContent("−AED 10.00");
  });

  it("does not subtract loyalty in the browser", () => {
    render(
      <MoneySummary
        className="cart-totals"
        currency="AED"
        subtotal={200}
        discount={0}
        shipping={0}
        shippingDiscount={0}
        total={200}
        amountPayable={190}
        loyalty={{ points: 1000, amount: 10 }}
      />,
    );
    expect(screen.getByText("Total").nextElementSibling).toHaveTextContent("AED 200.00");
    expect(screen.getByText("Amount due").nextElementSibling).toHaveTextContent("AED 190.00");
    expect(screen.getByText("Amount due").nextElementSibling).not.toHaveTextContent("AED 180.00");
  });
});

describe("checkout reservation and payable", () => {
  it("changes checkout points through the cart apply endpoint", async () => {
    const user = userEvent.setup();
    applyCartLoyaltyRedemption.mockResolvedValue({ cartId: "cart-1" });
    useCartStore.setState({
      loyaltyRedemption: quote({ appliedPoints: 200, appliedAmount: 2 }),
    });
    render(
      <Wrapper>
        <LoyaltyRedemptionEditor
          quoteOverride={quote({ appliedPoints: 200, appliedAmount: 2, eligible: true })}
        />
      </Wrapper>,
    );
    await user.click(await screen.findByRole("button", { name: "Change" }));
    await user.clear(screen.getByLabelText("Reward points to use"));
    await user.type(screen.getByLabelText("Reward points to use"), "150");
    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(applyCartLoyaltyRedemption).toHaveBeenCalledWith("cart-1", 150);
  });

  it("does not start a fake payment when the server payable is zero", () => {
    render(
      <CheckoutPayment
        methods={[
          {
            zonePaymentMethodId: "zp-1",
            paymentMethodId: "pay-1",
            providerCode: "stripe",
            methodCode: "card",
            displayName: "Card",
            isDefault: true,
          },
        ]}
        selectedId="zp-1"
        status="ready"
        submitting={false}
        errorMsg={null}
        onRetry={() => undefined}
        onSelect={() => undefined}
        canSubmit
        ctaLabel="Place order"
        amountPayable={0}
      />,
    );
    expect(screen.getByText("No payment needed — your rewards cover this order.")).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.queryByText(/Continue to payment/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Place order/ })).toBeInTheDocument();
  });
});

describe("order confirmation redemption", () => {
  it("renders redemption when the order earned nothing", () => {
    const reward = {
      earned: false as const,
      redemption: { redeemed: true as const, points: 4999, amount: 49.99, currencyCode: "AED" },
    };
    expect(hasOrderLoyaltySection(reward)).toBe(true);
    render(<OrderRewardNote reward={reward} />);
    expect(screen.getByRole("heading", { name: "Rewards" })).toBeInTheDocument();
    expect(screen.getByText("You used")).toBeInTheDocument();
    expect(screen.getByText("4,999 points")).toBeInTheDocument();
    expect(screen.getByText("AED 49.99")).toBeInTheDocument();
    expect(screen.queryByText(/points pending/)).not.toBeInTheDocument();
    expect(screen.queryByText("You earned")).not.toBeInTheDocument();
  });

  it("hides the Rewards section when nothing was earned or redeemed", () => {
    const reward = { earned: false as const, redemption: { redeemed: false as const } };
    expect(hasOrderLoyaltySection(reward)).toBe(false);
    render(<OrderRewardNote reward={reward} />);
    expect(screen.queryByRole("heading", { name: "Rewards" })).not.toBeInTheDocument();
  });

  it("shows redeemed and earned lines together", () => {
    const reward = {
      earned: true as const,
      orderId: "order-1",
      points: 1400,
      state: "PENDING" as const,
      currencyCode: "AED",
      vestedAt: null,
      redemption: { redeemed: true as const, points: 2000, amount: 20, currencyCode: "AED" },
    };
    expect(hasOrderLoyaltySection(reward)).toBe(true);
    render(<OrderRewardNote reward={reward} />);
    expect(screen.getByText("You used")).toBeInTheDocument();
    expect(screen.getByText("2,000 points")).toBeInTheDocument();
    expect(screen.getByText("AED 20.00")).toBeInTheDocument();
    expect(screen.getByText("You earned")).toBeInTheDocument();
    expect(screen.getByText("1,400 points pending")).toBeInTheDocument();
  });
});
