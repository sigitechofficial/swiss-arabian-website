"use client";

import { useAuthStore } from "@/stores/useAuthStore";

export function useCurrentUser() {
  return useAuthStore((s) => s.user);
}

/** `true` once session bootstrap has settled — guest or signed in. */
export function useAuthBootstrapped() {
  return useAuthStore((s) => s.bootstrapped);
}

export function useIsAuthenticated() {
  return useAuthStore((s) => s.isAuthenticated);
}
