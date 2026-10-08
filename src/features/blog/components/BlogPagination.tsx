import Link from "next/link";

type BlogPaginationProps = {
  page: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
};

/** Figma blog pagination — numbered squares + Next → */
export function BlogPagination({
  page,
  totalPages,
  hrefForPage,
}: BlogPaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from(
    { length: Math.min(totalPages, 3) },
    (_, i) => i + 1,
  );
  const nextDisabled = page >= totalPages;

  const cell =
    "inline-flex h-[38px] min-w-[38px] items-center justify-center text-[12px] font-semibold text-sa-primary";

  return (
    <nav
      className="flex items-center justify-center gap-0 pt-2"
      aria-label="Blog pages"
    >
      {pages.map((n) =>
        n === page ? (
          <span
            key={n}
            aria-current="page"
            className={`${cell} bg-terra text-white`}
          >
            {n}
          </span>
        ) : (
          <Link
            key={n}
            href={hrefForPage(n)}
            className={`${cell} cursor-pointer transition-colors hover:text-terra`}
            scroll
          >
            {n}
          </Link>
        ),
      )}
      {nextDisabled ? (
        <span className={`${cell} min-w-[77px] px-4 opacity-40`} aria-disabled>
          Next →
        </span>
      ) : (
        <Link
          href={hrefForPage(page + 1)}
          className={`${cell} min-w-[77px] cursor-pointer px-4 transition-colors hover:text-terra`}
          scroll
        >
          Next →
        </Link>
      )}
    </nav>
  );
}
