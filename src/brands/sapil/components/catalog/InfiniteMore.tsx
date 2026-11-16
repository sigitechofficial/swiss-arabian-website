"use client";

import { useEffect, useRef } from "react";
import { useSapilCopy } from "../../i18n/SapilCopy";

/**
 * Infinite scroll under the grid: the next page loads as this comes near the
 * screen. Without JavaScript (crawlers) it is a plain "More products" link to
 * the next page's address.
 */
export function InfiniteMore({
  hasNext,
  loading,
  nextHref,
  onLoadMore,
}: {
  hasNext: boolean;
  loading: boolean;
  /** Address of the next page (?page=N). */
  nextHref: string | null;
  onLoadMore: () => void;
}) {
  const t = useSapilCopy();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || !hasNext || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onLoadMore();
      },
      { rootMargin: "480px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNext, loading, onLoadMore]);

  if (!hasNext && !loading) return null;
  return (
    <div ref={ref} className="mt-[48px] flex justify-center">
      {loading ? (
        <p role="status" className="text-[14px] text-sapil-muted">
          {t("catalog.loadingMore")}
        </p>
      ) : nextHref ? (
        <a
          href={nextHref}
          onClick={(event) => {
            event.preventDefault();
            onLoadMore();
          }}
          className="font-[600] text-[15px] border-b border-current pb-[2px] [transition:color_.18s] hover:text-sapil-accent"
        >
          {t("catalog.moreProducts")}
        </a>
      ) : null}
    </div>
  );
}
