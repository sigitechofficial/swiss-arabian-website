"use client";

import { useEffect, useState } from "react";
import type { AnnouncementItem } from "@/features/cms/hooks/useCmsGlobalRegion";
import { resolveCmsLink } from "@/features/cms/utils/resolveCmsLink";
import { AnnouncementBar } from "../../ui";
import { SapilLink } from "../shared/SapilLink";

const DEFAULT_INTERVAL_MS = 4500;

/**
 * v9 `.announce` from the market's announcement bar (CMS). Several messages
 * take turns (not with reduced motion); none renders nothing.
 */
export function SapilAnnouncement({ items, intervalMs }: { items: AnnouncementItem[]; intervalMs?: number | null }) {
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(items.length);
  if (count !== items.length) {
    setCount(items.length);
    setIndex(0);
  }
  useEffect(() => {
    if (items.length <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ms = Math.min(30000, Math.max(2000, intervalMs ?? DEFAULT_INTERVAL_MS));
    const id = window.setInterval(() => setIndex((i) => (i + 1) % items.length), ms);
    return () => window.clearInterval(id);
  }, [items.length, intervalMs]);

  const item = items[index] ?? items[0];
  if (!item) return null;
  const href = resolveCmsLink(item.link) ?? undefined;
  return (
    <div aria-live={items.length > 1 ? "polite" : undefined}>
      <AnnouncementBar href={href} LinkComponent={SapilLink}>
        {item.message}
      </AnnouncementBar>
    </div>
  );
}
