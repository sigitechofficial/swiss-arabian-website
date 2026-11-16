import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ apiGet: vi.fn(), apiPost: vi.fn() }));
const cart = vi.hoisted(() => ({ addCartItems: vi.fn() }));
const ui = vi.hoisted(() => ({ setCartOpen: vi.fn(), zone: "SAPIL_UAE" }));

vi.mock("next/navigation", () => ({ usePathname: () => "/offers/TRIO" }));
vi.mock("@/lib/api/apiClient", () => api);
vi.mock("@/features/cart/api/cart.service", () => ({
  addCartItems: cart.addCartItems,
  storefrontCartQuery: () => new URLSearchParams("zoneCode=SAPIL_UAE"),
}));
vi.mock("@/features/markets/hooks/useMarketCurrency", () => ({ useMarketCurrency: () => "AED" }));
vi.mock("../utils/promotionAnalytics", () => ({ trackPromotion: vi.fn() }));
vi.mock("../utils/emptyBagMemory", () => ({ rememberEmptyOrigin: vi.fn() }));
vi.mock("@/stores/useUiStore", () => ({
  useUiStore: (pick: (s: unknown) => unknown) =>
    pick({ setCartOpen: ui.setCartOpen, catalogContext: ui.zone ? { zoneCode: ui.zone } : null }),
}));
vi.mock("@/stores/useCartStore", () => ({
  useCartStore: (pick: (s: unknown) => unknown) => pick({ setCartFromApi: vi.fn(), cartId: "c1" }),
}));

import { useOfferShop } from "./useOfferShop";

const product = (sku: string, inStock = true) => ({
  productId: sku,
  variantId: null,
  sku,
  slug: sku.toLowerCase(),
  title: sku,
  image: null,
  price: "AED 50",
  amount: "50",
  inStock,
});
const payload = {
  available: true,
  offer: { campaignId: "c", campaignCode: "TRIO", mechanic: "SET_BUNDLE", marketCode: "SAPIL_UAE", badge: "Save 20%" },
  groups: [
    { id: "g1", name: "Her", requiredQuantity: 1, selectionMode: "replace", products: [product("A"), product("B", false)] },
    { id: "g2", name: "Him", requiredQuantity: 1, selectionMode: "replace", products: [product("C")] },
  ],
  copy: { add: "Add", choose: "Choose", remove: "Remove", replace: "Replace", tray: "Tray", before: "", saving: "", total: "", search: "" },
};

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  sessionStorage.clear();
  ui.zone = "SAPIL_UAE";
  api.apiGet.mockReset();
  api.apiPost.mockReset();
  cart.addCartItems.mockReset();
  ui.setCartOpen.mockReset();
});

describe("useOfferShop", () => {
  it("waits for the market, then loads the offer", async () => {
    ui.zone = "";
    const { result } = renderHook(() => useOfferShop("TRIO"), { wrapper });
    expect(result.current.status).toBe("loading");
    expect(api.apiGet).not.toHaveBeenCalled();
  });

  it("is 'missing' when the offer does not run in the market", async () => {
    api.apiGet.mockResolvedValue({ available: false });
    const { result } = renderHook(() => useOfferShop("TRIO"), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("missing"));
  });

  it("builds the bundle, previews the price and adds every pick to the bag", async () => {
    api.apiGet.mockResolvedValue(payload);
    api.apiPost.mockResolvedValue({
      yourTotal: "AED 80",
      beforeSavings: "AED 100",
      subtotalAmount: "100",
      savingsAmount: "20",
      totalAmount: "80",
      message: "Ready",
      readyToAdd: true,
      unavailable: [],
    });
    cart.addCartItems.mockResolvedValue({ id: "c1" });
    const { result } = renderHook(() => useOfferShop("TRIO"), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("ready"));
    const [g1, g2] = result.current.shop!.groups;

    // Out of stock is never picked.
    act(() => result.current.choose(g1, g1.products[1]));
    expect(result.current.selections).toEqual([]);

    act(() => result.current.choose(g1, g1.products[0]));
    expect(result.current.activeId).toBe("g2");
    act(() => result.current.choose(g2, g2.products[0]));
    expect(result.current.unfilled).toEqual([]);

    await waitFor(() => expect(result.current.total).toBe(80));
    expect(result.current.subtotal).toBe(100);
    expect(result.current.savings).toBe(20);
    expect(result.current.ready).toBe(true);
    // Picks are kept for the session (per offer and market).
    expect(JSON.parse(sessionStorage.getItem("swiss-offer:SAPIL_UAE:TRIO") || "[]")).toHaveLength(2);

    await act(async () => {
      await result.current.addSelected();
    });
    expect(cart.addCartItems).toHaveBeenCalledWith(
      [
        { sku: "A", quantity: 1 },
        { sku: "C", quantity: 1 },
      ],
      "c1",
    );
    expect(ui.setCartOpen).toHaveBeenCalledWith(true);
    expect(result.current.addFailed).toBe(false);
  });

  it("reports a failed add", async () => {
    api.apiGet.mockResolvedValue(payload);
    api.apiPost.mockResolvedValue({ yourTotal: "x", beforeSavings: "x", message: "", readyToAdd: true, unavailable: [] });
    cart.addCartItems.mockRejectedValue(new Error("no"));
    const { result } = renderHook(() => useOfferShop("TRIO"), { wrapper });
    await waitFor(() => expect(result.current.status).toBe("ready"));
    const [g1, g2] = result.current.shop!.groups;
    act(() => result.current.choose(g1, g1.products[0]));
    act(() => result.current.choose(g2, g2.products[0]));
    await waitFor(() => expect(result.current.ready).toBe(true));
    await act(async () => {
      await result.current.addSelected();
    });
    expect(result.current.addFailed).toBe(true);
  });
});
