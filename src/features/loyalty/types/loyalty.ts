/** Customer rewards facts returned by Backend L1. Display only. */

export type LoyaltyAvailability = "ACTIVE" | "DISABLED";

export type LoyaltyWalletView = {
  availability: LoyaltyAvailability;
  /** Customer sentence when the program is off for this market. */
  unavailableMessage: string | null;
  /** Server `member`. True when this customer already has a Loyalty account. */
  member: boolean;
  /** True only when the server sent a wallet object. Never invented. */
  hasServerWallet: boolean;
  zoneCode: string | null;
  currencyCode: string | null;
  availablePoints: number;
  pendingPoints: number;
  reservedPoints: number;
  /**
   * Monetary equivalent of available points, as returned by the server.
   * Never derived from point value or reward rate.
   */
  availableValue: number | null;
  /** Server wallet debt. Never derived from available or pending. */
  debtPoints: number;
  /** Customer-safe note. Raw ledger language is dropped. */
  debtLabel: string | null;
  /** Server L5 tier snapshot. Null when the program has no tiers or none were sent. */
  tier: LoyaltyTierView | null;
};

/** Lifecycle word shown next to a row. Server-supplied, never inferred. */
export type LoyaltyActivityState = "Pending" | "Available" | "Expired";

/** One named Rewards tier. The display name is whatever the server sent. */
export type LoyaltyTierNameView = {
  name: string;
};

/** Server-priced progress toward the next named tier. Never derived here. */
export type LoyaltyTierView = {
  current: LoyaltyTierNameView | null;
  qualifyingSpend: number | null;
  remainingAmount: number | null;
  next: LoyaltyTierNameView | null;
  /** Present only when the server already computed it. */
  progressPercent: number | null;
  qualificationWindowDays: number | null;
};

export type LoyaltyTierHistoryView = {
  id: string;
  tierName: string | null;
  label: string;
  occurredAt: string | null;
};

export type LoyaltyTransactionView = {
  id: string;
  occurredAt: string | null;
  label: string;
  detail: string | null;
  points: number | null;
  state: LoyaltyActivityState | null;
};

/**
 * Server earning estimate for a product, cart or checkout session.
 * Always a non-binding estimate — only the order snapshot is a promise.
 */
export type LoyaltyEarnPreviewView =
  | { enabled: false; earningDisabled: boolean }
  | {
      enabled: true;
      earningDisabled: false;
      /** Server-calculated points. The browser never derives this. */
      estimatedPoints: number;
      currencyCode: string | null;
      /** Net eligible merchandise the server used, when it sends one. */
      eligibleAmount: number | null;
    };

/** Frozen per-order redemption. Display only — never priced in the browser. */
export type LoyaltyOrderRedemptionView =
  | { redeemed: false }
  | {
      redeemed: true;
      points: number;
      amount: number;
      currencyCode: string | null;
      /** After-sale return. Absent unless the server sends it. */
      returnedPoints?: number | null;
      returnedAmount?: number | null;
      netPoints?: number | null;
    };

/** After-sale earn reversal. All three numbers come from the server. */
export type LoyaltyOrderEarnAdjustmentView = {
  originalPoints: number;
  adjustedPoints: number;
  currentPoints: number;
};

/** Frozen per-order loyalty outcome read at confirmation and in history. */
export type LoyaltyOrderRewardView =
  | {
      earned: false;
      redemption: LoyaltyOrderRedemptionView;
      earnAdjustment?: LoyaltyOrderEarnAdjustmentView | null;
    }
  | {
      earned: true;
      orderId: string | null;
      points: number;
      state: "PENDING" | "AVAILABLE" | "CANCELLED";
      currencyCode: string | null;
      /** Present only when the server has vested the order. */
      vestedAt: string | null;
      redemption: LoyaltyOrderRedemptionView;
      earnAdjustment?: LoyaltyOrderEarnAdjustmentView | null;
    };

