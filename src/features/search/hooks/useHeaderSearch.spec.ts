import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUiStore } from "@/stores/useUiStore";
import { useHeaderSearch } from "./useHeaderSearch";

const push = vi.hoisted(() => vi.fn());
const remember = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/ar" }));
vi.mock("../utils/recentSearches", () => ({ rememberSearchQuery: remember }));
vi.mock("./useCatalogSearch", () => ({
  useCatalogSearch: (q: string) => ({ products: q ? [{ id: "1", slug: "berry-crush" }] : [] }),
}));

beforeEach(() => {
  push.mockReset();
  remember.mockReset();
  useUiStore.getState().setSearchOpen(true);
});

describe("useHeaderSearch", () => {
  it("opens results for the query in the page's language and remembers it", () => {
    const { result } = renderHook(() => useHeaderSearch({ limit: 8 }));
    act(() => result.current.setQuery("oud"));
    act(() => result.current.goToResults());
    expect(remember).toHaveBeenCalledWith("oud");
    expect(push).toHaveBeenCalledWith("/ar/search?q=oud");
    expect(useUiStore.getState().searchOpen).toBe(false);
  });

  it("opens a hit's product page and clears the query on close", () => {
    const { result } = renderHook(() => useHeaderSearch({ limit: 8 }));
    act(() => result.current.setQuery("be"));
    act(() => result.current.goToHit(0));
    expect(push).toHaveBeenCalledWith("/ar/products/berry-crush");
    expect(result.current.query).toBe("");
  });
});
