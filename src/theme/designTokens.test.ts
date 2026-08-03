import { describe, expect, it } from "vitest";
import { brandColors, radius } from "@/theme/designTokens";

describe("designTokens", () => {
  it("exposes Swiss Arabian terra primary", () => {
    expect(brandColors.terra).toBe("#B46E57");
  });

  it("uses md radius of 10px", () => {
    expect(radius.md).toBe(10);
  });
});