/** Server cart/checkout redemption quote. Limits and money are never derived here. */
export type LoyaltyRedemptionView = {
  enabled: boolean;
  eligible: boolean;
  availablePoints: number;
  minimumRedeemPoints: number;
  incrementPoints: number;
  maxRedeemablePoints: number;
  appliedPoints: number;
  appliedAmount: number;
  currencyCode: string | null;
  reason: string | null;
  /** Customer-safe sentence. Raw reason codes are never printed. */
  reasonMessage: string | null;
};

export const EMPTY_ORDER_REWARD: LoyaltyOrderRewardView = {
  earned: false,
  redemption: { redeemed: false },
  earnAdjustment: null,
};

/** Shown when the server reports debt without its own customer sentence. */
export const DEFAULT_DEBT_COPY =
  "Future reward points will first be applied to this adjustment before becoming available.";

const DISABLED = new Set([
  "DISABLED",
  "UNAVAILABLE",
  "INACTIVE",
  "NOT_AVAILABLE",
  "MARKET_DISABLED",
]);

/** Internal ledger codes are not customer copy. */
const RAW_ENUM = /^[A-Z0-9]+(?:_[A-Z0-9]+)+$/;

const PROGRAM_UNAVAILABLE = "Swiss Arabian Rewards is not currently available.";

const DEFAULT_UNAVAILABLE =
  "Swiss Arabian Rewards is not currently available in this market.";

const OPERATIONS_UNAVAILABLE =
  "Rewards are currently unavailable for new earning or redemption.";

const OPERATIONS_UNAVAILABLE_MARKET =
  "Rewards are currently unavailable for new earning or redemption in this market.";

/**
 * Server reason codes for a disabled program or market. The copy is deliberately
 * coarse, matching the backend, and never names which switch is off.
 */
const UNAVAILABLE_COPY: Record<string, string> = {
  LOYALTY_NOT_AVAILABLE: PROGRAM_UNAVAILABLE,
  LOYALTY_NOT_AVAILABLE_IN_THIS_MARKET: DEFAULT_UNAVAILABLE,
};

/** Shown when a historical wallet remains visible but new actions are off. */
const OPERATIONS_COPY: Record<string, string> = {
  LOYALTY_NOT_AVAILABLE: OPERATIONS_UNAVAILABLE,
  LOYALTY_NOT_AVAILABLE_IN_THIS_MARKET: OPERATIONS_UNAVAILABLE_MARKET,
};

const TIER_HISTORY_COPY: Record<string, string> = {
  TIER_STARTED: "Your Rewards tier started",
  PURCHASE: "Reached after a qualifying purchase",
  REFUND: "Adjusted after a refund",
  EXCHANGE: "Updated after an exchange adjustment",
  QUALIFICATION_EXPIRED: "Updated after the qualification period",
  PROGRAM_UPDATE: "Updated after a program change",
};

/** Temporary reservation chatter is hidden unless the server marks the row visible. */
const TRANSIENT_ACTIVITY = new Set(["POINTS_RESERVED", "POINTS_RELEASED"]);

const REDEMPTION_REASON_COPY: Record<string, string> = {
  REDEMPTION_DISABLED: "Reward points can’t be used on this order.",
  BELOW_MINIMUM: "Enter at least the minimum number of points.",
  INVALID_INCREMENT: "Use points in the allowed increment.",
  INSUFFICIENT_POINTS: "You don’t have enough reward points.",
  EXCEEDS_ORDER_COVERAGE: "That’s more points than this order can take.",
  LOYALTY_NOT_AVAILABLE: PROGRAM_UNAVAILABLE,
  REDEMPTION_NOT_AVAILABLE_WITH_CURRENT_OFFERS:
    "Reward points can’t be used with the current offer.",
  RESERVATION_EXPIRED: "Your reserved points expired. Apply them again.",
  CART_NOT_QUALIFIED: "Reward points can’t be used on this bag yet.",
};

