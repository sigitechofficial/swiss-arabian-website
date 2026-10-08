"use client";

import {
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";

const LENGTH = 6;

type AuthOtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export function AuthOtpInput({ value, onChange, error }: AuthOtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] ?? "");

  function setDigit(index: number, char: string) {
    const next = digits.slice();
    next[index] = char;
    onChange(next.join("").slice(0, LENGTH));
  }

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    setDigit(index, digit);
    if (digit && index < LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, LENGTH);
    if (!pasted) return;
    onChange(pasted);
    refs.current[Math.min(pasted.length, LENGTH) - 1]?.focus();
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center justify-center gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            aria-label={`Digit ${index + 1}`}
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={`h-14 w-12 border-[1.5px] bg-page text-center text-lg font-semibold text-sa-primary outline-none focus:border-[var(--sa-border-focus)] ${
              error ? "border-[var(--sa-action-danger)]" : "border-sa-input"
            }`}
          />
        ))}
      </div>
      {error ? (
        <p className="text-center text-xs text-[var(--sa-action-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
