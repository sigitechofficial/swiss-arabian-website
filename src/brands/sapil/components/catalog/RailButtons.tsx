"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";
import { IconButton } from "../../ui";
import { ChevronIcon } from "../../ui/shared";

/**
 * v9 `.rail-ctrl`: previous / next buttons that scroll a rail by two cards.
 * Direction-aware (right-to-left pages scroll the other way); disabled at the ends.
 */
export function RailButtons({
  railRef,
  gap,
  previousLabel,
  nextLabel,
  disableAtEnds = true,
}: {
  /** v9's product-page rail dims the arrows at the ends; the shop's collection rail does not */
  disableAtEnds?: boolean;
  railRef: RefObject<HTMLElement | null>;
  /** gap between cards in px (the step is card width + gap) */
  gap: number;
  previousLabel: string;
  nextLabel: string;
}) {
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const offset = Math.abs(rail.scrollLeft);
    setAtStart(offset < 8);
    setAtEnd(offset + rail.clientWidth > rail.scrollWidth - 8);
  }, [railRef]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    sync();
    rail.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      rail.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [railRef, sync]);

  const scroll = (forward: boolean) => {
    const rail = railRef.current;
    const first = rail?.firstElementChild as HTMLElement | null;
    if (!rail || !first) return;
    const rtl = getComputedStyle(rail).direction === "rtl";
    const step = (first.getBoundingClientRect().width + gap) * 2;
    rail.scrollBy({ left: (forward ? step : -step) * (rtl ? -1 : 1), behavior: "smooth" });
  };

  return (
    <div className="flex gap-[8px]">
      <IconButton variant="outlined" label={previousLabel} disabled={disableAtEnds && atStart} onClick={() => scroll(false)} className="rtl:-scale-x-100">
        <ChevronIcon dir="left" />
      </IconButton>
      <IconButton variant="outlined" label={nextLabel} disabled={disableAtEnds && atEnd} onClick={() => scroll(true)} className="rtl:-scale-x-100">
        <ChevronIcon dir="right" />
      </IconButton>
    </div>
  );
}
