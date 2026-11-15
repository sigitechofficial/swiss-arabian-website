"use client";

import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { useCollapsibleText } from "./useCollapsibleText";

/**
 * SEO text body above the footer: a fixed height with a fade; when the text is
 * longer, "View all" opens it and "Show less" closes it again. The full text is
 * always in the page (search engines read all of it), only its height changes.
 */
export function SeoTextBody({ html, lang: _lang }: { html: string; lang: string }) {
  const { id, ref, open, toggle, overflows, closed, maxHeight } = useCollapsibleText(html);
  // Buttons in the page's language (the text itself may be another language).
  const t = useShopCopy();
  const labels = { more: t("seoText.more"), less: t("seoText.less") };

  return (
    <div>
      <div
        id={id}
        ref={ref}
        className="site-page-body relative overflow-hidden text-sm transition-[max-height] duration-300"
        style={{ maxHeight }}
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
          onClick={toggle}
          className="mt-3 cursor-pointer border-0 bg-transparent p-0 text-[0.78rem] font-semibold tracking-[0.08em] text-copper uppercase underline underline-offset-4"
        >
          {open ? labels.less : labels.more}
        </button>
      ) : null}
    </div>
  );
}
