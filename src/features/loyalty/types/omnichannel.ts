/** Additive D365 omnichannel Loyalty read. Display only — never website redemption. */

export type OmnichannelLoyaltyStatus =
  | "LINKED"
  | "NOT_ENROLLED"
  | "UNAVAILABLE"
  | "ACTION_REQUIRED";

export type OmnichannelSyncSource = "CACHE" | "D365" | "LAST_KNOWN_GOOD" | "UNAVAILABLE";

export type OmnichannelActivityCategory = "EARN" | "REDEEM" | "OTHER";

export type OmnichannelActivityOrigin = "STORE" | "WEBSITE" | "UNKNOWN";

export type OmnichannelBalanceView = {
  activePoints: string;
  usedPoints: string;
  issuedPoints: string;
  expiredPoints: string;
  unvestedPoints: string;
};

export type OmnichannelSyncView = {
  fetchedAt: string | null;
  lastSuccessfulSyncAt: string | null;
  isFresh: boolean;
  source: OmnichannelSyncSource;
};

export type WebsiteRedemptionCapabilityView = {
  enabled: false;
  reason: string;
};

export type OmnichannelIdentityView = {
  customerGroup: string | null;
  currency: string | null;
};

export type OmnichannelRefreshReason = "READY" | "COOLDOWN" | "NOT_READY" | "DISABLED";

export type OmnichannelRefreshCapabilityView = {
  enabled: boolean;
  refreshable: boolean;
  reason: OmnichannelRefreshReason;
  retryAfterSeconds: number | null;
};

export type OmnichannelLoyaltyView = {
  source: "D365";
  status: OmnichannelLoyaltyStatus;
  identity: OmnichannelIdentityView | null;
  balance: OmnichannelBalanceView | null;
  sync: OmnichannelSyncView;
  websiteRedemption: WebsiteRedemptionCapabilityView;
  /**
   * L5D server-owned refresh path. Null when an older backend omitted the object
   * (S2 status fallback applies).
   */
  refresh: OmnichannelRefreshCapabilityView | null;
};

export type OmnichannelRefreshUi = {
  visible: boolean;
  clickable: boolean;
  cooling: boolean;
  reason: OmnichannelRefreshReason | null;
  retryAfterSeconds: number | null;
  fallback: boolean;
};

export type OmnichannelRefreshStatus =
  | "QUEUED"
  | "ALREADY_QUEUED"
  | "THROTTLED"
  | "NOT_READY"
  | "DISABLED";

export type OmnichannelRefreshResult = {
  status: OmnichannelRefreshStatus;
  refreshRequestedAt: string | null;
  retryAfterSeconds: number | null;
};

export type OmnichannelRefreshSnapshot = {
  status: OmnichannelLoyaltyStatus;
  fetchedAt: string | null;
  lastSuccessfulSyncAt: string | null;
  lastTransactionImportSuccessAt: string | null;
  activePoints: string | null;
};

export const OMNICHANNEL_REFRESH_POLL_AT_MS = [2000, 5000, 10000] as const;

export type ExternalLoyaltyActivityView = {
  source: "D365";
  entryType: string;
  category: OmnichannelActivityCategory;
  points: string;
  remainingPoints: string;
  entryDate: string | null;
  expirationDate: string | null;
  salesOrderId: string | null;
  receiptId: string | null;
  origin: OmnichannelActivityOrigin;
};

