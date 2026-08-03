"use client";

import { create } from "zustand";

type UiState = {
  mobileNavOpen: boolean;
  cartOpen: boolean;
  selectedMarketId: string | null;
  setMobileNavOpen: (open: boolean) => void;
  toggleMobileNav: () => void;
  setCartOpen: (open: boolean) => void;
  setSelectedMarketId: (id: string | null) => void;
};

export const useUiStore = create<UiState>((set) => ({
  mobileNavOpen: false,
  cartOpen: false,
  selectedMarketId: null,
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
  toggleMobileNav: () =>
    set((state) => ({ mobileNavOpen: !state.mobileNavOpen })),
  setCartOpen: (cartOpen) => set({ cartOpen }),
  setSelectedMarketId: (selectedMarketId) => set({ selectedMarketId }),
}));
