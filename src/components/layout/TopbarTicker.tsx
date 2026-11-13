"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAnnouncementBar } from "@/features/cms/hooks/useCmsGlobalRegion";
import { topbarTicker, topbarTickerLine } from "@/styles/siteChrome";

const DEFAULT_INTERVAL_MS = 3500;

export function TopbarTicker() {
  // Messages come only from the market's announcement bar (admin): fixed
  // texts here could promise delivery or returns the market does not offer.
  const announcement = useAnnouncementBar();
  const messages = useMemo(
    () => announcement.items.map((item) => item.message),
    [announcement.items],
  );
  const cmsData = {
    backgroundColor: announcement.backgroundColor,
    textColor: announcement.textColor,
    rotationIntervalMs: announcement.rotationIntervalMs ?? undefined,
  };

  const [index, setIndex] = useState(0);
  const interval = Math.min(
    30000,
    Math.max(2000, cmsData.rotationIntervalMs ?? DEFAULT_INTERVAL_MS),
  );

  // Restart from the first message when the list changes size.
  const [messageCount, setMessageCount] = useState(messages.length);
  if (messageCount !== messages.length) {
    setMessageCount(messages.length);
    setIndex(0);
  }

  useEffect(() => {
    if (messages.length <= 1) return undefined;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return undefined;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % messages.length);
    }, interval);
    return () => window.clearInterval(timer);
  }, [messages.length, interval]);

  // No announcement for this market: keep the message cell so the market and
  // language menus stay in their place (right edge) instead of sliding into
  // the middle column. On phones the bar is one row, so nothing is reserved.
  if (!messages.length) {
    return (
      <div
        className={`${topbarTicker} max-[600px]:hidden`}
        aria-hidden="true"
      />
    );
  }

  const style = {
    ...(cmsData.backgroundColor
      ? { backgroundColor: cmsData.backgroundColor }
      : null),
    ...(cmsData.textColor ? { color: cmsData.textColor } : null),
  } as CSSProperties;

  return (
    <div className={topbarTicker} aria-live="polite" style={style}>
      <AnimatePresence initial={false}>
        <motion.p
          className={topbarTickerLine}
          key={messages[index]}
          title={messages[index]}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          {messages[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
