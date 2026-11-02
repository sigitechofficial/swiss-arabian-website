/**
 * Display-only reader for the Backend public `staffPurchase` contract.
 * Money stays as the server sent it. Authorization is only `authorized: true`.
 */

export type StaffLineStatus = "APPLIED" | "NOT_APPLIED" | "INELIGIBLE" | "BLOCKED_BY_PROMOTION";

export type StaffQuoteLineView = {
  sku: string | null;
  status: StaffLineStatus | null;
  /** Line-level Backend percent. Never copied onto the affiliation. */
  percent: string | null;
  originalUnitPrice: string | null;
  staffDiscountAmount: string | null;
  finalLineTotal: string | null;
};

export type WebsiteHoldStatus = "HELD" | "RELEASED" | "NONE";

export type StaffAllowanceView = {
  amountLimit: string | null;
  amountUsed: string | null;
  balanceRemaining: string | null;
  otherProvisionalHolds: string | null;
  thisPurchaseConsumption: string | null;
  projectedRemaining: string | null;
  websiteHold: WebsiteHoldStatus;
  d365BalancesAreAuthoritative: boolean | null;
  projectedIsAuthoritative: boolean | null;
  fits: boolean | null;
};

/** Server money strings only. Missing rows are not derived in the browser. */
export type StaffPurchaseBreakdown = {
  originalMerchandiseSubtotal: string | null;
  staffDiscount: string | null;
  quotedStaffDiscount: string | null;
  promotionDiscount: string | null;
  merchandiseAfterDiscounts: string | null;
  shipping: string | null;
  includedVat: string | null;
  commerceTotal: string | null;
  giftCardApplied: string | null;
  loyaltyApplied: string | null;
  amountPayable: string | null;
};

export type StaffAccountingStage =
  | "NONE"
  | "QUOTED_NOT_APPLIED"
  | "PROVISIONAL_HOLD"
  | "ORDER_PAYMENT_PENDING"
  | "PAYMENT_CONFIRMED"
  | "D365_POSTING_PENDING"
  | "D365_ALLOWANCE_CONFIRMED";

export type EmployeeCheckoutView = {
  affiliationName: string | null;
  /** Explicit Backend `authorized: true` only. */
  authorized: true;
  eligible: boolean;
  pricingApplied: boolean;
  allowanceConfirmed: boolean;
  financialPostingEnabled: boolean;
  /** Set only when the Backend allows a website purchase while D365 posting stays pending. */
  platformPurchase?: "DISABLED" | "ALLOWED_D365_POSTING_PENDING";
  captureBlocked: boolean;
  taxContractMismatch: boolean;
  stacking: string | null;
  accountingStage: StaffAccountingStage | null;
  retailMirror: "READY" | "UNAVAILABLE";
  allowanceLedger: "READY" | "UNAVAILABLE";
  lines: StaffQuoteLineView[];
  allowance: StaffAllowanceView | null;
  breakdown: StaffPurchaseBreakdown;
};

const MONEY = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;

const LINE_STATUSES = new Set<string>(["APPLIED", "NOT_APPLIED", "INELIGIBLE", "BLOCKED_BY_PROMOTION"]);

const ACCOUNTING_STAGES = new Set<string>([
  "NONE",
  "QUOTED_NOT_APPLIED",
  "PROVISIONAL_HOLD",
  "ORDER_PAYMENT_PENDING",
  "PAYMENT_CONFIRMED",
  "D365_POSTING_PENDING",
  "D365_ALLOWANCE_CONFIRMED",
]);

export const STAFF_ACCOUNTING_STAGE_LABELS: Record<Exclude<StaffAccountingStage, "NONE">, string> = {
  QUOTED_NOT_APPLIED: "Staff Discount preview only",
  PROVISIONAL_HOLD: "Website allowance temporarily reserved",
  ORDER_PAYMENT_PENDING: "Order awaiting payment",
  PAYMENT_CONFIRMED: "Payment received. Allowance not yet confirmed in D365",
  D365_POSTING_PENDING: "Awaiting D365 allowance confirmation",
  D365_ALLOWANCE_CONFIRMED: "Allowance confirmed",
};

export const WEBSITE_HOLD_LABELS: Record<Exclude<WebsiteHoldStatus, "NONE">, string> = {
  HELD: "Website allowance temporarily reserved",
  RELEASED: "Website hold released",
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  return null;
}

function text(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const next = String(value).trim();
  return next || null;
}

function money(value: unknown): string | null {
  const next = text(value);
  return next && MONEY.test(next) ? next : null;
}

function bool(value: unknown): boolean | null {
  if (value === true) return true;
  if (value === false) return false;
  return null;
}

