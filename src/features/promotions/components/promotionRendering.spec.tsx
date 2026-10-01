import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCartStore } from "@/stores/useCartStore";
import { AppliedCampaigns } from "./AppliedCampaigns";
import { CouponForm } from "./CouponForm";
import { MoneySummary } from "./MoneySummary";
import { PromotionUnlockNote } from "./PromotionUnlockNote";
import type { PromotionOffer, PromotionSnapshotV1 } from "../types/promotions";

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

function snapshot(partial: Partial<PromotionSnapshotV1>): PromotionSnapshotV1 {
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

describe("promotion rendering", () => {
  it("shows a coupon BXGY label and the server discount", () => {
    useCartStore.setState({
      cartId: "cart-1",
      promotions: snapshot({
        applied: [
          {
            kind: "COUPON",
            code: "EID3FOR2",
            label: "Buy 2 Perfumes, Get 1 Body Spray Free",
            discountType: "BUY_X_GET_Y",
            discountValue: null,
            level: "LINE",
            amount: "50",
            metadata: { maxRewardQuantity: 1 },
          },
        ],
        totals: { discountTotal: "50.00" },
      }),
    });
    render(<CouponForm />);
    expect(screen.getByText("Buy 2 Perfumes, Get 1 Body Spray Free")).toBeInTheDocument();
    expect(screen.getByText("−AED 50.00")).toBeInTheDocument();
    expect(screen.queryByText(/maxRewardQuantity/)).not.toBeInTheDocument();
  });

  it("shows Free shipping for a zero-amount shipping coupon", () => {
    useCartStore.setState({
      cartId: "cart-1",
      promotions: snapshot({
        applied: [
          {
            kind: "COUPON",
            code: "FREESHIP",
            label: "Weekend delivery",
            discountType: "FREE_SHIPPING",
            discountValue: null,
            level: "SHIPPING",
            amount: "0",
          },
        ],
        totals: { discountTotal: "0.00", shippingDiscount: "25.00", amountPayable: "100.00" },
      }),
    });
    render(<CouponForm />);
    expect(screen.getByText("Weekend delivery")).toBeInTheDocument();
    expect(screen.getByText("Free shipping")).toBeInTheDocument();
    expect(screen.queryByText(/0\.00/)).not.toBeInTheDocument();
  });

  it("shows automatic BXGY and free-shipping rows", () => {
    render(
      <AppliedCampaigns
        snapshot={snapshot({
          applied: [
            {
              kind: "AUTOMATIC",
              code: "BXGY_3FOR2",
              label: "3 for 2",
              discountType: "BUY_X_GET_Y",
              discountValue: null,
              level: null,
              amount: "40.00",
            },
            {
              kind: "FREE_SHIPPING",
              code: "SHIP_FREE_300",
              label: "Free shipping",
              discountType: "FREE_SHIPPING",
              discountValue: null,
              level: "SHIPPING",
              amount: "0",
            },
          ],
          totals: { discountTotal: "40.00", shippingDiscount: "18.00" },
        })}
      />,
    );
    expect(screen.getByText("3 for 2")).toBeInTheDocument();
    expect(screen.getByText("−AED 40.00")).toBeInTheDocument();
    expect(screen.getByText("Free shipping")).toBeInTheDocument();
    expect(screen.getByText("−AED 18.00")).toBeInTheDocument();
  });

  it("keeps gift-card tender off the Discount row and shows amount due", () => {
    render(
      <MoneySummary
        className="cart-totals"
        currency="AED"
        subtotal={150}
        discount={20}
        shipping={25}
        shippingDiscount={18}
        total={137}
        amountPayable={87}
        giftCards={[{ usageId: "u1", maskedCode: "••••XM", amount: "50.00" }]}
      />,
    );
    expect(screen.getByText("Discount").nextElementSibling).toHaveTextContent("−AED 20.00");
    expect(screen.getByText("Shipping discount").nextElementSibling).toHaveTextContent("−AED 18.00");
    expect(screen.getByText("Gift card (••••XM)").nextElementSibling).toHaveTextContent("−AED 50.00");
    expect(screen.getByText("Amount due").nextElementSibling).toHaveTextContent("AED 87.00");
  });

  it("shows amount due from the current checkout payable, not a stale cart figure", () => {
    render(
      <MoneySummary
        className="checkout-totals"
        currency="AED"
        subtotal={99}
        discount={0}
        shipping={100}
        shippingDiscount={0}
        total={199}
        amountPayable={199}
      />,
    );
    expect(screen.getByText("Total").nextElementSibling).toHaveTextContent("AED 199.00");
    expect(screen.queryByText("Amount due")).not.toBeInTheDocument();
  });

  it("shows the tender-adjusted checkout payable as amount due", () => {
    render(
      <MoneySummary
        className="checkout-totals"
        currency="AED"
        subtotal={200}
        discount={0}
        shipping={0}
        shippingDiscount={0}
        total={200}
        amountPayable={150}
        giftCards={[{ usageId: "u1", maskedCode: null, amount: "50.00" }]}
      />,
    );
    expect(screen.getByText("Total").nextElementSibling).toHaveTextContent("AED 200.00");
    expect(screen.getByText("Amount due").nextElementSibling).toHaveTextContent("AED 150.00");
  });

  it("omits Discount when only a gift card is applied", () => {
    render(
      <MoneySummary
        className="cart-totals"
        currency="AED"
        subtotal={100}
        discount={0}
        shipping={0}
        shippingDiscount={0}
        total={100}
        amountPayable={50}
        giftCards={[{ usageId: "u1", maskedCode: null, amount: "50.00" }]}
      />,
    );
    expect(screen.queryByText("Discount")).not.toBeInTheDocument();
    expect(screen.getByText("Gift card")).toBeInTheDocument();
    expect(screen.getByText("Amount due")).toBeInTheDocument();
  });

  it("renders partial shipping money separately from merchandise discount and gift cards", () => {
    render(
      <>
        <AppliedCampaigns
          snapshot={snapshot({
            applied: [
              {
                kind: "AUTOMATIC",
                code: "SHIP50",
                label: "50% off shipping",
                discountType: "PERCENTAGE",
                discountValue: "50",
                level: "SHIPPING",
                amount: "50.00",
              },
            ],
            totals: { discountTotal: "20.00", shippingDiscount: "50.00", amountPayable: "150.00" },
          })}
        />
        <MoneySummary
          className="checkout-totals"
          currency="AED"
          subtotal={200}
          discount={20}
          shipping={50}
          shippingDiscount={50}
          total={250}
          amountPayable={150}
          giftCards={[{ usageId: "gc", maskedCode: null, amount: "100.00" }]}
        />
      </>,
    );
    expect(screen.getByText("50% off shipping")).toBeInTheDocument();
    expect(screen.getByText("Applied · AED 50.00")).toBeInTheDocument();
    expect(screen.getByText("Shipping").nextElementSibling).toHaveTextContent("AED 50.00");
    expect(screen.getByText("Shipping discount").nextElementSibling).toHaveTextContent("−AED 50.00");
    expect(screen.getByText("Discount").nextElementSibling).toHaveTextContent("−AED 20.00");
    expect(screen.getByText("Gift card").nextElementSibling).toHaveTextContent("−AED 100.00");
    expect(screen.getByText("Amount due").nextElementSibling).toHaveTextContent("AED 150.00");
  });

  it("shows a fixed shipping discount beside the server shipping amount", () => {
    render(
      <MoneySummary
        className="checkout-totals"
        currency="AED"
        subtotal={100}
        discount={0}
        shipping={80}
        shippingDiscount={20}
        total={180}
        amountPayable={180}
      />,
    );
    expect(screen.getByText("Shipping").nextElementSibling).toHaveTextContent("AED 80.00");
    expect(screen.getByText("Shipping discount").nextElementSibling).toHaveTextContent("−AED 20.00");
    expect(screen.queryByText(/^Free$/)).not.toBeInTheDocument();
  });

  it("keeps a fully waived shipping row as Free", () => {
    render(
      <MoneySummary
        className="cart-totals"
        currency="AED"
        subtotal={100}
        discount={0}
        shipping={0}
        shippingDiscount={100}
        total={100}
        amountPayable={100}
      />,
    );
    expect(screen.getByText("Shipping").nextElementSibling).toHaveTextContent("Free");
  });

  it("does not invent a shipping discount when the cart shipping fee is zero", () => {
    render(
      <MoneySummary
        className="cart-totals"
        currency="AED"
        subtotal={100}
        discount={0}
        shipping={0}
        shippingDiscount={0}
        total={100}
        amountPayable={100}
      />,
    );
    expect(screen.queryByText("Shipping discount")).not.toBeInTheDocument();
  });

  it("renders a promotion conflict as a quiet note", () => {
    const promo = snapshot({
      rejected: [{ reason: "PROMOTION_CONFLICT", message: "Another offer didn’t combine with the one already on your bag." }],
    });
    applicable.data = { promotions: promo, offers: [] };
    useCartStore.setState({ promotions: promo, cartId: "cart-1" });
    render(<PromotionUnlockNote />);
    expect(
      screen.getByText("Another offer didn’t combine with the one already on your bag."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows a server remaining amount and does not mark a pending offer applied", () => {
    const promo = snapshot({
      applied: [],
      totals: { discountTotal: "0", shippingDiscount: "0" },
    });
    applicable.data = {
      promotions: promo,
      offers: [
        {
          qualification: { status: "INELIGIBLE", remainingAmount: "75.00", minOrderAmount: "300.00" },
          rejected: { reason: "MIN_ORDER" },
        },
        {
          title: "Card offer",
          selected: true,
          qualification: { status: "PENDING", pendingReason: "PAYMENT_METHOD_REQUIRED" },
        },
      ],
    };
    useCartStore.setState({ promotions: promo, cartId: "cart-1" });
    render(
      <>
        <AppliedCampaigns snapshot={promo} />
        <PromotionUnlockNote />
      </>,
    );
    expect(screen.getByText("Spend AED 75.00 to unlock free shipping.")).toBeInTheDocument();
    expect(
      screen.getByText("Select an eligible payment method at checkout to use this offer."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Free shipping applied.")).not.toBeInTheDocument();
    expect(screen.queryByText(/unlocked free shipping/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Applied offers" })).not.toBeInTheDocument();
  });
});
