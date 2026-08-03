import { clearTokens } from "./token";
import { queryClient } from "@/lib/api/queryClient";
import { useAuthStore } from "@/stores/useAuthStore";

/** Clear tokens, Zustand auth, and React Query cache together. */
export function endSession(): void {
  clearTokens();
  useAuthStore.getState().reset();
  queryClient.clear();
}
