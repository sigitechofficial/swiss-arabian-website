"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { IconButton } from "../../ui";
import { NextIcon, PrevIcon } from "../shared/icons";

/**
 * A horizontal rail's arrows (v9 `cardRail`): scroll two items at a time, disable
 * at the ends. Works right-to-left (the browser's scrollLeft runs negative there).
 */
export function useRail<T extends HTMLElement>(gapFallback = 24) {
  const ref = useRef<T>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const pos = Math.abs(el.scrollLeft);
    setAtStart(pos < 8);
    setAtEnd(pos + el.clientWidth > el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      ro?.disconnect();
    };
  }, [measure]);

  const step = useCallback(
    (dir: 1 | -1) => {
      const el = ref.current;
      const first = el?.firstElementChild as HTMLElement | null;
      if (!el || !first) return;
      const gap = parseFloat(getComputedStyle(el).columnGap) || gapFallback;
      const rtl = getComputedStyle(el).direction === "rtl";
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const amount = (first.getBoundingClientRect().width + gap) * 2 * dir * (rtl ? -1 : 1);
      el.scrollBy({ left: amount, behavior: reduce ? "auto" : "smooth" });
    },
    [gapFallback],
  );

  // The DOM ref travels apart from the render state (callers destructure it).
  return { railRef: ref, atStart, atEnd, prev: () => step(-1), next: () => step(1) };
}

/** v9 `.rail-ctrl`: outlined previous / next buttons (arrows mirror in RTL). */
export function RailControls({
  atStart,
  atEnd,
  prev,
  next,
  prevLabel,
  nextLabel,
}: {
  atStart: boolean;
  atEnd: boolean;
  prev: () => void;
  next: () => void;
  prevLabel?: string;
  nextLabel?: string;
}) {
  const t = useSapilCopy();
  return (
    <div className="flex gap-[8px] [&_svg]:rtl:[transform:scaleX(-1)]">
      <IconButton variant="outlined" label={prevLabel ?? t("home.previous")} onClick={prev} disabled={atStart}>
        <PrevIcon />
      </IconButton>
      <IconButton variant="outlined" label={nextLabel ?? t("home.next")} onClick={next} disabled={atEnd}>
        <NextIcon />
      </IconButton>
    </div>
  );
}
