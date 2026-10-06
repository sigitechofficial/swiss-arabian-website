/** Promotion snapshot v1 — render as sent. Do not invent fields or client math. */

export const KNOWN_PROMOTION_KINDS = ["COUPON", "AUTOMATIC", "FREE_SHIPPING"] as const;
export type KnownPromotionKind = (typeof KNOWN_PROMOTION_KINDS)[number];
export type PromotionAppliedKind = KnownPromotionKind | string;

/** Benefit shapes the backend may return. Unknown values stay renderable. */
export const KNOWN_DISCOUNT_TYPES = [
  "PERCENTAGE",
  "FIXED_AMOUNT",
  "FIXED_PRICE",
  "BUY_X_GET_Y",
  "FREE_SHIPPING",
] as const;
export type KnownDiscountType = (typeof KNOWN_DISCOUNT_TYPES)[number];

export type PromotionApplied = {
  kind: PromotionAppliedKind;
  code: string | null;
  label: string | null;
  discountType: KnownDiscountType | string | null;
  discountValue: string | null;
  level: string | null;
  amount: string;
  /**
   * Optional server display metadata (for example a later reward cap).
   * Informational only — never used to count units or choose rewards.
   */
  metadata?: Record<string, unknown> | null;
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

export const QUALIFICATION_STATUSES = ["ELIGIBLE", "PENDING", "INELIGIBLE"] as const;
export type QualificationStatus = (typeof QUALIFICATION_STATUSES)[number];

export const PENDING_REASONS = ["PAYMENT_METHOD_REQUIRED", "SHIPPING_METHOD_REQUIRED"] as const;
export type PendingReason = (typeof PENDING_REASONS)[number];

/** P6 / P6.1 qualification. Unknown status and reason strings stay renderable. */
export type PromotionQualification = {
  status?: QualificationStatus | string;
  minOrderAmount?: string | null;
  remainingAmount?: string | null;
  qualifyingSubtotal?: string | null;
  minEligibleSubtotal?: string | null;
  minOrderQuantity?: number | null;
  minEligibleQuantity?: number | null;
  pendingReason?: PendingReason | string | null;
};

export type PromotionRejected = {
  code?: string | null;
  reason?: string | null;
  message?: string | null;
  minOrderAmount?: string | null;
  remainingAmount?: string | null;
  /** Legacy explicit threshold. Structured qualification fields win. */
  thresholdAmount?: string | null;
};

/** Optional near-miss metadata. Present fields are read; unknown keys are ignored. */
export type PromotionEligibilityHint = {
  reason?: string | null;
  thresholdAmount?: string | null;
  remainingAmount?: string | null;
  code?: string | null;
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
  /**
   * Awarded or choosable gifts. Display only.
   * Never folded into discount or subtotal.
   */
  gifts?: PromotionGiftAward[];
};

export type PromotionGiftLine = {
  sku: string;
  quantity: number;
  name: string | null;
  imageUrl: string | null;
};

/** Server gift award. Status notices are shown and are not treated as added lines. */
export type PromotionGiftAward = {
  type: string;
  promotionCode: string | null;
  status: string | null;
  message: string | null;
  giftItems: PromotionGiftLine[];
  choices: PromotionGiftLine[];
  /** Set when the quote asks the customer to pick, including after they have picked. */
  selectionMode?: "CUSTOMER_CHOICE" | "AUTO_FIRST_AVAILABLE" | null;
};

/** Server Set Bundle progress. Display only — the website does not count sets. */
export type SetBundleProgress = {
  completedSets?: number;
  percentOff?: string;
  repeat?: boolean;
  message?: string | null;
  lines?: Array<{
    ref?: string | null;
    sku?: string | null;
    label?: string | null;
  }>;
};

export type PromotionOffer = {
  code?: string | null;
  campaignCode?: string | null;
  title?: string | null;
  label?: string | null;
  applied?: boolean;
  selected?: boolean;
  setBundle?: SetBundleProgress | null;
  rejected?: PromotionRejected | null;
  qualification?: PromotionQualification | null;
  /** Legacy explicit threshold. Structured qualification fields win. */
  thresholdAmount?: string | null;
  remainingAmount?: string | null;
  eligibility?: PromotionEligibilityHint | null;
};

export type ProgressRailLine = {
  campaignCode: string;
  mechanic: string;
  message: string;
};

/** Server cart progress. The website prints these sentences and does not choose the next step. */
export type ProgressMark = {
  label: string;
  detail: string;
  state: "complete" | "current" | "next";
};

export type PromotionProgressRail = {
  primary: ProgressRailLine | null;
  primaryProgress: number | null;
  unlockedSummary: string | null;
  unlocked: ProgressRailLine[];
  secondary: ProgressRailLine[];
  marks: ProgressMark[];
};

export type PromotionRecommendationProduct = {
  productId: string;
  sku: string;
  slug: string | null;
  title: string;
  image: string | null;
  price: string | null;
};

export type PromotionRecommendations = {
  heading: string | null;
  addLabel: string;
  products: PromotionRecommendationProduct[];
};

export type ApplicablePromotions = {
  promotions: PromotionSnapshotV1;
  offers: PromotionOffer[];
  progress?: PromotionProgressRail | null;
  recommendations?: PromotionRecommendations | null;
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

export function isFreeShippingBenefit(
  item: Pick<PromotionApplied, "kind" | "discountType"> | null | undefined,
): boolean {
  if (!item) return false;
  return item.kind === "FREE_SHIPPING" || item.discountType === "FREE_SHIPPING";
}

export function shippingDiscountAmount(
  snapshot: PromotionSnapshotV1 | null | undefined,
): number {
  const raw = snapshot?.totals?.shippingDiscount;
  if (raw != null && raw !== "") {
    const fromTotals = Number(raw);
    return Number.isFinite(fromTotals) && fromTotals > 0 ? fromTotals : 0;
  }
  const row = (snapshot?.applied ?? []).find((item) => isFreeShippingBenefit(item));
  const rowAmount = row ? Number(row.amount) : 0;
  return Number.isFinite(rowAmount) && rowAmount > 0 ? rowAmount : 0;
}

export type AppliedPromotionView = {
  label: string;
  code: string | null;
  /** Positive server amount. Null means do not print a money figure (including 0). */
  amount: number | null;
  /** Non-money status, such as "Free shipping", when there is no merchandise amount. */
  status: string | null;
};

/** Label and server amount only. Does not interpret buy/get pools or caps. */
export function isFixedAmountBxgy(item: PromotionApplied): boolean {
  if (item.discountType !== "BUY_X_GET_Y") return false;
  const meta = item.metadata;
  if (!meta) return false;
  const raw = meta.rewardType ?? meta.rewardDiscountType;
  return typeof raw === "string" && raw.trim().toUpperCase() === "FIXED_AMOUNT";
}
export function appliedPromotionView(
  item: PromotionApplied,
  snapshot?: PromotionSnapshotV1 | null,
): AppliedPromotionView {
  const shipping = isFreeShippingBenefit(item);
  const label =
    item.label?.trim() ||
    item.code?.trim() ||
    (shipping ? "Free shipping" : "Offer");
  const code = item.code?.trim() || null;

  if (shipping) {
    const rowAmount = Number(item.amount);
    const quoted = shippingDiscountAmount(snapshot);
    if (item.kind === "COUPON") {
      if (Number.isFinite(rowAmount) && rowAmount > 0) {
        return { label, code, amount: rowAmount, status: null };
      }
      return { label, code, amount: null, status: "Free shipping" };
    }
    // A positive row amount is the post-clamp contribution. The shipping total
    // is only a stand-in when this applied row has no merchandise amount.
    if (Number.isFinite(rowAmount) && rowAmount > 0) {
      return { label, code, amount: rowAmount, status: null };
    }
    if (quoted > 0) return { label, code, amount: quoted, status: null };
    return { label, code, amount: null, status: "Free shipping" };
  }

  const amount = Number(item.amount);
  if (Number.isFinite(amount) && amount > 0) {
    return { label, code, amount, status: null };
  }
  return { label, code, amount: null, status: "Applied" };
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

/**
 * Server payable when sent. Never subtract gift-card tender on the client.
 * Explicit checkout or cart payable values win over a promotion snapshot.
 */
export function amountPayableFrom(
  snapshot: PromotionSnapshotV1 | null | undefined,
  extras: Array<string | null | undefined> = [],
): number | null {
  const candidates = [...extras, snapshot?.totals?.amountPayable];
  for (const value of candidates) {
    if (value == null || value === "") continue;
    const amount = Number(value);
    if (Number.isFinite(amount) && amount >= 0) return amount;
  }
  return null;
}

/** Checkout quote first. A cart snapshot is only used before a checkout session exists. */
export function checkoutQuoteSnapshot(
  session:
    | {
        promotionSnapshot?: PromotionSnapshotV1 | null;
        promotions?: PromotionSnapshotV1 | null;
      }
    | null
    | undefined,
  cartSnapshot: PromotionSnapshotV1 | null | undefined,
): PromotionSnapshotV1 | null {
  return session?.promotionSnapshot ?? session?.promotions ?? cartSnapshot ?? null;
}

function emptySnapshot(): PromotionSnapshotV1 {
  return {
    v: 1,
    computedAt: null,
    context: {
      brandCode: null,
      zoneCode: null,
      currencyCode: null,
      salesChannelCode: null,
    },
    applied: [],
    lineAllocations: [],
    totals: { discountTotal: "0" },
    rejected: [],
  };
}

/**
 * Keeps unknown additive keys. Missing lists become empty so a new optional
 * field cannot break the cart quote.
 */
export function readPromotionSnapshot(raw: unknown): PromotionSnapshotV1 | null {
  const row = asRecord(raw);
  if (!row) return null;
  const totals = asRecord(row.totals) ?? {};
  const context = asRecord(row.context) ?? {};
  const base = emptySnapshot();
  return {
    ...base,
    ...(row as Partial<PromotionSnapshotV1>),
    v: typeof row.v === "number" ? row.v : 1,
    computedAt: asString(row.computedAt),
    context: {
      ...base.context,
      ...context,
      brandCode: asString(context.brandCode),
      zoneCode: asString(context.zoneCode),
      currencyCode: asString(context.currencyCode),
      salesChannelCode: asString(context.salesChannelCode),
    },
    applied: Array.isArray(row.applied) ? (row.applied as PromotionApplied[]) : [],
    lineAllocations: Array.isArray(row.lineAllocations)
      ? (row.lineAllocations as PromotionLineAllocation[])
      : [],
    totals: {
      ...totals,
      discountTotal: asString(totals.discountTotal) ?? "0",
      shippingDiscount: asString(totals.shippingDiscount) ?? undefined,
      amountPayable: asString(totals.amountPayable) ?? undefined,
    },
    rejected: Array.isArray(row.rejected) ? (row.rejected as PromotionRejected[]) : [],
    gifts: readGiftAwards(row),
  };
}

function readGiftLine(raw: unknown): PromotionGiftLine | null {
  const row = asRecord(raw);
  if (!row) return null;
  const sku = asString(row.sku);
  if (!sku) return null;
  const quantityRaw = row.quantity;
  const quantity =
    typeof quantityRaw === "number"
      ? quantityRaw
      : typeof quantityRaw === "string"
        ? Number(quantityRaw)
        : 1;
  return {
    sku,
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    name: asString(row.name) ?? asString(row.productName),
    imageUrl: asString(row.imageUrl) ?? asString(row.image),
  };
}

function readGiftLines(raw: unknown): PromotionGiftLine[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const line = readGiftLine(item);
    return line ? [line] : [];
  });
}

function isGiftApplied(item: unknown): boolean {
  const applied = asRecord(item);
  if (!applied) return false;
  const type = `${applied.type ?? ""} ${applied.kind ?? ""} ${applied.discountType ?? ""}`.toUpperCase();
  const mode = String(applied.giftSelectionMode ?? "").toUpperCase();
  return type.includes("GIFT_WITH_PURCHASE") || type.includes("CUSTOMER_CHOICE") || mode === "CUSTOMER_CHOICE";
}

function normalizeGiftAward(item: unknown): PromotionGiftAward | null {
  const award = asRecord(item);
  if (!award) return null;
  const meta = asRecord(award.metadata) ?? {};
  const declared = String(award.type ?? award.kind ?? award.discountType ?? meta.type ?? "").toUpperCase();
  const modeRaw = String(
    award.giftSelectionMode ?? award.selectionMode ?? meta.giftSelectionMode ?? "",
  ).toUpperCase();
  const customerChoice = declared.includes("CUSTOMER_CHOICE") || modeRaw === "CUSTOMER_CHOICE";
  const giftItems = readGiftLines(award.giftItems ?? meta.giftItems);
  const quotedOptions = award.giftOptions ?? meta.giftOptions;
  const choices = Array.isArray(quotedOptions)
    ? readGiftLines(quotedOptions)
    : readGiftLines(award.choices ?? award.availableGifts ?? meta.choices ?? meta.availableGifts);
  if (!declared && !customerChoice && giftItems.length === 0 && choices.length === 0) return null;
  const awaiting = customerChoice && giftItems.length === 0 && choices.length > 0;
  return {
    type: awaiting ? "CUSTOMER_CHOICE" : declared || "GIFT_WITH_PURCHASE",
    promotionCode: asString(award.promotionCode) ?? asString(award.code) ?? asString(meta.promotionCode),
    status: asString(award.status) ?? asString(meta.status),
    message: asString(award.message) ?? asString(meta.message),
    giftItems,
    choices,
    selectionMode: customerChoice
      ? "CUSTOMER_CHOICE"
      : modeRaw === "AUTO_FIRST_AVAILABLE"
        ? "AUTO_FIRST_AVAILABLE"
        : null,
  };
}

/** Gifts from `gifts`, or from an applied gift row when the snapshot has not been parsed yet. */
export function readGiftAwards(raw: unknown): PromotionGiftAward[] {
  const row = asRecord(raw);
  if (!row) return [];
  const source = Array.isArray(row.gifts)
    ? row.gifts
    : Array.isArray(row.applied)
      ? row.applied.filter(isGiftApplied)
      : [];
  return source.flatMap((item) => {
    const award = normalizeGiftAward(item);
    return award ? [award] : [];
  });
}

export function readApplicablePromotions(raw: unknown): ApplicablePromotions {
  const data = asRecord(raw) ?? {};
  const offers = Array.isArray(data.offers)
    ? data.offers.flatMap((item) => {
        const offer = asRecord(item);
        return offer ? [offer as PromotionOffer] : [];
      })
    : [];
  return {
    promotions: readPromotionSnapshot(data.promotions) ?? emptySnapshot(),
    offers,
    progress: readProgressRail(data.progress),
    recommendations: readRecommendations(data.recommendations),
  };
}

function readRecommendations(value: unknown): PromotionRecommendations | null {
  const row = asRecord(value);
  if (!row) return null;
  const products = Array.isArray(row.products) ? row.products.flatMap((item) => {
    const product = asRecord(item);
    const sku = asString(product?.sku)?.trim();
    const title = asString(product?.title)?.trim();
    const productId = asString(product?.productId)?.trim();
    if (!product || !sku || !title || !productId) return [];
    return [{
      productId,
      sku,
      slug: asString(product.slug),
      title,
      image: asString(product.image),
      price: asString(product.price),
    }];
  }) : [];
  return {
    heading: asString(row.heading),
    addLabel: asString(row.addLabel) ?? "Add",
    products,
  };
}

function readProgressLine(value: unknown): ProgressRailLine | null {
  const row = asRecord(value);
  const message = asString(row?.message)?.trim();
  if (!row || !message) return null;
  return {
    campaignCode: asString(row.campaignCode) ?? "",
    mechanic: asString(row.mechanic) ?? "",
    message,
  };
}

function readProgressRail(value: unknown): PromotionProgressRail | null {
  const row = asRecord(value);
  if (!row) return null;
  const primary = readProgressLine(row.primary);
  const progress = typeof row.primaryProgress === 'number' ? row.primaryProgress : Number.NaN;
  return {
    primary,
    primaryProgress: primary && Number.isFinite(progress) ? progress : null,
    unlockedSummary: asString(row.unlockedSummary),
    unlocked: Array.isArray(row.unlocked) ? row.unlocked.flatMap((item) => {
      const line = readProgressLine(item);
      return line ? [line] : [];
    }) : [],
    secondary: Array.isArray(row.secondary) ? row.secondary.flatMap((item) => {
      const line = readProgressLine(item);
      return line ? [line] : [];
    }) : [],
    marks: Array.isArray(row.marks) ? row.marks.flatMap((item) => {
      const mark = asRecord(item);
      const label = asString(mark?.label)?.trim();
      const detail = asString(mark?.detail)?.trim() ?? "";
      const state = asString(mark?.state);
      if (!mark || !label || (state !== "complete" && state !== "current" && state !== "next")) return [];
      return [{ label, detail, state }];
    }) : [],
  };
}
