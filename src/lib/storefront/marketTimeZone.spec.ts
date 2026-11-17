import { describe, expect, it } from "vitest";
import { marketTimeZone } from "./marketTimeZone";

describe("marketTimeZone", () => {
  it("uses the market country's zone, Dubai when unknown", () => {
    expect(marketTimeZone("AE")).toBe("Asia/Dubai");
    expect(marketTimeZone("sa")).toBe("Asia/Riyadh");
    expect(marketTimeZone("OM")).toBe("Asia/Muscat");
    expect(marketTimeZone(null)).toBe("Asia/Dubai");
    expect(marketTimeZone("ZZ")).toBe("Asia/Dubai");
  });

});
