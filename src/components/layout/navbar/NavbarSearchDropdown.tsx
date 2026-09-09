"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { previewCatalog, searchCatalog } from "@/features/search";

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

export function NavbarSearchDropdown({
  placeholder = "Search fragrances",
}: {
  placeholder?: string;
} = {}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const popular = useMemo(
    () => (query.trim() ? searchCatalog(query, { limit: 6 }) : previewCatalog(6)),
    [query],
  );
  const newest = useMemo(() => previewCatalog(4), []);

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

  return (
    <div className="nav-search" ref={rootRef}>
      <label className="nav-search-field" htmlFor="nav-search-input">
        <SearchGlyph />
        <span className="visually-hidden">Search fragrances</span>
        <input
          id="nav-search-input"
          ref={inputRef}
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
        />
      </label>

      {open ? (
        <div className="nav-search-drop" id="nav-search-drop" role="dialog" aria-label="Search suggestions">
          <div className="nav-search-drop__popular">
            <p className="nav-search-drop__kicker">Results</p>
            <ul role="list">
              {popular.map((product) => (
                <li key={product.id}>
                  <Link href={`/products/${product.slug}`} onClick={() => setOpen(false)}>
                    <span>{product.title}</span>
                    <ChevronGlyph />
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              className="nav-search-drop__all"
              href="/products"
              onClick={() => setOpen(false)}
            >
              See all fragrances
            </Link>
          </div>

          <div className="nav-search-drop__new">
            <div className="nav-search-drop__new-head">
              <p className="nav-search-drop__kicker">New in</p>
              <Link href="/collections/new-launches" onClick={() => setOpen(false)}>
                See all
              </Link>
            </div>
            <ul className="nav-search-drop__cards" role="list">
              {newest.map((product) => (
                <li key={product.id}>
                  <Link href={`/products/${product.slug}`} onClick={() => setOpen(false)}>
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.title} width={120} height={150} />
                    ) : null}
                    <span>{product.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
