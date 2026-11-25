/**
 * Money on the website: the one place that knows how many decimals a currency has
 * and how an amount is written. Every price, total, threshold and payment amount
 * the storefront shows or sends goes through here (both brands).
 *
 * - A currency's minor units (decimals) come from the platform's own ISO 4217 data
 *   (`Intl`), never from a hand-written list: KWD/BHD/OMR have 3 ("KWD 10.120"),
 *   AED/USD/SAR 2, JPY 0.
 * - Amounts arrive from the API as strings ("10.120") or numbers; both are accepted.
 * - Text is the same on the server and in the browser: the locale is the page's
 *   (`intlLocale`), never the device's, so hydration matches.
 * - A malformed currency code never breaks a page: the amount is shown with two
 *   decimals after the code, and the code is logged once.
 */
import { intlLocale } from "@/lib/i18n/locales";

/** An amount as the API sends it: a number, or a decimal string ("10.120"). */
export type MoneyAmount = number | string;

/**
 * How a formatted amount reads.
 *
 * - `"code"` (default): the storefront's house style, "AED 250.00" / "KWD 10.120":
 *   the ISO code, a space, then the amount with Latin digits, a "." decimal point and
 *   no grouping. It is the same in every page language (the way the shop has always
 *   shown prices), so it needs no locale.
 * - `"localized"`: the page language's own currency format (`Intl`, currency sign
 *   and order of that language, e.g. "‏63.50 د.إ.‏" in Arabic). Needs `locale`.
 */
export type MoneyDisplay = "code" | "localized";

export type MoneyFormatOptions = {
  display?: MoneyDisplay;
  /** The page's locale ("ar", or an `Intl` tag); used by `"localized"`. Default: the shop's default. */
  locale?: string | null;
  /**
   * Leave the decimals off whole amounts ("AED 63" instead of "AED 63.00"). An amount
   * with a fraction always shows all of the currency's decimals ("KWD 10.120").
   */
  trimWholeAmounts?: boolean;
};

/** Minor units shown when the currency code cannot be read. */
const FALLBACK_DIGITS = 2;

const digitsByCurrency = new Map<string, number>();
const reportedCodes = new Set<string>();

/** "kwd " → "KWD". */
export function normalizeCurrency(currency: string | null | undefined): string {
  return (currency ?? "").trim().toUpperCase();
}

function reportInvalidCurrency(code: string): void {
  if (reportedCodes.has(code)) return;
  reportedCodes.add(code);
  console.warn(`[money] unreadable currency code ${JSON.stringify(code)}; showing ${FALLBACK_DIGITS} decimals`);
}

/** The digits for a valid code, or null when there is no code or `Intl` cannot read it. */
function readDigits(code: string): number | null {
  if (!code) return null;
  const cached = digitsByCurrency.get(code);
  if (cached != null) return cached;
  try {
    const digits = new Intl.NumberFormat("en", { style: "currency", currency: code }).resolvedOptions()
      .maximumFractionDigits;
    if (digits == null) return null;
    digitsByCurrency.set(code, digits);
    return digits;
  } catch {
    reportInvalidCurrency(code);
    return null;
  }
}

/** The currency's minor units (ISO 4217, from `Intl`): KWD 3, AED 2, JPY 0; 2 for an unreadable code. */
export function currencyDigits(currency: string | null | undefined): number {
  return readDigits(normalizeCurrency(currency)) ?? FALLBACK_DIGITS;
}

