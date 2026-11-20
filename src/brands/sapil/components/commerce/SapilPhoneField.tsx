"use client";

import { useId, type ReactNode } from "react";
import { CountryFlag } from "@/components/ui/phone/CountryFlag";
import { exampleForNumber, isValidMobile, usePhoneNumberField } from "@/components/ui/phone/usePhoneNumberField";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { FieldFrame, cx, fieldControlClass } from "../../ui";

export { exampleForNumber, isValidMobile };

/**
 * v9 `.phone` field with a country picker (flag + dial code, the Gulf markets
 * first, search), the national number typed after it. Starts on the market's
 * country; reports E.164 ("+971501234567"). Same behaviour as Swiss Arabian
 * (shared usePhoneNumberField).
 */
export function SapilPhoneField({
  id,
  label,
  value,
  onChange,
  error,
  wide,
  name,
  autoComplete = "tel-national",
}: {
  id: string;
  label: ReactNode;
  value: string;
  onChange: (e164: string) => void;
  error?: ReactNode;
  wide?: boolean;
  name?: string;
  autoComplete?: string;
}) {
  const t = useShopCopy();
  const { rootRef, inputRef, ...phone } = usePhoneNumberField({ value, onChange });
  const listId = useId();
  const errorId = `${id}-err`;
  return (
    <FieldFrame id={id} errorId={errorId} label={label} error={error} wide={wide}>
      <div className="flex gap-[8px]" dir="ltr">
        <div className="relative shrink-0" ref={rootRef}>
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={phone.open}
            aria-controls={phone.open ? listId : undefined}
            aria-label={t("phone.countryAria", { country: phone.countryLabel, dial: phone.dial })}
            onClick={phone.toggle}
            className={cx(fieldControlClass(Boolean(error)), "!w-auto inline-flex items-center gap-[8px] px-[12px] cursor-pointer font-[600]")}
          >
            <CountryFlag country={phone.country} />
            <span>+{phone.dial}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M2.5 4.5 6 8l3.5-3.5" />
            </svg>
          </button>
          {phone.open ? (
            <div className="absolute start-0 top-[calc(100%+6px)] z-[40] w-[290px] overflow-hidden rounded-[16px] border border-sapil-line bg-sapil-white shadow-sapil-lg">
              <div className="p-[10px] border-b border-sapil-line">
                <input
                  autoFocus
                  type="search"
                  autoComplete="off"
                  name="country-search"
                  value={phone.query}
                  onChange={(event) => phone.setQuery(event.target.value)}
                  placeholder={t("phone.search")}
                  aria-label={t("phone.searchAria")}
                  className="h-[40px] w-full rounded-[12px] border border-sapil-line-2 bg-sapil-card px-[12px] text-[14px] outline-none focus:border-sapil-accent"
                />
              </div>
              <ul id={listId} role="listbox" aria-label={t("phone.codeAria")} className="max-h-[260px] overflow-auto py-[4px] list-none m-0 p-0">
                {phone.countries.map((c) => (
                  <li key={c.code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={c.code === phone.country}
                      onClick={() => phone.pick(c.code)}
                      className={cx(
                        "flex w-full items-center gap-[10px] px-[14px] py-[9px] text-start text-[14px] hover:bg-sapil-paper",
                        c.code === phone.country && "bg-sapil-paper font-[600] text-sapil-accent",
                      )}
                    >
                      <CountryFlag country={c.code} />
                      <span className="min-w-0 flex-1 truncate">{c.name}</span>
                      <span className="shrink-0 text-sapil-ink-2">+{c.dial}</span>
                    </button>
                  </li>
                ))}
                {phone.countries.length === 0 ? <li className="px-[14px] py-[12px] text-[14px] text-sapil-ink-2">{t("phone.noMatch")}</li> : null}
              </ul>
            </div>
          ) : null}
        </div>
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="tel"
          inputMode="tel"
          autoComplete={autoComplete}
          placeholder={phone.example}
          value={phone.national}
          maxLength={phone.maxNationalDigits}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => phone.type(event.target.value)}
          className={cx(fieldControlClass(Boolean(error)), "min-w-0 flex-1")}
        />
      </div>
    </FieldFrame>
  );
}