function cents(value: string | null): number | null {
  if (!value || !MONEY.test(value)) return null;
  const negative = value.startsWith("-");
  const unsigned = negative ? value.slice(1) : value;
  const [whole, frac = ""] = unsigned.split(".");
  const padded = `${frac}00`.slice(0, 2);
  const amount = Number(whole) * 100 + Number(padded);
  return negative ? -amount : amount;
}

/** True when `charged` is the tax-inclusive price plus another 5%. */
export function addsFivePercentTax(priceAfter: string | null, charged: string | null): boolean {
  const base = cents(priceAfter);
  const next = cents(charged);
  if (base == null || next == null || base <= 0) return false;
  return next === base + Math.round((base * 5) / 100);
}

export function isPositiveServerMoney(value: string | null | undefined): boolean {
  const amount = cents(value ?? null);
  return amount != null && amount > 0;
}

function postingEnabled(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value === "string") {
    const status = value.trim().toUpperCase();
    return status === "ENABLED" || status === "SUPPORTED";
  }
  const row = asRecord(value);
  if (!row) return false;
  if (row.enabled === true || row.supported === true || row.captureAllowed === true) return true;
  const status = text(row.status)?.toUpperCase();
  return status === "ENABLED" || status === "SUPPORTED";
}

function captureBlocked(value: unknown, pricingApplied: boolean): boolean {
  if (!pricingApplied) return false;
  if (value === false) return true;
  if (typeof value === "string") {
    const status = value.trim().toUpperCase();
    return status === "DISABLED" || status === "UNAVAILABLE" || status === "BLOCKED" || status === "";
  }
  const row = asRecord(value);
  if (!row) return !postingEnabled(value);
  if (row.captureAllowed === false || row.supported === false || row.enabled === false) return true;
  const status = text(row.status)?.toUpperCase();
  return status === "DISABLED" || status === "UNAVAILABLE" || status === "BLOCKED";
}

function readAccountingStage(raw: unknown): StaffAccountingStage | null {
  const row = asRecord(raw);
  const stage = text(row?.stage ?? raw)?.toUpperCase();
  if (!stage || !ACCOUNTING_STAGES.has(stage)) return null;
  return stage as StaffAccountingStage;
}

export function staffAccountingStageLabel(stage: StaffAccountingStage | null | undefined): string | null {
  if (!stage || stage === "NONE") return null;
  return STAFF_ACCOUNTING_STAGE_LABELS[stage] ?? null;
}

export function websiteHoldLabel(status: WebsiteHoldStatus | null | undefined): string | null {
  if (!status || status === "NONE") return null;
  return WEBSITE_HOLD_LABELS[status] ?? null;
}

function readLineStatus(value: unknown): StaffLineStatus | null {
  const status = text(value)?.toUpperCase();
  if (!status || !LINE_STATUSES.has(status)) return null;
  return status as StaffLineStatus;
}

function readWebsiteHold(value: unknown): WebsiteHoldStatus {
  const status = text(value)?.toUpperCase();
  if (status === "HELD" || status === "RELEASED" || status === "NONE") return status;
  return "NONE";
}

function readLine(raw: unknown): StaffQuoteLineView | null {
  const row = asRecord(raw);
  if (!row) return null;
  const sku = text(row.sku);
  const status = readLineStatus(row.status);
  const percent = text(row.percent);
  const originalUnitPrice = money(row.originalUnitPrice);
  const staffDiscountAmount = money(row.staffDiscountAmount);
  const finalLineTotal = money(row.finalLineTotal);
  if (!sku && !status && !percent && !originalUnitPrice && !staffDiscountAmount && !finalLineTotal) return null;
  return { sku, status, percent, originalUnitPrice, staffDiscountAmount, finalLineTotal };
}

function readAllowance(raw: unknown): StaffAllowanceView | null {
  const source = asRecord(raw);
  if (!source) return null;
  const amountLimit = money(source.d365AmountLimit);
  const amountUsed = money(source.d365AmountUsed);
  const balanceRemaining = money(source.d365BalanceRemaining);
  const otherProvisionalHolds = money(source.otherProvisionalHolds);
  const thisPurchaseConsumption = money(source.thisPurchaseConsumption);
  const projectedRemaining = money(source.projectedRemaining);
  const websiteHold = readWebsiteHold(source.websiteHold);
  const d365BalancesAreAuthoritative = bool(source.d365BalancesAreAuthoritative);
  const projectedIsAuthoritative = bool(source.projectedIsAuthoritative);
  const fits = bool(source.fits);
  if (
    !amountLimit &&
    !amountUsed &&
    !balanceRemaining &&
    !otherProvisionalHolds &&
    !thisPurchaseConsumption &&
    !projectedRemaining &&
    websiteHold === "NONE" &&
    fits == null
  ) {
    return null;
  }
  return {
    amountLimit,
    amountUsed,
    balanceRemaining,
    otherProvisionalHolds,
    thisPurchaseConsumption,
    projectedRemaining,
    websiteHold,
    d365BalancesAreAuthoritative,
    projectedIsAuthoritative,
    fits,
  };
}

