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

export type GiftCardTender = {
  usageId: string | null;
  maskedCode: string | null;
  amount: string;
  remainingBalance?: string | null;
  currencyCode?: string | null;
  status?: string | null;
};

export type GiftCardBalance = {
  maskedCode: string | null;
  remainingBalance: string;
  currencyCode: string | null;
  status: string | null;
  expiresAt: string | null;
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
    amountPayable?: string;
  };
  rejected: PromotionRejected[];
  /** Tender — not merchandise discount. */
  giftCards?: GiftCardTender[];
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

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function asString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

export function parseGiftCardTender(raw: unknown): GiftCardTender | null {
  const row = asRecord(raw);
  if (!row) return null;
  const maskedCode = asString(row.maskedCode) ?? asString(row.masked_code);
  const usageId = asString(row.usageId) ?? asString(row.usage_id);
  const amount =
    asString(row.amount) ??
    asString(row.appliedAmount) ??
    asString(row.giftCardApplied) ??
    "0";
  if (!maskedCode && !usageId && Number(amount) <= 0) return null;
  return {
    usageId,
    maskedCode,
    amount,
    remainingBalance: asString(row.remainingBalance) ?? asString(row.remaining_balance),
    currencyCode: asString(row.currencyCode) ?? asString(row.currency_code),
    status: asString(row.status),
  };
}

export function visibleGiftCards(
  snapshot: PromotionSnapshotV1 | null | undefined,
  extra?: unknown,
): GiftCardTender[] {
  const fromSnapshot = Array.isArray(snapshot?.giftCards) ? snapshot.giftCards : [];
  const fromExtra = Array.isArray(extra) ? extra : [];
  const rows = fromSnapshot.length ? fromSnapshot : fromExtra;
  return rows
    .map((item) => parseGiftCardTender(item))
    .filter((item): item is GiftCardTender => Boolean(item));
}

export function giftCardSignature(
  snapshot: PromotionSnapshotV1 | null | undefined,
  extra?: unknown,
): string {
  return visibleGiftCards(snapshot, extra)
    .map((card) => `${card.usageId ?? card.maskedCode ?? ""}:${card.amount}`)
    .join("|");
}

/** Server payable when sent. Never subtract gift-card tender on the client. */
export function amountPayableFrom(
  snapshot: PromotionSnapshotV1 | null | undefined,
  extras: Array<string | null | undefined> = [],
): number | null {
  const candidates = [snapshot?.totals?.amountPayable, ...extras];
  for (const value of candidates) {
    if (value == null || value === "") continue;
    const amount = Number(value);
    if (Number.isFinite(amount) && amount >= 0) return amount;
  }
  return null;
}
