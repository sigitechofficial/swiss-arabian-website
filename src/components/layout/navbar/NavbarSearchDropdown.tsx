"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCatalogSearch, SEARCH_IDLE_SHORTCUTS, SEARCH_MIN_QUERY_LENGTH } from "@/features/search";
import { useNewLaunchesPreview } from "@/features/search/hooks/useNewLaunchesPreview";
import { useRecentSearches } from "@/features/search/hooks/useRecentSearches";
import type { ProductSummary } from "@/features/catalog/types/product";

function SearchGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function ChevronGlyph() {
  return (
    <svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M4.5 2.5 8 6 4.5 9.5" />
    </svg>
  );
}

function ProductRow({
  product,
  onPick,
}: {
  product: ProductSummary;
  onPick: () => void;
}) {
  return (
    <li>
      <Link href={`/products/${product.slug}`} onClick={onPick}>
        <span className="nav-search-drop__thumb" aria-hidden="true">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt=""
              width={44}
              height={44}
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.visibility = "hidden";
              }}
            />
          ) : null}
        </span>
        <span className="nav-search-drop__name">{product.title}</span>
        <ChevronGlyph />
      </Link>
    </li>
  );
}

export function NavbarSearchDropdown({
  placeholder = "Search fragrances",
}: {
  placeholder?: string;
} = {}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { items: recents, remember } = useRecentSearches();

  const trimmed = query.trim();
  const isIdle = trimmed.length < SEARCH_MIN_QUERY_LENGTH;
  const { products: hits } = useCatalogSearch(query, { limit: 6 });
  const newest = useNewLaunchesPreview(open);

  const close = () => {
    setOpen(false);
    inputRef.current?.blur();
  };

  function goToSearch(nextQuery: string) {
    const q = nextQuery.trim();
    if (q.length < SEARCH_MIN_QUERY_LENGTH) return;
    remember(q);
    close();
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  function submit() {
    goToSearch(trimmed);
  }

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const idleKicker = recents.length ? "Recent" : "Popular";

  return (
    <div className="nav-search" ref={rootRef}>
      <label className="nav-search-field" htmlFor="nav-search-input">
        <SearchGlyph />
        <span className="visually-hidden">Search fragrances</span>
        <input
          id="nav-search-input"
          ref={inputRef}
          className="nav-search-input"
          type="search"
          placeholder={placeholder}
          autoComplete="off"
          value={query}
          aria-expanded={open}
          aria-controls="nav-search-drop"
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
        />
      </label>

      {open ? (
        <div className="nav-search-drop" id="nav-search-drop" role="dialog" aria-label="Search suggestions">
          <div className="nav-search-drop__popular">
            <p className="nav-search-drop__kicker">{isIdle ? idleKicker : "Results"}</p>
            {isIdle ? (
              recents.length ? (
                <ul className="nav-search-drop__queries" role="list">
                  {recents.map((item) => (
                    <li key={item}>
                      <button type="button" onClick={() => goToSearch(item)}>
                        <span>{item}</span>
                        <ChevronGlyph />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="nav-search-drop__queries" role="list">
                  {SEARCH_IDLE_SHORTCUTS.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} onClick={close}>
                        <span>{item.label}</span>
                        <ChevronGlyph />
                      </Link>
                    </li>
                  ))}
                </ul>
              )
            ) : hits.length ? (
              <ul role="list">
                {hits.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    onPick={() => {
                      remember(trimmed);
                      close();
                    }}
                  />
                ))}
              </ul>
            ) : (
              <p className="nav-search-drop__empty">No matches yet — keep typing or browse new in.</p>
            )}
            {isIdle ? null : (
              <button type="button" className="nav-search-drop__all" onClick={submit}>
                See all results
              </button>
            )}
          </div>

          {newest.length ? (
            <div className="nav-search-drop__new">
              <div className="nav-search-drop__new-head">
                <p className="nav-search-drop__kicker">New in</p>
                <Link href="/collections/new-launches" onClick={close}>
                  See all
                </Link>
              </div>
              <ul className="nav-search-drop__cards" role="list">
                {newest.map((product) => (
                  <li key={product.id}>
                    <Link href={`/products/${product.slug}`} onClick={close}>
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.imageUrl} alt={product.title} width={120} height={150} />
                      ) : null}
                      <span>{product.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