/**
 * Backend presentation keys for a ledger row. These are stable display keys,
 * not the internal ledger enum, so they are mapped to customer copy here.
 */
const ACTIVITY_COPY: Record<string, string> = {
  POINTS_PENDING: "Points pending",
  /** Sent for a vested earn. */
  POINTS_AVAILABLE: "Points available",
  POINTS_EARNED: "Points earned",
  POINTS_ADJUSTMENT: "Points adjustment",
  POINTS_RESERVED: "Points reserved",
  POINTS_RELEASED: "Points released",
  POINTS_REDEEMED: "Points redeemed",
  POINTS_EXPIRED: "Points expired",
  REFUND_ADJUSTMENT: "Refund adjustment",
  POINTS_ADJUSTED_AFTER_REFUND: "Points adjusted after refund",
  REWARD_POINTS_RETURNED: "Reward points returned",
  POINTS_RETURNED: "Reward points returned",
  REDEMPTION_RETURN: "Reward points returned",
  REDEMPTION_REFUND: "Reward points returned",
  REDEMPTION_REVERSAL: "Reward points returned",
  EARN_REVERSAL: "Points adjusted after refund",
  DEBT_REPAYMENT: "Points applied to previous adjustment",
  POINTS_APPLIED_TO_ADJUSTMENT: "Points applied to previous adjustment",
  MANUAL_CREDIT: "Manual points credit",
  MANUAL_DEBIT: "Manual points adjustment",
  CUSTOMER_CARE: "Customer care points",
  CUSTOMER_CARE_POINTS: "Customer care points",
};

/** Server lifecycle state keys. Pending and Available stay explicit words. */
const ACTIVITY_STATE_COPY: Record<string, LoyaltyActivityState> = {
  PENDING: "Pending",
  AVAILABLE: "Available",
  EXPIRED: "Expired",
};

/** Reasons that mean loyalty is live but earning is switched off. */
const EARNING_DISABLED_REASONS = new Set(["EARNING_DISABLED"]);

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function customerCopy(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text || RAW_ENUM.test(text)) return null;
  return text;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function readPoints(source: Record<string, unknown>, keys: string[]): number {
  for (const key of keys) {
    const amount = readNumber(source[key]);
    if (amount != null) return amount;
  }
  return 0;
}

function readMoney(source: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const direct = readNumber(source[key]);
    if (direct != null) return direct;
    const nested = asRecord(source[key]);
    if (!nested) continue;
    const amount = readNumber(nested.amount) ?? readNumber(nested.value);
    if (amount != null) return amount;
  }
  return null;
}

function readText(source: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const text = customerCopy(source[key]);
    if (text) return text;
  }
  return null;
}

function isDisabledToken(value: unknown): boolean {
  return typeof value === "string" && DISABLED.has(value.trim().toUpperCase());
}

function marketDisabled(row: Record<string, unknown>): boolean {
  if (row.enabled === false || row.available === false || row.marketEnabled === false) {
    return true;
  }
  const statusKeys = ["availability", "status", "programStatus", "marketStatus"];
  if (statusKeys.some((key) => isDisabledToken(row[key]))) return true;
  for (const key of ["market", "program", "policy"]) {
    const nested = asRecord(row[key]);
    if (!nested) continue;
    if (nested.enabled === false || nested.available === false) return true;
    if (isDisabledToken(nested.status) || isDisabledToken(nested.availability)) return true;
  }
  return false;
}

function walletRecord(row: Record<string, unknown>): Record<string, unknown> {
  return asRecord(row.wallet) ?? asRecord(row.balances) ?? row;
}

/**
 * Reads the wallet the server already priced.
 * `policy.pointValue` and `policy.rewardRatePercent` are ignored so the browser
 * cannot price points — the money figure is `monetaryEquivalent.available`.
 */
