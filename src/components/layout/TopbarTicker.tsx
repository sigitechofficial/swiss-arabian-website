"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TOPBAR_TICKER } from "@/features/home/constants/chromeNav";

const INTERVAL_MS = 3500;

export function TopbarTicker({ controls = false }: { controls?: boolean }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return undefined;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % TOPBAR_TICKER.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  const step = (dir: -1 | 1) => {
    setIndex((current) => (current + dir + TOPBAR_TICKER.length) % TOPBAR_TICKER.length);
  };

  const line = (
    <AnimatePresence initial={false}>
      <motion.p
        className="topbar__ticker-line"
        key={TOPBAR_TICKER[index]}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        {TOPBAR_TICKER[index]}
      </motion.p>
    </AnimatePresence>
  );

  if (!controls) {
    return (
      <div className="topbar__ticker" aria-live="polite">
        {line}
      </div>
    );
  }

  return (
    <div className="topbar__ticker topbar__ticker--controls" aria-live="polite">
      <button type="button" className="topbar__ticker-btn" aria-label="Previous announcement" onClick={() => step(-1)}>
        ‹
      </button>
      <div className="topbar__ticker-stage">{line}</div>
      <button type="button" className="topbar__ticker-btn" aria-label="Next announcement" onClick={() => step(1)}>
        ›
      </button>
    </div>
  );
}
