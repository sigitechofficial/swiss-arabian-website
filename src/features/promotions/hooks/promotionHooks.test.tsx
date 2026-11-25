import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCartStore } from "@/stores/useCartStore";
import { useUiStore } from "@/stores/useUiStore";

const api = vi.hoisted(() => ({
  fetchProductCompanions: vi.fn(),
  previewProductCompanions: vi.fn(),
  fetchEmptyBag: vi.fn(),
  addCartItem: vi.fn(),
  addCartItems: vi.fn(),
  trackPromotion: vi.fn(),
  toast: vi.fn(),
  applicable: { data: undefined as unknown },
  viewed: [] as string[],
}));
vi.mock("../api/promotions.service", () => ({
  fetchProductCompanions: api.fetchProductCompanions,
  previewProductCompanions: api.previewProductCompanions,
  fetchEmptyBag: api.fetchEmptyBag,
}));
vi.mock("@/features/cart/api/cart.service", () => ({ addCartItem: api.addCartItem, addCartItems: api.addCartItems }));
vi.mock("../utils/promotionAnalytics", () => ({ trackPromotion: api.trackPromotion }));
vi.mock("@/components/ui/Toaster", () => ({ toast: api.toast }));
vi.mock("./useApplicablePromotions", () => ({ useApplicablePromotions: () => api.applicable }));
vi.mock("../utils/emptyBagMemory", () => ({ readViewed: () => api.viewed, readEmptyOrigin: () => "SUMMER" }));
vi.mock("@/hooks/useHydrated", () => ({ useHydrated: () => true }));

import { companionAmount, useProductCompanions } from "./useProductCompanions";
import { railHeading, useEmptyBagRecovery } from "./useEmptyBagRecovery";
import { usePromotionProgressTracking } from "./usePromotionProgressTracking";
import { usePromotionQuickAdd } from "./usePromotionQuickAdd";
import { useRecentlyViewedProducts } from "./useRecentlyViewedProducts";

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>;
}

const product = (sku: string, over = {}) => ({
  productId: `id-${sku}`,
  sku,
  slug: sku.toLowerCase(),
  title: sku,
  image: null,
  price: "AED 50",
  amount: "50",
  inStock: true,
  ...over,
});

beforeEach(() => {
  for (const fn of Object.values(api)) if (typeof fn === "function") fn.mockReset();
  api.applicable = { data: undefined };
  api.viewed = [];
  useCartStore.setState({ cartId: "cart-1" });
  useUiStore.setState({ cartOpen: false, catalogContext: { zoneCode: "AE", currencyCode: "AED" } as never });
});

describe("companionAmount", () => {
  it("reads money text and rejects what isn't a number", () => {
    expect(companionAmount("AED 1,250.50")).toBe(1250.5);
    expect(companionAmount(null)).toBeNull();
  });
});

