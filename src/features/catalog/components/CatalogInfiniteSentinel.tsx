"use client";

import { useEffect, useRef } from "react";

export function CatalogInfiniteSentinel({
  disabled,
  loading,
  onVisible,
}: {
  disabled?: boolean;
  loading?: boolean;
  onVisible: () => void;
}) {
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
      aria-hidden={!loading}
    >
      {loading ? (
        <p className="text-[13px] text-sa-muted" role="status">
          Loading more products…
        </p>
      ) : (
        <span className="h-px w-px overflow-hidden" />
      )}
    </div>
  );
}
