"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { localizeHref } from "@/lib/i18n/localePath";
import { useUiStore } from "@/stores/useUiStore";
import { rememberSearchQuery } from "../utils/recentSearches";
import { SEARCH_MIN_QUERY_LENGTH } from "../constants";
import { useCatalogSearch } from "./useCatalogSearch";

/**
 * The header search dialog: open state (shared store), the typed query, live
 * hits, and where Enter / a hit goes. The query clears whenever the dialog closes.
 */
export function useHeaderSearch({ limit }: { limit: number }) {
  const open = useUiStore((s) => s.searchOpen);
  const setOpen = useUiStore((s) => s.setSearchOpen);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const pathname = usePathname() || "/";

  // Live catalog search, debounced and gated by the shared hook.
  const search = useCatalogSearch(query, { limit });
  const hits = search.products;

  // Clear the search when the dialog closes (it can be closed from the store
  // elsewhere), adjusting state during render instead of in an effect.
  const [lastOpen, setLastOpen] = useState(open);
  if (lastOpen !== open) {
    setLastOpen(open);
    if (!open) {
      setQuery("");
      setActiveIndex(0);
    }
  }

  function remember() {
    const q = query.trim();
    if (q.length >= SEARCH_MIN_QUERY_LENGTH) rememberSearchQuery(q);
  }

  function goToResults() {
    const q = query.trim();
    remember();
    setOpen(false);
    router.push(localizeHref(q ? `/search?q=${encodeURIComponent(q)}` : "/search", pathname));
  }

  function goToHit(index: number) {
    const hit = hits[index];
    remember();
    if (!hit) {
      goToResults();
      return;
    }
    setOpen(false);
    router.push(localizeHref(`/products/${hit.slug}`, pathname));
  }

  return {
    open,
    setOpen,
    query,
    setQuery,
    activeIndex,
    setActiveIndex,
    hits,
    search,
    hasQuery: query.trim().length > 0,
    goToResults,
    goToHit,
  };
}
