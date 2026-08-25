import { describe, expect, it } from "vitest";
import { brandColors, radius } from "./designTokens";

describe("designTokens", () => {
  it("keeps brand terra as the primary CTA color", () => {
    expect(brandColors.terra).toBe("#B46E57");
  });

  it("uses the documented card radius", () => {
    expect(radius.md).toBe(10);
  });
});
