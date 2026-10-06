import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HistoricalLineDiscount } from "@/features/orders/components/HistoricalLineDiscount";
import { historicalLineDiscount } from "@/features/orders/utils/historicalLineDiscount";
import { useCartStore } from "@/stores/useCartStore";
import { AppliedCampaigns } from "./AppliedCampaigns";
import { GiftWithPurchase } from "./GiftWithPurchase";
import { MoneySummary } from "./MoneySummary";
import {
  amountPayableFrom,
  appliedPromotionView,
  checkoutQuoteSnapshot,
  type PromotionApplied,
  type PromotionSnapshotV1,
} from "../types/promotions";

vi.mock("../hooks/useGiftCatalog", () => ({
  useGiftCatalogMap: () => new Map(),
}));

vi.mock("../hooks/useGiftChoice", () => ({
  useGiftChoice: () => ({
    select: { mutateAsync: vi.fn(), isPending: false },
    cartId: "cart-1",
  }),
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

function bxgy(partial: Partial<PromotionApplied> & Pick<PromotionApplied, "label" | "amount">): PromotionApplied {
  return {
    kind: "AUTOMATIC",
    code: "BXGY",
    discountType: "BUY_X_GET_Y",
    discountValue: null,
    level: "LINE",
    ...partial,
  };
}

afterEach(() => {
  cleanup();
  useCartStore.getState().clear();
});

describe("BXGY fixed amount presentation", () => {
  it("keeps a free BXGY row on the server amount", () => {
    const item = bxgy({
      label: "Buy 1 Get 1 Free",
      amount: "40.00",
      discountValue: "100",
      metadata: { rewardType: "FREE", getQty: 1 },
    });
    expect(appliedPromotionView(item).amount).toBe(40);
    render(<AppliedCampaigns snapshot={quote({ applied: [item] })} />);
    expect(screen.getByText("Buy 1 Get 1 Free")).toBeInTheDocument();
    expect(screen.getByText("−AED 40.00")).toBeInTheDocument();
    expect(screen.queryByText(/Applied ·/)).not.toBeInTheDocument();
  });

  it("keeps a percentage BXGY row on the server amount", () => {
    const item = bxgy({
      label: "Buy 2 Get 1 at 50%",
      amount: "25.00",
      discountValue: "50",
      metadata: { rewardType: "PERCENTAGE", percentOff: 50 },
    });
    render(<AppliedCampaigns snapshot={quote({ applied: [item] })} />);
    expect(screen.getByText("Buy 2 Get 1 at 50%")).toBeInTheDocument();
    expect(screen.getByText("−AED 25.00")).toBeInTheDocument();
    expect(screen.queryByText("Applied · AED 50.00")).not.toBeInTheDocument();
  });

  it("shows a fixed-amount BXGY row from the server contribution", () => {
    const item = bxgy({
      label: "Buy 2 get 1 — AED 30 off",
      amount: "30.00",
      discountValue: "30",
      metadata: { rewardType: "FIXED_AMOUNT", rewardValue: "30", getQty: 1 },
    });
    render(<AppliedCampaigns snapshot={quote({ applied: [item] })} />);
    expect(screen.getByText("Buy 2 get 1 — AED 30 off")).toBeInTheDocument();
    expect(screen.getByText("Applied · AED 30.00")).toBeInTheDocument();
  });

  it("uses the server total for two reward units instead of the configured each-value", () => {
    const item = bxgy({
      label: "Buy 4 Get 2",
      amount: "50.00",
      discountValue: "25",
      metadata: { rewardType: "FIXED_AMOUNT", rewardValue: "25", getQty: 2 },
    });
    expect(appliedPromotionView(item).amount).toBe(Number(item.amount));
    expect(appliedPromotionView(item).amount).not.toBe(Number(item.discountValue));
    render(<AppliedCampaigns snapshot={quote({ applied: [item] })} />);
    expect(screen.getByText("Applied · AED 50.00")).toBeInTheDocument();
    expect(screen.queryByText("Applied · AED 25.00")).not.toBeInTheDocument();
  });

  it("shows the clamped server amount rather than the configured reward", () => {
    const item = bxgy({
      label: "AED 30 off reward item",
      amount: "20.00",
      discountValue: "30",
      metadata: { rewardType: "FIXED_AMOUNT", rewardValue: "30" },
    });
    render(<AppliedCampaigns snapshot={quote({ applied: [item], totals: { discountTotal: "20.00" } })} />);
    expect(screen.getByText("Applied · AED 20.00")).toBeInTheDocument();
    expect(screen.queryByText("Applied · AED 30.00")).not.toBeInTheDocument();
  });

  it("renders the active market quote for a fixed-amount reward", () => {
    const uae = bxgy({
      label: "AED 30 off each reward item",
      amount: "30.00",
      metadata: { rewardType: "FIXED_AMOUNT", rewardValue: "30" },
    });
    const ksa = bxgy({
      label: "SAR 20 off each reward item",
      amount: "20.00",
      discountValue: "30",
      metadata: { rewardType: "FIXED_AMOUNT", rewardValue: "30" },
    });
    const { unmount } = render(
      <AppliedCampaigns
        snapshot={quote({
          applied: [uae],
          context: { brandCode: null, zoneCode: "UAE", currencyCode: "AED", salesChannelCode: null },
        })}
      />,
    );
    expect(screen.getByText("Applied · AED 30.00")).toBeInTheDocument();
    unmount();
    render(
      <AppliedCampaigns
        snapshot={quote({
          applied: [ksa],
          context: { brandCode: null, zoneCode: "KSA", currencyCode: "SAR", salesChannelCode: null },
        })}
      />,
    );
    expect(screen.getByText("Applied · SAR 20.00")).toBeInTheDocument();
    expect(screen.queryByText("Applied · AED 30.00")).not.toBeInTheDocument();
  });

  it("clears the previous market quote without touching bag lines", () => {
    useCartStore.setState({
      lines: [{ variantId: "v1", slug: "rose", title: "Rose", unitPrice: 100, currency: "AED", quantity: 1 }],
      promotions: quote({ applied: [bxgy({ label: "AED 30 off", amount: "30.00", metadata: { rewardType: "FIXED_AMOUNT" } })] }),
      totals: {
        subtotal: 100,
        total: 70,
        discount: 30,
        shipping: 0,
        tax: 0,
        amountPayable: 70,
        currency: "AED",
        itemCount: 1,
        totalQty: 1,
      },
    });
    useCartStore.getState().clearPromotions();
    expect(useCartStore.getState().promotions).toBeNull();
    expect(useCartStore.getState().totals).toBeNull();
    expect(useCartStore.getState().lines).toHaveLength(1);
  });

  it("does not multiply a configured reward by quantity", () => {
    const item = bxgy({
      label: "Buy 4 Get 2",
      amount: "50.00",
      discountValue: "25",
      metadata: { rewardType: "FIXED_AMOUNT", rewardValue: "25", getQty: 3 },
    });
    const shown = appliedPromotionView(item).amount;
    expect(shown).toBe(50);
    expect(shown).not.toBe(Number(item.metadata?.rewardValue) * Number(item.metadata?.getQty));
    expect(shown).not.toBe(Number(item.discountValue));
  });

  it("leaves gift with purchase at zero", () => {
    render(
      <GiftWithPurchase
        snapshot={quote({
          gifts: [
            {
              type: "GIFT_WITH_PURCHASE",
              promotionCode: "GWP",
              status: null,
              message: null,
              giftItems: [{ sku: "SAMPLE", quantity: 1, name: "Sample", imageUrl: null }],
              choices: [],
            },
          ],
        })}
      />,
    );
    expect(screen.getByRole("heading", { name: "Sample" })).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.queryByText("Applied · AED 0.00")).not.toBeInTheDocument();
  });

  it("keeps cart totals and checkout payable on the server figures", () => {
    const snap = quote({
      applied: [
        bxgy({
          label: "AED 30 off reward item",
          amount: "20.00",
          discountValue: "30",
          metadata: { rewardType: "FIXED_AMOUNT", rewardValue: "30" },
        }),
      ],
      totals: { discountTotal: "20.00", amountPayable: "80.00" },
    });
    render(
      <MoneySummary
        className="checkout-totals"
        currency="AED"
        subtotal={100}
        discount={20}
        shipping={0}
        shippingDiscount={0}
        total={80}
        amountPayable={80}
        freeGifts={[{ name: "Sample", quantity: 1 }]}
      />,
    );
    expect(screen.getByText("Discount").nextElementSibling).toHaveTextContent("−AED 20.00");
    expect(screen.getByText("Total").nextElementSibling).toHaveTextContent("AED 80.00");
    expect(screen.getByText(/Sample/)).toHaveTextContent("AED 0.00");
    expect(screen.queryByText("Amount due")).not.toBeInTheDocument();
    const quoted = checkoutQuoteSnapshot({ promotions: snap }, null);
    expect(quoted?.totals.discountTotal).toBe("20.00");
    expect(amountPayableFrom(quoted, ["180.00"])).toBe(180);
  });

  it("keeps a historical fixed-amount line on the stored total", () => {
    const snapshot = {
      v: 1,
      discountTotal: "20.00",
      allocations: [{ kind: "AUTOMATIC", code: "BXGY", discountType: "BUY_X_GET_Y", amount: "30.00" }],
    };
    expect(historicalLineDiscount(snapshot)).toBe(20);
    render(<HistoricalLineDiscount snapshot={snapshot} currency="AED" className="line-discount" />);
    expect(screen.getByText("−AED 20.00")).toBeInTheDocument();
    expect(screen.queryByText("−AED 30.00")).not.toBeInTheDocument();
  });
});
