import type { ProgressMark, PromotionProgressRail } from "../types/promotions";

/**
 * What the compact promotion rail shows (bag drawer, bag page, checkout
 * summary), decided once for every brand; each brand draws it:
 * - `saved`: every step is done ("You saved 20%"): a single banner.
 * - `rail`: the headline, then reward steps (marks with a reward), plain steps
 *   (marks), or a meter; and one extra note (an unlocked offer).
 * Free gifts have their own line, so the GWP unlock sentence is left out.
 */
export type CompactProgressView =
  | { kind: "none" }
  | { kind: "saved"; headline: string }
  | {
      kind: "rail";
      headline: string | null;
      /** The marks carry rewards: draw them as a reward range (gift, %, delivery …). */
      rewardMarks: boolean;
      marks: ProgressMark[];
      /** 0–100 when there are no marks and the primary offer has a meter. */
      meter: number | null;
      note: string | null;
    };

export function compactProgressView(progress: PromotionProgressRail | null | undefined): CompactProgressView {
  if (!progress) return { kind: "none" };
  if (
    !progress.primary &&
    !progress.unlockedSummary &&
    !progress.unlocked.length &&
    !progress.secondary.length &&
    !progress.marks.length
  ) {
    return { kind: "none" };
  }
  const note = progress.unlockedSummary || progress.unlocked.find((line) => line.mechanic !== "GWP")?.message || null;
  const headline = progress.primary?.message ?? note;
  if (!headline && !progress.marks.length) return { kind: "none" };
  const stillOpen = progress.marks.some((mark) => mark.state !== "complete");
  const saved = headline != null && /saved\s+\d+\s*%|وفرت\s+\d+/i.test(headline) && !/add\s+\d|أضف/i.test(headline) && !stillOpen;
  if (saved && headline) return { kind: "saved", headline };
  // "Choose a delivery method" has no amount to measure.
  const methodGap = /delivery method|طريقة توصيل/i.test(progress.primary?.message ?? "");
  const meter =
    !progress.marks.length && progress.primary && progress.primaryProgress != null && !methodGap ? progress.primaryProgress : null;
  return {
    kind: "rail",
    headline: progress.primary?.message ?? null,
    rewardMarks: progress.marks.some((mark) => Boolean(mark.rewardType)),
    marks: progress.marks,
    meter,
    note,
  };
}

/**
 * Where the reward range's fill ends (0–100): each mark sits at the centre of
 * its slot (the last at the end), and the fill moves between them in step with
 * the amount spent towards the next one.
 */
export function rewardFill(marks: ProgressMark[]): number {
  const thresholds = marks.map((mark) => Number(mark.threshold));
  const count = marks.length;
  if (!count || thresholds.some((value) => !Number.isFinite(value) || value <= 0)) return 0;
  const center = (index: number) => ((index + 0.5) / count) * 100;
  const next = marks.find((mark) => mark.state === "current" && mark.threshold != null && mark.amountRemaining != null);
  let current = 0;
  if (next) {
    current = Math.max(0, Number(next.threshold) - Number(next.amountRemaining));
  } else if (marks.every((mark) => mark.state === "complete")) {
    return 100;
  } else {
    const done = [...marks].reverse().find((mark) => mark.state === "complete");
    current = Number(done?.threshold) || 0;
  }
  if (!Number.isFinite(current) || current <= 0) return 0;
  if (current >= thresholds[count - 1]) return 100;
  let previousAmount = 0;
  let previousAt = 0;
  for (let index = 0; index < count; index += 1) {
    const at = index === count - 1 ? 100 : center(index);
    if (current <= thresholds[index]) {
      const span = thresholds[index] - previousAmount;
      const ratio = span <= 0 ? 1 : (current - previousAmount) / span;
      return previousAt + (at - previousAt) * ratio;
    }
    previousAmount = thresholds[index];
    previousAt = at;
  }
  return 100;
}
