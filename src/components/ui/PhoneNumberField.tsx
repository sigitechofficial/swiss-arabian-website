"use client";

// Country flag sprites (real SVGs: Windows renders no flag emoji). Imported here, not in
// globals.css, so only pages with a phone field load the ~270-flag stylesheet.
import "flag-icons/css/flag-icons.min.css";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import { phoneCc, phoneNum } from "@/styles/checkoutChrome";
import { useMarket } from "@/providers/MarketProvider";
import { intlLocale } from "@/lib/i18n/locales";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { useShopCopy } from "@/lib/i18n/useShopCopy";

/** Shown first — the markets the storefront actually ships to. */
const PREFERRED: CountryCode[] = ["AE", "SA", "QA", "KW", "BH", "OM"];
const FALLBACK_COUNTRY: CountryCode = "AE";

function asCountry(code: string | null | undefined): CountryCode | null {
  const upper = code?.trim().toUpperCase();
  return upper && (getCountries() as string[]).includes(upper) ? (upper as CountryCode) : null;
}

function countryName(country: string, locale = "en"): string {
  try {
    return new Intl.DisplayNames([locale === "en" ? "en" : intlLocale(locale)], { type: "region" }).of(country) ?? country;
  } catch {
    return country;
  }
}

/** Real SVG sprite (flag-icons) — Windows renders no flag emoji at all. */
function Flag({ country }: { country: string }) {
  return (
    <span
      className={`fi fi-${country.toLowerCase()} h-[14px] w-[19px] shrink-0 rounded-[2px] bg-cover`}
      aria-hidden="true"
    />
  );
}

/** Each surface keeps its own field styling; the behaviour is identical. */
type PhoneVariant = "auth" | "account" | "checkout";

const VARIANTS: Record<PhoneVariant, { trigger: string; input: string; wrapInput: boolean }> = {
  auth: {
    trigger:
      "flex h-[40px] cursor-pointer items-center gap-2 rounded-[10px] border border-sa-input bg-surface px-3 text-sm text-sa-primary outline-none sm:text-[12.5px]",
    input:
      "block w-full appearance-none border-0 bg-transparent px-4 py-2.5 text-sm font-normal text-sa-primary shadow-none outline-none ring-0 placeholder:text-sa-muted focus:outline-none focus:ring-0 focus-visible:outline-none sm:text-[12.5px]",
    wrapInput: true,
  },
  account: {
    trigger:
      "flex h-11 cursor-pointer items-center gap-2 rounded-md border border-sa-input bg-white px-3 text-[14px] text-sa-primary outline-none",
    input:
      "h-11 w-full min-w-0 rounded-md border border-sa-input bg-white px-3.5 text-[14px] text-sa-primary outline-none placeholder:text-sa-muted focus:outline-none focus-visible:outline-none",
    wrapInput: false,
  },
  checkout: {
    trigger: phoneCc,
    input: phoneNum,
    wrapInput: false,
  },
};

type PhoneNumberFieldProps = {
  id?: string;
  label?: string;
  /** Off when the surrounding form already renders its own label. */
  renderLabel?: boolean;
  hint?: string;
  error?: string;
  variant?: PhoneVariant;
  required?: boolean;
  name?: string;
  /** Full number in E.164 (`+971501234567`), or "" while empty. */
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  autoComplete?: string;
};

/**
 * Country picker + national number, side by side. The parent always receives
 * one E.164 string; `libphonenumber-js` supplies dial codes and validation.
 * The picker is a custom listbox rather than a `<select>`: native options can
 * only hold text, so flags would be impossible.
 */