export type LoyaltyPageInfoView = {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

const POINT_STRING_RE = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;

const STATUSES = new Set<OmnichannelLoyaltyStatus>([
  "LINKED",
  "NOT_ENROLLED",
  "UNAVAILABLE",
  "ACTION_REQUIRED",
]);

const SYNC_SOURCES = new Set<OmnichannelSyncSource>([
  "CACHE",
  "D365",
  "LAST_KNOWN_GOOD",
  "UNAVAILABLE",
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function readTrimmed(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text || null;
}

/**
 * Display-only grouping for a decimal POINT STRING.
 * Does not use Number / parseFloat / Math.round.
 */
export function formatPointQuantity(value: string): string {
  const trimmed = value.trim();
  if (!POINT_STRING_RE.test(trimmed)) return trimmed;
  const negative = trimmed.startsWith("-");
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const dot = unsigned.indexOf(".");
  const intPart = dot === -1 ? unsigned : unsigned.slice(0, dot);
  const frac = dot === -1 ? "" : unsigned.slice(dot + 1);
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const body = frac ? `${grouped}.${frac}` : grouped;
  return negative ? `−${body}` : body;
}

function readPointQuantity(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!POINT_STRING_RE.test(text)) return null;
  return text;
}

function readPointField(source: Record<string, unknown>, key: string): string {
  return readPointQuantity(source[key]) ?? "0";
}

function readStatus(value: unknown): OmnichannelLoyaltyStatus {
  if (typeof value !== "string") return "UNAVAILABLE";
  const key = value.trim().toUpperCase();
  if (STATUSES.has(key as OmnichannelLoyaltyStatus)) {
    return key as OmnichannelLoyaltyStatus;
  }
  return "UNAVAILABLE";
}

function readSyncSource(value: unknown): OmnichannelSyncSource {
  if (typeof value !== "string") return "UNAVAILABLE";
  const key = value.trim().toUpperCase();
  if (SYNC_SOURCES.has(key as OmnichannelSyncSource)) {
    return key as OmnichannelSyncSource;
  }
  return "UNAVAILABLE";
}

function readBalance(raw: unknown): OmnichannelBalanceView | null {
  const row = asRecord(raw);
  if (!row) return null;
  const active = readPointQuantity(row.activePoints);
  if (active == null) return null;
  return {
    activePoints: active,
    usedPoints: readPointField(row, "usedPoints"),
    issuedPoints: readPointField(row, "issuedPoints"),
    expiredPoints: readPointField(row, "expiredPoints"),
    unvestedPoints: readPointField(row, "unvestedPoints"),
  };
}

const DISABLED_REDEMPTION: WebsiteRedemptionCapabilityView = {
  enabled: false,
  reason: "D365_REDEMPTION_NOT_AVAILABLE",
};

export function readWebsiteRedemption(raw: unknown): WebsiteRedemptionCapabilityView {
  const row = asRecord(raw);
  const reason = readTrimmed(row?.reason) ?? DISABLED_REDEMPTION.reason;
  return { enabled: false, reason };
}

function readIdentity(raw: unknown): OmnichannelIdentityView | null {
  const row = asRecord(raw);
  if (!row) return null;
  return {
    customerGroup: readTrimmed(row.customerGroup),
    currency: readTrimmed(row.currency),
  };
}

export function readOmnichannelLoyalty(raw: unknown): OmnichannelLoyaltyView | null {
  const row = asRecord(raw);
  if (!row) return null;
  const status = readStatus(row.status);
  const linked = status === "LINKED";
  const balance = linked ? readBalance(row.balance) : null;
  const syncRow = asRecord(row.sync) ?? {};
  return {
    source: "D365",
    status,
    identity: linked ? readIdentity(row.identity) : null,
    balance,
    sync: {
      fetchedAt: linked ? (readTrimmed(syncRow.fetchedAt) ?? null) : null,
      lastSuccessfulSyncAt: linked ? (readTrimmed(syncRow.lastSuccessfulSyncAt) ?? null) : null,
      isFresh: linked && syncRow.isFresh === true,
      source: linked ? readSyncSource(syncRow.source) : "UNAVAILABLE",
    },
    websiteRedemption: readWebsiteRedemption(row.websiteRedemption),
    refresh: readRefreshCapability(row),
  };
}

const REFRESH_REASONS = new Set<OmnichannelRefreshReason>([
  "READY",
  "COOLDOWN",
  "NOT_READY",
  "DISABLED",
]);

function readRefreshReason(value: unknown): OmnichannelRefreshReason | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toUpperCase();
  if (REFRESH_REASONS.has(key as OmnichannelRefreshReason)) {
    return key as OmnichannelRefreshReason;
  }
  return null;
}

function readRefreshCapability(row: Record<string, unknown>): OmnichannelRefreshCapabilityView | null {
  const nested = asRecord(row.refresh);
  if (!nested) return null;
  if (typeof nested.enabled !== "boolean" && typeof nested.refreshable !== "boolean" && !nested.reason) {
    return null;
  }
  const enabled = nested.enabled === true;
  const refreshable = typeof nested.refreshable === "boolean" ? nested.refreshable : enabled;
  const reason =
    readRefreshReason(nested.reason) ??
    (refreshable ? "READY" : enabled ? "COOLDOWN" : "DISABLED");
  return {
    enabled,
    refreshable,
    reason,
    retryAfterSeconds: readRetryAfterSeconds(nested.retryAfterSeconds),
  };
}

/**
 * L5D `omnichannel.refresh` wins when present.
 * Older L5C payloads without `refresh` keep the S2 LINKED / NOT_ENROLLED fallback.
 */
export function omnichannelRefreshUi(
  view: OmnichannelLoyaltyView | null | undefined,
): OmnichannelRefreshUi {
  const hidden: OmnichannelRefreshUi = {
    visible: false,
    clickable: false,
    cooling: false,
    reason: null,
    retryAfterSeconds: null,
    fallback: false,
  };
  if (!view) return hidden;
  const cap = view.refresh;
  if (cap) {
    if (!cap.enabled || cap.reason === "NOT_READY" || cap.reason === "DISABLED") {
      return { ...hidden, reason: cap.reason, retryAfterSeconds: cap.retryAfterSeconds };
    }
    const cooling = cap.reason === "COOLDOWN";
    return {
      visible: true,
      clickable: cap.refreshable && cap.reason === "READY" && !cooling,
      cooling,
      reason: cap.reason,
      retryAfterSeconds: cap.retryAfterSeconds,
      fallback: false,
    };
  }
  const fallback = view.status === "LINKED" || view.status === "NOT_ENROLLED";
  return {
    visible: fallback,
    clickable: fallback,
    cooling: false,
    reason: null,
    retryAfterSeconds: null,
    fallback: true,
  };
}

export function canRequestOmnichannelRefresh(
  view: OmnichannelLoyaltyView | null | undefined,
): boolean {
  return omnichannelRefreshUi(view).clickable;
}

export function captureOmnichannelRefreshSnapshot(
  view: OmnichannelLoyaltyView | null | undefined,
  lastTransactionImportSuccessAt: string | null = null,
): OmnichannelRefreshSnapshot | null {
  if (!view) return null;
  return {
    status: view.status,
    fetchedAt: view.sync.fetchedAt,
    lastSuccessfulSyncAt: view.sync.lastSuccessfulSyncAt,
    lastTransactionImportSuccessAt,
    activePoints: view.balance?.activePoints ?? null,
  };
}

function isLaterTimestamp(next: string | null, prev: string | null): boolean {
  if (!next) return false;
  if (!prev) return true;
  return next > prev;
}

/** Newer sync timestamps or a meaningful status/balance change — not a failed no-op. */
export function omnichannelRefreshObserved(
  before: OmnichannelRefreshSnapshot,
  after: OmnichannelRefreshSnapshot,
): boolean {
  if (after.status !== before.status) return true;
  if (
    after.activePoints != null &&
    before.activePoints != null &&
    after.activePoints !== before.activePoints
  ) {
    return true;
  }
  if (isLaterTimestamp(after.fetchedAt, before.fetchedAt)) return true;
  if (isLaterTimestamp(after.lastSuccessfulSyncAt, before.lastSuccessfulSyncAt)) return true;
  if (
    isLaterTimestamp(after.lastTransactionImportSuccessAt, before.lastTransactionImportSuccessAt)
  ) {
    return true;
  }
  return false;
}

const REFRESH_STATUSES = new Set<OmnichannelRefreshStatus>([
  "QUEUED",
  "ALREADY_QUEUED",
  "THROTTLED",
  "NOT_READY",
  "DISABLED",
]);

function readRetryAfterSeconds(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return value;
  }
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!/^\d+$/.test(text)) return null;
  return Number(text);
}

