import type { ReactNode } from "react";
import { filtersGroup, filtersLabel, filtersList, railFilter, railFilterCount } from "../../catalogChrome";
import type { StorefrontFacetOption } from "../../types/catalogFacets";

type CatalogFilterChoicesProps = {
  label: string;
  allLabel: string;
  allSuffix?: ReactNode;
  value: string;
  options: StorefrontFacetOption[];
  onChange: (value: string) => void;
};

export function CatalogFilterChoices({
  label,
  allLabel,
  allSuffix,
  value,
  options,
  onChange,
}: CatalogFilterChoicesProps) {
  return (
    <div className={filtersGroup} role="group" aria-label={label}>
      <p className={filtersLabel}>{label}</p>
      <ul className={filtersList} role="list">
        <li>
          <button className={railFilter} type="button" aria-pressed={value === "all"} onClick={() => onChange("all")}>
            {allLabel}
            {allSuffix}
          </button>
        </li>
        {options.map((option) => (
          <li key={option.code}>
            <button
              className={railFilter}
              type="button"
              aria-pressed={value === option.code}
              onClick={() => onChange(option.code)}
            >
              {option.label} <span className={railFilterCount}>({option.count})</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
