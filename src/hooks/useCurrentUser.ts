"use client";

import { useAuthStore } from "@/stores/useAuthStore";

export function useCurrentUser() {
  return useAuthStore((s) => s.user);
}
