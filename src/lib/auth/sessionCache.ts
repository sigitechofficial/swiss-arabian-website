import { queryClient } from "@/lib/api/queryClient";
import { promotionKeys } from "@/features/promotions/api/promotions.keys";
import { loyaltyKeys } from "@/features/loyalty/api/loyalty.keys";

/**
 * Drop customer-scoped server quotes after sign-in.
 * Eligibility stays on the next Backend response — this only clears the guest cache.
 */
export function refreshCustomerScopedCaches(): void {
  void queryClient.removeQueries({ queryKey: promotionKeys.all });
  void queryClient.removeQueries({ queryKey: loyaltyKeys.all });
}
