"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import examples from "libphonenumber-js/examples.mobile.json";
import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import { intlLocale } from "@/lib/i18n/locales";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { useMarket } from "@/providers/MarketProvider";

/** Shown first: the markets the storefront ships to. */
const PREFERRED: CountryCode[] = ["AE", "SA", "QA", "KW", "BH", "OM"];
const FALLBACK_COUNTRY: CountryCode = "AE";

function asCountry(code: string | null | undefined): CountryCode | null {
  const upper = code?.trim().toUpperCase();
  return upper && (getCountries() as string[]).includes(upper) ? (upper as CountryCode) : null;
}

export function countryName(country: string, locale = "en"): string {
  try {
    return new Intl.DisplayNames([locale === "en" ? "en" : intlLocale(locale)], { type: "region" }).of(country) ?? country;
  } catch {
    return country;
  }
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

/** Digits typed before the number parses: drop a leading dial code if present. */
function stripDialCode(raw: string, country: CountryCode): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const dial = getCountryCallingCode(country);
  const national = digits.startsWith(dial) ? digits.slice(dial.length) : digits;
  return new AsYouType(country).input(national);
}

/** A stored number for reading ("+971501234567" → "+971 50 123 4567"); kept as it is when it doesn't parse. */
export function formatPhoneNumber(e164: string | null | undefined): string {
  const value = (e164 ?? "").trim();
  if (!value) return "";
  return parsePhoneNumberFromString(value)?.formatInternational() ?? value;
}

/** A mobile number of that country as the shopper types it ("50 123 4567" for AE, "51 234 5678" for SA). */
export function exampleNationalNumber(country: CountryCode): string {
  const example = getExampleNumber(country, examples);
  return example ? new AsYouType(country).input(example.nationalNumber) : "";
}

/** A complete, valid number (E.164). */
export function isValidMobile(e164: string): boolean {
  try {
    return Boolean(e164) && isValidPhoneNumber(e164);
  } catch {
    return false;
  }
}

/**
 * Country picker + national number for every brand's phone field. The parent
 * always receives one E.164 string; `libphonenumber-js` supplies dial codes
 * and validation. An empty field starts on the selected market's country;
 * pasting "+9665…" switches the picker to Saudi Arabia. Each brand draws the
 * trigger, list and input; this holds the behaviour.
 */
export function usePhoneNumberField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const t = useShopCopy();
  const locale = useShopLocale();
  const parsed = value ? parsePhoneNumberFromString(value) : undefined;
  const marketCountry = asCountry(useMarket().catalogContext?.countryCode) ?? FALLBACK_COUNTRY;
  const [country, setCountry] = useState<CountryCode>((parsed?.country as CountryCode | undefined) ?? marketCountry);
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

  const activeCountry = (parsed?.country as CountryCode | undefined) ?? country;
  const national = parsed ? parsed.nationalNumber.toString() : stripDialCode(value, activeCountry);
  const dial = getCountryCallingCode(activeCountry);
  // E.164 allows 15 digits in total, dial code included.
  const maxNationalDigits = 15 - dial.length;

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
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || (digits && c.dial.startsWith(digits)),
    );
  }, [countries, query]);

  // A prefilled number with the dial code doubled (`+971971…`) is repaired once.
  useEffect(() => {
    if (!value || isValidPhoneNumber(value)) return;
    const repaired = toE164(activeCountry, national);
    if (repaired !== value && isValidPhoneNumber(repaired)) onChange(repaired);
  }, [value, activeCountry, national, onChange]);

  // Forms that call `reportValidity()` (checkout) must not submit a number the
  // payment providers will reject (Tabby fails the whole session on it).
  useEffect(() => {
    inputRef.current?.setCustomValidity(value && !isValidPhoneNumber(value) ? t("phone.invalid") : "");
  }, [value, t]);

  // The list closes on a click outside or Escape.
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

  return {
    country: activeCountry,
    countryLabel: countryName(activeCountry, locale),
    /** The number box's example, for the chosen country. */
    example: exampleNationalNumber(activeCountry),
    dial,
    national,
    maxNationalDigits,
    countries: filtered,
    query,
    setQuery,
    open,
    setOpen,
    rootRef,
    inputRef,
    /** Choose a country from the list (keeps the typed number). */
    pick(nextCountry: CountryCode) {
      setCountry(nextCountry);
      onChange(toE164(nextCountry, national));
      setOpen(false);
      setQuery("");
    },
    /** The number box changed: digits only, never more than E.164 allows. */
    type(raw: string) {
      const digits = raw.replace(/\D/g, "").slice(0, maxNationalDigits);
      setCountry(activeCountry);
      onChange(toE164(activeCountry, digits));
    },
  };
}
