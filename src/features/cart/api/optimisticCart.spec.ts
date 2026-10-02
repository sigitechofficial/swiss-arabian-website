import { describe, expect, it } from "vitest";
import type { ApiCart } from "../types/cart";
import { runQueuedCart } from "./optimisticCart";
import { useCartStore } from "@/stores/useCartStore";
import type { PromotionSnapshotV1 } from "@/features/promotions/types/promotions";

function promo(label: string, amount: string): PromotionSnapshotV1 {
  return {
    v: 1,
    computedAt: null,
    context: { brandCode: null, zoneCode: "UAE", currencyCode: "AED", salesChannelCode: null },
    applied: [
      {
        kind: "AUTOMATIC",
        code: label,
        label,
        discountType: "FIXED_AMOUNT",
        discountValue: null,
        level: "ORDER",
        amount,
      },
    ],
    lineAllocations: [],
    totals: { discountTotal: amount, shippingDiscount: "0.00" },
    rejected: [],
  };
}

function cart(id: string, discount: string, promotions: PromotionSnapshotV1 | null): ApiCart {
  return {
    cartId: "cart-1",
    status: "ACTIVE",
    context: {
      zoneId: "z",
      zoneCode: "UAE",
      legalEntityCode: "LE",
      currencyCode: "AED",
    },
    items: [
      {
        cartItemId: "line-1",
        productId: "p",
        variantId: "v",
        sku: "SKU",
        productName: "Oud",
        variantName: null,
        quantity: "2",
        unitPriceEstimate: "100.00",
        lineSubtotalEstimate: "200.00",
        currencyCode: "AED",
        sellabilitySummary: {
          isSellable: true,
          hasValidPrice: true,
          hasAvailableInventory: true,
          blockReasons: [],
        },
        warnings: [],
      },
    ],
    itemCount: 1,
    totalQuantity: "2",
    subtotalEstimate: "200.00",
    discountEstimate: discount,
    taxEstimate: "0.00",
    shippingEstimate: "25.00",
    totalEstimate: "225.00",
    amountPayable: "225.00",
    currency: "AED",
    promotions,
    validation: null,
    updatedAt: "2026-09-29T00:00:00.000Z",
    metadata: { quote: id },
  };
}

describe("queued cart commercial state", () => {
  it("replaces lines, totals, and promotions together from the latest server cart", async () => {
    useCartStore.setState({
      promotions: promo("stale", "99.00"),
      totals: {
        subtotal: 1,
        total: 1,
        discount: 99,
        shipping: 0,
        tax: 0,
        amountPayable: 1,
        currency: "AED",
        itemCount: 1,
        totalQty: 1,
      },
    });

    let releaseFirst: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const first = runQueuedCart(async () => {
      await gate;
      return cart("first", "10.00", promo("First", "10.00"));
    });
    const second = runQueuedCart(async () => cart("second", "20.00", promo("Second", "20.00")));
    releaseFirst();
    await first;
    await second;

    const state = useCartStore.getState();
    expect(state.promotions?.applied[0]?.label).toBe("Second");
    expect(state.totals?.discount).toBe(20);
    expect(state.totals?.subtotal).toBe(200);
    expect(state.lines[0]?.quantity).toBe(2);
  });

  it("keeps the current cart when a later coupon quote fails", async () => {
    await runQueuedCart(async () => cart("kept", "15.00", promo("Kept", "15.00")));
    await expect(
      runQueuedCart(async () => {
        throw new Error("COUPON_NOT_APPLICABLE");
      }),
    ).rejects.toThrow("COUPON_NOT_APPLICABLE");
    expect(useCartStore.getState().promotions?.applied[0]?.label).toBe("Kept");
    expect(useCartStore.getState().totals?.discount).toBe(15);
  });
});