export function readLoyaltyWallet(raw: unknown): LoyaltyWalletView {
  const row = asRecord(raw);
  if (!row) {
    throw new Error("We couldn't load your rewards right now.");
  }

  const walletObject = asRecord(row.wallet) ?? asRecord(row.balances);
  const hasServerWallet = walletObject != null;
  const member = row.member === true;
  const wallet = walletObject ?? walletRecord(row);
  const market = asRecord(row.market) ?? {};
  const equivalent = asRecord(row.monetaryEquivalent) ?? {};
  const disabled = marketDisabled(row) || marketDisabled(wallet);
  const reason = typeof row.reason === "string" ? row.reason.trim().toUpperCase() : "";
  const historical = hasServerWallet || member;
  const backendMessage =
    readText(row, ["message", "customerMessage"]) ??
    readText(wallet, ["message", "customerMessage"]);
  const pointsSource = disabled && !hasServerWallet ? {} : wallet;

  return {
    availability: disabled ? "DISABLED" : "ACTIVE",
    unavailableMessage: disabled
      ? backendMessage ??
        (historical ? OPERATIONS_COPY[reason] ?? OPERATIONS_UNAVAILABLE_MARKET : null) ??
        UNAVAILABLE_COPY[reason] ??
        DEFAULT_UNAVAILABLE
      : null,
    member,
    hasServerWallet,
    zoneCode:
      readText(market, ["code", "zoneCode"]) ?? readText(row, ["zoneCode"]),
    currencyCode:
      readText(wallet, ["currencyCode"]) ??
      readText(equivalent, ["currencyCode"]) ??
      readText(market, ["currencyCode"]) ??
      readText(row, ["currencyCode"]),
    availablePoints: readPoints(pointsSource, ["availablePoints", "available", "points"]),
    pendingPoints: readPoints(pointsSource, ["pendingPoints", "pending"]),
    reservedPoints: readPoints(pointsSource, ["reservedPoints", "reserved"]),
    availableValue:
      disabled && !hasServerWallet
        ? null
        : readMoney(equivalent, ["available", "amount", "value"]) ??
          readMoney(wallet, ["availableValue", "monetaryEquivalent", "worth"]),
    debtPoints: Math.max(0, readPoints(pointsSource, ["debtPoints", "debt"])),
    debtLabel:
      readText(wallet, ["debtLabel", "debtMessage", "customerDebtMessage"]) ??
      readText(row, ["debtLabel", "debtMessage", "customerDebtMessage"]) ??
      (readPoints(pointsSource, ["debtPoints", "debt"]) > 0 ? DEFAULT_DEBT_COPY : null),
    tier: readLoyaltyTier(row),
  };
}

function readTierName(value: unknown): LoyaltyTierNameView | null {
  if (typeof value === "string") {
    const name = customerCopy(value);
    return name ? { name } : null;
  }
  const row = asRecord(value);
  if (!row) return null;
  const name =
    readText(row, ["name", "displayName", "label", "title"]) ??
    null;
  return name ? { name } : null;
}

function readProgressPercent(value: unknown): number | null {
  const amount = readNumber(value);
  if (amount == null) return null;
  if (amount < 0 || amount > 100) return null;
  return amount;
}

function tierHistoryList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  const row = asRecord(raw);
  if (!row) return [];
  if (Array.isArray(row.items)) return row.items;
  return [];
}

function tierHistoryLabel(reason: string): string {
  return TIER_HISTORY_COPY[reason] ?? "Tier update";
}

export function readLoyaltyTierHistory(raw: unknown): LoyaltyTierHistoryView[] {
  return tierHistoryList(raw).flatMap((item, index) => {
    const row = asRecord(item);
    if (!row) return [];
    const to = readTierName(row.to);
    const reason = typeof row.reason === "string" ? row.reason.trim().toUpperCase() : "";
    return [
      {
        id: readText(row, ["id"]) ?? `tier-history-${index}`,
        tierName: to?.name ?? null,
        label: tierHistoryLabel(reason),
        occurredAt: readText(row, ["changedAt"]) ?? null,
      },
    ];
  });
}

