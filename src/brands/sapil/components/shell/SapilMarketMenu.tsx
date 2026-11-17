"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MediaImage } from "@/components/ui/MediaImage";
import { flagImageSrc } from "@/features/markets/utils/flagForMarket";
import { useLanguageSwitch } from "@/hooks/useLanguageSwitch";
import { useMarket } from "@/providers/MarketProvider";
import { useSapilCopy } from "../../i18n/SapilCopy";
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

export type PickerOption = Flagged & { id: string; label: string; lang?: string };

const TRIGGER_BASE =
  "inline-flex items-center rounded-full border text-sapil-ink whitespace-nowrap [transition:border-color_.18s,background_.18s] hover:border-sapil-ink aria-expanded:border-sapil-ink [&_svg]:[transition:transform_.2s_var(--sapil-ease)] aria-expanded:[&_svg]:[transform:rotate(180deg)]";
const TRIGGER = `${TRIGGER_BASE} gap-[8px] h-[40px] ps-[12px] pe-[10px] border-sapil-line-2 bg-sapil-card text-[14px] font-[600] [&_svg]:w-[16px] [&_svg]:h-[16px]`;
/** For the mint top bar: shorter, smaller type, a light white wash that reads on mint. */
const TRIGGER_COMPACT = `${TRIGGER_BASE} gap-[6px] h-[30px] ps-[10px] pe-[8px] border-transparent bg-sapil-white/55 hover:bg-sapil-white/80 aria-expanded:bg-sapil-white text-[13px] font-[600] [&_svg]:w-[14px] [&_svg]:h-[14px]`;

const OPTION =
  "flex w-full items-center gap-[10px] min-h-[44px] px-[12px] rounded-[12px] text-start text-[14px] font-[500] text-sapil-ink [transition:background_.18s] hover:bg-sapil-paper aria-selected:bg-sapil-paper aria-selected:font-[700]";

/**
 * One header dropdown in Sapil's chip look (no v9 design; Swiss Arabian's top-bar
 * "Ship to" and language menus): the chip shows the current choice, the card lists
 * the others. Escape or a click outside closes it and focus returns to the chip.
 */
export function SapilHeaderPicker({
  label,
  value,
  options,
  onChange,
  withFlags = false,
  compact = false,
}: {
  /** What is being picked ("Ship to", "Language"): the list's name and the chip's prefix. */
  label: string;
  value: string | null;
  options: readonly PickerOption[];
  onChange: (id: string) => void;
  withFlags?: boolean;
  /** The top bar's smaller chip. */
  compact?: boolean;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

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

  const selected = options.find((o) => o.id === value) ?? options[0];
  if (!selected) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={`${label}: ${selected.label}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        lang={selected.lang}
        onClick={() => setOpen((v) => !v)}
        className={compact ? TRIGGER_COMPACT : TRIGGER}
      >
        {withFlags ? <Flag flag={selected.flag} countryCode={selected.countryCode} /> : null}
        <span>{selected.label}</span>
        <ChevronDownIcon />
      </button>
      {open ? (
        <div className="absolute top-[calc(100%+8px)] end-0 z-[45] w-[240px] text-start bg-sapil-white rounded-[20px] p-[10px] shadow-[0_2px_4px_rgba(60,45,30,.06),0_30px_60px_-24px_rgba(60,45,30,.35)]">
          <p className="text-[12px] font-[700] tracking-[.1em] uppercase text-sapil-muted mt-[6px] mb-[6px] ms-[12px]">{label}</p>
          <ul id={listId} role="listbox" aria-label={label} className="m-0 p-0 list-none">
            {options.map((o) => (
              <li key={o.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  lang={o.lang}
                  aria-selected={o.id === selected.id}
                  onClick={() => {
                    setOpen(false);
                    if (o.id !== selected.id) onChange(o.id);
                  }}
                  className={OPTION}
                >
                  {withFlags ? <Flag flag={o.flag} countryCode={o.countryCode} /> : null}
                  {o.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/**
 * The two dropdowns, as in Swiss Arabian's top bar: the market ("Ship to", with
 * flags; choosing one switches it in place; shown with a single market too) and
 * the language (the page reloads in it). Each shows whenever the market provider
 * has an option for it. `compact`: the chips for the mint top bar.
 */
export function SapilMarketMenu({ compact = false }: { compact?: boolean }) {
  const t = useSapilCopy();
  const { marketId, setMarketId, regionOptions, languageOptions } = useMarket();
  const { languageId, setLanguageId } = useLanguageSwitch();
  if (!regionOptions.length && !languageOptions.length) return null;
  return (
    <div className={compact ? "flex items-center gap-[6px]" : "flex items-center gap-[8px] me-[6px]"} data-sapil-market-menu="">
      <SapilHeaderPicker label={t("shell.shipTo")} value={marketId} options={regionOptions} onChange={setMarketId} withFlags compact={compact} />
      <SapilHeaderPicker label={t("shell.language")} value={languageId} options={languageOptions} onChange={setLanguageId} compact={compact} />
    </div>
  );
}
