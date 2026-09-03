"use client";

import Image from "next/image";
import Link from "next/link";
import {
  FormEvent,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { IconSearch } from "@/components/layout/HeaderIcons";
import {
  catalogKeys,
  fetchCatalogSearch,
} from "@/features/catalog/api/catalog.service";
import { formatMoney } from "@/features/home/data/homeContent";
import { DEFAULT_ZONE_CODE } from "@/lib/storefront/context";
import { useMarket } from "@/providers/MarketProvider";
import { SEARCH_MIN_QUERY_LENGTH } from "../constants";
import { searchHref } from "../utils/searchUrl";

const TYPEAHEAD_LIMIT = 6;

function HeaderSearchField() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { marketId } = useMarket();
  const zoneCode = marketId || DEFAULT_ZONE_CODE;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);

  const onSearchPage = pathname === "/search";
  const expanded = open || onSearchPage;
  const q = value.trim();
  const showPanel = open && q.length >= SEARCH_MIN_QUERY_LENGTH;

  useEffect(() => {
    if (onSearchPage) {
      setValue(searchParams.get("q") ?? "");
      setOpen(true);
    }
  }, [onSearchPage, searchParams]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const { data, isFetching } = useQuery({
    queryKey: catalogKeys.search(q, zoneCode, 1, TYPEAHEAD_LIMIT, "newest"),
    queryFn: () =>
      fetchCatalogSearch(zoneCode, {
        q,
        page: 1,
        limit: TYPEAHEAD_LIMIT,
        onlySellable: true,
      }),
    enabled: showPanel,
  });

  const hits = data?.products ?? [];
  const total = data?.pagination.total ?? 0;

  function goToResults(query = q) {
    const trimmed = query.trim();
    if (trimmed.length < SEARCH_MIN_QUERY_LENGTH) {
      router.push("/search");
      setOpen(false);
      return;
    }
    router.push(searchHref({ q: trimmed }));
    setOpen(false);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    goToResults();
  }

  return (
    <div ref={rootRef} className="relative hidden md:block">
      <form
        onSubmit={onSubmit}
        role="search"
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
        className={`flex cursor-text items-center gap-2.5 border bg-cream px-4 py-2 transition-[width,border-color,box-shadow] duration-300 ease-out dark:bg-section-soft ${
          expanded
            ? "w-[min(28rem,42vw)] border-terra/40 shadow-[0_8px_24px_rgba(44,36,29,0.08)] dark:border-terra/50"
            : "w-52 border-bone dark:border-sa-input"
        }`}
      >
        <button
          type="submit"
          className="shrink-0 text-sa-primary transition-opacity hover:opacity-70"
          aria-label="Search"
        >
          <IconSearch />
        </button>
        <label className="sr-only" htmlFor="header-catalog-search">
          Search products
        </label>
        <input
          ref={inputRef}
          id="header-catalog-search"
          type="search"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="What are you looking for?"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent font-sans text-[12.4px] text-sa-primary outline-none placeholder:text-sa-muted"
        />
      </form>

      {showPanel ? (
        <div
          className="absolute right-0 z-50 mt-1.5 w-full border border-sa-border bg-page shadow-[0_12px_32px_rgba(44,36,29,0.12)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.4)]"
          role="listbox"
          aria-label="Search suggestions"
        >
          {isFetching && hits.length === 0 ? (
            <p className="px-4 py-5 text-[12px] text-sa-muted">Searching…</p>
          ) : hits.length === 0 ? (
            <p className="px-4 py-5 text-[12px] text-sa-muted">
              No matches for “{q}”
            </p>
          ) : (
            <ul>
              {hits.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/products/${product.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-cream dark:hover:bg-section-soft"
                  >
                    <span className="relative size-12 shrink-0 overflow-hidden border border-sa-border bg-white">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt=""
                          fill
                          className="object-contain p-1"
                          sizes="48px"
                        />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-semibold uppercase tracking-[0.04em] text-sa-primary">
                        {product.title}
                      </span>
                      {product.price != null ? (
                        <span className="mt-0.5 block text-[12px] text-sa-muted">
                          {formatMoney(product.price, product.currency || "AED")}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => goToResults()}
            className="flex w-full items-center justify-between border-t border-sa-border px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-terra hover:bg-cream dark:hover:bg-section-soft"
          >
            <span>View all results</span>
            {total > 0 ? <span className="tabular-nums">{total}</span> : null}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function HeaderSearch() {
  return (
    <Suspense
      fallback={
        <div className="hidden h-9 w-52 border border-bone bg-cream md:block dark:border-sa-input dark:bg-section-soft" />
      }
    >
      <HeaderSearchField />
    </Suspense>
  );
}