export function readOmnichannelRefreshResult(raw: unknown): OmnichannelRefreshResult | null {
  const row = asRecord(raw);
  if (!row) return null;
  const key = typeof row.status === "string" ? row.status.trim().toUpperCase() : "";
  if (!REFRESH_STATUSES.has(key as OmnichannelRefreshStatus)) return null;
  return {
    status: key as OmnichannelRefreshStatus,
    refreshRequestedAt: readTrimmed(row.refreshRequestedAt) ?? null,
    retryAfterSeconds: readRetryAfterSeconds(row.retryAfterSeconds),
  };
}

function readCategory(value: unknown): OmnichannelActivityCategory {
  if (typeof value !== "string") return "OTHER";
  const key = value.trim().toUpperCase();
  if (key === "EARN" || key === "REDEEM") return key;
  return "OTHER";
}

function readOrigin(value: unknown): OmnichannelActivityOrigin {
  if (typeof value !== "string") return "UNKNOWN";
  const key = value.trim().toUpperCase();
  if (key === "STORE" || key === "WEBSITE" || key === "UNKNOWN") return key;
  return "UNKNOWN";
}

export function readExternalLoyaltyActivity(raw: unknown): ExternalLoyaltyActivityView[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const row = asRecord(item);
    if (!row) return [];
    const points = readPointQuantity(row.points);
    if (points == null) return [];
    return [
      {
        source: "D365",
        entryType: readTrimmed(row.entryType) ?? "",
        category: readCategory(row.category),
        points,
        remainingPoints: readPointQuantity(row.remainingPoints) ?? "0",
        entryDate: readTrimmed(row.entryDate) ?? null,
        expirationDate: readTrimmed(row.expirationDate) ?? null,
        salesOrderId: readTrimmed(row.salesOrderId) ?? null,
        receiptId: readTrimmed(row.receiptId) ?? null,
        origin: readOrigin(row.origin),
      },
    ];
  });
}