describe("useProductCompanions", () => {
  const companions = {
    current: product("CUR"),
    groups: [{ id: "bundle", heading: "Often bought together", seeAllPath: null, products: [product("B1"), product("OUT", { inStock: false })] }],
    copy: {},
  };

  it("pre-selects the product, prices the selection, and adds it to the bag", async () => {
    api.fetchProductCompanions.mockResolvedValue(companions);
    api.previewProductCompanions.mockResolvedValue({ beforeSavings: "100", promotionSaving: "10", yourTotal: "90", message: null, readyToAdd: true });
    api.addCartItems.mockResolvedValue({ id: "cart-1" });
    const setCartFromApi = vi.fn();
    useCartStore.setState({ setCartFromApi } as never);
    const { result } = renderHook(() => useProductCompanions({ productId: "p1", marketCode: "AE" }), { wrapper });
    await waitFor(() => expect(result.current.selected).toEqual(["CUR"]));
    act(() => result.current.toggle("B1"));
    act(() => result.current.toggle("OUT")); // out of stock: not selectable
    expect(result.current.selected).toEqual(["CUR", "B1"]);
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current).toMatchObject({ subtotal: 100, total: 90, discount: 10 });
    act(() => result.current.addSelected());
    await waitFor(() => expect(useUiStore.getState().cartOpen).toBe(true));
    expect(api.addCartItems).toHaveBeenCalledWith([{ sku: "CUR", quantity: 1 }, { sku: "B1", quantity: 1 }], "cart-1");
  });

  it("says so when the price can't be worked out, and keeps Add off", async () => {
    api.fetchProductCompanions.mockResolvedValue(companions);
    api.previewProductCompanions.mockRejectedValue(new Error("down"));
    const { result } = renderHook(() => useProductCompanions({ productId: "p1" }), { wrapper });
    await waitFor(() => expect(result.current.message).toMatch(/couldn.t work out this price/i));
    expect(result.current.ready).toBe(false);
  });

  it("tells the shopper when adding fails", async () => {
    api.fetchProductCompanions.mockResolvedValue(companions);
    api.previewProductCompanions.mockResolvedValue({ beforeSavings: "50", promotionSaving: null, yourTotal: "50", message: null, readyToAdd: true });
    api.addCartItems.mockRejectedValue(new Error("down"));
    const { result } = renderHook(() => useProductCompanions({ productId: "p1" }), { wrapper });
    await waitFor(() => expect(result.current.ready).toBe(true));
    act(() => result.current.addSelected());
    await waitFor(() => expect(api.toast).toHaveBeenCalledWith(expect.stringMatching(/couldn.t add/i), "error"));
    expect(result.current.busy).toBe(false);
  });
});

describe("usePromotionQuickAdd", () => {
  it("shows picks only with a heading and products, and reports a failed add", async () => {
    api.applicable = {
      data: {
        recommendations: { heading: "Add one more to unlock 20% off", addLabel: "Add", products: [{ sku: "Q1" }] },
        progress: { primary: { campaignCode: "TIER", mechanic: "TIERED" } },
        promotions: { context: { zoneCode: "AE" } },
      },
    };
    api.addCartItem.mockRejectedValue(new Error("down"));
    const { result } = renderHook(() => usePromotionQuickAdd({ surface: "drawer" }));
    expect(result.current.show).toBe(true);
    act(() => result.current.add({ sku: "Q1" } as never));
    expect(result.current.busy).toBe("Q1");
    await waitFor(() => expect(result.current.busy).toBeNull());
    expect(api.toast).toHaveBeenCalledWith(expect.stringMatching(/couldn.t add/i), "error");
    expect(api.trackPromotion).not.toHaveBeenCalledWith("promotion_recommendation_added", expect.anything());
  });

  it("shows nothing without a heading", () => {
    api.applicable = { data: { recommendations: { heading: "", products: [{ sku: "Q1" }] }, promotions: { context: {} } } };
    expect(renderHook(() => usePromotionQuickAdd()).result.current.show).toBe(false);
  });
});

describe("useEmptyBagRecovery", () => {
  it("drops the full stop from a rail heading", () => {
    expect(railHeading("Recently viewed. ")).toBe("Recently viewed");
  });

  it("adds a suggestion, opens the bag and tracks it", async () => {
    api.fetchEmptyBag.mockResolvedValue({ groups: [], addLabel: "Add" });
    api.addCartItem.mockResolvedValue({ id: "cart-1" });
    const { result } = renderHook(() => useEmptyBagRecovery("empty-drawer"), { wrapper });
    await waitFor(() => expect(api.fetchEmptyBag).toHaveBeenCalledWith({ campaignCode: "SUMMER", viewedProductIds: [] }));
    act(() => result.current.add({ campaignCode: "SUMMER" } as never, { sku: "E1" } as never));
    await waitFor(() => expect(useUiStore.getState().cartOpen).toBe(true));
    expect(api.trackPromotion).toHaveBeenCalledWith("promotion_recommendation_added", { campaignCode: "SUMMER", market: "AE", surface: "empty-drawer" });
  });
});

