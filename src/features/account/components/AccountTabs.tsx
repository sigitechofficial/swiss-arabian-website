"use client";

export type AccountTabOption<T extends string> = {
  value: T;
  label: string;
};

type AccountTabsProps<T extends string> = {
  options: readonly AccountTabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
};

/** Figma · Sub-Filter-Tabs (1203:8920 · 1236:9674) — underlined text tabs */
export function AccountUnderlineTabs<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: AccountTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex gap-6 overflow-x-auto border-b border-sa-border sm:gap-10"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={`relative shrink-0 pb-[14px] pt-4 text-[14px] whitespace-nowrap transition-colors ${
              active
                ? "font-semibold text-sa-primary"
                : "text-sa-secondary hover:text-sa-primary"
            }`}
          >
            {option.label}
            {active ? (
              <span
                className="absolute inset-x-0 bottom-0 h-0.5 bg-terra"
                aria-hidden
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** Figma · Filter-Bar pills (1318:10046) */
export function AccountPillTabs<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: AccountTabsProps<T>) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={`rounded-full px-4 py-[8px] text-[12px] transition-colors ${
              active
                ? "border border-sa-border bg-surface font-semibold text-sa-primary"
                : "text-sa-secondary hover:text-sa-primary"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
