import type { PromotionOffer, PromotionSnapshotV1, SetBundleProgress } from "../types/promotions";

function asProgress(value: unknown): SetBundleProgress | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as SetBundleProgress;
}

function pushNote(notes: string[], message: string | null | undefined) {
  const text = message?.trim();
  if (text && !notes.includes(text)) notes.push(text);
}

/** Sentences the server already wrote. A completed set is shown only after that discount survived. */
export function setBundleNotes(
  offers: PromotionOffer[] | undefined,
  snapshot: PromotionSnapshotV1 | null | undefined,
): string[] {
  const notes: string[] = [];
  for (const offer of offers ?? []) {
    if (!offer.setBundle?.message) continue;
    if (offer.applied || offer.setBundle.completedSets === 0) pushNote(notes, offer.setBundle.message);
  }
  for (const applied of snapshot?.applied ?? []) {
    pushNote(notes, asProgress(applied.metadata?.setBundle)?.message);
  }
  return notes;
}

type BundleRow = NonNullable<SetBundleProgress["lines"]>[number];

function rowLabel(
  rows: BundleRow[] | undefined,
  line: { cartItemId?: string | null; sku?: string | null },
): string | null {
  for (const row of rows ?? []) {
    const label = row.label?.trim();
    if (!label) continue;
    if (line.cartItemId && row.ref && row.ref === line.cartItemId) return label;
    if (!line.cartItemId && line.sku && row.sku && row.sku === line.sku) return label;
  }
  return null;
}

/**
 * Badge for a cart line. A line the priced quote placed inside a surviving set wins.
 * With `offers`, a line counted toward a set that still misses a slot is badged too.
 */
export function setBundleLineLabel(
  snapshot: PromotionSnapshotV1 | null | undefined,
  line: { cartItemId?: string | null; sku?: string | null },
  offers?: PromotionOffer[] | null,
): string | null {
  for (const applied of snapshot?.applied ?? []) {
    const label = rowLabel(asProgress(applied.metadata?.setBundle)?.lines, line);
    if (label) return label;
  }
  if (!offers) return null;
  for (const applied of snapshot?.applied ?? []) {
    const label = rowLabel(asProgress(applied.metadata?.setBundle)?.pendingLines, line);
    if (label) return label;
  }
  for (const offer of offers) {
    const label = rowLabel(offer.setBundle?.pendingLines, line);
    if (label) return label;
  }
  return null;
}

/** Complete sets the priced quote kept, across every applied set-bundle campaign. */
export function completedBundleSets(snapshot: PromotionSnapshotV1 | null | undefined): number {
  let total = 0;
  for (const applied of snapshot?.applied ?? []) {
    total += asProgress(applied.metadata?.setBundle)?.completedSets ?? 0;
  }
  return total;
}

/** Lines the quote placed in a surviving set first, then the rest — each group keeps its bag order. */
export function bundleLinesFirst<T extends { cartItemId?: string | null; sku?: string | null }>(
  lines: T[],
  ...snapshots: Array<PromotionSnapshotV1 | null | undefined>
): T[] {
  const inBundle = (line: T) => snapshots.some((snapshot) => setBundleLineLabel(snapshot, line) != null);
  return [...lines.filter(inBundle), ...lines.filter((line) => !inBundle(line))];
}
