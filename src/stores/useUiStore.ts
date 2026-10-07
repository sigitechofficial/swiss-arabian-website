"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { brandScopedStorage } from "@/lib/storefront/brandStorage";

/** Mirrors storefront catalogContext — kept here to avoid a cycle with context.ts. */
export type PersistedCatalogContext = {
  zoneCode?: string | null;
  languageCode?: string | null;
  currencyCode?: string | null;
  countryCode?: string | null;
  salesChannelCode?: string | null;
  zoneId?: string | null;
  brandId?: string | null;
  brandCode?: string | null;
};

type UiState = {
  cartOpen: boolean;
  searchOpen: boolean;
  mobileNavOpen: boolean;
  selectedMarketId: string | null;
  catalogContext: PersistedCatalogContext | null;
  setCartOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
  setSelectedMarketId: (id: string | null) => void;
  setCatalogContext: (ctx: PersistedCatalogContext | null) => void;
  selectMarket: (
    selectedMarketId: string | null,
    catalogContext: PersistedCatalogContext | null,
  ) => void;
};

type PersistedUiState = Pick<UiState, "selectedMarketId" | "catalogContext">;

export const useUiStore = create<UiState>()(
  persist<UiState, [], [], PersistedUiState>(
    (set) => ({
      cartOpen: false,
      searchOpen: false,
      mobileNavOpen: false,
      selectedMarketId: null,
      catalogContext: null,
      setCartOpen: (cartOpen) => set({ cartOpen }),
      setSearchOpen: (searchOpen) => set({ searchOpen }),
      setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
      setSelectedMarketId: (selectedMarketId) => set({ selectedMarketId }),
      setCatalogContext: (catalogContext) => set({ catalogContext }),
      selectMarket: (selectedMarketId, catalogContext) =>
        set({ selectedMarketId, catalogContext }),
    }),
    {
      // Only the shopper's country survives reloads (and full-page loads such
      // as a 404) — drawer/overlay open states always start closed.
      name: "sa-ui-market",
      storage: createJSONStorage(() => brandScopedStorage()),
      partialize: (state) => ({
        selectedMarketId: state.selectedMarketId,
        catalogContext: state.catalogContext,
      }),
      // Rehydrated after mount (see MarketProvider) so the first client render
      // matches the server's default market — no hydration mismatch.
      skipHydration: true,
    },
  ),
);
