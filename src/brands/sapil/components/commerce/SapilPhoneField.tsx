"use client";

import { useState, type ReactNode } from "react";
import { isValidPhoneNumber } from "libphonenumber-js";
import { Field } from "../../ui";

/** "+971501234567" → "501234567" for a +971 field (other numbers are shown whole). */
export function nationalPart(e164: string, dialCode: string): string {
  const value = e164.trim();
  if (!value) return "";
  if (value.startsWith(`+${dialCode}`)) return value.slice(dialCode.length + 1);
  if (value.startsWith("+")) return value;
  return value;
}

/** The typed national number with the field's dial code, as E.164 ("" when empty). */
export function toE164(national: string, dialCode: string): string {
  const trimmed = national.trim();
  if (trimmed.startsWith("+")) return `+${trimmed.replace(/\D/g, "")}`;
  const digits = trimmed.replace(/\D/g, "").replace(/^0+/, "");
  return digits ? `+${dialCode}${digits}` : "";
}

export function isValidMobile(e164: string): boolean {
  try {
    return Boolean(e164) && isValidPhoneNumber(e164);
  } catch {
    return false;
  }
}

/**
 * v9 `.phone` field: the market's dial code as a fixed prefix (+971), the
 * national number typed after it. Reports E.164 ("+971501234567").
 */
export function SapilPhoneField({
  id,
  label,
  dialCode,
  value,
  onChange,
  error,
  placeholder,
  wide,
  name,
  autoComplete = "tel-national",
}: {
  id: string;
  label: ReactNode;
  dialCode: string;
  value: string;
  onChange: (e164: string) => void;
  error?: ReactNode;
  placeholder?: string;
  wide?: boolean;
  name?: string;
  autoComplete?: string;
}) {
  // What the shopper typed (spaces kept); re-read when the value changes from outside (prefill).
  const [typed, setTyped] = useState(() => nationalPart(value, dialCode));
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    if (toE164(typed, dialCode) !== value) setTyped(nationalPart(value, dialCode));
  }
  return (
    <Field
      id={id}
      name={name}
      label={label}
      type="tel"
      inputMode="tel"
      autoComplete={autoComplete}
      prefix={<span dir="ltr">+{dialCode}</span>}
      placeholder={placeholder}
      value={typed}
      dir="ltr"
      onChange={(event) => {
        setTyped(event.target.value);
        const next = toE164(event.target.value, dialCode);
        setLastValue(next);
        onChange(next);
      }}
      error={error}
      wide={wide}
    />
  );
}