/**
 * Reads `/me.tier`. Remaining spend is `tier.next.remainingAmount` only —
 * the browser never subtracts qualifying spend from a threshold.
 */
export function readLoyaltyTier(raw: unknown): LoyaltyTierView | null {
  const row = asRecord(raw);
  const body = asRecord(row?.tier);
  if (!body || body.enabled === false) return null;

  const current = readTierName(body.current);
  const nextBody = asRecord(body.next);
  const next = readTierName(nextBody);
  const qualifying = asRecord(body.qualifyingSpend) ?? {};
  const qualifyingSpend = readMoney(qualifying, ["amount"]) ?? readMoney(body, ["qualifyingSpend"]);
  const remainingAmount = nextBody ? readMoney(nextBody, ["remainingAmount"]) : null;
  const progressPercent = next ? readProgressPercent(body.progressPercent) : null;
  const qualificationWindowDays = readNumber(body.qualificationWindowDays);

  if (
    !current &&
    !next &&
    qualifyingSpend == null &&
    remainingAmount == null &&
    progressPercent == null &&
    qualificationWindowDays == null
  ) {
    return null;
  }

  return {
    current,
    qualifyingSpend,
    remainingAmount: next ? remainingAmount : null,
    next,
    progressPercent,
    qualificationWindowDays,
  };
}

function transactionList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  const row = asRecord(raw);
  if (!row) return [];
  if (Array.isArray(row.items)) return row.items;
  if (Array.isArray(row.transactions)) return row.transactions;
  if (Array.isArray(row.entries)) return row.entries;
  return [];
}

function activityCopy(presentationKey: string, points: number | null): string | null {
  if (presentationKey === "REFUND_ADJUSTMENT") {
    if (points != null && points > 0) return "Reward points returned";
    if (points != null && points < 0) return "Points adjusted after refund";
  }
  return ACTIVITY_COPY[presentationKey] ?? null;
}

/**
 * Customer labels only. The server `type` is a presentation key, so it is
 * translated here; an unmapped or internal code falls back to neutral copy and
 * is never printed raw.
 */
export function readLoyaltyTransactions(raw: unknown): LoyaltyTransactionView[] {
  return transactionList(raw).flatMap((item, index) => {
    const row = asRecord(item);
    if (!row) return [];
    const presentationKey =
      typeof row.type === "string" ? row.type.trim().toUpperCase() : "";
    if (TRANSIENT_ACTIVITY.has(presentationKey) && row.customerVisible !== true && row.visible !== true) {
      return [];
    }
    const points =
      readNumber(row.points) ?? readNumber(row.pointsDelta) ?? readNumber(row.pointDelta);
    const label =
      readText(row, ["label", "displayLabel", "title", "description"]) ??
      activityCopy(presentationKey, points) ??
      "Reward activity";
    const id = readText(row, ["id"]) ?? `activity-${index}`;
    const stateKey = typeof row.state === "string" ? row.state.trim().toUpperCase() : "";
    return [
      {
        id,
        occurredAt:
          readText(row, ["occurredAt", "createdAt", "postedAt", "displayDate", "date"]) ?? null,
        label,
        detail: readText(row, ["detail", "subtitle", "note"]),
        points,
        state: ACTIVITY_STATE_COPY[stateKey] ?? null,
      },
    ];
  });
}

/**
 * Reads a server earning estimate. `estimatedPoints` is taken as sent — the
 * browser never multiplies price by a reward rate or divides by a point value.
 */
