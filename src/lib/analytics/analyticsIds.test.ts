import { describe, expect, it } from "vitest";
import { cleanGa4Id, cleanGtmId } from "./analyticsIds";

describe("analytics ids", () => {
  it("accepts only real Tag Manager / GA4 ids", () => {
    expect(cleanGtmId(" gtm-abc123 ")).toBe("GTM-ABC123");
    expect(cleanGtmId("abc123")).toBeNull();
    expect(cleanGtmId("")).toBeNull();
    expect(cleanGa4Id("g-XYZ12345")).toBe("G-XYZ12345");
    expect(cleanGa4Id("UA-123-1")).toBeNull();
    expect(cleanGa4Id(undefined)).toBeNull();
  });
});
