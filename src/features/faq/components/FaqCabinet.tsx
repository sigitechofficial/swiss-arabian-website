"use client";

import { useMemo, useState } from "react";

import {
  drawerMetaLabel,
  faqDrawers,
  type FaqDrawer,
  type FaqItem,
} from "../data/faqContent";

function FaqAccordionItem({
  item,
  open,
  onToggle,
}: {
  item: FaqItem;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-sa-border bg-surface px-5 py-[18px] sm:px-6">
      <button
        type="button"
        className="flex w-full items-center gap-4 text-left"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className="flex-1 text-[15px] font-bold text-sa-primary">
          {item.question}
        </span>
        <span className="shrink-0 text-[20px] leading-none text-terra" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>
      {open ? (
        <p className="mt-3 text-[13.5px] leading-[1.65] text-sa-secondary">
          {item.answer}
        </p>
      ) : null}
    </div>
  );
}

function DrawerButton({
  drawer,
  active,
  onSelect,
}: {
  drawer: FaqDrawer;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "true" : undefined}
      className={`relative w-full border border-sa-border px-5 py-3 text-left transition-colors ${
        active ? "bg-surface" : "bg-transparent hover:bg-surface/60"
      }`}
    >
      <p className="text-[11px] text-gold">{drawer.index}</p>
      <p
        className={`mt-1 text-[17px] ${
          active
            ? "font-bold text-gold"
            : "font-semibold text-sa-primary"
        }`}
      >
        {drawer.title}
      </p>
      <p className="mt-1.5 max-w-[198px] text-[11px] leading-snug text-sa-secondary">
        {drawerMetaLabel(drawer)}
      </p>
      <span
        className={`absolute right-4 top-1/2 h-0.5 w-7 -translate-y-1/2 ${
          active ? "bg-terra" : "bg-sa-border"
        }`}
        aria-hidden
      />
    </button>
  );
}

/** Figma cabinet + search — 997:8564 / 997:8568 */
export function FaqCabinet() {
  const [activeId, setActiveId] = useState("order");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const activeDrawer =
    faqDrawers.find((d) => d.id === activeId) ?? faqDrawers[0];

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return faqDrawers.flatMap((drawer) =>
      drawer.items
        .filter(
          (item) =>
            item.question.toLowerCase().includes(q) ||
            item.answer.toLowerCase().includes(q) ||
            drawer.title.toLowerCase().includes(q) ||
            drawer.summary.toLowerCase().includes(q),
        )
        .map((item) => ({ drawer, item })),
    );
  }, [query]);

  const isSearching = searchResults !== null;
  const displayItems: FaqItem[] = isSearching
    ? searchResults.map((r) => r.item)
    : activeDrawer.items;

  return (
    <>
      {/* Search */}
      <section className="bg-cream px-4 py-8 dark:bg-section-soft sm:px-6 lg:px-[120px] lg:py-[43px]">
        <label className="relative mx-auto block w-full max-w-[1200px]">
          <span className="sr-only">Search FAQs</span>
          <span
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[14px] text-sa-secondary"
            aria-hidden
          >
            ⌕
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpenId(null);
            }}
            placeholder={`Search all drawers — "delivery", "oud", "samples"…`}
            className="h-[50px] w-full rounded-md border border-sa-input bg-surface py-3 pl-10 pr-4 text-[15px] text-sa-primary outline-none placeholder:text-sa-secondary focus:border-terra"
          />
        </label>
      </section>

      {/* Cabinet */}
      <section
        className="bg-page px-4 pb-12 sm:px-6 lg:px-[120px] lg:pb-16"
        aria-label="FAQ drawers"
      >
        <div className="mx-auto flex max-w-[1200px] flex-col gap-0 lg:flex-row lg:items-stretch">
          <aside className="border border-sa-border bg-cream dark:bg-section-soft lg:w-[280px] lg:shrink-0">
            <p className="px-5 py-[22px] text-[10px] font-bold uppercase tracking-[0.26em] text-gold">
              Six drawers
            </p>
            <nav className="flex flex-col" aria-label="FAQ categories">
              {faqDrawers.map((drawer) => (
                <DrawerButton
                  key={drawer.id}
                  drawer={drawer}
                  active={!isSearching && activeId === drawer.id}
                  onSelect={() => {
                    setActiveId(drawer.id);
                    setQuery("");
                    setOpenId(null);
                  }}
                />
              ))}
            </nav>
          </aside>

          <div className="min-w-0 flex-1 border border-t-0 border-sa-border bg-surface px-4 py-7 sm:px-8 lg:border-t lg:border-l-0 lg:px-11 lg:py-7">
            <h2 className="font-sans text-[28px] font-bold text-sa-primary sm:text-[36px]">
              {isSearching ? "Search results" : activeDrawer.title}
            </h2>
            <p className="mt-2 text-[13px] text-sa-secondary">
              {isSearching
                ? `${displayItems.length} ${displayItems.length === 1 ? "match" : "matches"}`
                : drawerMetaLabel(activeDrawer)}
            </p>
            <div className="mt-4 h-px w-full bg-sa-border" />

            <div className="mt-4 flex flex-col gap-0">
              {displayItems.length === 0 ? (
                <p className="py-8 text-[14px] text-sa-secondary">
                  No matching entries. Try another keyword or browse a drawer.
                </p>
              ) : (
                displayItems.map((item) => (
                  <FaqAccordionItem
                    key={item.id}
                    item={item}
                    open={openId === item.id}
                    onToggle={() =>
                      setOpenId((id) => (id === item.id ? null : item.id))
                    }
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
