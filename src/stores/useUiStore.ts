"use client";

import { create } from "zustand";

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

export const useUiStore = create<UiState>((set) => ({
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
}));
