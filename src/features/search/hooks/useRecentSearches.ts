"use client";

import { useCallback, useEffect, useState } from "react";
import { readRecentSearches, rememberSearchQuery } from "../utils/recentSearches";

export function useRecentSearches() {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    setItems(readRecentSearches());
  }, []);

  const remember = useCallback((query: string) => {
    setItems(rememberSearchQuery(query));
  }, []);

  return { items, remember };
}
