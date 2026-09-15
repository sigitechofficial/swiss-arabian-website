"use client";

import { useEffect, useId, useRef } from "react";
import { flagImageSrc } from "@/features/markets/utils/flagForMarket";

export type TopbarMenuOption = {
  id: string;
  label: string;
  flag?: string;
  lang?: string;
  countryCode?: string;
};

function TopbarFlag({
  flag,
  countryCode,
}: {
  flag?: string;
  countryCode?: string;
}) {
  if (countryCode) {
    return (
      <img
        className="topbar__flag-img"
        src={flagImageSrc(countryCode)}
        width={16}
        height={12}
        alt=""
        aria-hidden="true"
      />
    );
  }
  if (!flag) return null;
  return (
    <span className="topbar__flag" aria-hidden="true">
      {flag}
    </span>
  );
}

export function TopbarMenu({
  label,
  value,
  options,
  open,
  onOpenChange,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly TopbarMenuOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (id: string) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((option) => option.id === value) ?? options[0];

  useEffect(() => {
    if (!open) return;

    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  if (!selected) return null;

  return (
    <div
      className={open ? "topbar__menu is-open" : "topbar__menu"}
      ref={rootRef}
    >
      <button
        className="topbar__menu-trigger"
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        lang={selected.lang}
        onClick={() => onOpenChange(!open)}
      >
        <TopbarFlag flag={selected.flag} countryCode={selected.countryCode} />
        <span>{selected.label}</span>
        <svg
          className="topbar__caret"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          aria-hidden="true"
        >
          <path d="M2.5 4.5 6 8l3.5-3.5" />
        </svg>
      </button>
      {open ? (
        <ul
          className="topbar__menu-panel"
          id={listId}
          role="listbox"
          aria-label={label}
        >
          {options.map((option) => (
            <li key={option.id} role="presentation">
              <button
                className="topbar__menu-option"
                type="button"
                role="option"
                lang={option.lang}
                aria-selected={option.id === selected.id}
                onClick={() => {
                  onChange(option.id);
                  onOpenChange(false);
                }}
              >
                <TopbarFlag flag={option.flag} countryCode={option.countryCode} />
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
