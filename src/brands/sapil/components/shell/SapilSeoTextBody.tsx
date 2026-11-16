"use client";

import { useCollapsibleText } from "@/features/seo-footer/useCollapsibleText";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { buttonClass } from "../../ui/Button";
import { cx } from "../../ui/shared";

/** The SEO text body with v9 "View all / Show less" (shared `useCollapsibleText`). */
export function SapilSeoTextBody({ html }: { html: string }) {
  const { id, ref, open, toggle, overflows, closed, maxHeight } = useCollapsibleText(html);
  const t = useShopCopy();
  return (
    <div className="text-center">
      <div
        id={id}
        ref={ref}
        className="relative overflow-hidden text-start text-[15px] leading-[1.7] text-sapil-ink-2 [transition:max-height_.3s_var(--sapil-ease)] [&_p]:mb-[12px] [&_a]:underline [&_a]:underline-offset-[3px] [&_h2]:text-[18px] [&_h2]:font-[700] [&_h2]:text-sapil-ink [&_h2]:mt-[18px] [&_h2]:mb-[8px] [&_h3]:text-[18px] [&_h3]:mt-[18px] [&_h3]:mb-[8px] [&_ul]:list-disc [&_ul]:ps-[20px] [&_ol]:list-decimal [&_ol]:ps-[20px]"
        style={{ maxHeight }}
      >
        <div dangerouslySetInnerHTML={{ __html: html }} />
        {closed ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[64px] bg-[linear-gradient(to_top,var(--sapil-white),transparent)]"
          />
        ) : null}
      </div>
      {overflows ? (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={toggle}
          className={cx(buttonClass("link"), "mt-[14px]")}
        >
          {open ? t("seoText.less") : t("seoText.more")}
        </button>
      ) : null}
    </div>
  );
}
