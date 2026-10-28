/**
 * Display-only reader for the Backend `employeeCheckout` object.
 * Money stays as the server sent it. This module does not add tax or reprice a line.
 */

export type StaffQuoteLineView = {
  sku: string | null;
  name: string | null;
  eligible: boolean;
  originalPrice: string | null;
  staffDiscount: string | null;
  priceAfter: string | null;
  conflict: string | null;
};

export type StaffAllowanceView = {
  amountLimit: string | null;
  amountUsed: string | null;
  balanceRemaining: string | null;
  estimatedConsumption: string | null;
  projectedRemaining: string | null;
  insufficient: boolean;
};

export type EmployeeCheckoutView = {
  personnelNumber: string | null;
  affiliationName: string | null;
  eligible: boolean;
  pricingApplied: boolean;
  allowanceConfirmed: boolean;
  financialPostingEnabled: boolean;
  /** Quoted staff prices must not be captured while posting is blocked. */
  captureBlocked: boolean;
  /** Backend added tax on top of a tax-inclusive staff price. Display only; not corrected here. */
  taxContractMismatch: boolean;
  staffDiscountTotal: string | null;
  stacking: string | null;
  lines: StaffQuoteLineView[];
  allowance: StaffAllowanceView | null;
};

const MONEY = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;

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

function postingEnabled(value: unknown): boolean {
  if (value === true) return true;
  const row = asRecord(value);
  if (!row) return false;
  if (row.enabled === true || row.supported === true || row.captureAllowed === true) return true;
  const status = text(row.status)?.toUpperCase();
  return status === "ENABLED" || status === "SUPPORTED";
}

function captureBlocked(value: unknown, pricingApplied: boolean): boolean {
  if (!pricingApplied) return false;
  if (value === false) return true;
  const row = asRecord(value);
  if (!row) return !postingEnabled(value);
  if (row.captureAllowed === false || row.supported === false || row.enabled === false) return true;
  const status = text(row.status)?.toUpperCase();
  return status === "DISABLED" || status === "UNAVAILABLE" || status === "BLOCKED";
}

function readLine(raw: unknown): StaffQuoteLineView | null {
  const row = asRecord(raw);
  if (!row) return null;
  const originalPrice = money(row.originalPrice ?? row.unitPrice);
  const staffDiscount = money(row.staffDiscount ?? row.discountAmount);
  const priceAfter = money(row.priceAfter ?? row.discountedPrice);
  return {
    sku: text(row.sku),
    name: text(row.productName ?? row.name),
    eligible: row.eligible === true,
    originalPrice,
    staffDiscount,
    priceAfter,
    conflict: text(row.conflict ?? row.stackingStatus ?? row.reason),
  };
}

function quoteAddsTax(quote: Record<string, unknown>, lines: StaffQuoteLineView[]): boolean {
  const quoteTax = money(quote.tax ?? quote.additionalTax ?? quote.taxTotal);
  if (quoteTax && cents(quoteTax) !== 0) return true;
  return lines.some((line) => {
    const raw = quote.lines;
    if (!Array.isArray(raw)) return false;
    const match = raw.find((item) => text(asRecord(item)?.sku) === line.sku);
    const charged = money(
      asRecord(match)?.payable ?? asRecord(match)?.priceWithTax ?? asRecord(match)?.totalWithTax,
    );
    return addsFivePercentTax(line.priceAfter, charged);
  });
}

function readAllowance(raw: unknown, benefit: Record<string, unknown> | null): StaffAllowanceView | null {
  const row = asRecord(raw);
  const source = row ?? benefit;
  if (!source) return null;
  const amountLimit = money(source.amountLimit ?? benefit?.amountLimit);
  const amountUsed = money(source.amountUsed ?? benefit?.amountUsed);
  const balanceRemaining = money(
    source.authoritativeRemaining ?? source.balanceRemaining ?? benefit?.balanceRemaining,
  );
  const estimatedConsumption = money(source.provisionalOrderConsumption ?? source.estimatedConsumption);
  const projectedRemaining = money(source.projectedRemaining);
  if (!amountLimit && !amountUsed && !balanceRemaining && !estimatedConsumption && !projectedRemaining) {
    return null;
  }
  return {
    amountLimit,
    amountUsed,
    balanceRemaining,
    estimatedConsumption,
    projectedRemaining,
    insufficient: source.sufficient === false || source.insufficient === true,
  };
}

export function staffPricingIsPayable(view: EmployeeCheckoutView | null | undefined): boolean {
  if (!view) return false;
  return (
    view.eligible &&
    view.pricingApplied &&
    view.allowanceConfirmed &&
    view.financialPostingEnabled &&
    !view.captureBlocked &&
    !view.taxContractMismatch
  );
}

export function readEmployeeCheckout(raw: unknown): EmployeeCheckoutView | null {
  const row = asRecord(raw);
  if (!row) return null;
  const benefit = asRecord(row.benefit);
  const quote = asRecord(row.staffQuote) ?? {};
  const lines = Array.isArray(quote.lines) ? quote.lines.flatMap((item) => {
    const line = readLine(item);
    return line ? [line] : [];
  }) : [];
  const pricingApplied = quote.pricingApplied === true;
  const financialPosting = row.financialPosting;
  const stacking = asRecord(quote.stacking);
  return {
    personnelNumber: text(row.personnelNumber),
    affiliationName: text(benefit?.affiliationName ?? benefit?.name),
    eligible: row.eligible !== false && text(row.employeeLinkStatus)?.toUpperCase() !== "REVOKED",
    pricingApplied,
    allowanceConfirmed: row.allowanceConfirmed === true || quote.allowanceConfirmed === true,
    financialPostingEnabled: postingEnabled(financialPosting),
    captureBlocked: captureBlocked(financialPosting, pricingApplied),
    taxContractMismatch: quoteAddsTax(quote, lines),
    staffDiscountTotal: money(quote.staffDiscountTotal),
    stacking: text(stacking?.status ?? stacking?.message ?? quote.stacking),
    lines,
    allowance: readAllowance(asRecord(quote.allowance), benefit),
  };
}
