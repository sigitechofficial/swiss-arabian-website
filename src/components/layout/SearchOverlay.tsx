"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { SEARCH_MIN_QUERY_LENGTH, useCatalogSearch } from "@/features/search";
import { rememberSearchQuery } from "@/features/search/utils/recentSearches";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { useUiStore } from "@/stores/useUiStore";
import { visuallyHidden } from "@/styles/siteChrome";

// Same eased, no-slam entrance language as the mega menu (`SiteHeader`'s
// `megaPanelVariants`) — scrim fades while the dock scales/drops in from a
// touch above rest, so the whole thing feels like one smooth reveal rather
// than a hard cut.
const scrimVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.16, ease: [0.22, 0.61, 0.36, 1] } },
  exit: { opacity: 0, transition: { duration: 0.12, ease: [0.4, 0, 1, 1] } },
};

// `x` stays a fixed "-50%" (the dock is centered via `left: 50%` in CSS) —
// framer-motion writes the whole `transform` inline once any of x/y/scale
// animate, so the horizontal centering has to travel through the variants
// too or it gets clobbered by the animated transform.
const dockVariants: Variants = {
  hidden: { opacity: 0, x: "-50%", y: -10, scale: 0.98 },
  visible: {
    opacity: 1,
    x: "-50%",
    y: 0,
    scale: 1,
    transition: { duration: 0.22, ease: [0.22, 0.61, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    x: "-50%",
    y: -8,
    scale: 0.985,
    transition: { duration: 0.14, ease: [0.4, 0, 1, 1] },
  },
};

const OVERLAY_LIMIT = 8;

/** Header search — live predictive hits (name-first, typo-tolerant) over a
 *  translucent scrim. Submit opens `/search?q=` so the same matcher runs on
 *  a dedicated results URL. */
export function SearchOverlay() {
  const open = useUiStore((s) => s.searchOpen);
  const setOpen = useUiStore((s) => s.setSearchOpen);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Live catalog search, debounced and gated by the shared hook. An empty box
  // previews the products list instead of firing a blank-`q` search.
  const { products: hits } = useCatalogSearch(query, {
    limit: OVERLAY_LIMIT,
  });
  const hasQuery = query.trim().length > 0;

  useEffect(() => {
    if (!open) return;
    document.body.classList.add("overflow-hidden");
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("overflow-hidden");
      document.removeEventListener("keydown", onKeyDown);
      cancelAnimationFrame(frame);
    };
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function goToResults() {
    const q = query.trim();
    if (q.length >= SEARCH_MIN_QUERY_LENGTH) rememberSearchQuery(q);
    setOpen(false);
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  function goToHit(index: number) {
    const hit = hits[index];
    const q = query.trim();
    if (q.length >= SEARCH_MIN_QUERY_LENGTH) rememberSearchQuery(q);
    if (!hit) {
      goToResults();
      return;
    }
    setOpen(false);
    router.push(`/products/${hit.slug}`);
  }

  return (
    <AnimatePresence>
      {open ? (
        <div id="ai-search" className="pointer-events-auto fixed inset-0 z-[200]" role="dialog" aria-modal="true" aria-label="Search">
          <motion.div
            className="absolute inset-0 bg-[rgba(24,20,17,0.45)] backdrop-blur-[3px]"
            variants={scrimVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => setOpen(false)}
          />
          <motion.div
            className="absolute top-[88px] left-1/2 flex w-[min(720px,calc(100%-32px))] flex-col gap-2.5 will-change-transform max-[640px]:top-16 max-[640px]:w-[calc(100%-20px)]"
            variants={dockVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <form
              className="flex h-14 items-center gap-1.5 rounded-full border border-white/12 bg-[var(--ink)] p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.28)]"
              autoComplete="off"
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                goToResults();
              }}
            >
              <button
                type="button"
                className="flex size-[42px] shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-white/8 text-[var(--white)] hover:bg-white/16 [&_svg]:size-3.5"
                aria-label="Close search"
                onClick={() => setOpen(false)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
              <label className={visuallyHidden} htmlFor="ai-search-input">
                Search scents
              </label>
              <input
                ref={inputRef}
                id="ai-search-input"
                type="search"
                name="q"
                maxLength={140}
                placeholder="Search by name, note, or mood"
                enterKeyHint="search"
                autoComplete="off"
                aria-autocomplete="list"
                aria-controls="ai-search-results"
                aria-activedescendant={hits[activeIndex] ? `ai-search-hit-${hits[activeIndex].id}` : undefined}
                className="h-full min-w-0 flex-1 border-0 bg-transparent px-2 font-[inherit] text-[0.95rem] text-[var(--white)] outline-none placeholder:text-white/50 [&::-webkit-search-cancel-button]:hidden"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    if (!hits.length) return;
                    setActiveIndex((i) => (i + 1) % hits.length);
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    if (!hits.length) return;
                    setActiveIndex((i) => (i - 1 + hits.length) % hits.length);
                  } else if (e.key === "Enter" && hasQuery && hits.length && !e.metaKey && !e.ctrlKey) {
                    if (document.activeElement === inputRef.current && hits[activeIndex]) {
                      e.preventDefault();
                      goToHit(activeIndex);
                    }
                  }
                }}
              />
              <button type="submit" className="flex size-[42px] shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-[var(--copper)] text-[var(--white)] hover:bg-[var(--copper-deep)] [&_svg]:size-3.5" aria-label="Search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
              </button>
            </form>

            <div className="max-h-[min(62vh,480px)] overflow-y-auto rounded-[20px] border border-[var(--line)] bg-[var(--white)] shadow-[0_16px_48px_rgba(0,0,0,0.14)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <p className="m-0 px-[18px] pt-4 pb-2 text-[11px] tracking-[0.08em] text-[var(--ink-2)] uppercase" hidden={hasQuery && hits.length === 0}>
                {hasQuery ? "Suggestions" : "Try a note, a name, or a mood"}
              </p>
              <ul className="m-0 list-none px-2 pt-1 pb-3" id="ai-search-results" role="listbox">
                {hits.map((product, index) => (
                  <li key={product.id} role="presentation">
                    <Link
                      id={`ai-search-hit-${product.id}`}
                      className="flex items-center gap-3.5 rounded-[14px] px-3 py-2.5 text-inherit no-underline transition-colors hover:bg-[var(--cream-2)] aria-selected:bg-[var(--cream-2)] rtl:flex-row-reverse rtl:text-right"
                      href={`/products/${product.slug}`}
                      role="option"
                      aria-selected={index === activeIndex}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => setOpen(false)}
                    >
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className="size-[52px] shrink-0 rounded-[10px] bg-[var(--sand)] object-contain" src={product.imageUrl} alt="" />
                      ) : (
                        <img className="size-[52px] shrink-0 rounded-[10px] bg-[#efeae2] object-contain" alt="" />
                      )}
                      <span className="min-w-0">
                        <p className="m-0 text-[0.95rem] font-semibold text-[var(--ink)]">{product.title}</p>
                        <p className="mt-0.5 truncate text-[0.8rem] text-[var(--ink-2)] rtl:[direction:rtl]">
                          {product.subtitle}
                          {product.price != null ? ` · ${formatMoney(product.price, product.currency)}` : ""}
                        </p>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="m-0 px-[18px] pt-2 pb-[18px] text-[0.9rem] text-[var(--ink-2)]" hidden={!hasQuery || hits.length > 0}>
                No matches — try another spelling
              </p>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
