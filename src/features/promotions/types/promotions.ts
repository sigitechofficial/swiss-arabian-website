/** Promotion snapshot v1 — render as sent. Do not invent fields or client math. */

export const KNOWN_PROMOTION_KINDS = ["COUPON", "AUTOMATIC", "FREE_SHIPPING"] as const;
export type KnownPromotionKind = (typeof KNOWN_PROMOTION_KINDS)[number];
export type PromotionAppliedKind = KnownPromotionKind | string;

export type PromotionApplied = {
  kind: PromotionAppliedKind;
  code: string | null;
  label: string | null;
  discountType: string | null;
  discountValue: string | null;
  level: string | null;
  amount: string;
};

export type PromotionLineAllocation = {
  ref: string | null;
  sku: string | null;
  amount: string;
};

export type PromotionSnapshotContext = {
  brandCode: string | null;
  zoneCode: string | null;
  currencyCode: string | null;
  salesChannelCode: string | null;
};

export type PromotionRejected = {
  code?: string | null;
  reason?: string | null;
  message?: string | null;
  minOrderAmount?: string | null;
};

export type PromotionSnapshotV1 = {
  v: 1 | number;
  computedAt: string | null;
  context: PromotionSnapshotContext;
  applied: PromotionApplied[];
  lineAllocations: PromotionLineAllocation[];
  totals: {
    discountTotal: string;
    shippingDiscount?: string;
  };
  rejected: PromotionRejected[];
};

export type PromotionOffer = {
  code?: string | null;
  campaignCode?: string | null;
  title?: string | null;
  label?: string | null;
  selected?: boolean;
  rejected?: PromotionRejected | null;
};

export type ApplicablePromotions = {
  promotions: PromotionSnapshotV1;
  offers: PromotionOffer[];
};

export function isKnownPromotionKind(kind: string | null | undefined): kind is KnownPromotionKind {
  return KNOWN_PROMOTION_KINDS.includes(kind as KnownPromotionKind);
}

export function visibleApplied(
  snapshot: PromotionSnapshotV1 | null | undefined,
): PromotionApplied[] {
  return (snapshot?.applied ?? []).filter((item) => isKnownPromotionKind(item.kind));
}

export function appliedCoupon(
  snapshot: PromotionSnapshotV1 | null | undefined,
): PromotionApplied | null {
  return (
    (snapshot?.applied ?? []).find((item) => item.kind === "COUPON" && item.code) ?? null
  );
}

export function shippingDiscountAmount(
  snapshot: PromotionSnapshotV1 | null | undefined,
): number {
  const fromTotals = Number(snapshot?.totals?.shippingDiscount ?? "0");
  if (fromTotals > 0) return fromTotals;
  const row = (snapshot?.applied ?? []).find((item) => item.kind === "FREE_SHIPPING");
  return row ? Number(row.amount) : 0;
}
