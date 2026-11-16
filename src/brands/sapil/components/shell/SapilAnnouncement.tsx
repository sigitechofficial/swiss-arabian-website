"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import type { AnnouncementItem } from "@/features/cms/hooks/useCmsGlobalRegion";
import { resolveCmsLink } from "@/features/cms/utils/resolveCmsLink";
import { AnnouncementBar } from "../../ui";
import { SapilLink } from "../shared/SapilLink";

const DEFAULT_INTERVAL_MS = 4500;
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** `**words**` in a CMS message are set in bold (v9 `.announce b`). */
export function emphasized(message: string): ReactNode[] {
  return message.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <b key={i}>{part}</b> : part));
}

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
const prefersReducedMotion = () => window.matchMedia(REDUCED_MOTION).matches;

/**
 * v9 `.announce` from the market's announcement bar (CMS). Several messages
 * take turns, with no control button (the user's choice, 17 Nov 2026): the
 * rotation waits while the pointer or keyboard focus is on the bar, and it
 * doesn't run at all with reduced motion. The bar is not a live region: a screen
 * reader reads the message where it is instead of hearing every change. None
 * renders nothing.
 */
export function SapilAnnouncement({ items, intervalMs }: { items: AnnouncementItem[]; intervalMs?: number | null }) {
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(items.length);
  if (count !== items.length) {
    setCount(items.length);
    setIndex(0);
  }
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => false);
  const [holding, setHolding] = useState(false);
  const rotates = items.length > 1;
  const running = rotates && !reducedMotion && !holding;

  useEffect(() => {
    if (!running) return;
    const ms = Math.min(30000, Math.max(2000, intervalMs ?? DEFAULT_INTERVAL_MS));
    const id = window.setInterval(() => setIndex((i) => (i + 1) % items.length), ms);
    return () => window.clearInterval(id);
  }, [running, items.length, intervalMs]);

  const item = items[index] ?? items[0];
  if (!item) return null;
  const href = resolveCmsLink(item.link) ?? undefined;
  if (!rotates) {
    return (
      <AnnouncementBar href={href} LinkComponent={SapilLink}>
        {emphasized(item.message)}
      </AnnouncementBar>
    );
  }
  return (
    <div
      onMouseEnter={() => setHolding(true)}
      onMouseLeave={() => setHolding(false)}
      onFocus={() => setHolding(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHolding(false);
      }}
    >
      <AnnouncementBar href={href} LinkComponent={SapilLink}>
        {emphasized(item.message)}
      </AnnouncementBar>
    </div>
  );
}
