"use client";

import { phoneCc, phoneNum } from "@/styles/checkoutChrome";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { CountryFlag as Flag } from "./phone/CountryFlag";
import { toE164, usePhoneNumberField } from "./phone/usePhoneNumberField";

/** Kept for callers that import it from here. */
export { toE164 };

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
  const fieldLabel = label ?? t("phone.label");
  const styles = VARIANTS[variant];
  const phone = usePhoneNumberField({ value, onChange });
  const { open, setOpen, query, setQuery, rootRef, inputRef, national, maxNationalDigits } = phone;
  const activeCountry = phone.country;
  const filtered = phone.countries;

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
      placeholder={phone.example}
      value={national}
      maxLength={maxNationalDigits}
      pattern="[0-9]*"
      onBlur={onBlur}
      onChange={(event) => phone.type(event.target.value)}
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
            aria-label={t("phone.countryAria", { country: phone.countryLabel, dial: phone.dial })}
            onClick={() => setOpen((v) => !v)}
          >
            <Flag country={activeCountry} />
            <span dir="ltr">+{phone.dial}</span>
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
                      onClick={() => phone.pick(code)}
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