export function readEarnPreview(raw: unknown): LoyaltyEarnPreviewView {
  const row = asRecord(raw);
  if (!row) return { enabled: false, earningDisabled: false };

  const reason = typeof row.reason === "string" ? row.reason.trim().toUpperCase() : "";
  const earningDisabled = EARNING_DISABLED_REASONS.has(reason);

  if (row.enabled !== true) {
    return { enabled: false, earningDisabled };
  }

  const earning = asRecord(row.earning) ?? row;
  const points = readNumber(earning.estimatedPoints) ?? readNumber(earning.points);
  if (points == null || points <= 0) {
    return { enabled: false, earningDisabled };
  }

  return {
    enabled: true,
    earningDisabled: false,
    estimatedPoints: points,
    currencyCode:
      readText(earning, ["currencyCode"]) ?? readText(row, ["currencyCode"]),
    eligibleAmount: readMoney(earning, ["eligibleAmount"]),
  };
}

const ORDER_REWARD_STATES = new Set(["PENDING", "AVAILABLE", "CANCELLED"]);

function readOrderRedemption(row: Record<string, unknown> | null): LoyaltyOrderRedemptionView {
  const redemption = asRecord(row?.redemption);
  if (!redemption || redemption.redeemed !== true) return { redeemed: false };

  const points = readNumber(redemption.points);
  if (points == null || points <= 0) return { redeemed: false };

  const returnedPoints =
    readNumber(redemption.returnedPoints) ?? readNumber(redemption.pointsRefunded);
  const hasReturn = returnedPoints != null && returnedPoints > 0;
  const netPoints = readNumber(redemption.netPoints) ?? readNumber(redemption.netPointsUsed);

  return {
    redeemed: true,
    points,
    amount: readMoney(redemption, ["amount"]) ?? 0,
    currencyCode: readText(redemption, ["currencyCode"]),
    returnedPoints: hasReturn ? returnedPoints : null,
    returnedAmount: hasReturn
      ? readMoney(redemption, ["returnedAmount", "amountRefunded"])
      : null,
    netPoints: hasReturn ? netPoints : null,
  };
}

function readEarnAdjustment(row: Record<string, unknown>): LoyaltyOrderEarnAdjustmentView | null {
  const sources = [
    asRecord(row.earnAdjustment),
    asRecord(row.afterSale),
    asRecord(row.adjustment),
    asRecord(row.earning),
    row,
  ];
  for (const source of sources) {
    if (!source) continue;
    const adjustedPoints =
      readNumber(source.adjustedPoints) ??
      readNumber(source.pointsReversed) ??
      readNumber(source.earnReversalPoints) ??
      readNumber(source.reversedPoints);
    const currentPoints =
      readNumber(source.currentPoints) ??
      readNumber(source.netEarnedPoints) ??
      readNumber(source.netPoints) ??
      readNumber(source.remainingPoints);
    const originalPoints =
      readNumber(source.originalPoints) ??
      readNumber(source.earnedPoints) ??
      (adjustedPoints != null ? readNumber(source.points) : null);
    if (originalPoints == null || adjustedPoints == null || currentPoints == null) continue;
    if (adjustedPoints <= 0) continue;
    return { originalPoints, adjustedPoints, currentPoints };
  }
  return null;
}

/**
 * Reads the frozen per-order outcome. Never falls back to a cart estimate, so
 * a stale preview cannot be presented as the earned result.
 */
export function readOrderReward(raw: unknown): LoyaltyOrderRewardView {
  const row = asRecord(raw);
  if (!row) return EMPTY_ORDER_REWARD;

  const redemption = readOrderRedemption(row);
  const earnAdjustment = readEarnAdjustment(row);
  if (row.earned !== true) return { earned: false, redemption, earnAdjustment };

  const points = readNumber(row.points);
  if (points == null || points <= 0) return { earned: false, redemption, earnAdjustment };

  const stateKey = typeof row.presentationState === "string"
    ? row.presentationState.trim().toUpperCase()
    : "";
  if (!ORDER_REWARD_STATES.has(stateKey)) return { earned: false, redemption, earnAdjustment };

  return {
    earned: true,
    orderId: readText(row, ["orderId"]),
    points,
    state: stateKey as "PENDING" | "AVAILABLE" | "CANCELLED",
    currencyCode: readText(row, ["currencyCode"]),
    vestedAt: readText(row, ["vestedAt"]),
    redemption,
    earnAdjustment,
  };
}

