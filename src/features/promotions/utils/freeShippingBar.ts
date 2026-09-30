import type { PromotionOffer, PromotionSnapshotV1 } from "../types/promotions";
import { shippingDiscountAmount } from "../types/promotions";
import {
  explicitThresholdAmount,
  structuredSpendAmount,
} from "./freeShippingThreshold";

function blob(offer: PromotionOffer): string {
  return `${offer.code ?? ""} ${offer.campaignCode ?? ""} ${offer.title ?? ""} ${offer.label ?? ""}`.toLowerCase();
}

export function isShippingOffer(offer: PromotionOffer): boolean {
  return /ship|deliver/.test(blob(offer));
}

function minOrderFrom(value: string | null | undefined): number | null {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function thresholdFromOffer(offer: PromotionOffer, subtotal: number): number | null {
  const min =
    minOrderFrom(offer.qualification?.minOrderAmount) ??
    minOrderFrom(offer.rejected?.minOrderAmount) ??
    minOrderFrom(explicitThresholdAmount(offer));
  if (min) return min;

  const remaining = minOrderFrom(structuredSpendAmount(offer));
  if (remaining != null && subtotal >= 0) {
    const derived = remaining + subtotal;
    if (derived > 0) return derived;
  }

  const code = `${offer.code ?? ""} ${offer.campaignCode ?? ""}`;
  const codeMatch = code.match(/ship_free[_-]?(\d+)/i);
  if (codeMatch) return Number(codeMatch[1]);
  const title = `${offer.title ?? ""} ${offer.label ?? ""}`;
  const titleMatch = title.match(/over\s+(?:[a-z]{3}\s*)?([\d,.]+)/i);
  if (titleMatch) return Number(titleMatch[1].replace(/,/g, ""));
  return null;
}

/** Merchandise threshold for the free-shipping campaign, if the API sent one. */
export function pickShippingThreshold(
  offers: PromotionOffer[] | undefined,
  snapshot: PromotionSnapshotV1 | null | undefined,
  subtotal = 0,
): number | null {
  for (const offer of offers ?? []) {
    if (!isShippingOffer(offer)) continue;
    const threshold = thresholdFromOffer(offer, subtotal);
    if (threshold) return threshold;
  }
  for (const row of snapshot?.rejected ?? []) {
    const min = minOrderFrom(row.minOrderAmount);
    const hay = `${row.code ?? ""} ${row.message ?? ""}`.toLowerCase();
    if (!/ship|deliver/.test(hay)) continue;
    if (min) return min;
    const codeMatch = (row.code ?? "").match(/ship_free[_-]?(\d+)/i);
    if (codeMatch) return Number(codeMatch[1]);
  }
  return null;
}

export function freeShippingProgress(args: {
  subtotal: number;
  offers?: PromotionOffer[];
  snapshot: PromotionSnapshotV1 | null | undefined;
}): { threshold: number | null; isFree: boolean; progress: number; remaining: number } {
  const threshold = pickShippingThreshold(args.offers, args.snapshot, args.subtotal);
  const quotedFree = shippingDiscountAmount(args.snapshot) > 0;
  const crossed = threshold != null && args.subtotal >= threshold;
  const isFree = quotedFree || crossed;
  const progress = isFree ? 1 : threshold ? Math.min(1, args.subtotal / threshold) : 0;
  const remaining = threshold != null ? Math.max(0, threshold - args.subtotal) : 0;
  return { threshold, isFree, progress, remaining };
}
