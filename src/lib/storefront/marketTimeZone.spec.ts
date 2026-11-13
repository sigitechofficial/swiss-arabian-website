import { afterEach, describe, expect, it } from "vitest";
import { useUiStore } from "@/stores/useUiStore";
import { currentMarketTimeZone, marketTimeZone } from "./marketTimeZone";

afterEach(() => useUiStore.setState({ catalogContext: null }));

describe("marketTimeZone", () => {
  it("uses the market country's zone, Dubai when unknown", () => {
    expect(marketTimeZone("AE")).toBe("Asia/Dubai");
    expect(marketTimeZone("sa")).toBe("Asia/Riyadh");
    expect(marketTimeZone("OM")).toBe("Asia/Muscat");
    expect(marketTimeZone(null)).toBe("Asia/Dubai");
    expect(marketTimeZone("ZZ")).toBe("Asia/Dubai");
  });

  it("follows the selected market", () => {
    expect(currentMarketTimeZone()).toBe("Asia/Dubai");
    useUiStore.setState({ catalogContext: { zoneCode: "KSA", countryCode: "SA" } });
    expect(currentMarketTimeZone()).toBe("Asia/Riyadh");
  });
});
