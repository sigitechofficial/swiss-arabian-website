"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type UiState = {
  mobileNavOpen: boolean;
  cartOpen: boolean;
  searchOpen: boolean;
  selectedMarketId: string | null;
  setMobileNavOpen: (open: boolean) => void;
  toggleMobileNav: () => void;
  setCartOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setSelectedMarketId: (id: string | null) => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      mobileNavOpen: false,
      cartOpen: false,
      searchOpen: false,
      selectedMarketId: null,
      setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
      toggleMobileNav: () =>
        set((state) => ({ mobileNavOpen: !state.mobileNavOpen })),
      setCartOpen: (cartOpen) => set({ cartOpen }),
      setSearchOpen: (searchOpen) => set({ searchOpen }),
      setSelectedMarketId: (selectedMarketId) => set({ selectedMarketId }),
    }),
    {
      // Only the shopper's country survives reloads (and full-page loads such
      // as a 404) — drawer/overlay open states always start closed.
      name: "sa-ui-market",
      partialize: (state) => ({ selectedMarketId: state.selectedMarketId }),
      // Rehydrated after mount (see MarketProvider) so the first client render
      // matches the server's default market — no hydration mismatch.
      skipHydration: true,
    },
  ),
);
