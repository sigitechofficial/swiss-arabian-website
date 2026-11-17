import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NavItem, NavigationPayload } from "../types/navigation";
import { shopByNavFrom, useNavigation } from "./useNavigation";

const api = vi.hoisted(() => ({ payload: null as unknown }));
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("../api/navigation.service", () => ({ fetchNavigation: async () => api.payload }));

const item = (id: string, type: NavItem["type"], href: string | null, children?: NavItem[]): NavItem => ({
  id,
  label: id,
  slug: null,
  type,
  href,
  ...(children ? { children } : {}),
});

const HEADER = [item("Collections", "URL", "/collections", [item("Sarab", "COLLECTION", "/collections/sarab")])];
const SHOP_BY = [
  item("For her", "COLLECTION", "/collections/for-her"),
  item("Mood", "URL", "/#mood"),
  item("Help", "URL", "/pages/faqs"),
];

function payload(extra: Partial<NavigationPayload>): NavigationPayload {
  return {
    context: { zoneId: "z", zoneCode: "SAPIL_URD1" },
    header: HEADER,
    footer: [],
    metadata: { generatedAt: "2026-11-16T00:00:00Z", source: "bound_menu", cmsAvailable: true },
    ...extra,
  };
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  api.payload = null;
});

describe("shopByNavFrom", () => {
  it("prepares the Shop-by menu like the header (direct links), keeping order and hash links", () => {
    expect(shopByNavFrom(payload({ shopBy: SHOP_BY })).map((i) => i.href)).toEqual([
      "/collections/for-her",
      "/#mood",
      "/faq",
    ]);
  });

  it("is empty when the backend sends none or omits it (older backends)", () => {
    expect(shopByNavFrom(payload({ shopBy: [] }))).toEqual([]);
    expect(shopByNavFrom(payload({}))).toEqual([]);
    expect(shopByNavFrom(undefined)).toEqual([]);
    expect(shopByNavFrom({ shopBy: null as never })).toEqual([]);
  });
});

describe("useNavigation", () => {
  it("returns the Shop-by menu next to the header", async () => {
    api.payload = payload({ shopBy: SHOP_BY, metadata: { ...payload({}).metadata, shopByMenuHandle: "sapil-shop-by" } });
    const { result } = renderHook(() => useNavigation("SAPIL_URD1"), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.shopByNav.map((i) => i.label)).toEqual(["For her", "Mood", "Help"]);
    expect(result.current.headerNav.map((i) => i.label)).toEqual(["Collections"]);
  });

  it("returns an empty Shop-by menu when the backend omits it; the header is unchanged", async () => {
    api.payload = payload({});
    const { result } = renderHook(() => useNavigation("SAPIL_URD1"), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.shopByNav).toEqual([]);
    expect(result.current.headerNav).toEqual(HEADER);
    expect(result.current.chromeItems.length).toBeGreaterThan(0);
  });
});