function readSupport(raw: unknown): { retailMirror: "READY" | "UNAVAILABLE"; allowanceLedger: "READY" | "UNAVAILABLE" } {
  const row = asRecord(raw);
  return {
    retailMirror: row?.retailMirror === "UNAVAILABLE" ? "UNAVAILABLE" : "READY",
    allowanceLedger: row?.allowanceLedger === "UNAVAILABLE" ? "UNAVAILABLE" : "READY",
  };
}

function readBreakdown(raw: unknown): StaffPurchaseBreakdown {
  const row = asRecord(raw) ?? {};
  return {
    originalMerchandiseSubtotal: money(row.originalMerchandiseSubtotal),
    staffDiscount: money(row.staffDiscount),
    quotedStaffDiscount: money(row.quotedStaffDiscount),
    promotionDiscount: money(row.promotionDiscount),
    merchandiseAfterDiscounts: money(row.merchandiseAfterDiscounts),
    shipping: money(row.shipping),
    includedVat: money(row.includedVat),
    commerceTotal: money(row.commerceTotal),
    giftCardApplied: money(row.giftCardApplied),
    loyaltyApplied: money(row.loyaltyApplied),
    amountPayable: money(row.amountPayable),
  };
}

/** Unwrap `staffPurchase` from a cart, checkout, or order envelope. Does not authorize. */
export function extractStaffPurchaseRaw(resource: unknown): unknown {
  const root = asRecord(resource);
  if (!root) return null;
  if ("staffPurchase" in root) return root.staffPurchase;
  const snapshot = asRecord(root.promotionSnapshot);
  if (snapshot && "staffPurchase" in snapshot) return snapshot.staffPurchase;
  return root;
}

/** Discounted capture stays blocked while financial posting is disabled, unless the Backend explicitly allows a platform purchase. */
export function staffDiscountPaymentBlocked(view: EmployeeCheckoutView | null | undefined): boolean {
  if (!view?.authorized || !view.pricingApplied) return false;
  if (view.platformPurchase === "ALLOWED_D365_POSTING_PENDING") return false;
  return !view.financialPostingEnabled || view.captureBlocked;
}

export function staffPricingIsPayable(view: EmployeeCheckoutView | null | undefined): boolean {
  if (!view?.authorized) return false;
  return (
    view.eligible &&
    view.pricingApplied &&
    view.allowanceConfirmed &&
    view.financialPostingEnabled &&
    !view.captureBlocked &&
    !view.taxContractMismatch
  );
}

/**
 * Returns a view only when the public contract says `authorized: true`.
 * Presence of staffPurchase, breakdown, allowance, accounting, eligible, or a
 * legacy employeeCheckout object is not authorization.
 */
export function readEmployeeCheckout(raw: unknown): EmployeeCheckoutView | null {
  const extracted = extractStaffPurchaseRaw(raw);
  const row = asRecord(extracted);
  if (!row || row.authorized !== true) return null;

  const lines = Array.isArray(row.lines)
    ? row.lines.flatMap((item) => {
        const line = readLine(item);
        return line ? [line] : [];
      })
    : [];
  const pricingApplied = row.pricingApplied === true;
  const financialPosting = row.financialPosting;
  const stacking = asRecord(row.stacking);

  return {
    affiliationName: text(row.affiliationName),
    authorized: true,
    eligible: row.eligible === true,
    pricingApplied,
    allowanceConfirmed: row.allowanceConfirmed === true,
    financialPostingEnabled: postingEnabled(financialPosting),
    platformPurchase:
      row.platformPurchase === "ALLOWED_D365_POSTING_PENDING"
        ? "ALLOWED_D365_POSTING_PENDING"
        : "DISABLED",
    captureBlocked: captureBlocked(financialPosting, pricingApplied),
    taxContractMismatch: false,
    stacking: text(stacking?.status ?? stacking?.message ?? row.stacking),
    accountingStage: readAccountingStage(row.accounting),
    retailMirror: readSupport(row.support).retailMirror,
    allowanceLedger: readSupport(row.support).allowanceLedger,
    lines,
    allowance: readAllowance(row.allowance),
    breakdown: readBreakdown(row.breakdown),
  };
}