export function PhoneNumberField({
  id = "phone",
  label,
  renderLabel = true,
  hint,
  error,
  variant = "auth",
  required,
  name,
  value,
  onChange,
  onBlur,
  autoComplete = "tel",
}: PhoneNumberFieldProps) {
  const t = useShopCopy();
  const locale = useShopLocale();
  const fieldLabel = label ?? t("phone.label");
  const parsed = value ? parsePhoneNumberFromString(value) : undefined;
  // An empty field starts on the selected market's country (+974 in Qatar).
  const marketCountry = asCountry(useMarket().catalogContext?.countryCode) ?? FALLBACK_COUNTRY;
  const [country, setCountry] = useState<CountryCode>(
    (parsed?.country as CountryCode | undefined) ?? marketCountry,
  );
  // Follow a market switch while nothing has been typed yet.
  const [lastMarketCountry, setLastMarketCountry] = useState(marketCountry);
  if (marketCountry !== lastMarketCountry) {
    setLastMarketCountry(marketCountry);
    if (!value) setCountry(marketCountry);
  }
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const styles = VARIANTS[variant];

  // A parsed number wins: pasting "+9665…" switches the picker to Saudi Arabia.
  const activeCountry = (parsed?.country as CountryCode | undefined) ?? country;
  const national = parsed ? parsed.nationalNumber.toString() : stripDialCode(value, activeCountry);
  // E.164 allows 15 digits in total, dial code included.
  const maxNationalDigits = 15 - getCountryCallingCode(activeCountry).length;

  const countries = useMemo(() => {
    const all = getCountries();
    const rest = all
      .filter((code) => !PREFERRED.includes(code))
      .map((code) => ({ code, name: countryName(code, locale), dial: getCountryCallingCode(code) }))
      .sort((a, b) => a.name.localeCompare(b.name, locale));
    return [
      ...PREFERRED.filter((code) => all.includes(code)).map((code) => ({
        code,
        name: countryName(code, locale),
        dial: getCountryCallingCode(code),
      })),
      ...rest,
    ];
  }, [locale]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    const digits = q.replace(/\D/g, "");
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (digits && c.dial.startsWith(digits)),
    );
  }, [countries, query]);

  // A prefilled number with the dial code doubled (`+971971…`) is repaired once.
  useEffect(() => {
    if (!value || isValidPhoneNumber(value)) return;
    const repaired = toE164(activeCountry, national);
    if (repaired !== value && isValidPhoneNumber(repaired)) onChange(repaired);
  }, [value, activeCountry, national, onChange]);

  // Forms that call `reportValidity()` (checkout) must not submit a number
  // the payment providers will reject — Tabby fails the whole session on it.
  useEffect(() => {
    inputRef.current?.setCustomValidity(
      value && !isValidPhoneNumber(value) ? t("phone.invalid") : "",
    );
  }, [value, t]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function emit(nextCountry: CountryCode, nextNational: string) {
    onChange(toE164(nextCountry, nextNational));
  }

  function pick(nextCountry: CountryCode) {
    setCountry(nextCountry);
    emit(nextCountry, national);
    setOpen(false);
    setQuery("");
  }

  const numberInput = (
    <input
      ref={inputRef}
      id={id}
      name={name}
      type="tel"
      inputMode="tel"
      required={required}
      autoComplete={autoComplete}
      className={styles.input}
      placeholder="50 123 4567"
      value={national}
      maxLength={maxNationalDigits}
      pattern="[0-9]*"
      onBlur={onBlur}
      onChange={(event) => {
        // Digits only, and never more than E.164 allows for this country.
        const digits = event.target.value.replace(/\D/g, "").slice(0, maxNationalDigits);
        setCountry(activeCountry);
        emit(activeCountry, digits);
      }}
    />
  );

  return (
    <div className="flex w-full flex-col gap-1.5">
      {renderLabel ? (
        <label htmlFor={id} className="text-[12px] font-normal leading-normal text-sa-secondary">
          {fieldLabel}
        </label>
      ) : null}

      <div className="flex w-full items-center gap-2">
        <div className="relative shrink-0" ref={rootRef}>
          <button
            type="button"
            className={styles.trigger}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label={t("phone.countryAria", { country: countryName(activeCountry, locale), dial: getCountryCallingCode(activeCountry) })}
            onClick={() => setOpen((v) => !v)}
          >
            <Flag country={activeCountry} />
            <span dir="ltr">+{getCountryCallingCode(activeCountry)}</span>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M2.5 4.5 6 8l3.5-3.5" />
            </svg>
          </button>

          {open ? (
            <div className="absolute left-0 top-[calc(100%+4px)] z-30 w-[268px] overflow-hidden rounded-md border border-sa-border bg-white text-left shadow-[0_12px_32px_-12px_rgba(36,31,27,0.35)]">
              <div className="border-b border-sa-border p-2">
                <input
                  autoFocus
                  type="search"
                  autoComplete="off"
                  name="country-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("phone.search")}
                  aria-label={t("phone.searchAria")}
                  className="h-9 w-full rounded-[8px] border border-sa-input bg-surface px-2.5 text-[12.5px] text-sa-primary outline-none placeholder:text-sa-muted focus:outline-none focus-visible:outline-none"
                />
              </div>
              <ul className="max-h-64 overflow-auto py-1" role="listbox" aria-label={t("phone.codeAria")}>
                {filtered.map(({ code, name: label, dial }) => (
                  <li key={code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={code === activeCountry}
                      onClick={() => pick(code)}
                      className={`flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors hover:bg-section-soft ${
                        code === activeCountry ? "bg-section-soft font-semibold text-terra" : "text-sa-primary"
                      }`}
                    >
                      <Flag country={code} />
                      <span className="min-w-0 flex-1 truncate">{label}</span>
                      <span className="shrink-0 text-sa-secondary" dir="ltr">+{dial}</span>
                    </button>
                  </li>
                ))}
                {filtered.length === 0 ? (
                  <li className="px-3 py-3 text-[13px] text-sa-secondary">{t("phone.noMatch")}</li>
                ) : null}
              </ul>
            </div>
          ) : null}
        </div>

        {styles.wrapInput ? (
          <div
            className={`min-w-0 flex-1 rounded-[10px] border bg-surface ${
              error ? "border-[var(--sa-action-danger)]" : "border-sa-input"
            }`}
          >
            {numberInput}
          </div>
        ) : (
          numberInput
        )}
      </div>

      {error ? (
        <p className="text-[11px] leading-normal text-[var(--sa-action-danger)]">{error}</p>
      ) : hint ? (
        <p className="text-[11px] leading-normal text-sa-secondary">{hint}</p>
      ) : null}
    </div>
  );
}

/**
 * E.164 from the picker country + whatever was typed in the number box.
 * Shoppers often type the dial code again (`971 50…` next to `+971`) or a
 * trunk zero (`050…`); once that reads as a valid number, keep only the
 * national part so we never send `+971971…`.
 */
export function toE164(country: CountryCode, typed: string): string {
  const digits = typed.replace(/\D/g, "");
  if (!digits) return "";
  const dial = getCountryCallingCode(country);
  const plain = `+${dial}${digits}`;
  // `.number` is the canonical form: `+9710501…` comes back as `+971501…`.
  const asTyped = parsePhoneNumberFromString(plain);
  if (asTyped?.isValid()) return asTyped.number;
  const asNational = parsePhoneNumberFromString(digits, country);
  if (asNational?.isValid() && asNational.countryCallingCode === dial) {
    return asNational.number;
  }
  return plain;
}

/** Digits typed before the number parses — drop a leading dial code if present. */
function stripDialCode(raw: string, country: CountryCode): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const dial = getCountryCallingCode(country);
  const national = digits.startsWith(dial) ? digits.slice(dial.length) : digits;
  return new AsYouType(country).input(national);
}
