"use client";

import { useEffect, useRef } from "react";
import { SEARCH_MIN_QUERY_LENGTH } from "@/features/search";
import { useHeaderSearch } from "@/features/search/hooks/useHeaderSearch";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { Dialog } from "../../ui";
import { SearchIcon } from "../shared/icons";
import { SapilProductCard } from "../product";

const LIMIT = 8;

/** v9 search sheet: live results in the dialog; Enter opens every result on the search page. */
export function SapilSearchDialog() {
  const t = useSapilCopy();
  const { open, setOpen, query, setQuery, hits, search, goToResults } = useHeaderSearch({ limit: LIMIT });
  const inputRef = useRef<HTMLInputElement>(null);
  const typed = query.trim();
  const searching = typed.length >= SEARCH_MIN_QUERY_LENGTH;

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const total = search.total;
  const hint = !searching
    ? t("shell.searchHint")
    : search.isLoading || search.tooShort || search.isFetching
      ? t("shell.searchLoading")
      : search.isError
        ? t("shell.searchError")
        : t("shell.searchCount", { count: total });

  return (
    <Dialog open={open} onClose={() => setOpen(false)} label={t("shell.search")} wide closeLabel={t("shell.close")}>
      <div className="pt-[40px] px-[16px] pb-[40px] max-900:pt-[28px] max-900:px-[20px] max-900:pb-[28px]">
        <form
          role="search"
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            if (typed) goToResults();
          }}
          className="flex items-center gap-[12px] border-b border-sapil-ink pb-[10px] mb-[28px] me-[48px] [&>svg]:w-[22px] [&>svg]:h-[22px] [&>svg]:flex-none"
        >
          <SearchIcon />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("shell.searchPlaceholder")}
            aria-label={t("shell.search")}
            className="flex-1 min-w-0 border-0 bg-transparent font-sapil-serif text-[28px] font-[400] text-sapil-ink outline-none [&::-webkit-search-cancel-button]:appearance-none"
          />
        </form>
        <p className="text-sapil-muted mb-[28px] text-[15px]" aria-live="polite">
          {hint}
        </p>
        {searching && hits.length ? (
          <div className="grid grid-cols-4 gap-x-[24px] gap-y-[40px] max-900:grid-cols-2 max-900:gap-x-[16px] max-900:gap-y-[32px]">
            {hits.slice(0, LIMIT).map((p) => (
              <SapilProductCard key={p.id} product={p} wishlist={false} quickView={false} imageSizes="(max-width: 900px) 50vw, 25vw" />
            ))}
          </div>
        ) : null}
      </div>
    </Dialog>
  );
}
