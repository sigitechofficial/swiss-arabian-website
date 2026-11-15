"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { cx } from "../../ui/shared";

export type ToolbarFacetOption = {
  value: string;
  label: string;
  /** Products with this option (from the listing API's facets), when known. */
  count?: number;
};

export type ToolbarFacet = {
  key: string;
  title: string;
  options: ToolbarFacetOption[];
  /** Selected option values. */
  selected: string[];
};

export type ListingToolbarProps = {
  facets: ToolbarFacet[];
  sorts: { value: string; label: string }[];
  sort: string;
  /** "24 of 120": shown / total. */
  countLabel?: string;
  onToggle: (facetKey: string, value: string) => void;
  onClearFacet: (facetKey: string) => void;
  onClearAll: () => void;
  onSort: (value: string) => void;
  className?: string;
};

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="m7 10 5 5 5-5" />
    </svg>
  );
}
function Tick() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

const SORT_KEY = "__sort";

const FDD =
  "inline-flex items-center gap-[8px] h-[44px] ps-[18px] pe-[14px] rounded-full bg-sapil-card border border-sapil-line-2 text-[15px] font-[500] whitespace-nowrap [transition:border-color_.18s,background_.18s,color_.18s] hover:border-sapil-ink aria-expanded:border-sapil-ink [&_svg]:w-[16px] [&_svg]:h-[16px] [&_svg]:[transition:transform_.2s_var(--sapil-ease)] aria-expanded:[&_svg]:[transform:rotate(180deg)] max-900:flex-none max-900:h-[40px] max-900:text-[14px]";
const OPT =
  "flex items-center gap-[12px] py-[11px] px-[12px] rounded-[12px] text-[15px] text-start [transition:background_.15s] hover:bg-sapil-paper [&>i]:w-[20px] [&>i]:h-[20px] [&>i]:border-[1.5px] [&>i]:border-sapil-line-2 [&>i]:grid [&>i]:place-items-center [&>i]:flex-none [&>i]:[transition:all_.15s] [&>i_svg]:w-[13px] [&>i_svg]:h-[13px] [&>i_svg]:text-sapil-white [&>i_svg]:opacity-0 aria-pressed:[&>i]:bg-sapil-accent aria-pressed:[&>i]:border-sapil-accent aria-pressed:[&>i_svg]:opacity-100";

/**
 * v9 filter bar (`.toolbar`, `filterUI()`): one dropdown per facet plus sort,
 * each opening a small menu of options with counts right under its button;
 * active filters as removable pills; the result count. Sticky under the header.
 * Presentational: the page owns the filter state (in the address).
 */