describe("useEmptyBagRecovery waits for the market", () => {
  it("asks nothing before the shopper's market is known (the server answers 400 without it)", async () => {
    useUiStore.setState({ catalogContext: null });
    api.fetchEmptyBag.mockResolvedValue({ groups: [], addLabel: "Add" });
    renderHook(() => useEmptyBagRecovery("empty-drawer"), { wrapper });
    await act(async () => {});
    expect(api.fetchEmptyBag).not.toHaveBeenCalled();

    // The market provider resolves the market: now, and only now, it asks.
    act(() => useUiStore.setState({ catalogContext: { zoneCode: "AE", currencyCode: "AED", languageCode: "en" } as never }));
    await waitFor(() => expect(api.fetchEmptyBag).toHaveBeenCalledTimes(1));
  });

  it("holds the request while disabled (a closed bag drawer)", async () => {
    api.fetchEmptyBag.mockResolvedValue({ groups: [], addLabel: "Add" });
    const { rerender } = renderHook(({ open }) => useEmptyBagRecovery("empty-drawer", { enabled: open }), {
      wrapper,
      initialProps: { open: false },
    });
    await act(async () => {});
    expect(api.fetchEmptyBag).not.toHaveBeenCalled();

    rerender({ open: true });
    await waitFor(() => expect(api.fetchEmptyBag).toHaveBeenCalledTimes(1));
  });

  it("asks again in the shopper's new language (headings are translated)", async () => {
    useUiStore.setState({ catalogContext: { zoneCode: "AE", currencyCode: "AED", languageCode: "en" } as never });
    api.fetchEmptyBag.mockResolvedValue({ groups: [], addLabel: "Add" });
    renderHook(() => useEmptyBagRecovery("empty-cart"), { wrapper });
    await waitFor(() => expect(api.fetchEmptyBag).toHaveBeenCalledTimes(1));

    act(() => useUiStore.setState({ catalogContext: { zoneCode: "AE", currencyCode: "AED", languageCode: "ar" } as never }));
    await waitFor(() => expect(api.fetchEmptyBag).toHaveBeenCalledTimes(2));
  });
});

describe("useRecentlyViewedProducts", () => {
  it("asks for this browser's history without the product on screen", async () => {
    api.viewed = ["p1", "p2", "p3"];
    api.fetchEmptyBag.mockResolvedValue({
      groups: [{ id: "viewed", heading: "Still on your mind.", products: [{ productId: "p2", slug: "p2", title: "P2", sku: "S2", amount: "30", image: null }] }],
    });
    const { result } = renderHook(() => useRecentlyViewedProducts("p1"), { wrapper });
    await waitFor(() => expect(result.current.products).toHaveLength(1));
    expect(api.fetchEmptyBag).toHaveBeenCalledWith({ viewedProductIds: ["p2", "p3"], scope: "viewed" });
    expect(result.current.heading).toBe("Still on your mind.");
    expect(result.current.products[0]).toMatchObject({ id: "p2", price: 30, currency: "AED" });
  });

  it("asks nothing without history", () => {
    renderHook(() => useRecentlyViewedProducts("p1"), { wrapper });
    expect(api.fetchEmptyBag).not.toHaveBeenCalled();
  });
});

describe("usePromotionProgressTracking", () => {
  it("reports progress and unlocks once per change", () => {
    const progress = { primary: { campaignCode: "TIER", mechanic: "TIERED", message: "1 more" }, unlockedSummary: null, unlocked: [] as { campaignCode: string; mechanic: string; message: string }[] };
    const { rerender } = renderHook(({ p }) => usePromotionProgressTracking(p as never, "AE", "cart"), { initialProps: { p: progress } });
    rerender({ p: { ...progress } });
    expect(api.trackPromotion).toHaveBeenCalledTimes(1);
    expect(api.trackPromotion).toHaveBeenCalledWith("promotion_progress_advanced", { campaignCode: "TIER", mechanic: "TIERED", market: "AE", surface: "cart" });
    rerender({ p: { ...progress, unlocked: [{ campaignCode: "TIER", mechanic: "TIERED", message: "20% off unlocked" }] } });
    expect(api.trackPromotion).toHaveBeenCalledWith("promotion_unlocked", expect.objectContaining({ campaignCode: "TIER" }));
  });
});
