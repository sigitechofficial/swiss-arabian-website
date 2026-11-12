"use client";

import { useEffect, useId, useRef, useState } from "react";

/** Height of the closed block (about 6 lines of body text). */
const COLLAPSED_PX = 168;

const LABELS = {
  en: { more: "View all", less: "Show less" },
  ar: { more: "عرض الكل", less: "عرض أقل" },
} as const;

/**
 * SEO text body above the footer: a fixed height with a fade; when the text is
 * longer, "View all" opens it and "Show less" closes it again. The full text is
 * always in the page (search engines read all of it), only its height changes.
 */
export function SeoTextBody({ html, lang }: { html: string; lang: string }) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [fullHeight, setFullHeight] = useState(0);
  const [open, setOpen] = useState(false);
  const labels = lang === "ar" ? LABELS.ar : LABELS.en;

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

  const overflows = fullHeight > COLLAPSED_PX + 8;
  const closed = overflows && !open;

  return (
    <div>
      <div
        id={id}
        ref={ref}
        className="site-page-body relative overflow-hidden text-sm transition-[max-height] duration-300"
        style={{ maxHeight: closed ? COLLAPSED_PX : overflows ? fullHeight : undefined }}
      >
        <div dangerouslySetInnerHTML={{ __html: html }} />
        {closed ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--cream,#faf6ee)] to-transparent"
          />
        ) : null}
      </div>
      {overflows ? (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
          className="mt-3 cursor-pointer border-0 bg-transparent p-0 text-[0.78rem] font-semibold tracking-[0.08em] text-copper uppercase underline underline-offset-4"
        >
          {open ? labels.less : labels.more}
        </button>
      ) : null}
    </div>
  );
}
