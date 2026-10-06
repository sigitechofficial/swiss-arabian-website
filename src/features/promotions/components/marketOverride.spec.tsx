import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HistoricalGiftNote } from "@/features/orders/components/HistoricalGiftNote";
import { useCartStore } from "@/stores/useCartStore";
import { AppliedCampaigns } from "../components/AppliedCampaigns";
import { GiftChoiceHost } from "../components/GiftChoiceHost";
import { GiftWithPurchase } from "../components/GiftWithPurchase";
import { useGiftChoiceStore } from "../giftChoiceStore";
import { MoneySummary } from "../components/MoneySummary";
import {
  amountPayableFrom,
  appliedPromotionView,
  checkoutQuoteSnapshot,
  readGiftAwards,
  shippingDiscountAmount,
  type PromotionApplied,
  type PromotionSnapshotV1,
} from "../types/promotions";
import { offerQualificationMessage } from "../utils/qualificationCopy";

vi.mock("next/navigation", () => ({
  usePathname: () => "/cart",
}));

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

function row(partial: Partial<PromotionApplied> & Pick<PromotionApplied, "amount">): PromotionApplied {
  return {
    kind: "AUTOMATIC",
    code: "PROMO",
    label: null,
    discountType: "PERCENTAGE",
    discountValue: "20",
    level: "ORDER",
    ...partial,
  };
}

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  useGiftChoiceStore.setState({ openCode: null, celebrate: false, flashing: false });
  useCartStore.setState({ lines: [], promotions: null, totals: null, cartId: "cart-1" });
});

