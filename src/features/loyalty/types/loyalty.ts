/** Customer rewards facts returned by Backend L1. Display only. */

export type LoyaltyAvailability = "ACTIVE" | "DISABLED";

export type LoyaltyWalletView = {
  availability: LoyaltyAvailability;
  /** Customer sentence when the program is off for this market. */
  unavailableMessage: string | null;
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
  /** Customer-safe note. Raw ledger language is dropped. */
  debtLabel: string | null;
};

/** Lifecycle word shown next to a row. Server-supplied, never inferred. */
export type LoyaltyActivityState = "Pending" | "Available" | "Expired";

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

/** Frozen per-order loyalty outcome read at confirmation and in history. */
export type LoyaltyOrderRewardView =
  | { earned: false }
  | {
      earned: true;
      orderId: string | null;
      points: number;
      state: "PENDING" | "AVAILABLE" | "CANCELLED";
      currencyCode: string | null;
      /** Present only when the server has vested the order. */
      vestedAt: string | null;
    };

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

/**
 * Server reason codes for a disabled program or market. The copy is deliberately
 * coarse, matching the backend, and never names which switch is off.
 */
const UNAVAILABLE_COPY: Record<string, string> = {
  LOYALTY_NOT_AVAILABLE: PROGRAM_UNAVAILABLE,
  LOYALTY_NOT_AVAILABLE_IN_THIS_MARKET: DEFAULT_UNAVAILABLE,
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

  const wallet = walletRecord(row);
  const market = asRecord(row.market) ?? {};
  const equivalent = asRecord(row.monetaryEquivalent) ?? {};
  const disabled = marketDisabled(row) || marketDisabled(wallet);
  const reason = typeof row.reason === "string" ? row.reason.trim().toUpperCase() : "";

  return {
    availability: disabled ? "DISABLED" : "ACTIVE",
    unavailableMessage: disabled
      ? readText(row, ["message", "customerMessage"]) ??
        readText(wallet, ["message", "customerMessage"]) ??
        UNAVAILABLE_COPY[reason] ??
        DEFAULT_UNAVAILABLE
      : null,
    zoneCode:
      readText(market, ["code", "zoneCode"]) ?? readText(row, ["zoneCode"]),
    currencyCode:
      readText(wallet, ["currencyCode"]) ??
      readText(equivalent, ["currencyCode"]) ??
      readText(market, ["currencyCode"]) ??
      readText(row, ["currencyCode"]),
    availablePoints: readPoints(wallet, ["availablePoints", "available", "points"]),
    pendingPoints: readPoints(wallet, ["pendingPoints", "pending"]),
    reservedPoints: readPoints(wallet, ["reservedPoints", "reserved"]),
    availableValue:
      readMoney(equivalent, ["available", "amount", "value"]) ??
      readMoney(wallet, ["availableValue", "monetaryEquivalent", "worth"]),
    debtLabel:
      readText(wallet, ["debtLabel", "debtMessage", "customerDebtMessage"]) ??
      readText(row, ["debtLabel", "debtMessage", "customerDebtMessage"]),
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
    const label =
      readText(row, ["label", "displayLabel", "title", "description"]) ??
      ACTIVITY_COPY[presentationKey] ??
      "Reward activity";
    const id = readText(row, ["id"]) ?? `activity-${index}`;
    const points =
      readNumber(row.points) ?? readNumber(row.pointsDelta) ?? readNumber(row.pointDelta);
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

/**
 * Reads the frozen per-order outcome. Never falls back to a cart estimate, so
 * a stale preview cannot be presented as the earned result.
 */
export function readOrderReward(raw: unknown): LoyaltyOrderRewardView {
  const row = asRecord(raw);
  if (!row || row.earned !== true) return { earned: false };

  const points = readNumber(row.points);
  if (points == null || points <= 0) return { earned: false };

  const stateKey = typeof row.presentationState === "string"
    ? row.presentationState.trim().toUpperCase()
    : "";
  if (!ORDER_REWARD_STATES.has(stateKey)) return { earned: false };

  return {
    earned: true,
    orderId: readText(row, ["orderId"]),
    points,
    state: stateKey as "PENDING" | "AVAILABLE" | "CANCELLED",
    currencyCode: readText(row, ["currencyCode"]),
    vestedAt: readText(row, ["vestedAt"]),
  };
}

export function formatPoints(value: number): string {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}

export function isEmptyRewardsWallet(wallet: LoyaltyWalletView): boolean {
  return (
    wallet.availability === "ACTIVE" &&
    wallet.availablePoints === 0 &&
    wallet.pendingPoints === 0 &&
    wallet.reservedPoints === 0
  );
}
