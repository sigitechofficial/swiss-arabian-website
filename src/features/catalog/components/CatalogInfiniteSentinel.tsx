"use client";

import { useEffect, useRef } from "react";
import { useShopCopy } from "@/lib/i18n/useShopCopy";

export function CatalogInfiniteSentinel({
  disabled,
  loading,
  onVisible,
  nextHref,
}: {
  disabled?: boolean;
  loading?: boolean;
  onVisible: () => void;
  /** Address of the next page: a plain link crawlers can follow (no JavaScript). */
  nextHref?: string | null;
}) {
  const t = useShopCopy();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onVisible();
      },
      { rootMargin: "480px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [disabled, onVisible]);

  if (disabled && !loading) return null;

  return (
    <div
      ref={ref}
      className="mt-10 flex justify-center border-t border-sa-border pt-8"
    >
      {loading ? (
        <p className="text-[13px] text-sa-muted" role="status">
          {t("catalog.loadingMore")}
        </p>
      ) : nextHref && !disabled ? (
        <a
          href={nextHref}
          className="text-[13px] text-[var(--ink,#241f1b)] underline underline-offset-4"
          onClick={(event) => {
            // With JavaScript the next products load in place (infinite scroll).
            event.preventDefault();
            onVisible();
          }}
        >
          {t("catalog.moreProducts")}
        </a>
      ) : (
        <span className="h-px w-px overflow-hidden" aria-hidden="true" />
      )}
    </div>
  );
}
