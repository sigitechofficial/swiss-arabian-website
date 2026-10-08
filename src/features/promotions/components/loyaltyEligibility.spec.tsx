import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { LoyaltyRedemptionEditor } from "@/features/loyalty/components/LoyaltyRedemptionEditor";
import { readLoyaltyRedemption } from "@/features/loyalty/types/loyalty";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCartStore } from "@/stores/useCartStore";
import { useUiStore } from "@/stores/useUiStore";
import { AppliedCampaigns } from "./AppliedCampaigns";
import { MoneySummary } from "./MoneySummary";
import { OfferLanding } from "./OfferLanding";
import type { PromotionDiscovery } from "../types/discovery";
import type { PromotionSnapshotV1 } from "../types/promotions";

const discoveryState = vi.hoisted(() => ({
  data: null as PromotionDiscovery | null,
  isLoading: false,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/cart",
}));

vi.mock("../hooks/usePromotionDiscovery", () => ({
  usePromotionDiscovery: () => ({
    data: discoveryState.data,
    isLoading: discoveryState.isLoading,
  }),
}));

vi.mock("@/features/cart/api/cart.service", () => ({
  applyCartLoyaltyRedemption: vi.fn(),
  removeCartLoyaltyRedemption: vi.fn(),
  getActiveCart: vi.fn(),
}));

vi.mock("@/features/cart/api/optimisticCart", () => ({
  runQueuedCart: (run: () => Promise<unknown>) => run(),
}));

vi.mock("@/features/loyalty/api/loyalty.service", () => ({
  fetchLoyaltyWallet: vi.fn().mockResolvedValue({
    availablePoints: 5420,
    currencyCode: "AED",
    member: true,
  }),
  fetchLoyaltyTransactions: vi.fn().mockResolvedValue([]),
  fetchLoyaltyTierHistory: vi.fn().mockResolvedValue([]),
}));

function quote(partial: Partial<PromotionSnapshotV1>): PromotionSnapshotV1 {
  return {
    v: 1,
    computedAt: null,
    context: { brandCode: null, zoneCode: "UAE", currencyCode: "AED", salesChannelCode: null },
    applied: [],
    lineAllocations: [],
    totals: { discountTotal: "0" },
    rejected: [],
    ...partial,
  };
}

function Wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  useAuthStore.setState({
    user: { id: "gold-1", email: "gold@example.com" },
    isAuthenticated: true,
    bootstrapped: true,
  });
  useUiStore.setState({
    catalogContext: { zoneCode: "UAE", currencyCode: "AED", languageCode: "en" },
  });
});

afterEach(() => {
  cleanup();
  discoveryState.data = null;
  discoveryState.isLoading = false;
  useCartStore.setState({
    promotions: null,
    loyaltyRedemption: null,
    loyaltyAdjusted: false,
    cartId: "cart-1",
  });
});

