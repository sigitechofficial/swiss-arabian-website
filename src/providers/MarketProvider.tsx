"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useUiStore } from "@/stores/useUiStore";

type MarketContextValue = {
  marketId: string | null;
  setMarketId: (id: string | null) => void;
};

const MarketContext = createContext<MarketContextValue | null>(null);

export function MarketProvider({ children }: { children: ReactNode }) {
  const marketId = useUiStore((s) => s.selectedMarketId);
  const setMarketId = useUiStore((s) => s.setSelectedMarketId);

  const value = useMemo(
    () => ({ marketId, setMarketId }),
    [marketId, setMarketId],
  );

  return (
    <MarketContext.Provider value={value}>{children}</MarketContext.Provider>
  );
}

export function useMarket() {
  const ctx = useContext(MarketContext);
  if (!ctx) {
    throw new Error("useMarket must be used within MarketProvider");
  }
  return ctx;
}
