import { describe, expect, it } from "vitest";
import { pt, round3 } from "./MoodWheel";

const decimals = (n: number) => (String(n).split(".")[1] ?? "").length;

describe("MoodWheel geometry (hydration-safe)", () => {
  it("rounds every wheel point to at most 3 decimals", () => {
    // 6 moods → 60° segments; 30° gives the reported 26.794919243112… value.
    for (let a = 0; a <= 360; a += 7.5) {
      for (const r of [200, 150, 104]) {
        const [x, y] = pt(a, r);
        expect(decimals(x)).toBeLessThanOrEqual(3);
        expect(decimals(y)).toBeLessThanOrEqual(3);
      }
    }
    expect(pt(30, 200)[1]).toBe(26.795);
    expect(pt(0, 200)).toEqual([200, 0]);
    expect(pt(90, 200)).toEqual([400, 200]);
  });

  it("gives the same string whatever the last digits of sin / cos are", () => {
    expect(round3(26.794919243112332)).toBe(round3(26.794919243112304));
    expect(String(round3(76.333 - 24))).toBe("52.333");
  });
});
