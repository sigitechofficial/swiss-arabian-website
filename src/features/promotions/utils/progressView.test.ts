import { describe, expect, it } from "vitest";
import type { ProgressMark, PromotionProgressRail } from "../types/promotions";
import { compactProgressView, rewardFill } from "./progressView";

const rail = (patch: Partial<PromotionProgressRail>): PromotionProgressRail => ({
  primary: null,
  primaryProgress: null,
  unlockedSummary: null,
  unlocked: [],
  secondary: [],
  marks: [],
  ...patch,
});
const line = (message: string, mechanic = "TIERED_SPEND") => ({ campaignCode: "C1", mechanic, message });
const mark = (state: ProgressMark["state"], patch: Partial<ProgressMark> = {}): ProgressMark => ({ label: "Step", detail: "", state, ...patch });

describe("compactProgressView (bag, bag page, checkout rail for every brand)", () => {
  it("shows nothing without progress", () => {
    expect(compactProgressView(null)).toEqual({ kind: "none" });
    expect(compactProgressView(rail({}))).toEqual({ kind: "none" });
  });

  it("all steps done with a 'saved' sentence: one banner", () => {
    expect(compactProgressView(rail({ primary: line("You saved 20%"), marks: [mark("complete")] }))).toEqual({
      kind: "saved",
      headline: "You saved 20%",
    });
    // A step still open, or 'add 1 more', keeps the steps.
    expect(compactProgressView(rail({ primary: line("You saved 20%"), marks: [mark("complete"), mark("current")] })).kind).toBe("rail");
    expect(compactProgressView(rail({ primary: line("You saved 10%. Add 1 more to save 20%") })).kind).toBe("rail");
  });

  it("steps, reward steps or a meter, with one note that is not the free gift", () => {
    const view = compactProgressView(
      rail({
        primary: line("Add AED 50 to get a free gift"),
        primaryProgress: 40,
        marks: [mark("complete", { rewardType: "PERCENTAGE" }), mark("current", { rewardType: "FREE_GIFT" })],
        unlocked: [line("Free gift unlocked", "GWP"), line("10% off applied")],
      }),
    );
    expect(view).toMatchObject({ kind: "rail", headline: "Add AED 50 to get a free gift", rewardMarks: true, meter: null, note: "10% off applied" });
    expect(compactProgressView(rail({ primary: line("Add AED 20 for free delivery"), primaryProgress: 60 }))).toMatchObject({ kind: "rail", meter: 60 });
    // "choose a delivery method" has nothing to measure
    expect(compactProgressView(rail({ primary: line("Choose a delivery method to see the offer"), primaryProgress: 0 }))).toMatchObject({ meter: null });
  });
});

describe("rewardFill", () => {
  it("moves between mark centres in step with the amount spent", () => {
    const marks = [mark("current", { threshold: "100", amountRemaining: "50" }), mark("next", { threshold: "200" })];
    expect(rewardFill(marks)).toBe(12.5);
    expect(rewardFill([mark("complete", { threshold: "100" }), mark("complete", { threshold: "200" })])).toBe(100);
    expect(rewardFill([mark("current")])).toBe(0);
  });
});
