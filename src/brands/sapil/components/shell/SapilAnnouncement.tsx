"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import type { AnnouncementItem } from "@/features/cms/hooks/useCmsGlobalRegion";
import { resolveCmsLink } from "@/features/cms/utils/resolveCmsLink";
import { useSapilCopy } from "../../i18n/SapilCopy";
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
 * take turns. WCAG 2.2.2: a pause / play button stops the rotation (it also
 * waits while the pointer or focus is on the bar), and it doesn't start with
 * reduced motion. The bar is not a live region: a screen reader reads the
 * message where it is instead of hearing every change. None renders nothing.
 */
export function SapilAnnouncement({ items, intervalMs }: { items: AnnouncementItem[]; intervalMs?: number | null }) {
  const t = useSapilCopy();
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(items.length);
  if (count !== items.length) {
    setCount(items.length);
    setIndex(0);
  }
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => false);
  // The shopper's own choice wins over the reduced-motion default.
  const [choice, setChoice] = useState<"play" | "pause" | null>(null);
  const [holding, setHolding] = useState(false);
  const rotates = items.length > 1;
  const playing = rotates && (choice ? choice === "play" : !reducedMotion);
  const running = playing && !holding;

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
      className="relative"
      onMouseEnter={() => setHolding(true)}
      onMouseLeave={() => setHolding(false)}
      onFocus={() => setHolding(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHolding(false);
      }}
    >
      <AnnouncementBar href={href} LinkComponent={SapilLink} className="px-[48px]">
        {emphasized(item.message)}
      </AnnouncementBar>
      <button
        type="button"
        onClick={() => setChoice(playing ? "pause" : "play")}
        aria-label={playing ? t("shell.announcePause") : t("shell.announcePlay")}
        className="absolute end-[10px] top-1/2 -translate-y-1/2 grid place-items-center w-[28px] h-[28px] rounded-full text-sapil-ink transition-[background] duration-[180ms] hover:bg-sapil-white/70"
      >
        {playing ? (
          <svg aria-hidden="true" viewBox="0 0 12 12" className="w-[12px] h-[12px]" fill="currentColor">
            <rect x="2" y="1.5" width="2.6" height="9" rx="0.8" />
            <rect x="7.4" y="1.5" width="2.6" height="9" rx="0.8" />
          </svg>
        ) : (
          <svg aria-hidden="true" viewBox="0 0 12 12" className="w-[12px] h-[12px] rtl:-scale-x-100" fill="currentColor">
            <path d="M3 1.6v8.8a.6.6 0 0 0 .9.5l7-4.4a.6.6 0 0 0 0-1L3.9 1.1a.6.6 0 0 0-.9.5Z" />
          </svg>
        )}
      </button>
    </div>
  );
}
