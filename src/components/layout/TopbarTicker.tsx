"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { TOPBAR_TICKER } from "@/features/home/constants/chromeNav";
import {
  cmsGlobalKeys,
  fetchCmsGlobalRegion,
  firstSectionOfType,
} from "@/features/cms/api/cmsGlobalRegion.service";
import { useSelectedCatalogMarket } from "@/features/markets/hooks/useSelectedCatalogMarket";
import { topbarTicker, topbarTickerLine } from "@/styles/siteChrome";

const DEFAULT_INTERVAL_MS = 3500;

export function TopbarTicker() {
  const market = useSelectedCatalogMarket();
  const zoneCode = market?.zoneCode ?? "";
  const languageCode = market?.languageCode ?? "en";

  const cmsQuery = useQuery({
    queryKey: cmsGlobalKeys.region("announcement-bar", zoneCode, languageCode),
    queryFn: () =>
      fetchCmsGlobalRegion({
        slug: "announcement-bar",
        zoneCode,
        languageCode,
      }),
    enabled: Boolean(zoneCode),
    staleTime: 60_000,
  });

  const cmsSection = firstSectionOfType(
    cmsQuery.data?.sections ?? [],
    "ANNOUNCEMENT_BAR",
  );
  const cmsData = (cmsSection?.data ?? {}) as {
    enabled?: boolean;
    messages?: Array<{ message?: string }>;
    backgroundColor?: string | null;
    textColor?: string | null;
    rotationIntervalMs?: number;
  };

  const messages = useMemo(() => {
    if (cmsData.enabled === false) return [];
    const fromCms = (cmsData.messages ?? [])
      .map((m) => m.message?.trim())
      .filter((m): m is string => Boolean(m));
    return fromCms.length ? fromCms : [...TOPBAR_TICKER];
  }, [cmsData.enabled, cmsData.messages]);

  const [index, setIndex] = useState(0);
  const interval = Math.min(
    30000,
    Math.max(2000, cmsData.rotationIntervalMs ?? DEFAULT_INTERVAL_MS),
  );

  useEffect(() => {
    setIndex(0);
  }, [messages.length]);

  useEffect(() => {
    if (messages.length <= 1) return undefined;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return undefined;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % messages.length);
    }, interval);
    return () => window.clearInterval(timer);
  }, [messages.length, interval]);

  if (!messages.length) return null;

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
