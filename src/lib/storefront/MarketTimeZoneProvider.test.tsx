import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { useUiStore } from "@/stores/useUiStore";
import { MarketTimeZoneProvider, useMarketTimeZone } from "./MarketTimeZoneProvider";

afterEach(() => useUiStore.setState({ catalogContext: null }));

describe("useMarketTimeZone", () => {
  it("uses the page's market zone from the server, even if another market is stored", () => {
    useUiStore.setState({ catalogContext: { zoneCode: "KSA", countryCode: "SA" } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <MarketTimeZoneProvider timeZone="Asia/Qatar">{children}</MarketTimeZoneProvider>
    );
    expect(renderHook(() => useMarketTimeZone(), { wrapper }).result.current).toBe("Asia/Qatar");
  });

  it("outside the provider, follows the selected market, then the home market", () => {
    expect(renderHook(() => useMarketTimeZone()).result.current).toBe("Asia/Dubai");
    useUiStore.setState({ catalogContext: { zoneCode: "KSA", countryCode: "SA" } });
    expect(renderHook(() => useMarketTimeZone()).result.current).toBe("Asia/Riyadh");
  });
});