function isQuoteRecord(row: Record<string, unknown>): boolean {
  return (
    "enabled" in row ||
    "eligible" in row ||
    "appliedPoints" in row ||
    "maxRedeemablePoints" in row ||
    "availablePoints" in row
  );
}

function parseRedemptionQuote(quote: Record<string, unknown>): LoyaltyRedemptionView {
  const reason = typeof quote.reason === "string" ? quote.reason.trim().toUpperCase() : "";
  return {
    enabled: quote.enabled !== false,
    eligible: quote.eligible === true,
    availablePoints: readPoints(quote, ["availablePoints"]),
    minimumRedeemPoints: readPoints(quote, ["minimumRedeemPoints"]),
    incrementPoints: readPoints(quote, ["incrementPoints"]),
    maxRedeemablePoints: readPoints(quote, ["maxRedeemablePoints"]),
    appliedPoints: readPoints(quote, ["appliedPoints"]),
    appliedAmount: readMoney(quote, ["appliedAmount"]) ?? 0,
    currencyCode: readText(quote, ["currencyCode"]),
    reason: reason || null,
    reasonMessage:
      readText(quote, ["message", "customerMessage"]) ??
      (reason ? REDEMPTION_REASON_COPY[reason] ?? null : null),
  };
}

/**
 * Reads the server redemption quote. `appliedAmount` and `maxRedeemablePoints`
 * are taken as sent — the browser never prices points or caps coverage.
 */
export function readLoyaltyRedemption(...sources: unknown[]): LoyaltyRedemptionView | null {
  for (const source of sources) {
    const row = asRecord(source);
    if (!row) continue;
    const nested = asRecord(row.loyaltyRedemption);
    if (nested && isQuoteRecord(nested)) return parseRedemptionQuote(nested);
    if (isQuoteRecord(row)) return parseRedemptionQuote(row);
  }
  return null;
}

export function loyaltyRedemptionSignature(quote: LoyaltyRedemptionView | null | undefined): string {
  if (!quote) return "";
  return `${quote.appliedPoints}:${quote.appliedAmount}`;
}

export function redemptionReasonMessage(reason: string | null | undefined): string | null {
  if (!reason) return null;
  const key = reason.trim().toUpperCase();
  return REDEMPTION_REASON_COPY[key] ?? null;
}

export function isLoyaltyRedemptionHidden(quote: LoyaltyRedemptionView | null | undefined): boolean {
  if (!quote) return true;
  if (quote.appliedPoints > 0) return false;
  if (quote.reason === "LOYALTY_NOT_AVAILABLE") return true;
  return !quote.enabled && !quote.reasonMessage;
}

export function formatPoints(value: number): string {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}

export function hasRewardsFigures(wallet: LoyaltyWalletView): boolean {
  return (
    wallet.availablePoints !== 0 ||
    wallet.pendingPoints !== 0 ||
    wallet.reservedPoints !== 0 ||
    wallet.debtPoints > 0 ||
    Boolean(wallet.tier?.current)
  );
}

export function isEmptyRewardsWallet(wallet: LoyaltyWalletView): boolean {
  return wallet.availability === "ACTIVE" && !hasRewardsFigures(wallet);
}

/** Historical balances/activity may render even when current operations are off. */
export function hasHistoricalRewards(wallet: LoyaltyWalletView): boolean {
  return wallet.hasServerWallet || wallet.member;
}

export function hasLoyaltyTier(wallet: LoyaltyWalletView): boolean {
  const tier = wallet.tier;
  if (!tier) return false;
  return Boolean(tier.current || tier.next || tier.qualifyingSpend != null);
}
