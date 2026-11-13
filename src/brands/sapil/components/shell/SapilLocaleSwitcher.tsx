"use client";

import { useId } from "react";
import { useLanguageSwitch } from "@/hooks/useLanguageSwitch";
import { useMarket } from "@/providers/MarketProvider";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { cx } from "../../ui";

/* No v9 design: a pair of chip-styled selects (v9 `.chip` look), with the native picker for a11y. */
const SELECT =
  "h-[40px] ps-[16px] pe-[36px] rounded-full border border-sapil-line-2 bg-sapil-card text-[14px] font-[500] text-sapil-ink appearance-none cursor-pointer [transition:border-color_.18s] hover:border-sapil-ink bg-no-repeat [background-position:right_14px_center] rtl:[background-position:left_14px_center] [background-size:14px]";
const ARROW = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231e1b18' stroke-width='1.8'%3E%3Cpath d='m7 10 5 5 5-5'/%3E%3C/svg%3E")`;

/** Country (market) and language pickers, from the market provider. Hidden when there is nothing to choose. */
export function SapilLocaleSwitcher({ className }: { className?: string }) {
  const t = useSapilCopy();
  const id = useId();
  const { marketId, setMarketId, regionOptions, languageOptions } = useMarket();
  const { languageId, setLanguageId } = useLanguageSwitch();
  const showMarket = regionOptions.length > 1;
  const showLanguage = languageOptions.length > 1;
  if (!showMarket && !showLanguage) return null;
  return (
    <div className={cx("flex flex-wrap items-center gap-[8px]", className)}>
      {showMarket ? (
        <span className="inline-flex items-center gap-[8px]">
          <label htmlFor={`${id}-market`} className="sr-only">
            {t("shell.country")}
          </label>
          <select
            id={`${id}-market`}
            value={marketId ?? regionOptions[0]?.id ?? ""}
            onChange={(e) => setMarketId(e.target.value)}
            className={SELECT}
            style={{ backgroundImage: ARROW }}
          >
            {regionOptions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.flag ? `${r.flag} ` : ""}
                {r.label}
              </option>
            ))}
          </select>
        </span>
      ) : null}
      {showLanguage ? (
        <span className="inline-flex items-center gap-[8px]">
          <label htmlFor={`${id}-lang`} className="sr-only">
            {t("shell.language")}
          </label>
          <select
            id={`${id}-lang`}
            value={languageId}
            onChange={(e) => setLanguageId(e.target.value)}
            className={SELECT}
            style={{ backgroundImage: ARROW }}
          >
            {languageOptions.map((l) => (
              <option key={l.id} value={l.id} lang={l.lang}>
                {l.label}
              </option>
            ))}
          </select>
        </span>
      ) : null}
    </div>
  );
}