export function readPageInfo(raw: unknown, fallback: Partial<LoyaltyPageInfoView> = {}): LoyaltyPageInfoView {
  const row = asRecord(raw);
  const limit = typeof row?.limit === "number" && Number.isFinite(row.limit) ? row.limit : (fallback.limit ?? 20);
  const offset = typeof row?.offset === "number" && Number.isFinite(row.offset) ? row.offset : (fallback.offset ?? 0);
  const total = typeof row?.total === "number" && Number.isFinite(row.total) ? row.total : (fallback.total ?? 0);
  return {
    total,
    limit,
    offset,
    hasMore: row?.hasMore === true,
  };
}

export const EMPTY_EXTERNAL_PAGE_INFO: LoyaltyPageInfoView = {
  total: 0,
  limit: 20,
  offset: 0,
  hasMore: false,
};

export function externalActivityLabel(row: ExternalLoyaltyActivityView): string {
  if (row.category === "EARN") return "Store points earned";
  if (row.category === "REDEEM") return "Store points redeemed";
  return "Store reward activity";
}

export function formatExternalActivityPoints(row: ExternalLoyaltyActivityView): string {
  const formatted = formatPointQuantity(row.points);
  if (row.category === "EARN") {
    return formatted.startsWith("−") ? `${formatted} points` : `+${formatted} points`;
  }
  if (row.category === "REDEEM") {
    return formatted.startsWith("−") ? `${formatted} points` : `−${formatted} points`;
  }
  return `${formatted} points`;
}

export const OMNICHANNEL_COPY = {
  eyebrow: "Store rewards",
  linkedHint: "Synced with Swiss Arabian stores",
  stale: "Balance may be delayed",
  lastSynced: "Last synced",
  notEnrolled: "No store loyalty membership linked yet",
  unavailable: "Store rewards are temporarily unavailable.",
  actionRequired: "We couldn’t link your store rewards to this account.",
  contact: "Contact us",
  activityHeading: "Store activity",
  activityEmpty: "No store reward activity yet.",
  activityStale: "Store activity may be delayed.",
  activityLoading: "Loading store activity…",
  activityError: "We couldn’t load store activity right now.",
  loadMore: "Load more store activity",
  onlineEyebrow: "Online rewards",
  onlineActivity: "Online activity",
  onlineEmpty: "No reward activity yet.",
  loadMoreOnline: "Load more",
  refresh: "Check for updates",
  refreshing: "Refreshing…",
  throttled: "You can refresh again shortly.",
  notReady: "Store rewards can’t be refreshed right now.",
  refreshFailed: "We couldn’t refresh store rewards.",
  updated: "Store rewards updated.",
} as const;
