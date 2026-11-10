import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCartStore, type CartLine } from "@/stores/useCartStore";
import type { CheckoutSessionResponse } from "../types/checkout";
import { checkoutScopeKey, useCheckout } from "./useCheckout";

/**
 * Switching market on the checkout page: the bag store clears / reloads while it
 * still holds the old cart id. The checkout must wait, then start exactly one
 * session for the new market's bag (it used to rebuild in a loop).
 */

const createCheckoutFromCart = vi.hoisted(() => vi.fn());
const cancelCheckout = vi.hoisted(() => vi.fn());
const market = vi.hoisted(() => ({ zoneCode: "UAE" }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/providers/MarketProvider", () => ({
  useOptionalMarket: () => ({ catalogContext: { zoneCode: market.zoneCode } }),
}));
vi.mock("@/features/cart/api/cart.service", () => ({
  getActiveCart: vi.fn().mockRejectedValue(new Error("not needed")),
}));
vi.mock("../api/checkout.service", () => ({
  cancelCheckout,
  createCheckoutFromCart,
  getCheckoutSession: vi.fn().mockRejectedValue(new Error("none")),
  listDeliveryMethods: vi.fn().mockResolvedValue([]),
  listPaymentMethods: vi.fn().mockResolvedValue([]),
  selectDeliveryMethod: vi.fn(),
  selectPaymentMethod: vi.fn(),
  setCheckoutAddress: vi.fn(),
  validateCheckout: vi.fn(),
}));

const line = (id: string, currency: string): CartLine => ({
  cartItemId: id,
  variantId: `v-${id}`,
  slug: "oud",
  title: "Oud",
  unitPrice: 100,
  currency,
  quantity: 1,
});

function sessionFor(cartId: string, lineId: string, zoneCode: string): CheckoutSessionResponse {
  return {
    checkoutSessionId: `sess-${cartId}`,
    status: "VALID",
    context: {
      zoneId: null,
      zoneCode,
      legalEntityCode: "SA",
      salesChannelId: null,
      salesChannelCode: null,
      countryCode: "AE",
      currencyCode: "AED",
      languageCode: "en",
    },
    cartId,
    items: [{ cartItemId: lineId, sku: "SKU", productId: null, variantId: null, quantity: "1", unitPriceEstimate: "100", lineSubtotalEstimate: "100" }],
    priceSnapshots: [],
    inventorySnapshots: [],
    selectedPaymentMethod: null,
    selectedDeliveryMethod: null,
    validationIssues: [],
    totalsEstimate: { subtotal: "100.00", discount: "0.00", shipping: "0.00", tax: "0.00", total: "100.00" },
    currency: "AED",
    expiresAt: null,
    validation: { isValid: false, status: "DRAFT" },
    promotionSnapshot: {
      v: 1,
      computedAt: null,
      context: { brandCode: null, zoneCode, currencyCode: "AED", salesChannelCode: null },
      applied: [],
      lineAllocations: [],
      totals: { discountTotal: "0.00", shippingDiscount: "0.00" },
      rejected: [],
    },
  };
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  localStorage.clear();
  market.zoneCode = "UAE";
  createCheckoutFromCart.mockReset();
  cancelCheckout.mockReset();
  createCheckoutFromCart.mockImplementation(async ({ cartId }: { cartId: string }) =>
    cartId === "cart-uae"
      ? sessionFor("cart-uae", "line-uae", "UAE")
      : sessionFor("cart-qtr", "line-qtr", "QTR"),
  );
  useCartStore.setState({
    cartId: "cart-uae",
    lines: [line("line-uae", "AED")],
    totals: null,
    promotions: null,
    syncing: false,
  });
});

/** What MarketProvider does on a switch: new market, bag syncing, then the new bag. */
async function switchMarket(next: { zoneCode: string; cartId: string; lines: CartLine[] }) {
  await act(async () => {
    market.zoneCode = next.zoneCode;
    useCartStore.setState({ syncing: true, lines: [] });
  });
  await act(async () => {
    useCartStore.setState({ cartId: next.cartId, lines: next.lines, syncing: false });
  });
}

describe("checkout market switch", () => {
  it("starts exactly one session for the new market's bag and does not cancel the old one", async () => {
    const { result } = renderHook(() => useCheckout(), { wrapper });
    await waitFor(() => expect(result.current.session?.cartId).toBe("cart-uae"));
    expect(createCheckoutFromCart).toHaveBeenCalledTimes(1);

    await switchMarket({ zoneCode: "QTR", cartId: "cart-qtr", lines: [line("line-qtr", "QAR")] });

    await waitFor(() => expect(result.current.session?.cartId).toBe("cart-qtr"));
    // Give any follow-up effects a chance to (wrongly) fire again.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(createCheckoutFromCart).toHaveBeenCalledTimes(2);
    expect(createCheckoutFromCart).toHaveBeenLastCalledWith({ cartId: "cart-qtr" });
    // The UAE session stays on the server: switching back resumes it.
    expect(cancelCheckout).not.toHaveBeenCalled();
  });

  it("starts nothing when the new market's bag is empty", async () => {
    const { result } = renderHook(() => useCheckout(), { wrapper });
    await waitFor(() => expect(result.current.session?.cartId).toBe("cart-uae"));

    await switchMarket({ zoneCode: "QTR", cartId: "cart-qtr", lines: [] });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(createCheckoutFromCart).toHaveBeenCalledTimes(1);
    expect(cancelCheckout).not.toHaveBeenCalled();
    expect(result.current.session).toBeNull();
  });
});

describe("checkoutScopeKey", () => {
  it("is the market and the cart", () => {
    expect(checkoutScopeKey("qtr", "cart-1")).toBe("QTR|cart-1");
    expect(checkoutScopeKey("UAE", null)).toBeNull();
  });
});
