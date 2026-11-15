import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductListResult } from "../api/catalog.service";
import { useCatalogPlp } from "./useCatalogPlp";

const fetchCatalogListing = vi.hoisted(() => vi.fn());

vi.mock("@/features/markets/hooks/useSelectedCatalogMarket", () => ({
  useSelectedCatalogMarket: () => ({ zoneCode: "URD1", salesChannelCode: "platform_sa_urd1" }),
}));

vi.mock("../api/fetchCatalogListing", () => ({
  fetchCatalogListing,
  catalogListingQueryKey: (_source: unknown, zone: string, filters: unknown) => [
    "catalog",
    zone,
    JSON.stringify(filters),
  ],
}));

const emptyListing: ProductListResult = {
  products: [],
  pagination: { page: 1, limit: 24, total: 0, totalPages: 0 },
  facets: null,
} as unknown as ProductListResult;

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  fetchCatalogListing.mockReset();
});

describe("useCatalogPlp load failure", () => {
  it("reports a failed load (not an empty catalog) when the store can't be reached, and recovers on retry", async () => {
    fetchCatalogListing.mockRejectedValueOnce(new Error("fetch failed"));
    const { result } = renderHook(() => useCatalogPlp({ kind: "products" }, { page: 1 } as never), {
      wrapper,
    });

    await waitFor(() => expect(result.current.loadFailed).toBe(true));
    expect(result.current.loading).toBe(false);

    fetchCatalogListing.mockResolvedValueOnce(emptyListing);
    act(() => result.current.retry());

    await waitFor(() => expect(result.current.loadFailed).toBe(false));
    expect(result.current.products).toEqual([]);
  });

  it("an answered empty listing is not a failure", async () => {
    fetchCatalogListing.mockResolvedValueOnce(emptyListing);
    const { result } = renderHook(() => useCatalogPlp({ kind: "products" }, { page: 1 } as never), {
      wrapper,
    });

    await waitFor(() => expect(result.current.products).toEqual([]));
    expect(result.current.loadFailed).toBe(false);
  });
});
