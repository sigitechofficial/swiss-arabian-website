"use client";

import { create } from "zustand";

export type StoreUser = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
};

type AuthState = {
  user: StoreUser | null;
  isAuthenticated: boolean;
  bootstrapped: boolean;
  setUser: (user: StoreUser | null) => void;
  setBootstrapped: (value: boolean) => void;
  reset: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  bootstrapped: false,
  setUser: (user) =>
    set({
      user,
      isAuthenticated: Boolean(user),
    }),
  setBootstrapped: (bootstrapped) => set({ bootstrapped }),
  reset: () =>
    set({
      user: null,
      isAuthenticated: false,
      bootstrapped: true,
    }),
}));
