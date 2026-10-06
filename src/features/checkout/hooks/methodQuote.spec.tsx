import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCartStore } from "@/stores/useCartStore";
import type { CheckoutSessionResponse } from "../types/checkout";
import { useCheckout } from "./useCheckout";

const createCheckoutFromCart = vi.hoisted(() => vi.fn());
const selectDeliveryMethod = vi.hoisted(() => vi.fn());
const selectPaymentMethod = vi.hoisted(() => vi.fn());
const listDeliveryMethods = vi.hoisted(() => vi.fn());
const listPaymentMethods = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("../api/checkout.service", () => ({
  cancelCheckout: vi.fn(),
  createCheckoutFromCart,
  getCheckoutSession: vi.fn(),
  listDeliveryMethods,
  listPaymentMethods,
  selectDeliveryMethod,
  selectPaymentMethod,
  setCheckoutAddress: vi.fn(),
  validateCheckout: vi.fn(),
}));

function session(partial: Partial<CheckoutSessionResponse>): CheckoutSessionResponse {
  return {
    checkoutSessionId: "sess-1",
    status: "VALID",
    context: {
      zoneId: null,
      zoneCode: "UAE",
      legalEntityCode: "SA",
      salesChannelId: null,
      salesChannelCode: null,
      countryCode: "AE",
      currencyCode: "AED",
      languageCode: "en",
    },
    cartId: "cart-1",
    items: [{ cartItemId: "line-1", sku: "SKU", productId: null, variantId: null, quantity: "1", unitPriceEstimate: "100", lineSubtotalEstimate: "100" }],
    priceSnapshots: [],
    inventorySnapshots: [],
    selectedPaymentMethod: null,
    selectedDeliveryMethod: null,
    validationIssues: [],
    totalsEstimate: { subtotal: "100.00", discount: "0.00", shipping: "25.00", tax: "0.00", total: "125.00" },
    currency: "AED",
    expiresAt: null,
    validation: { isValid: false, status: "DRAFT" },
    promotionSnapshot: {
      v: 1,
      computedAt: null,
      context: { brandCode: null, zoneCode: "UAE", currencyCode: "AED", salesChannelCode: null },
      applied: [],
      lineAllocations: [],
      totals: { discountTotal: "0.00", shippingDiscount: "0.00" },
      rejected: [],
    },
    ...partial,
  };
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  localStorage.clear();
  createCheckoutFromCart.mockReset();
  selectDeliveryMethod.mockReset();
  selectPaymentMethod.mockReset();
  listDeliveryMethods.mockReset();
  listPaymentMethods.mockReset();
  useCartStore.setState({
    cartId: "cart-1",
    lines: [
      {
        cartItemId: "line-1",
        variantId: "v1",
        slug: "oud",
        title: "Oud",
        unitPrice: 100,
        currency: "AED",
        quantity: 1,
      },
    ],
    totals: {
      subtotal: 100,
      total: 125,
      discount: 0,
      shipping: 25,
      tax: 0,
      amountPayable: null,
      currency: "AED",
      itemCount: 1,
      totalQty: 1,
    },
    promotions: null,
  });
  listDeliveryMethods.mockResolvedValue([
    {
      zoneDeliveryMethodId: "zd-1",
      deliveryMethodId: "del-1",
      partnerCode: "aramex",
      methodCode: "standard",
      displayName: "Standard",
      isDefault: true,
      estimatedFee: "25.00",
    },
    {
      zoneDeliveryMethodId: "zd-2",
      deliveryMethodId: "del-2",
      partnerCode: "aramex",
      methodCode: "express",
      displayName: "Express",
      isDefault: false,
      estimatedFee: "40.00",
    },
  ]);
  listPaymentMethods.mockResolvedValue([
    {
      zonePaymentMethodId: "zp-1",
      paymentMethodId: "pay-1",
      providerCode: "stripe",
      methodCode: "card",
      displayName: "Card",
      isDefault: true,
    },
    {
      zonePaymentMethodId: "zp-2",
      paymentMethodId: "pay-2",
      providerCode: "cod",
      methodCode: "cod",
      displayName: "Cash",
      isDefault: false,
    },
  ]);
});

