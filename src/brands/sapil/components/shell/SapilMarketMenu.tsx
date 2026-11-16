"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MediaImage } from "@/components/ui/MediaImage";
import { flagImageSrc } from "@/features/markets/utils/flagForMarket";
import { useLanguageSwitch } from "@/hooks/useLanguageSwitch";
import { useMarket } from "@/providers/MarketProvider";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { cx } from "../../ui";
import { ChevronDownIcon } from "../shared/icons";

type Flagged = { flag?: string; countryCode?: string };

function Flag({ flag, countryCode }: Flagged) {
  if (countryCode) {
    return (
      <MediaImage
        src={flagImageSrc(countryCode)}
        width={20}
        height={14}
        alt=""
        aria-hidden="true"
        className="w-[20px] h-[14px] rounded-[3px] object-cover shadow-[0_0_0_1px_rgba(30,27,24,.08)] flex-none"
      />
    );
  }
  return flag ? (
    <span aria-hidden="true" className="text-[16px] leading-none">
      {flag}
    </span>
  ) : null;
}

const OPTION =
  "flex w-full items-center gap-[10px] min-h-[44px] px-[12px] rounded-[12px] text-start text-[14px] font-[500] text-sapil-ink [transition:background_.18s] hover:bg-sapil-paper aria-[current=true]:bg-sapil-paper aria-[current=true]:font-[700]";
const HEADING = "text-[12px] font-[700] tracking-[.1em] uppercase text-sapil-muted mt-0 mb-[6px] ms-[12px]";

/**
 * Header "ship to" chip (no v9 design; Swiss Arabian's top-bar "Ship to" and
 * language menus in Sapil's chip look). Shows the market's flag and name and
 * opens a card with the brand's markets and the market's languages. Choosing a
 * market switches it in place; choosing a language reloads the page in it.
 * Hidden when there is nothing to choose.
 */
export function SapilMarketMenu() {
  const t = useSapilCopy();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const { marketId, setMarketId, regionOptions, languageOptions } = useMarket();
  const { languageId, setLanguageId } = useLanguageSwitch();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const showMarkets = regionOptions.length > 1;
  const showLanguages = languageOptions.length > 1;
  if (!showMarkets && !showLanguages) return null;

  const market = regionOptions.find((r) => r.id === marketId) ?? regionOptions[0];
  const language = languageOptions.find((l) => l.id === languageId) ?? languageOptions[0];
  const summary = [market?.label, language?.label].filter(Boolean).join(", ");

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        data-sapil-market-menu=""
        aria-label={t("shell.countryAndLanguage", { current: summary })}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-[8px] h-[40px] ps-[12px] pe-[10px] me-[6px] rounded-full border border-sapil-line-2 bg-sapil-card text-[14px] font-[600] text-sapil-ink whitespace-nowrap [transition:border-color_.18s] hover:border-sapil-ink aria-expanded:border-sapil-ink [&_svg]:w-[16px] [&_svg]:h-[16px] [&_svg]:[transition:transform_.2s_var(--sapil-ease)] aria-expanded:[&_svg]:[transform:rotate(180deg)]"
      >
        {market ? <Flag flag={market.flag} countryCode={market.countryCode} /> : null}
        {market ? <span>{market.label}</span> : null}
        {showLanguages && language ? (
          <span className="text-sapil-muted font-[500] uppercase" lang={language.lang}>
            {language.id}
          </span>
        ) : null}
        <ChevronDownIcon />
      </button>
      {open ? (
        <div
          id={panelId}
          className="absolute top-[calc(100%+8px)] end-0 z-[45] w-[260px] bg-sapil-white rounded-[20px] p-[10px] shadow-[0_2px_4px_rgba(60,45,30,.06),0_30px_60px_-24px_rgba(60,45,30,.35)]"
        >
          {showMarkets ? (
            <div role="group" aria-label={t("shell.shipTo")}>
              <p className={cx(HEADING, "mt-[6px]")}>{t("shell.shipTo")}</p>
              <ul className="m-0 p-0 list-none">
                {regionOptions.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      aria-current={r.id === market?.id ? "true" : undefined}
                      onClick={() => {
                        setOpen(false);
                        if (r.id !== market?.id) setMarketId(r.id);
                      }}
                      className={OPTION}
                    >
                      <Flag flag={r.flag} countryCode={r.countryCode} />
                      {r.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {showLanguages ? (
            <div role="group" aria-label={t("shell.language")} className={cx(showMarkets && "mt-[8px] pt-[8px] border-t border-sapil-line")}>
              <p className={cx(HEADING, "mt-[6px]")}>{t("shell.language")}</p>
              <ul className="m-0 p-0 list-none">
                {languageOptions.map((l) => (
                  <li key={l.id}>
                    <button
                      type="button"
                      lang={l.lang}
                      aria-current={l.id === language?.id ? "true" : undefined}
                      onClick={() => {
                        setOpen(false);
                        if (l.id !== language?.id) setLanguageId(l.id);
                      }}
                      className={OPTION}
                    >
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
