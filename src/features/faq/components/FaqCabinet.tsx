"use client";

import { useMemo, useState } from "react";

import { drawerMetaLabel, faqDrawers, type FaqDrawer, type FaqItem } from "../data/faqContent";

const container =
  "mx-auto w-full max-w-[var(--chrome-content-max)] px-[var(--chrome-edge)] [@media(min-width:1200px)]:px-0";

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
    <div
      className={`rounded-lg border bg-surface px-5 py-4 transition-colors sm:px-6 ${
        open ? "border-terra/40" : "border-sa-border"
      }`}
    >
      <button
        type="button"
        className="flex w-full cursor-pointer items-center gap-4 text-left"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className="flex-1 text-[14.5px] font-semibold text-sa-primary">{item.question}</span>
        <span
          className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-[16px] leading-none transition-colors ${
            open ? "border-terra bg-terra text-white" : "border-sa-border text-terra"
          }`}
          aria-hidden
        >
          {open ? "−" : "+"}
        </span>
      </button>
      {open ? <p className="mt-3 pr-10 text-[13.5px] leading-[1.7] text-sa-secondary">{item.answer}</p> : null}
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
      className={`relative w-full cursor-pointer rounded-md px-4 py-3 text-left transition-colors ${
        active ? "bg-surface shadow-[0_6px_18px_-12px_rgba(60,30,20,0.35)]" : "hover:bg-surface/60"
      }`}
    >
      <p className="text-[10.5px] font-semibold text-gold">{drawer.index}</p>
      <p className={`mt-0.5 text-[15.5px] ${active ? "font-bold text-terra" : "font-semibold text-sa-primary"}`}>
        {drawer.title}
      </p>
      <p className="mt-1 text-[11px] leading-snug text-sa-secondary">{drawerMetaLabel(drawer)}</p>
      <span
        className={`absolute right-4 top-1/2 h-0.5 w-6 -translate-y-1/2 rounded-full ${active ? "bg-terra" : "bg-sa-border"}`}
        aria-hidden
      />
    </button>
  );
}

export function FaqCabinet({ initialDrawer }: { initialDrawer?: string }) {
  const [activeId, setActiveId] = useState(
    faqDrawers.some((d) => d.id === initialDrawer) ? (initialDrawer as string) : "order",
  );
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const activeDrawer = faqDrawers.find((d) => d.id === activeId) ?? faqDrawers[0];

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return faqDrawers.flatMap((drawer) =>
      drawer.items.filter(
        (item) =>
          item.question.toLowerCase().includes(q) ||
          item.answer.toLowerCase().includes(q) ||
          drawer.title.toLowerCase().includes(q) ||
          drawer.summary.toLowerCase().includes(q),
      ),
    );
  }, [query]);

  const isSearching = searchResults !== null;
  const displayItems = searchResults ?? activeDrawer.items;

  return (
    <>
      <section className="bg-section-soft py-8 lg:py-10">
        <label className={`${container} relative block`}>
          <span className="sr-only">Search FAQs</span>
          <span className="relative block">
            <svg
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sa-secondary"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpenId(null);
              }}
              placeholder={`Search all questions — "delivery", "oud", "samples"…`}
              className="h-[50px] w-full rounded-full border border-sa-input bg-surface py-3 pl-11 pr-5 text-[14.5px] text-sa-primary outline-none placeholder:text-sa-secondary focus:border-terra"
            />
          </span>
        </label>
      </section>

      <section className="bg-page py-10 lg:py-14" aria-label="FAQ categories">
        <div className={`${container} flex flex-col gap-6 lg:flex-row lg:items-start`}>
          <aside className="rounded-lg border border-sa-border bg-section-soft p-2 lg:sticky lg:top-40 lg:w-[270px] lg:shrink-0">
            <p className="px-4 pb-2 pt-3 text-[10px] font-bold uppercase tracking-[0.24em] text-gold">Topics</p>
            <nav className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:flex lg:flex-col" aria-label="FAQ topics">
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

          <div className="min-w-0 flex-1">
            <h2 className="text-[26px] font-bold text-sa-primary sm:text-[32px]">
              {isSearching ? "Search results" : activeDrawer.title}
            </h2>
            <p className="mt-1.5 text-[13px] text-sa-secondary">
              {isSearching
                ? `${displayItems.length} ${displayItems.length === 1 ? "match" : "matches"}`
                : drawerMetaLabel(activeDrawer)}
            </p>

            <div className="mt-6 flex flex-col gap-3">
              {displayItems.length === 0 ? (
                <p className="rounded-lg border border-dashed border-sa-border px-6 py-10 text-center text-[14px] text-sa-secondary">
                  No matching questions. Try another keyword or browse a topic.
                </p>
              ) : (
                displayItems.map((item) => (
                  <FaqAccordionItem
                    key={item.id}
                    item={item}
                    open={openId === item.id}
                    onToggle={() => setOpenId((id) => (id === item.id ? null : item.id))}
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
