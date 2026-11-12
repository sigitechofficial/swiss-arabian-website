"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { cx, DefaultLink, type SapilLinkComponent } from "./shared";

export type TabItem = {
  value: string;
  label: ReactNode;
  /** small count after the label */
  count?: ReactNode;
  /** link tabs (v9 price tiers): each tab is its own page */
  href?: string;
};

const TAB =
  "inline-flex items-center gap-[8px] h-[42px] px-[18px] rounded-full border font-[600] text-[15px] [transition:border-color_.18s,background_.18s]";
const tabClass = (on: boolean) =>
  cx(TAB, on ? "bg-sapil-accent border-sapil-accent text-sapil-white" : "bg-sapil-card border-sapil-line-2 hover:border-sapil-ink");

function Count({ on, children }: { on: boolean; children: ReactNode }) {
  return <small className={cx("text-[12px] font-[500]", on ? "text-sapil-on-dark" : "text-sapil-muted")}>{children}</small>;
}

export type TabsProps = {
  items: TabItem[];
  value: string;
  /** required for in-page tabs (no href) */
  onValueChange?: (value: string) => void;
  /** accessible name of the tab list / nav, e.g. "Shop by price" */
  label: string;
  /** id prefix linking tabs to TabPanel (in-page tabs) */
  idBase?: string;
  LinkComponent?: SapilLinkComponent;
  className?: string;
};

/**
 * v9 `.tier-tabs` / `.tier-tab` pills.
 * With `href` on every item: a <nav> of links, the open one marked aria-current="page" (as v9).
 * Without: a WAI-ARIA tablist (roving tabindex, ←/→/Home/End) controlling <TabPanel>s.
 */
export function Tabs({ items, value, onValueChange, label, idBase = "sapil-tabs", LinkComponent = DefaultLink, className }: TabsProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const wrap = cx("flex gap-[8px] flex-wrap", className);

  if (items.every((t) => t.href)) {
    return (
      <nav aria-label={label} className={wrap}>
        {items.map((t) => {
          const on = t.value === value;
          return (
            <LinkComponent key={t.value} href={t.href!} aria-current={on ? "page" : undefined} className={tabClass(on)}>
              {t.label}
              {t.count !== undefined && <Count on={on}>{t.count}</Count>}
            </LinkComponent>
          );
        })}
      </nav>
    );
  }

  const onKey = (e: KeyboardEvent, i: number) => {
    const last = items.length - 1;
    const next =
      e.key === "ArrowRight" ? (i === last ? 0 : i + 1)
      : e.key === "ArrowLeft" ? (i === 0 ? last : i - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : -1;
    if (next < 0) return;
    e.preventDefault();
    refs.current[next]?.focus();
    onValueChange?.(items[next].value);
  };

  return (
    <div role="tablist" aria-label={label} className={wrap}>
      {items.map((t, i) => {
        const on = t.value === value;
        return (
          <button
            key={t.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${idBase}-tab-${t.value}`}
            aria-selected={on}
            aria-controls={`${idBase}-panel-${t.value}`}
            tabIndex={on ? 0 : -1}
            onClick={() => onValueChange?.(t.value)}
            onKeyDown={(e) => onKey(e, i)}
            className={tabClass(on)}
          >
            {t.label}
            {t.count !== undefined && <Count on={on}>{t.count}</Count>}
          </button>
        );
      })}
    </div>
  );
}

/** Panel for in-page Tabs; hidden unless active. */
export function TabPanel({
  idBase = "sapil-tabs",
  value,
  active,
  children,
  className,
}: {
  idBase?: string;
  value: string;
  active: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="tabpanel"
      id={`${idBase}-panel-${value}`}
      aria-labelledby={`${idBase}-tab-${value}`}
      hidden={!active}
      tabIndex={0}
      className={className}
    >
      {children}
    </div>
  );
}
