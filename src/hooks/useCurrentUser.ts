"use client";

import { useAuthStore } from "@/stores/useAuthStore";

export function useCurrentUser() {
  return useAuthStore((s) => s.user);
}

export function useIsAuthenticated() {
  return useAuthStore((s) => s.isAuthenticated);
}

export function useAuthBootstrapped() {
  return useAuthStore((s) => s.bootstrapped);
}
