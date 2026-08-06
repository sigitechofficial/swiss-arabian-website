"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Reveal } from "@/components/motion";
import { toast } from "@/components/ui/Toaster";
import { STORE_LOCATIONS, type StoreLocation } from "../data/storesContent";
import { StoreMapPanel } from "./StoreMapPanel";

/**
 * Store locator — Figma 106:522 structure, Swiss Arabian theme
 * (gold eyebrow, terra CTAs, square borders, no pill chrome).
 */
export function StoresPageView() {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(
    STORE_LOCATIONS[0]?.id ?? null,
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return STORE_LOCATIONS;
    return STORE_LOCATIONS.filter(
      (store) =>
        store.name.toLowerCase().includes(q) ||
        store.address.toLowerCase().includes(q),
    );
  }, [query]);

  function selectStore(store: StoreLocation) {
    setActiveId(store.id);
    setExpandedId((current) => (current === store.id ? null : store.id));
  }

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    if (filtered[0]) {
      setActiveId(filtered[0].id);
      setExpandedId(filtered[0].id);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      toast("Location is not available in this browser.", "info");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => {
        toast("Nearest shops highlighted for your area.", "success");
        setActiveId(STORE_LOCATIONS[0]?.id ?? null);
      },
      () => {
        toast("Couldn’t access your location. Search by city instead.", "error");
      },
      { timeout: 8000 },
    );
  }

  return (
    <div className="bg-page">
      <div className="mx-auto max-w-[1280px] px-4 pb-16 pt-10 sm:px-6 lg:px-10 lg:pb-20 lg:pt-12">
        <Reveal fade>
          <header className="max-w-[720px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
              Visit us
            </p>
            <h1 className="mt-3 font-sans text-[clamp(2rem,4.5vw,3rem)] font-medium tracking-[-0.02em] text-sa-primary">
              Find a Swiss Arabian shop
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-sa-secondary">
              Discover our fragrances in person across the GCC — sample the
              collections, meet our fragrance advisors, and take home something
              wrapped by hand.
            </p>
          </header>
        </Reveal>

        <Reveal>
          <form
            onSubmit={handleSearch}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-stretch"
          >
            <label className="flex min-w-0 flex-1 items-center gap-3 border border-sa-input bg-page px-4 py-3 dark:bg-surface">
              <SearchIcon />
              <span className="sr-only">Search by city, mall or emirate</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by city, mall or emirate"
                className="w-full bg-transparent text-[14px] text-sa-primary outline-none placeholder:text-sa-muted"
              />
            </label>
            <button
              type="button"
              onClick={useMyLocation}
              className="border border-sa-primary px-6 py-3 text-[13px] font-semibold text-sa-primary transition-colors hover:border-terra hover:text-terra"
            >
              Use my location
            </button>
            <button
              type="submit"
              className="bg-terra px-8 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--sa-action-primary-hover)]"
            >
              Search
            </button>
          </form>
        </Reveal>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(360px,560px)] lg:gap-12 lg:pt-2">
          <Reveal className="order-2 min-w-0 lg:order-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sa-muted">
              {filtered.length}{" "}
              {filtered.length === 1 ? "shop" : "shops"}
            </p>

            <ul className="mt-4 border-t border-sa-border">
              {filtered.map((store, index) => {
                const isActive = store.id === activeId;
                const isExpanded = store.id === expandedId;
                return (
                  <li
                    key={store.id}
                    className={`border-b transition-colors ${
                      isActive ? "border-terra/50" : "border-sa-border"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => selectStore(store)}
                      className="group flex w-full items-baseline gap-4 py-3.5 text-left"
                      aria-expanded={isExpanded}
                    >
                      <span
                        className={`w-5 shrink-0 text-[11px] font-medium tabular-nums tracking-wide ${
                          isActive ? "text-terra" : "text-sa-muted"
                        }`}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-[15px] tracking-[-0.01em] transition-colors group-hover:text-terra ${
                            isActive
                              ? "font-semibold text-sa-primary"
                              : "font-medium text-sa-primary"
                          }`}
                        >
                          {store.name}
                        </span>
                        <span className="mt-1 block text-[12.5px] leading-relaxed text-sa-muted">
                          {store.address}
                          <span className="text-sa-muted/50"> · </span>
                          {store.hours}
                        </span>
                        {isExpanded && store.phone ? (
                          <span className="mt-2.5 block text-[12.5px] text-sa-secondary">
                            <a
                              href={`tel:${store.phone.replace(/\s/g, "")}`}
                              className="font-medium text-terra hover:underline"
                              onClick={(event) => event.stopPropagation()}
                            >
                              {store.phone}
                            </a>
                          </span>
                        ) : null}
                      </span>

                      <span
                        className={`shrink-0 self-center text-sa-muted/70 transition-transform duration-200 group-hover:text-sa-muted ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                        aria-hidden
                      >
                        <ChevronIcon />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {filtered.length === 0 ? (
              <p className="py-10 text-[13px] text-sa-muted">
                No shops match that search. Try another city or mall.
              </p>
            ) : null}
          </Reveal>

          <Reveal className="order-1 lg:order-2">
            <StoreMapPanel
              stores={filtered}
              activeId={activeId}
              onSelect={setActiveId}
            />
          </Reveal>
        </div>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden
      className="shrink-0 text-sa-muted"
    >
      <circle cx="8" cy="8" r="5.25" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M12.2 12.2 15.5 15.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M2.5 4.5 6 8l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
