"use client";

import { useEffect, useId, useRef, useState } from "react";

/** Height of the closed block (about 6 lines of body text). */
export const SEO_TEXT_COLLAPSED_PX = 168;

/**
 * The SEO text block's "View all / Show less" behaviour, for every brand: a
 * fixed height while closed, opened to the text's measured height. The full
 * text is always in the page (search engines read all of it).
 */
export function useCollapsibleText(html: string, collapsedPx = SEO_TEXT_COLLAPSED_PX) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [fullHeight, setFullHeight] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setFullHeight(el.scrollHeight);
    measure();
    // Watch the text itself: its height changes with the window width even while the box is capped.
    const observer = new ResizeObserver(measure);
    observer.observe(el.firstElementChild ?? el);
    return () => observer.disconnect();
  }, [html]);

  const overflows = fullHeight > collapsedPx + 8;
  const closed = overflows && !open;
  return {
    id,
    ref,
    open,
    toggle: () => setOpen((v) => !v),
    overflows,
    closed,
    /** Inline max-height for the text box. */
    maxHeight: closed ? collapsedPx : overflows ? fullHeight : undefined,
  };
}
