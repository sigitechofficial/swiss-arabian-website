import { describe, expect, it } from "vitest";
import { hostFromSiteKey, parseSiteKey, siteTreeKey } from "./siteKey";

describe("page tree keys", () => {
  it("an address's key, with the market on an address that serves several", () => {
    expect(siteTreeKey("swissarabian.com")).toBe("swissarabian.com");
    expect(siteTreeKey("swissarabian.com", "KSA")).toBe("swissarabian.com~KSA");
    expect(siteTreeKey("sp.localhost:3045", "SAPIL_URD1")).toBe("sp.localhost__3045~SAPIL_URD1");
    expect(siteTreeKey("swissarabian.com", "bad/code")).toBe("swissarabian.com");
  });

  it("reads host and market back", () => {
    expect(parseSiteKey("swissarabian.com~KSA")).toEqual({ host: "swissarabian.com", marketCode: "KSA" });
    expect(parseSiteKey("sp.localhost__3045")).toEqual({ host: "sp.localhost:3045", marketCode: null });
    expect(hostFromSiteKey("swissarabian.com~KSA")).toBe("swissarabian.com");
  });

  it("refuses anything that is not a key", () => {
    expect(parseSiteKey("swissarabian.com~KSA~X")).toBeNull();
    expect(parseSiteKey("swissarabian.com~")).toBeNull();
    expect(parseSiteKey("swiss arabian~KSA")).toBeNull();
    expect(parseSiteKey("")).toBeNull();
  });
});
