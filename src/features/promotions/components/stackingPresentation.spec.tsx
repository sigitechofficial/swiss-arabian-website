import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCartStore } from "@/stores/useCartStore";
import { AppliedCampaigns } from "./AppliedCampaigns";
import { CouponForm } from "./CouponForm";
import { MoneySummary } from "./MoneySummary";
import { PromotionUnlockNote } from "./PromotionUnlockNote";
import {
  appliedPromotionView,
  shippingDiscountAmount,
  type PromotionApplied,
  type PromotionOffer,
  type PromotionSnapshotV1,
} from "../types/promotions";

vi.mock("next/navigation", () => ({
  usePathname: () => "/cart",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/features/cart/hooks/useCouponMutations", () => ({
  useCouponMutations: () => ({
    apply: { mutateAsync: vi.fn(), isPending: false },
    remove: { mutateAsync: vi.fn(), isPending: false },
    cartId: "cart-1",
  }),
}));

const applicable = vi.hoisted(() => ({
  data: null as { promotions: PromotionSnapshotV1; offers: PromotionOffer[] } | null,
}));

vi.mock("../hooks/useApplicablePromotions", () => ({
  useApplicablePromotions: () => ({ data: applicable.data }),
}));

function row(
  partial: Partial<PromotionApplied> & Pick<PromotionApplied, "kind" | "amount">,
): PromotionApplied {
  return {
    code: null,
    label: null,
    discountType: null,
    discountValue: null,
    level: null,
    ...partial,
  };
}