describe("effective market quote", () => {
  it("shows the UAE applied benefit and ignores a higher base discount value", () => {
    const item = row({ label: "20% off", discountValue: "20", amount: "40.00" });
    render(<AppliedCampaigns snapshot={quote({ applied: [item], context: { brandCode: null, zoneCode: "UAE", currencyCode: "AED", salesChannelCode: null } })} />);
    expect(screen.getByText("20% off")).toBeInTheDocument();
    expect(appliedPromotionView(item).amount).toBe(40);
    expect(screen.queryByText("15% off")).not.toBeInTheDocument();
  });

  it("shows the KSA overridden benefit instead of the campaign default", () => {
    const item = row({ label: "15% off", discountValue: "20", amount: "30.00" });
    render(<AppliedCampaigns snapshot={quote({ applied: [item], context: { brandCode: null, zoneCode: "KSA", currencyCode: "SAR", salesChannelCode: null } })} />);
    expect(screen.getByText("15% off")).toBeInTheDocument();
    expect(screen.getByText("−SAR 30.00")).toBeInTheDocument();
    expect(screen.queryByText(/20%/)).not.toBeInTheDocument();
  });

  it("does not show a UAE-only product as discounted on a KSA quote", () => {
    const ksa = quote({ applied: [], context: { brandCode: null, zoneCode: "KSA", currencyCode: "SAR", salesChannelCode: null } });
    render(<AppliedCampaigns snapshot={ksa} />);
    expect(screen.queryByRole("list", { name: "Applied offers" })).not.toBeInTheDocument();
    expect(
      offerQualificationMessage(
        { qualification: { status: "INELIGIBLE" }, rejected: { reason: "REQUIRED_PRODUCT_MISSING" } },
        "SAR",
      ),
    ).toBe("Add the required item to use this offer.");
  });

  it("renders collection eligibility from the server status only", () => {
    expect(
      offerQualificationMessage(
        { qualification: { status: "ELIGIBLE" }, title: "Four collections" },
        "SAR",
      ),
    ).toBeNull();
    expect(
      offerQualificationMessage(
        {
          qualification: { status: "PENDING", pendingReason: "SHIPPING_METHOD_REQUIRED" },
          title: "Four collections",
        },
        "SAR",
      ),
    ).toBe("Select an eligible delivery method at checkout to use this offer.");
  });

  it("renders an all-products override from the applied row", () => {
    render(
      <AppliedCampaigns
        snapshot={quote({
          applied: [row({ code: "ALL", label: "All products 15% off", amount: "15.00", discountValue: "20" })],
        })}
      />,
    );
    expect(screen.getByText("All products 15% off")).toBeInTheDocument();
    expect(screen.getByText("−AED 15.00")).toBeInTheDocument();
  });

  it("uses only the current quote giftOptions", () => {
    const ksa = readGiftAwards({
      gifts: [
        {
          type: "CUSTOMER_CHOICE",
          giftOptions: [
            { sku: "B", quantity: 1, name: "Gift B" },
            { sku: "D", quantity: 1, name: "Gift D" },
          ],
          choices: [
            { sku: "A", quantity: 1, name: "Gift A" },
            { sku: "B", quantity: 1, name: "Gift B" },
            { sku: "C", quantity: 1, name: "Gift C" },
          ],
        },
      ],
    });
    expect(ksa[0]?.choices.map((gift) => gift.sku)).toEqual(["B", "D"]);
    const snap = quote({ gifts: ksa });
    useCartStore.setState({ promotions: snap, cartId: "cart-1" });
    render(
      <>
        <GiftWithPurchase snapshot={snap} />
        <GiftChoiceHost />
      </>,
    );
    expect(screen.getByText("Gift B")).toBeInTheDocument();
    expect(screen.getByText("Gift D")).toBeInTheDocument();
    expect(screen.queryByText("Gift A")).not.toBeInTheDocument();
    expect(screen.queryByText("Gift C")).not.toBeInTheDocument();
  });

  it("shows a removed gift from the new quote instead of the previous selection", () => {
    render(
      <GiftWithPurchase
        snapshot={quote({
          gifts: [
            {
              type: "GIFT_WITH_PURCHASE",
              promotionCode: "GWP",
              status: "REMOVED",
              message: null,
              giftItems: [{ sku: "A", quantity: 1, name: "Gift A", imageUrl: null }],
              choices: [],
            },
          ],
        })}
      />,
    );
    expect(screen.getByText("This free gift was removed.")).toBeInTheDocument();
    expect(screen.queryByText("Free gift added")).not.toBeInTheDocument();
  });

  it("renders BXGY from the applied server amount", () => {
    const item = row({
      code: "BXGY",
      label: "Buy 2 get 1",
      discountType: "BUY_X_GET_Y",
      discountValue: "3",
      amount: "25.00",
    });
    expect(appliedPromotionView(item).amount).toBe(25);
    render(<AppliedCampaigns snapshot={quote({ applied: [item] })} />);
    expect(screen.getByText("−AED 25.00")).toBeInTheDocument();
  });

  it("shows each market's server shipping discount", () => {
    const uae = quote({ totals: { discountTotal: "0", shippingDiscount: "50.00" } });
    const ksa = quote({ totals: { discountTotal: "0", shippingDiscount: "25.00" } });
    expect(shippingDiscountAmount(uae)).toBe(50);
    expect(shippingDiscountAmount(ksa)).toBe(25);
    render(
      <MoneySummary
        className="checkout-totals"
        currency="AED"
        subtotal={100}
        discount={0}
        shipping={50}
        shippingDiscount={shippingDiscountAmount(uae)}
        total={150}
        amountPayable={150}
      />,
    );
    expect(screen.getByText("Shipping discount").nextElementSibling).toHaveTextContent("−AED 50.00");
  });

  it("keeps cart totals and checkout payable on the server figures", () => {
    render(
      <MoneySummary
        className="checkout-totals"
        currency="AED"
        subtotal={200}
        discount={20}
        shipping={50}
        shippingDiscount={50}
        total={230}
        amountPayable={150}
      />,
    );
    expect(screen.getByText("Subtotal").nextElementSibling).toHaveTextContent("AED 200.00");
    expect(screen.getByText("Total").nextElementSibling).toHaveTextContent("AED 230.00");
    expect(screen.getByText("Amount due").nextElementSibling).toHaveTextContent("AED 150.00");
    const stale = quote({ totals: { discountTotal: "20", amountPayable: "99.00" } });
    expect(amountPayableFrom(checkoutQuoteSnapshot({ promotions: stale }, stale), ["150.00"])).toBe(150);
  });

  it("shows a stored historical gift without a live market quote", () => {
    render(
      <HistoricalGiftNote
        className="note"
        snapshot={{
          gifts: [{ type: "GIFT_WITH_PURCHASE", giftItems: [{ sku: "A", quantity: 1 }] }],
        }}
      />,
    );
    expect(screen.getByText("Free gift included")).toBeInTheDocument();
  });

  it("clears the previous market promotion presentation", () => {
    useCartStore.setState({
      lines: [{ variantId: "v1", slug: "rose", title: "Rose", unitPrice: 100, currency: "AED", quantity: 1 }],
      promotions: quote({
        applied: [row({ label: "20% off", amount: "20.00" })],
        totals: { discountTotal: "20.00", shippingDiscount: "50.00" },
        gifts: [
          {
            type: "CUSTOMER_CHOICE",
            promotionCode: null,
            status: null,
            message: null,
            giftItems: [],
            choices: [{ sku: "A", quantity: 1, name: "Gift A", imageUrl: null }],
          },
        ],
      }),
      totals: {
        subtotal: 100,
        total: 150,
        discount: 20,
        shipping: 50,
        tax: 0,
        amountPayable: 150,
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
});
