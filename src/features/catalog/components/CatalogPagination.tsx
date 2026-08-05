"use client";

import Link from "next/link";

type CatalogPaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  hrefForPage: (page: number) => string;
};

function visiblePages(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set<number>();
  pages.add(1);
  pages.add(total);
  for (let p = current - 1; p <= current + 1; p += 1) {
    if (p >= 1 && p <= total) pages.add(p);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const n = sorted[i]!;
    if (i > 0 && n - sorted[i - 1]! > 1) out.push("ellipsis");
    out.push(n);
  }
  return out;
}

export function CatalogPagination({
  page,
  totalPages,
  total,
  hrefForPage,
}: CatalogPaginationProps) {
  if (totalPages <= 1) return null;

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;
  const items = visiblePages(page, totalPages);

  const navClass =
    "inline-flex h-10 min-w-10 items-center justify-center border border-sa-border px-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-sa-primary transition-colors hover:border-terra hover:text-terra disabled:pointer-events-none disabled:opacity-40";

  return (
    <nav
      className="mt-10 flex flex-col items-center gap-4 border-t border-sa-border pt-8"
      aria-label="Product pages"
    >
      <p className="text-[13px] text-sa-muted">
        Page {page} of {totalPages}
        <span className="mx-2 text-sa-border">·</span>
        {total} products
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {prevDisabled ? (
          <span className={`${navClass} opacity-40`} aria-disabled>
            Prev
          </span>
        ) : (
          <Link href={hrefForPage(page - 1)} className={`${navClass} cursor-pointer`} scroll>
            Prev
          </Link>
        )}

        {items.map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`e-${index}`}
              className="px-1 text-sa-muted"
              aria-hidden
            >
              …
            </span>
          ) : item === page ? (
            <span
              key={item}
              aria-current="page"
              className="inline-flex h-10 min-w-10 items-center justify-center bg-terra px-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-white"
            >
              {item}
            </span>
          ) : (
            <Link
              key={item}
              href={hrefForPage(item)}
              className={`${navClass} cursor-pointer`}
              scroll
            >
              {item}
            </Link>
          ),
        )}

        {nextDisabled ? (
          <span className={`${navClass} opacity-40`} aria-disabled>
            Next
          </span>
        ) : (
          <Link href={hrefForPage(page + 1)} className={`${navClass} cursor-pointer`} scroll>
            Next
          </Link>
        )}
      </div>
    </nav>
  );
}
