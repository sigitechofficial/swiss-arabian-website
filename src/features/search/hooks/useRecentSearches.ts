"use client";

import { useCallback, useMemo, useState } from "react";
import { useHydrated } from "@/hooks/useHydrated";
import { readRecentSearches, rememberSearchQuery } from "../utils/recentSearches";

export function useRecentSearches() {
  // Stored searches are browser-only: read after hydration; after a new
  // search, the updated list returned by rememberSearchQuery wins.
  const hydrated = useHydrated();
  const stored = useMemo(() => (hydrated ? readRecentSearches() : []), [hydrated]);
  const [updated, setUpdated] = useState<string[] | null>(null);
  const items = updated ?? stored;

  const remember = useCallback((query: string) => {
    setUpdated(rememberSearchQuery(query));
  }, []);

  return { items, remember };
}
