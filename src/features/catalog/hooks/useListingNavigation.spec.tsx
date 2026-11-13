import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useListingNavigation } from "./useListingNavigation";

const push = vi.hoisted(() => vi.fn());
const path = vi.hoisted(() => ({ current: "/ar/products" }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => path.current,
}));

beforeEach(() => {
  push.mockReset();
  path.current = "/ar/products";
});

describe("useListingNavigation on a prerendered default-language page", () => {
  it("uses the public path, not the internal /en/…/p/N one", () => {
    path.current = "/en/products/p/2";
    const { result } = renderHook(() => useListingNavigation({ page: 2 }));
    expect(result.current.pathname).toBe("/products");
    result.current.patch({ sort: "newest" });
    expect(push).toHaveBeenCalledWith("/products?sort=newest", { scroll: false });
  });
});

describe("useListingNavigation", () => {
  it("patches a filter and starts again at page 1", () => {
    const { result } = renderHook(() =>
      useListingNavigation({ page: 3, sort: "price_asc", houseCollection: "sarab" }),
    );
    result.current.patch({ fragranceFamily: "fruity" });
    expect(push).toHaveBeenCalledWith(
      "/ar/products?houseCollection=sarab&fragranceFamily=fruity&sort=price_asc",
      { scroll: false },
    );
  });

  it("clears filters but keeps the sort", () => {
    const { result } = renderHook(() =>
      useListingNavigation({ page: 2, sort: "newest", maxPrice: "99", featuredNote: "rose" }),
    );
    result.current.clearFilters();
    expect(push).toHaveBeenCalledWith("/ar/products?sort=newest", { scroll: false });
  });

  it("keeps the page's own parameters", () => {
    const { result } = renderHook(() => useListingNavigation({ page: 1 }, { under: "99" }));
    result.current.patch({ sort: "price_desc" });
    expect(push).toHaveBeenCalledWith("/ar/products?sort=price_desc&under=99", { scroll: false });
  });

  it("does nothing without a URL-driven listing", () => {
    const { result } = renderHook(() => useListingNavigation(undefined));
    result.current.patch({ sort: "newest" });
    expect(push).not.toHaveBeenCalled();
  });
});
