"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { previewCatalog, searchCatalog } from "@/features/search";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { useUiStore } from "@/stores/useUiStore";

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

  const hits = useMemo(
    () => (query.trim() ? searchCatalog(query, { limit: OVERLAY_LIMIT }) : previewCatalog(OVERLAY_LIMIT)),
    [query],
  );
  const hasQuery = query.trim().length > 0;

  useEffect(() => {
    if (!open) return;
    document.body.classList.add("is-search-open");
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("is-search-open");
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
    setOpen(false);
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  function goToHit(index: number) {
    const hit = hits[index];
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
        <div id="ai-search" className="ai-search is-open" role="dialog" aria-modal="true" aria-label="Search">
          <motion.div
            className="ai-search-scrim"
            variants={scrimVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => setOpen(false)}
          />
          <motion.div
            className="ai-search-dock"
            variants={dockVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <form
              className="ai-search-bar"
              autoComplete="off"
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                goToResults();
              }}
            >
              <button
                type="button"
                className="ai-search-circle"
                aria-label="Close search"
                onClick={() => setOpen(false)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
              <label className="visually-hidden" htmlFor="ai-search-input">
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
              <button type="submit" className="ai-search-circle ai-search-send" aria-label="Search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
              </button>
            </form>

            <div className="ai-search-panel">
              <p className="ai-search-kicker" hidden={hasQuery && hits.length === 0}>
                {hasQuery ? "Suggestions" : "Try a note, a name, or a mood"}
              </p>
              <ul className="ai-search-results" id="ai-search-results" role="listbox">
                {hits.map((product, index) => (
                  <li key={product.id} role="presentation">
                    <Link
                      id={`ai-search-hit-${product.id}`}
                      className={`ai-search-hit${index === activeIndex ? " is-active" : ""}`}
                      href={`/products/${product.slug}`}
                      role="option"
                      aria-selected={index === activeIndex}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => setOpen(false)}
                    >
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.imageUrl} alt="" />
                      ) : (
                        <img alt="" style={{ background: "#efeae2" }} />
                      )}
                      <span className="ai-search-hit-copy">
                        <p className="ai-search-hit-name">{product.title}</p>
                        <p className="ai-search-hit-meta">
                          {product.subtitle}
                          {product.price != null ? ` · ${formatMoney(product.price, product.currency)}` : ""}
                        </p>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="ai-search-empty" hidden={!hasQuery || hits.length > 0}>
                No matches — try another spelling
              </p>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
