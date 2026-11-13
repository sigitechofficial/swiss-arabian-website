import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { useCatalogCollections } from "./useCatalogCollections";

const fetchCollections = vi.hoisted(() => vi.fn(async () => [{ id: "2", slug: "royale", name: "Royale" }]));
const market = vi.hoisted(() => ({ value: null as null | { zoneCode: string; salesChannelCode: string } }));

vi.mock("@/features/markets/hooks/useSelectedCatalogMarket", () => ({
  useSelectedCatalogMarket: () => market.value,
}));
vi.mock("@/features/catalog/api/catalog.service", () => ({
  catalogKeys: { collections: (zone: string) => ["collections", zone] },
  fetchCollections,
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useCatalogCollections", () => {
  it("shows the server list before the market is known", () => {
    market.value = null;
    const initial = { zoneCode: "URD1", collections: [{ id: "1", slug: "sarab", name: "Sarab" }] };
    const { result } = renderHook(() => useCatalogCollections(initial), { wrapper });
    expect(result.current.collections?.[0]?.slug).toBe("sarab");
    expect(result.current.loading).toBe(false);
  });

  it("loads the shopper's market when the server list is another market's", async () => {
    market.value = { zoneCode: "KSA", salesChannelCode: "web" };
    const initial = { zoneCode: "URD1", collections: [{ id: "1", slug: "sarab", name: "Sarab" }] };
    const { result } = renderHook(() => useCatalogCollections(initial), { wrapper });
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.collections?.[0]?.slug).toBe("royale"));
  });
});
