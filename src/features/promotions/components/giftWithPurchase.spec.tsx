import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCartStore } from "@/stores/useCartStore";
import { AppliedCampaigns } from "./AppliedCampaigns";
import { GiftWithPurchase } from "./GiftWithPurchase";
import { MoneySummary } from "./MoneySummary";
import { HistoricalGiftNote } from "@/features/orders/components/HistoricalGiftNote";
import { awardedGiftLines, giftUnitPrice } from "../utils/giftWithPurchase";
import type { PromotionSnapshotV1 } from "../types/promotions";

const select = vi.hoisted(() => vi.fn());

vi.mock("../hooks/useGiftChoice", () => ({
  useGiftChoice: () => ({
    select: { mutateAsync: select, isPending: false },
    cartId: "cart-1",
  }),
}));

function snapshot(partial: Partial<PromotionSnapshotV1>): PromotionSnapshotV1 {
  return {
    v: 1,
    computedAt: null,
    context: { brandCode: null, zoneCode: "UAE", currencyCode: "AED", salesChannelCode: null },
    applied: [
      {
        kind: "AUTOMATIC",
        code: "EID_AUTO10",
        label: "Eid 10%",
        discountType: "PERCENTAGE",
        discountValue: "10",
        level: "ORDER",
        amount: "50.00",
      },
    ],
    lineAllocations: [],
    totals: { discountTotal: "50.00", amountPayable: "450.00" },
    rejected: [],
    ...partial,
  };
}

afterEach(() => {
  cleanup();
  select.mockReset();
  useCartStore.setState({ promotions: null, cartId: "cart-1", totals: null });
});

describe("gift with purchase", () => {
  it("renders an automatic gift", () => {
    render(
      <GiftWithPurchase
        currency="AED"
        snapshot={snapshot({
          gifts: [
            {
              type: "GIFT_WITH_PURCHASE",
              promotionCode: "GWP1",
              status: null,
              message: null,
              giftItems: [{ sku: "OUD-SAMPLE", quantity: 1, name: "Arabian Oud Sample", imageUrl: null }],
              choices: [],
            },
          ],
        })}
      />,
    );
    expect(screen.getByText("Free gift added")).toBeInTheDocument();
    expect(screen.getByText("Arabian Oud Sample ×1")).toBeInTheDocument();
  });

  it("renders customer choice and sends the selected sku", async () => {
    const user = userEvent.setup();
    select.mockResolvedValue(undefined);
    render(
      <GiftWithPurchase
        snapshot={snapshot({
          gifts: [
            {
              type: "CUSTOMER_CHOICE",
              promotionCode: "GWP-CHOICE",
              status: null,
              message: null,
              giftItems: [],
              choices: [
                { sku: "SAMPLE-A", quantity: 1, name: "Rose Sample", imageUrl: "/rose.jpg" },
              ],
            },
          ],
        })}
      />,
    );
    expect(screen.getByText("Choose your free gift")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Rose Sample" })).toHaveAttribute("src", "/rose.jpg");
    expect(screen.getByText("SAMPLE-A")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Select" }));
    expect(select).toHaveBeenCalledWith({ sku: "SAMPLE-A", promotionCode: "GWP-CHOICE" });
  });

  it("prices the gift at zero and leaves discount totals unchanged", () => {
    const promo = snapshot({
      gifts: [
        {
          type: "GIFT_WITH_PURCHASE",
          promotionCode: "GWP1",
          status: null,
          message: null,
          giftItems: [{ sku: "SAMPLE", quantity: 1, name: "Sample Perfume", imageUrl: null }],
          choices: [],
        },
      ],
    });
    expect(giftUnitPrice()).toBe(0);
    expect(awardedGiftLines(promo)).toHaveLength(1);
    render(
      <>
        <AppliedCampaigns snapshot={promo} />
        <MoneySummary
          className="cart-totals"
          currency="AED"
          subtotal={500}
          discount={50}
          shipping={0}
          shippingDiscount={0}
          total={450}
          freeGifts={awardedGiftLines(promo).map((gift) => ({
            name: gift.name ?? gift.sku,
            quantity: gift.quantity,
          }))}
        />
      </>,
    );
    expect(screen.getAllByText("−AED 50.00").length).toBeGreaterThan(0);
    expect(screen.getByText("Discount")).toBeInTheDocument();
    expect(screen.getByText("Eid 10%")).toBeInTheDocument();
    expect(screen.getByText(/Sample Perfume/)).toBeInTheDocument();
    expect(screen.getByText(/AED 0\.00/)).toBeInTheDocument();
    expect(screen.getByText("AED 500.00")).toBeInTheDocument();
    expect(screen.getByText("AED 450.00")).toBeInTheDocument();
  });

  it("keeps the gift on the checkout snapshot", () => {
    const promo = snapshot({
      gifts: [
        {
          type: "GIFT_WITH_PURCHASE",
          promotionCode: "GWP1",
          status: null,
          message: null,
          giftItems: [{ sku: "SAMPLE", quantity: 1, name: "Arabian Oud Sample", imageUrl: null }],
          choices: [],
        },
      ],
    });
    render(<GiftWithPurchase snapshot={promo} selectable={false} />);
    expect(screen.getByText("Arabian Oud Sample ×1")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Select" })).not.toBeInTheDocument();
  });

  it("shows a removed gift instead of adding it", () => {
    render(
      <GiftWithPurchase
        snapshot={snapshot({
          gifts: [
            {
              type: "GIFT_WITH_PURCHASE",
              promotionCode: "GWP1",
              status: "REMOVED",
              message: null,
              giftItems: [{ sku: "SAMPLE", quantity: 1, name: "Arabian Oud Sample", imageUrl: null }],
              choices: [],
            },
          ],
        })}
      />,
    );
    expect(screen.getByText("This free gift was removed.")).toBeInTheDocument();
    expect(screen.queryByText("Free gift added")).not.toBeInTheDocument();
    expect(awardedGiftLines(snapshot({
      gifts: [
        {
          type: "GIFT_WITH_PURCHASE",
          promotionCode: "GWP1",
          status: "REMOVED",
          message: null,
          giftItems: [{ sku: "SAMPLE", quantity: 1, name: "Arabian Oud Sample", imageUrl: null }],
          choices: [],
        },
      ],
    }))).toHaveLength(0);
  });

  it("shows a stored gift on a historical order without changing the discount", () => {
    render(
      <HistoricalGiftNote
        className="note"
        snapshot={{
          v: 1,
          gifts: [
            {
              type: "GIFT_WITH_PURCHASE",
              giftItems: [{ sku: "SAMPLE", quantity: 1, name: "Arabian Oud Sample" }],
            },
          ],
          totals: { discountTotal: "50.00" },
        }}
      />,
    );
    expect(screen.getByText("Free gift included")).toBeInTheDocument();
  });
});