/** A money value from the API ("63.00", 63, " 10.120 ") as a number; null when missing or not a number. */
export function parseMoney(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

/**
 * Whether `text` is a plain, non-negative decimal amount with at most the currency's
 * decimals: "10.120" or "10.12" for KWD, "65.00" for AED, "1500" for JPY (not "1,500" or "AED 65").
 */
export function isDecimalAmount(text: string | null | undefined, currency: string | null | undefined): boolean {
  const match = /^\d+(?:\.(\d+))?$/.exec((text ?? "").trim());
  return match != null && (match[1]?.length ?? 0) <= currencyDigits(currency);
}

function toNumber(amount: MoneyAmount): number {
  return parseMoney(amount) ?? Number.NaN;
}

/** `value × 10^exponent`, done on the decimal text so 1.005 × 100 is 100.5, not 100.49999999999999. */
function shiftDecimal(value: number, exponent: number): number {
  const [mantissa, power = "0"] = String(value).split("e");
  return Number(`${mantissa}e${Number(power) + exponent}`);
}

/** Round half away from zero at `digits` decimals (as `Intl` does), without binary drift (1.005 → 1.01). */
function roundTo(value: number, digits: number): number {
  const sign = value < 0 ? -1 : 1;
  const result = sign * shiftDecimal(Math.round(shiftDecimal(Math.abs(value), digits)), -digits);
  return Object.is(result, -0) ? 0 : result;
}

/** The amount rounded to the currency's minor units (KWD 10.1204 → 10.12; AED 19.755 → 19.76). */
export function roundMoney(amount: MoneyAmount, currency: string | null | undefined): number {
  const n = toNumber(amount);
  return Number.isFinite(n) ? roundTo(n, currencyDigits(currency)) : Number.NaN;
}

/**
 * The amount as a plain decimal string with exactly the currency's minor units, for
 * machines (JSON-LD `price`, payment widgets, analytics): KWD 10.12 → "10.120",
 * AED 250 → "250.00", JPY 1500 → "1500". Empty for a missing amount.
 */
export function toDecimalString(amount: MoneyAmount, currency: string | null | undefined): string {
  const n = toNumber(amount);
  if (!Number.isFinite(n)) return "";
  const digits = currencyDigits(currency);
  return roundTo(n, digits).toFixed(digits);
}

/** The amount in the currency's minor units, as an integer (KWD 10.12 → 10120, AED 10.5 → 1050, JPY 1500 → 1500). */
export function toMinorUnits(amount: MoneyAmount, currency: string | null | undefined): number {
  const n = toNumber(amount);
  if (!Number.isFinite(n)) return Number.NaN;
  const digits = currencyDigits(currency);
  return Math.round(shiftDecimal(roundTo(n, digits), digits));
}

/** An integer amount in minor units back to the major amount (KWD 10120 → 10.12). */
export function fromMinorUnits(minor: number, currency: string | null | undefined): number {
  return Number.isFinite(minor) ? shiftDecimal(minor, -currencyDigits(currency)) : Number.NaN;
}

type Resolved = { code: string; digits: number; valid: boolean; value: number; minimumDigits: number };

function resolve(amount: MoneyAmount, currency: string | null | undefined, trimWholeAmounts: boolean): Resolved | null {
  const n = toNumber(amount);
  if (!Number.isFinite(n)) return null;
  const code = normalizeCurrency(currency);
  const read = readDigits(code);
  const digits = read ?? FALLBACK_DIGITS;
  const value = roundTo(n, digits);
  const minimumDigits = trimWholeAmounts && Number.isInteger(value) ? 0 : digits;
  return { code, digits, valid: read != null, value, minimumDigits };
}

/** "250.00", "10.120", "63": Latin digits, "." decimal, no grouping (the house style's number). */
function plainNumber(r: Resolved): string {
  return r.value.toFixed(r.minimumDigits === 0 ? 0 : r.digits);
}

/** Joins the code and the number the house way ("KWD 10.120"; just the number without a code). */
function codeFirst(code: string, number: string): string {
  return code ? `${code} ${number}` : number;
}

/**
 * An amount for a shopper to read: "AED 250.00", "KWD 10.120", "JPY 1500"
 * (see `MoneyDisplay` and `MoneyFormatOptions`). Empty for a missing or unreadable amount.
 */
export function formatMoney(
  amount: MoneyAmount,
  currency: string | null | undefined,
  options: MoneyFormatOptions = {},
): string {
  const r = resolve(amount, currency, options.trimWholeAmounts ?? false);
  if (!r) return "";
  if (options.display === "localized" && r.valid) {
    return new Intl.NumberFormat(intlLocale(options.locale), {
      style: "currency",
      currency: r.code,
      minimumFractionDigits: r.minimumDigits,
      maximumFractionDigits: r.digits,
    }).format(r.value);
  }
  return codeFirst(r.code, plainNumber(r));
}

/** A formatted amount split into the currency sign and the number (for a large total: `<small>AED</small> 105`). */
export type MoneyParts = { currency: string; amount: string };

/**
 * `formatMoney` in two parts. `"code"`: the ISO code and the house-style number;
 * `"localized"`: the page language's currency sign ("د.إ.") and its number (grouped).
 * Null for a missing or unreadable amount.
 */
export function formatMoneyParts(
  amount: MoneyAmount,
  currency: string | null | undefined,
  options: MoneyFormatOptions = {},
): MoneyParts | null {
  const r = resolve(amount, currency, options.trimWholeAmounts ?? false);
  if (!r) return null;
  if (options.display === "localized" && r.valid) {
    const tag = intlLocale(options.locale);
    const number = new Intl.NumberFormat(tag, {
      minimumFractionDigits: r.minimumDigits,
      maximumFractionDigits: r.digits,
    }).format(r.value);
    const sign =
      new Intl.NumberFormat(tag, { style: "currency", currency: r.code })
        .formatToParts(r.value)
        .find((part) => part.type === "currency")?.value ?? r.code;
    return { currency: sign, amount: number };
  }
  return { currency: r.code, amount: plainNumber(r) };
}
