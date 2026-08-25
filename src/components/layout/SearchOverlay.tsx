"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { STATIC_PRODUCTS } from "@/features/home/constants/staticProducts";
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

/** Mirrors `v5/search.js`'s stopword list — short filler words that would
 *  otherwise dilute every query's token match score. */
const STOPWORDS = new Set([
  "i",
  "im",
  "i'm",
  "looking",
  "for",
  "a",
  "an",
  "the",
  "to",
  "of",
  "and",
  "or",
  "with",
  "scent",
  "fragrance",
  "perfume",
  "something",
  "some",
  "my",
  "me",
  "want",
  "need",
  "like",
  "please",
  "that",
  "this",
  "in",
  "on",
  "at",
  "is",
  "it",
]);

function tokensOf(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/[\s,./·]+/)
    .filter((tok) => tok.length > 1 && !STOPWORDS.has(tok));
}

function blobOf(p: (typeof STATIC_PRODUCTS)[number]): string {
  return [p.title, p.subtitle, p.id].filter(Boolean).join(" ").toLowerCase();
}

function filterCatalog(query: string) {
  const tokens = tokensOf(query);
  if (!tokens.length) return STATIC_PRODUCTS.slice();

  const andHits: typeof STATIC_PRODUCTS = [];
  const orHits: typeof STATIC_PRODUCTS = [];
  for (const product of STATIC_PRODUCTS) {
    const blob = blobOf(product);
    const score = tokens.reduce((acc, tok) => acc + (blob.includes(tok) ? 1 : 0), 0);
    if (score === tokens.length) andHits.push(product);
    else if (score > 0) orHits.push(product);
  }
  return andHits.length ? andHits : orHits;
}

/** Header search — a centered, dark "AI search" dock over a translucent
 *  scrim with a live-filtered results panel underneath, matching
 *  `v5/landing.html` + `v5/search.js` pixel-for-pixel (ported to React /
 *  static local product data instead of a live catalog fetch). */
export function SearchOverlay() {
  const open = useUiStore((s) => s.searchOpen);
  const setOpen = useUiStore((s) => s.setSearchOpen);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const hits = useMemo(() => filterCatalog(query), [query]);
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
                const first = hits[0];
                if (first) {
                  setOpen(false);
                  router.push(`/products/${first.slug}`);
                }
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
                placeholder="I'm looking for a scent for an elegant dinner"
                enterKeyHint="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button type="submit" className="ai-search-circle ai-search-send" aria-label="Search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
              </button>
            </form>

            <div className="ai-search-panel">
              <p className="ai-search-kicker" hidden={hasQuery}>
                Try a note, a name, or a mood
              </p>
              <ul className="ai-search-results" role="list">
                {hits.map((product) => (
                  <li key={product.id}>
                    <Link
                      className="ai-search-hit"
                      href={`/products/${product.slug}`}
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
              <p className="ai-search-empty" hidden={hits.length > 0}>
                No matches
              </p>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
