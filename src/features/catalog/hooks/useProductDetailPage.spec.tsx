import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { CartLine } from "@/stores/useCartStore";
import type { ProductDetail } from "../types/product";
import { cartLineForProduct, useProductDetailPage } from "./useProductDetailPage";

const insider = vi.hoisted(() => vi.fn());
const remember = vi.hoisted(() => vi.fn());

vi.mock("@/lib/insider", () => ({ ensureInsiderProductPage: insider }));
vi.mock("@/features/promotions/utils/emptyBagMemory", () => ({ rememberViewedProduct: remember }));
vi.mock("@/providers/MarketProvider", () => ({ useMarket: () => ({ marketId: "URD1" }) }));
vi.mock("@/features/markets/hooks/useSelectedCatalogMarket", () => ({
  useSelectedCatalogMarket: () => ({ zoneCode: "URD1", salesChannelCode: "web" }),
}));
vi.mock("@/features/merchandising", () => ({
  MERCH_RAIL_SLUGS: { pdpAlsoLike: "also" },
  pickMoreFromCollection: (list?: Array<{ slug: string; name: string }>) => list?.[0] ?? null,
  useMerchRail: () => [],
}));
vi.mock("@/features/merchandising/utils/browsedCollection", () => ({ useBrowsedCollection: () => null }));
vi.mock("../api/catalog.service", () => ({
  catalogKeys: {
    detail: (slug: string, zone: string) => ["detail", slug, zone],
    collectionProducts: (...args: unknown[]) => ["collection", ...args],
  },
  fetchProductBySlug: vi.fn(),
  fetchCollectionProducts: vi.fn(async () => ({ products: [], pagination: { page: 1, limit: 12, total: 0, totalPages: 1 }, facets: null })),
}));

const detail: ProductDetail = {
  id: "p1",
  slug: "berry-crush",
  title: "Berry Crush",
  price: 63,
  currency: "AED",
  variantId: "v1",
  description: "Product details will appear here soon.",
  imageUrl: "a.webp",
  imageUrls: ["a.webp", "b.webp", "a.webp"],
  collections: [{ name: "Fruity Capsules", slug: "fruity-capsules" }],
  pdpMetafields: { top_note: "Strawberry", base_note: "Musk" },
};

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("cartLineForProduct", () => {
  it("matches by variant, sku or slug", () => {
    const line = { variantId: "SKU1", slug: "x" } as CartLine;
    expect(cartLineForProduct([line], { variantId: "v1", sku: "SKU1", slug: "berry" })).toBe(line);
    expect(cartLineForProduct([line], { variantId: "v2", sku: "", slug: "y" })).toBeUndefined();
  });
});

describe("useProductDetailPage", () => {
  it("prepares the server product and records the view", () => {
    const { result } = renderHook(
      () => useProductDetailPage({ product: detail, serverZoneCode: "URD1", slug: "berry-crush" }),
      { wrapper },
    );
    expect(result.current.product?.title).toBe("Berry Crush");
    // the placeholder text is not a description
    expect(result.current.description).toBeNull();
    expect(result.current.galleryImages).toEqual(["a.webp", "b.webp"]);
    expect(result.current.livePyramid.map((r) => r.level)).toEqual(["Top", "Base"]);
    expect(result.current.moreFromCollection?.slug).toBe("fruity-capsules");
    expect(insider).toHaveBeenCalled();
    expect(remember).toHaveBeenCalledWith("p1");

    act(() => result.current.markImageFailed("a.webp"));
    expect(result.current.galleryImages).toEqual(["b.webp"]);
  });
});
