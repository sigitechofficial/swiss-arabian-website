import { clearTokens } from "./token";
import { queryClient } from "@/lib/api/queryClient";
import { insiderLogout } from "@/lib/insider";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCartStore } from "@/stores/useCartStore";
import { clearCartId } from "@/features/cart/utils/guestToken";

/** Clear tokens, Zustand auth, React Query cache, and local cart on logout. */
export function endSession(): void {
  insiderLogout();
  clearTokens();
  useAuthStore.getState().reset();
  queryClient.clear();
  useCartStore.getState().clear();
  useCartStore.getState().setCartId(null);
  clearCartId();
}