export function ListingToolbar({
  facets,
  sorts,
  sort,
  countLabel,
  onToggle,
  onClearFacet,
  onClearAll,
  onSort,
  className,
}: ListingToolbarProps) {
  const t = useSapilCopy();
  const menuId = useId();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const toolbarRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const shown = facets.filter((f) => f.options.length || f.selected.length);
  const sortLabel = sorts.find((s) => s.value === sort)?.label ?? sorts[0]?.label ?? "";
  const openFacet = shown.find((f) => f.key === openKey);
  const active = shown.flatMap((f) =>
    f.selected.map((v) => ({ key: f.key, value: v, label: f.options.find((o) => o.value === v)?.label ?? v })),
  );

  const close = useCallback((focusButton = false) => {
    setOpenKey((current) => {
      if (focusButton && current) {
        barRef.current?.querySelector<HTMLButtonElement>(`[data-dd="${CSS.escape(current)}"]`)?.focus();
      }
      return null;
    });
  }, []);

  // Place the menu under its button, kept inside the toolbar (v9 drawMenu()).
  const place = useCallback(() => {
    const toolbar = toolbarRef.current;
    const menu = menuRef.current;
    if (!toolbar || !menu || !openKey) return;
    const button = barRef.current?.querySelector<HTMLElement>(`[data-dd="${CSS.escape(openKey)}"]`);
    if (!button) return;
    const tb = toolbar.getBoundingClientRect();
    const r = button.getBoundingClientRect();
    const rtl = getComputedStyle(toolbar).direction === "rtl";
    const offset = rtl ? tb.right - r.right : r.left - tb.left;
    const start = Math.max(0, Math.min(offset, tb.width - menu.offsetWidth));
    setMenuStyle({ insetInlineStart: `${start}px` });
  }, [openKey]);

  useLayoutEffect(() => {
    place();
  }, [place]);

  useEffect(() => {
    if (!openKey) return;
    const onDown = (event: MouseEvent) => {
      const path = event.composedPath();
      if (!path.includes(menuRef.current as EventTarget) && !path.includes(barRef.current as EventTarget)) close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(true);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", place);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", place);
    };
  }, [close, openKey, place]);

  const toggleMenu = (key: string) => setOpenKey((current) => (current === key ? null : key));

  return (
    <div
      ref={toolbarRef}
      data-sapil-toolbar=""
      className={cx(
        "sticky top-[76px] z-[20] bg-[rgba(247,243,238,.95)] backdrop-blur-[8px] flex items-center gap-[12px] flex-wrap py-[16px] border-b border-sapil-line mb-[40px] max-900:top-[64px]",
        className,
      )}
    >
      <div
        ref={barRef}
        role="group"
        aria-label={t("catalog.filtersLabel")}
        className="flex gap-[8px] flex-wrap max-900:flex-nowrap max-900:overflow-x-auto max-900:[scrollbar-width:none] max-900:[&::-webkit-scrollbar]:hidden max-900:-mx-sapil-gut max-900:px-sapil-gut max-900:w-[calc(100%+var(--sapil-gut)*2)]"
      >
        {shown.map((f) => (
          <button
            key={f.key}
            type="button"
            data-dd={f.key}
            aria-haspopup="true"
            aria-expanded={openKey === f.key}
            aria-controls={openKey === f.key ? menuId : undefined}
            onClick={() => toggleMenu(f.key)}
            className={cx(FDD, f.selected.length > 0 && "border-sapil-accent")}
          >
            {f.title}
            {f.selected.length ? (
              <b className="min-w-[20px] h-[20px] px-[6px] rounded-full bg-sapil-accent text-sapil-white text-[12px] grid place-items-center">
                {f.selected.length}
              </b>
            ) : null}
            <Chevron />
          </button>
        ))}
        {sorts.length ? (
          <button
            type="button"
            data-dd={SORT_KEY}
            aria-haspopup="true"
            aria-expanded={openKey === SORT_KEY}
            aria-controls={openKey === SORT_KEY ? menuId : undefined}
            onClick={() => toggleMenu(SORT_KEY)}
            className={cx(FDD, "ms-auto max-900:ms-0")}
          >
            <span className="text-sapil-muted">{t("catalog.sortLabel")}</span> {sortLabel}
            <Chevron />
          </button>
        ) : null}
      </div>
      {countLabel ? (
        <span aria-live="polite" className="ms-auto text-[14px] text-sapil-muted tabular-nums max-900:ms-0 max-900:w-full max-900:order-3">
          {countLabel}
        </span>
      ) : null}
      {active.length ? (
        <div className="flex flex-wrap gap-[8px] items-center w-full">
          {active.map((a) => (
            <button
              key={`${a.key}:${a.value}`}
              type="button"
              aria-label={t("catalog.removeFilter", { label: a.label })}
              onClick={() => onToggle(a.key, a.value)}
              className="inline-flex items-center gap-[8px] h-[34px] ps-[14px] pe-[12px] rounded-full bg-sapil-accent-soft text-sapil-accent text-[14px] font-[500] hover:bg-sapil-accent hover:text-sapil-white"
            >
              {a.label}
              <span aria-hidden="true" className="text-[16px] opacity-70">
                ×
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={onClearAll}
            className="font-[600] text-[14px] border-b border-current pb-[2px] [transition:color_.18s] hover:text-sapil-accent"
          >
            {t("catalog.clearAll")}
          </button>
        </div>
      ) : null}
      {openKey ? (
        <div
          ref={menuRef}
          id={menuId}
          style={menuStyle}
          className="absolute top-[calc(100%-8px)] z-[30] min-w-[260px] max-w-[min(340px,calc(100vw-32px))] bg-sapil-white rounded-[20px] p-[8px] shadow-[0_2px_4px_rgba(60,45,30,.06),0_24px_48px_-16px_rgba(60,45,30,.3)]"
        >
          {openKey === SORT_KEY ? (
            <div className="flex flex-col max-h-[340px] overflow-y-auto">
              {sorts.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  aria-pressed={s.value === sort}
                  onClick={() => {
                    onSort(s.value);
                    close(true);
                  }}
                  className={cx(OPT, "[&>i]:rounded-full")}
                >
                  <i>
                    <Tick />
                  </i>
                  {s.label}
                </button>
              ))}
            </div>
          ) : openFacet ? (
            <>
              <div className="flex flex-col max-h-[340px] overflow-y-auto">
                {openFacet.options.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    aria-pressed={openFacet.selected.includes(o.value)}
                    onClick={() => onToggle(openFacet.key, o.value)}
                    className={cx(OPT, "[&>i]:rounded-[6px]")}
                  >
                    <i>
                      <Tick />
                    </i>
                    {o.label}
                    {o.count != null ? <small className="ms-auto text-[13px] text-sapil-muted">{o.count}</small> : null}
                  </button>
                ))}
              </div>
              {openFacet.selected.length ? (
                <button
                  type="button"
                  onClick={() => onClearFacet(openFacet.key)}
                  className="block mt-[6px] mx-[12px] mb-[8px] font-[600] text-[14px] border-b border-current pb-[2px] hover:text-sapil-accent"
                >
                  {t("catalog.clearFacet", { facet: openFacet.title.toLowerCase() })}
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
