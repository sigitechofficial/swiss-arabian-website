import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const useReturnsPolicy = vi.hoisted(() => vi.fn(() => ({ data: undefined, isLoading: true })));
const market = vi.hoisted(() => ({ marketId: "AE" as string | null, regionOptions: [{ id: "AE", label: "UAE" }] }));
vi.mock("./useAfterSales", () => ({ useReturnsPolicy }));
vi.mock("@/providers/MarketProvider", () => ({ useMarket: () => market }));

import { useMarketReturnTerms } from "./useMarketReturnTerms";

describe("useMarketReturnTerms", () => {
  it("names the selected market and asks for its terms", () => {
    const { result } = renderHook(() => useMarketReturnTerms());
    expect(result.current.market).toBe("UAE");
    expect(useReturnsPolicy).toHaveBeenCalledWith({ mode: "market", zoneCode: "AE" });
  });

  it("falls back to the market code when it has no label", () => {
    market.marketId = "KW";
    expect(renderHook(() => useMarketReturnTerms()).result.current.market).toBe("KW");
  });
});