describe("checkout method re-quote", () => {
  it("replaces the checkout quote when the payment method changes", async () => {
    const initial = session({});
    const requoted = session({
      totalsEstimate: { subtotal: "100.00", discount: "15.00", shipping: "25.00", tax: "0.00", total: "110.00" },
      promotionSnapshot: {
        v: 1,
        computedAt: null,
        context: { brandCode: null, zoneCode: "UAE", currencyCode: "AED", salesChannelCode: null },
        applied: [
          {
            kind: "AUTOMATIC",
            code: "CARD15",
            label: "Card offer",
            discountType: "PERCENTAGE",
            discountValue: "15",
            level: "ORDER",
            amount: "15.00",
          },
        ],
        lineAllocations: [],
        totals: { discountTotal: "15.00", shippingDiscount: "0.00" },
        rejected: [],
      },
    });
    createCheckoutFromCart.mockResolvedValue(initial);
    selectDeliveryMethod.mockResolvedValue(initial);
    selectPaymentMethod.mockImplementation(async (_id: string, paymentMethodId: string) =>
      paymentMethodId === "pay-2" ? requoted : initial,
    );

    const { result } = renderHook(() => useCheckout(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await result.current.choosePayment("zp-2");

    await waitFor(() => {
      expect(result.current.session?.totalsEstimate.discount).toBe("15.00");
    });
    expect(selectPaymentMethod).toHaveBeenCalledWith("sess-1", "pay-2");
    expect(result.current.session?.promotionSnapshot?.applied[0]?.label).toBe("Card offer");
    expect(result.current.session?.promotionSnapshot?.totals.discountTotal).toBe("15.00");
    expect(result.current.session).toBe(requoted);
  });

  it("replaces the checkout quote when the delivery method changes", async () => {
    const initial = session({});
    const requoted = session({
      totalsEstimate: { subtotal: "100.00", discount: "0.00", shipping: "0.00", tax: "0.00", total: "100.00" },
      promotionSnapshot: {
        v: 1,
        computedAt: null,
        context: { brandCode: null, zoneCode: "UAE", currencyCode: "AED", salesChannelCode: null },
        applied: [
          {
            kind: "FREE_SHIPPING",
            code: "SHIP",
            label: "Free shipping",
            discountType: "FREE_SHIPPING",
            discountValue: null,
            level: "SHIPPING",
            amount: "0",
          },
        ],
        lineAllocations: [],
        totals: { discountTotal: "0.00", shippingDiscount: "25.00" },
        rejected: [],
      },
    });
    createCheckoutFromCart.mockResolvedValue(initial);
    selectPaymentMethod.mockResolvedValue(initial);
    selectDeliveryMethod.mockImplementation(async (_id: string, deliveryMethodId: string) =>
      deliveryMethodId === "del-2" ? requoted : initial,
    );

    const { result } = renderHook(() => useCheckout(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await result.current.chooseDelivery("zd-2");

    await waitFor(() => {
      expect(result.current.session?.promotionSnapshot?.totals.shippingDiscount).toBe("25.00");
    });
    expect(selectDeliveryMethod).toHaveBeenCalledWith("sess-1", "del-2");
    expect(result.current.session?.totalsEstimate.shipping).toBe("0.00");
    expect(result.current.session).toBe(requoted);
  });

  it("drops an applied method offer when the server snapshot no longer includes it", async () => {
    const applied = session({
      totalsEstimate: { subtotal: "100.00", discount: "15.00", shipping: "25.00", tax: "0.00", total: "110.00" },
      promotionSnapshot: {
        v: 1,
        computedAt: null,
        context: { brandCode: null, zoneCode: "UAE", currencyCode: "AED", salesChannelCode: null },
        applied: [
          {
            kind: "AUTOMATIC",
            code: "CARD15",
            label: "Card offer",
            discountType: "PERCENTAGE",
            discountValue: "15",
            level: "ORDER",
            amount: "15.00",
          },
        ],
        lineAllocations: [],
        totals: { discountTotal: "15.00", shippingDiscount: "0.00" },
        rejected: [],
      },
    });
    const removed = session({
      totalsEstimate: { subtotal: "100.00", discount: "0.00", shipping: "25.00", tax: "0.00", total: "125.00" },
    });
    createCheckoutFromCart.mockResolvedValue(applied);
    selectDeliveryMethod.mockResolvedValue(applied);
    selectPaymentMethod.mockImplementation(async (_id: string, paymentMethodId: string) =>
      paymentMethodId === "pay-2" ? removed : applied,
    );

    const { result } = renderHook(() => useCheckout(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.session?.promotionSnapshot?.applied).toHaveLength(1);

    await result.current.choosePayment("zp-2");
    await waitFor(() => {
      expect(result.current.session?.totalsEstimate.discount).toBe("0.00");
    });
    expect(result.current.session?.promotionSnapshot?.applied).toEqual([]);
    expect(result.current.session).toBe(removed);
  });
});
