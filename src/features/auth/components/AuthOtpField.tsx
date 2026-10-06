"use client";

import { useRef } from "react";

const LENGTH = 6;

function slotsFrom(value: string): string[] {
  const slots = Array.from({ length: LENGTH }, () => "");
  value
    .replace(/\D/g, "")
    .slice(0, LENGTH)
    .split("")
    .forEach((digit, index) => {
      slots[index] = digit;
    });
  return slots;
}

export function AuthOtpField({
  id = "otp",
  label = "Sign-in code",
  value,
  onChange,
  error,
  disabled = false,
  autoFocus = false,
}: {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const slots = slotsFrom(value);

  function focusAt(index: number) {
    inputs.current[Math.max(0, Math.min(LENGTH - 1, index))]?.focus();
  }

  function commit(nextSlots: string[], focusIndex?: number) {
    onChange(nextSlots.join(""));
    if (focusIndex != null) focusAt(focusIndex);
  }

  function handlePaste(index: number, text: string) {
    const digits = text.replace(/\D/g, "").slice(0, LENGTH - index);
    if (!digits) return;
    const next = slots.slice();
    digits.split("").forEach((digit, offset) => {
      next[index + offset] = digit;
    });
    commit(next, index + digits.length);
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <label htmlFor={`${id}-0`} className="text-[12px] font-normal leading-normal text-sa-secondary">
        {label}
      </label>
      <div className="flex justify-between gap-2" role="group" aria-label={label}>
        {slots.map((digit, index) => (
          <div
            key={index}
            className={`h-[52px] min-w-0 flex-1 overflow-hidden rounded-[10px] border bg-surface ${
              error ? "border-[var(--sa-action-danger)]" : "border-sa-input"
            }`}
          >
          <input
            id={`${id}-${index}`}
            ref={(node) => {
              inputs.current[index] = node;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            autoFocus={autoFocus && index === 0}
            maxLength={index === 0 ? LENGTH : 1}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-label={`Digit ${index + 1} of ${LENGTH}`}
            value={digit}
            className="h-full w-full appearance-none border-0 bg-transparent text-center text-[1.125rem] font-medium tracking-wide text-sa-primary shadow-none outline-none ring-0 focus:outline-none focus-visible:outline-none"
            onChange={(event) => {
              const raw = event.target.value.replace(/\D/g, "");
              if (raw.length > 1) {
                handlePaste(index, raw);
                return;
              }
              const next = slots.slice();
              next[index] = raw.slice(-1);
              commit(next, raw ? index + 1 : index);
            }}
            onKeyDown={(event) => {
              if (event.key === "Backspace" && !slots[index] && index > 0) {
                event.preventDefault();
                const next = slots.slice();
                next[index - 1] = "";
                commit(next, index - 1);
              }
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                focusAt(index - 1);
              }
              if (event.key === "ArrowRight") {
                event.preventDefault();
                focusAt(index + 1);
              }
            }}
            onPaste={(event) => {
              event.preventDefault();
              handlePaste(index, event.clipboardData.getData("text"));
            }}
            onFocus={(event) => event.currentTarget.select()}
          />
          </div>
        ))}
      </div>
      {error ? <p className="text-[11px] leading-normal text-[var(--sa-action-danger)]">{error}</p> : null}
    </div>
  );
}
