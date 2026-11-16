import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCollectionsList } from "./useCollectionsList";

const fetchCollections = vi.hoisted(() => vi.fn());
const market = vi.hoisted(() => ({ value: { zoneCode: "Z1", salesChannelCode: "c" } as null | { zoneCode: string; salesChannelCode: string } }));

vi.mock("@/features/markets/hooks/useSelectedCatalogMarket", () => ({
  useSelectedCatalogMarket: () => market.value,
}));
vi.mock("@/features/catalog/api/catalog.service", () => ({
  fetchCollections,
  catalogKeys: { collections: (zone: string) => ["collections", zone] },
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  fetchCollections.mockReset();
  market.value = { zoneCode: "Z1", salesChannelCode: "c" };
});

describe("useCollectionsList", () => {
  it("uses the server list for the same market without loading", () => {
    fetchCollections.mockResolvedValue([]);
    const initial = { zoneCode: "Z1", collections: [{ slug: "a", name: "A" }] as never };
    const { result } = renderHook(() => useCollectionsList(initial), { wrapper });
    expect(result.current.loading).toBe(false);
    expect(result.current.collections).toHaveLength(1);
  });

  it("loads the selected market's list and reports failures", async () => {
    fetchCollections.mockRejectedValueOnce(new Error("down"));
    const { result } = renderHook(() => useCollectionsList(null), { wrapper });
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loadFailed).toBe(true));
  });

  it("stays loading until the market is known", () => {
    market.value = null;
    const { result } = renderHook(() => useCollectionsList(null), { wrapper });
    expect(result.current.loading).toBe(true);
    expect(fetchCollections).not.toHaveBeenCalled();
  });
});