describe("FE-L6 promotion surfaces", () => {
  it("shows a Gold campaign on the offer landing when discovery returned it", () => {
    discoveryState.data = {
      brandCode: null,
      marketCode: "UAE",
      currencyCode: "AED",
      locale: "en",
      entryLabel: null,
      offers: [
        {
          campaignId: "1",
          campaignCode: "GOLD10",
          mechanic: "PERCENTAGE",
          publicTitle: "Gold member saving",
          badge: "Gold 10%",
          shortMessage: "A Gold Rewards saving.",
          benefitSummary: "10% off",
          qualificationSummary: "For Gold Rewards.",
          activationType: "AUTOMATIC",
          presentationState: "AVAILABLE",
          shopOfferAvailable: false,
          shopOfferPath: null,
          detailsAvailable: true,
          marketCode: "UAE",
          currencyCode: "AED",
          groups: [],
          lines: [],
          details: {
            whatYouGet: "10% off qualifying items.",
            howToQualify: "Available on this bag.",
            restrictions: [],
            ctaLabel: null,
          },
        },
      ],
      primaryOffer: null,
      secondaryOffers: [],
      unlockedBenefits: [],
      nextBestAction: null,
      tiles: [],
      chrome: {
        viewDetails: "View details",
        close: "Close",
        viewAll: "View all benefits",
        whatYouGet: "What you get",
        howToQualify: "How to qualify",
        restrictions: "Important restrictions",
        loading: "Loading.",
        unavailable: "This is not available in your market.",
      },
      productBadges: [],
    };
    render(<OfferLanding code="GOLD10" />);
    expect(screen.getByRole("heading", { name: "Gold member saving" })).toBeInTheDocument();
    expect(screen.queryByText(/requiredTier/)).not.toBeInTheDocument();
  });

  it("does not invent a Gold landing when discovery omitted the campaign", () => {
    discoveryState.data = {
      brandCode: null,
      marketCode: "UAE",
      currencyCode: "AED",
      locale: "en",
      entryLabel: null,
      offers: [],
      primaryOffer: null,
      secondaryOffers: [],
      unlockedBenefits: [],
      nextBestAction: null,
      tiles: [],
      chrome: {
        viewDetails: "View details",
        close: "Close",
        viewAll: "View all benefits",
        whatYouGet: "What you get",
        howToQualify: "How to qualify",
        restrictions: "Important restrictions",
        loading: "Loading.",
        unavailable: "This is not available in your market.",
      },
      productBadges: [],
    };
    render(<OfferLanding code="GOLD10" />);
    expect(screen.getByText("This is not available in your market.")).toBeInTheDocument();
    expect(screen.queryByText("Gold member saving")).not.toBeInTheDocument();
  });

  it("renders a Gold cart saving from the server quote", () => {
    const snapshot = quote({
      applied: [
        {
          kind: "AUTOMATIC",
          code: "GOLD10",
          label: "Gold member saving",
          discountType: "PERCENTAGE",
          discountValue: "10",
          level: "ORDER",
          amount: "25.00",
        },
      ],
      totals: { discountTotal: "25.00", amountPayable: "225.00" },
    });
    render(
      <>
        <AppliedCampaigns snapshot={snapshot} />
        <MoneySummary
          className="cart-totals"
          currency="AED"
          subtotal={250}
          discount={25}
          shippingDiscount={0}
          total={225}
          amountPayable={225}
        />
      </>,
    );
    expect(screen.getByText("Gold member saving")).toBeInTheDocument();
    expect(screen.getAllByText("−AED 25.00").length).toBeGreaterThan(0);
    expect(screen.queryByText("Gold Member Price")).not.toBeInTheDocument();
  });

  it("does not apply Gold when the Silver quote omitted it", () => {
    render(
      <AppliedCampaigns
        snapshot={quote({
          applied: [],
          rejected: [{ code: "GOLD10", reason: "LOYALTY_TIER_REQUIRED" }],
          totals: { discountTotal: "0", amountPayable: "250.00" },
        })}
      />,
    );
    expect(screen.queryByText("Gold member saving")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Applied offers")).not.toBeInTheDocument();
  });

  it("still shows Gold promotion savings when points redemption is blocked", async () => {
    const snapshot = quote({
      applied: [
        {
          kind: "AUTOMATIC",
          code: "GOLD10",
          label: "Gold member saving",
          discountType: "PERCENTAGE",
          discountValue: "10",
          level: "ORDER",
          amount: "25.00",
        },
      ],
      totals: { discountTotal: "25.00" },
    });
    useCartStore.setState({
      cartId: "cart-1",
      promotions: snapshot,
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
        <AppliedCampaigns snapshot={snapshot} />
        <LoyaltyRedemptionEditor />
      </Wrapper>,
    );
    expect(screen.getByText("Gold member saving")).toBeInTheDocument();
    expect(await screen.findByText("Reward points can’t be used with the current offer.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Apply" })).not.toBeInTheDocument();
  });
});