function snap(partial: Partial<PromotionSnapshotV1>): PromotionSnapshotV1 {
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

afterEach(() => {
  cleanup();
  applicable.data = null;
  useCartStore.setState({ promotions: null, cartId: "cart-1", totals: null });
});

describe("P7 stacking presentation", () => {
  it("displays the clamped applied amount and ignores discountValue", () => {
    const item = row({
      kind: "AUTOMATIC",
      code: "ORDER20",
      label: "Order offer",
      discountType: "PERCENTAGE",
      discountValue: "50",
      amount: "20.00",
    });
    expect(appliedPromotionView(item).amount).toBe(20);
    render(<AppliedCampaigns snapshot={snap({ applied: [item] })} />);
    expect(screen.getByText("−AED 20.00")).toBeInTheDocument();
    expect(screen.queryByText(/50/)).not.toBeInTheDocument();
  });

  it("shows a fully clamped offer as a quiet conflict, not an applied row", () => {
    const promo = snap({
      applied: [],
      rejected: [
        {
          code: "OFFER_B",
          reason: "PROMOTION_CONFLICT",
          message: "Another offer was applied instead.",
        },
      ],
    });
    applicable.data = { promotions: promo, offers: [] };
    useCartStore.setState({ promotions: promo, cartId: "cart-1" });
    render(
      <>
        <AppliedCampaigns snapshot={promo} />
        <PromotionUnlockNote />
      </>,
    );
    expect(screen.getByText("Another offer was applied instead.")).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Applied offers" })).not.toBeInTheDocument();
    expect(screen.queryByText(/0\.00/)).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders two stackable automatic offers", () => {
    render(
      <AppliedCampaigns
        snapshot={snap({
          applied: [
            row({ kind: "AUTOMATIC", code: "AUTO_A", label: "Layer offer", amount: "10.00" }),
            row({ kind: "AUTOMATIC", code: "AUTO_B", label: "Set offer", amount: "8.00" }),
          ],
        })}
      />,
    );
    expect(screen.getByText("Layer offer")).toBeInTheDocument();
    expect(screen.getByText("−AED 10.00")).toBeInTheDocument();
    expect(screen.getByText("Set offer")).toBeInTheDocument();
    expect(screen.getByText("−AED 8.00")).toBeInTheDocument();
  });

  it("renders product, order, and shipping rows together", () => {
    const promo = snap({
      applied: [
        row({
          kind: "AUTOMATIC",
          code: "PROD",
          label: "Product offer",
          level: "PRODUCT",
          amount: "100.00",
        }),
        row({
          kind: "AUTOMATIC",
          code: "ORDER",
          label: "Order offer",
          level: "ORDER",
          amount: "30.00",
        }),
        row({
          kind: "FREE_SHIPPING",
          code: "SHIP",
          label: "Shipping offer",
          level: "SHIPPING",
          discountType: "FREE_SHIPPING",
          amount: "25.00",
        }),
      ],
      totals: { discountTotal: "130.00", shippingDiscount: "25.00" },
    });
    render(
      <>
        <AppliedCampaigns snapshot={promo} />
        <MoneySummary
          className="cart-totals"
          currency="AED"
          subtotal={400}
          discount={130}
          shipping={25}
          shippingDiscount={shippingDiscountAmount(promo)}
          total={295}
        />
      </>,
    );
    expect(screen.getByText("Product offer")).toBeInTheDocument();
    expect(screen.getByText("−AED 100.00")).toBeInTheDocument();
    expect(screen.getByText("Order offer")).toBeInTheDocument();
    expect(screen.getByText("−AED 30.00")).toBeInTheDocument();
    expect(screen.getByText("Shipping offer")).toBeInTheDocument();
    expect(screen.getAllByText("−AED 25.00")).toHaveLength(2);
    expect(screen.getByText("Discount").nextElementSibling).toHaveTextContent("−AED 130.00");
    expect(screen.getByText("Shipping discount").nextElementSibling).toHaveTextContent("−AED 25.00");
  });

  it("keeps a coupon and an automatic offer, with the server discount total", () => {
    const promo = snap({
      applied: [
        row({
          kind: "COUPON",
          code: "EID20",
          label: "Eid coupon",
          discountValue: "50",
          amount: "20.00",
        }),
        row({ kind: "AUTOMATIC", code: "AUTO", label: "Automatic offer", amount: "15.00" }),
      ],
      totals: { discountTotal: "32.00", shippingDiscount: "0.00" },
    });
    useCartStore.setState({ promotions: promo, cartId: "cart-1" });
    render(
      <>
        <CouponForm />
        <AppliedCampaigns snapshot={promo} />
        <MoneySummary
          className="cart-totals"
          currency="AED"
          subtotal={200}
          discount={32}
          shipping={0}
          shippingDiscount={0}
          total={168}
        />
      </>,
    );
    expect(screen.getByText("Eid coupon")).toBeInTheDocument();
    expect(screen.getByText("EID20")).toBeInTheDocument();
    expect(screen.getByText("−AED 20.00")).toBeInTheDocument();
    expect(screen.getByText("Automatic offer")).toBeInTheDocument();
    expect(screen.getByText("−AED 15.00")).toBeInTheDocument();
    expect(screen.getByText("Discount").nextElementSibling).toHaveTextContent("−AED 32.00");
    expect(screen.queryByText(/50/)).not.toBeInTheDocument();
  });

  it("does not show a conflicting coupon as applied", () => {
    const promo = snap({
      applied: [row({ kind: "AUTOMATIC", code: "AUTO", label: "Automatic offer", amount: "15.00" })],
      rejected: [
        { code: "LOSER", reason: "PROMOTION_CONFLICT", message: "Another offer was applied instead." },
      ],
    });
    applicable.data = { promotions: promo, offers: [] };
    useCartStore.setState({ promotions: promo, cartId: "cart-1" });
    render(
      <>
        <CouponForm />
        <PromotionUnlockNote />
      </>,
    );
    expect(screen.queryByText("LOSER")).not.toBeInTheDocument();
    expect(screen.getByText("Another offer was applied instead.")).toBeInTheDocument();
  });

  it("collapses identical conflict fallbacks and keeps distinct messages", () => {
    const promo = snap({
      rejected: [
        { code: "A", reason: "PROMOTION_CONFLICT" },
        { code: "B", reason: "PROMOTION_CONFLICT" },
        { code: "C", reason: "PROMOTION_CONFLICT", message: "The shipping offer was kept." },
      ],
    });
    applicable.data = { promotions: promo, offers: [] };
    render(<PromotionUnlockNote />);
    expect(
      screen.getAllByText("Another offer didn’t combine with the one already on your bag."),
    ).toHaveLength(1);
    expect(screen.getByText("The shipping offer was kept.")).toBeInTheDocument();
  });

  it("does not sum shipping rows into the shipping discount", () => {
    const promo = snap({
      applied: [
        row({
          kind: "FREE_SHIPPING",
          code: "SHIP_A",
          label: "Ship A",
          discountType: "FREE_SHIPPING",
          amount: "10.00",
        }),
        row({
          kind: "FREE_SHIPPING",
          code: "SHIP_B",
          label: "Ship B",
          discountType: "FREE_SHIPPING",
          amount: "15.00",
        }),
      ],
      totals: { discountTotal: "0", shippingDiscount: "22.00" },
    });
    expect(shippingDiscountAmount(promo)).toBe(22);
    render(
      <MoneySummary
        className="cart-totals"
        currency="AED"
        subtotal={100}
        discount={0}
        shipping={25}
        shippingDiscount={shippingDiscountAmount(promo)}
        total={103}
      />,
    );
    expect(screen.getByText("Shipping discount").nextElementSibling).toHaveTextContent("−AED 22.00");
    expect(screen.queryByText("Discount")).not.toBeInTheDocument();
  });

  it("keeps a pending offer distinct from a conflict", () => {
    const promo = snap({
      rejected: [{ reason: "PROMOTION_CONFLICT", message: "Another offer was applied instead." }],
    });
    applicable.data = {
      promotions: promo,
      offers: [
        {
          qualification: { status: "PENDING", pendingReason: "SHIPPING_METHOD_REQUIRED" },
        },
      ],
    };
    render(<PromotionUnlockNote />);
    expect(
      screen.getByText("Select an eligible delivery method at checkout to use this offer."),
    ).toBeInTheDocument();
    expect(screen.getByText("Another offer was applied instead.")).toBeInTheDocument();
    expect(screen.queryByText(/unlocked/i)).not.toBeInTheDocument();
  });

  it("still renders BXGY and a free-shipping coupon from the server", () => {
    const promo = snap({
      applied: [
        row({
          kind: "COUPON",
          code: "EID3FOR2",
          label: "Buy 2 Perfumes, Get 1 Body Spray Free",
          discountType: "BUY_X_GET_Y",
          discountValue: "3",
          amount: "50",
        }),
        row({
          kind: "COUPON",
          code: "FREESHIP",
          label: "Weekend delivery",
          discountType: "FREE_SHIPPING",
          amount: "0",
        }),
      ],
      totals: { discountTotal: "50.00", shippingDiscount: "25.00" },
    });
    expect(appliedPromotionView(promo.applied[0], promo).amount).toBe(50);
    expect(appliedPromotionView(promo.applied[1], promo)).toMatchObject({
      amount: null,
      status: "Free shipping",
    });
    expect(shippingDiscountAmount(promo)).toBe(25);
  });
});
