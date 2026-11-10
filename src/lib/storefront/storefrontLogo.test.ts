import { describe, expect, it } from "vitest";
import { storefrontLogo } from "./brand";

describe("storefrontLogo", () => {
  it("has a descriptive file name and alt text (SEO audit)", () => {
    const logo = storefrontLogo();
    expect(logo.src).toMatch(/online-perfume-store\.png$/);
    expect(logo.alt).toBe(`${logo.name} Online Perfume Store`);
    expect(logo.width).toBeGreaterThan(0);
    expect(logo.height).toBeGreaterThan(0);
  });
});
