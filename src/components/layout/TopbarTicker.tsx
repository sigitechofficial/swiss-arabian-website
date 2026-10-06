"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TOPBAR_TICKER } from "@/features/home/constants/chromeNav";
import { topbarTicker, topbarTickerLine } from "@/styles/siteChrome";

const INTERVAL_MS = 3500;

export function TopbarTicker() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return undefined;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % TOPBAR_TICKER.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className={topbarTicker} aria-live="polite">
      <AnimatePresence initial={false}>
        <motion.p
          className={topbarTickerLine}
          key={TOPBAR_TICKER[index]}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          {TOPBAR_TICKER[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
