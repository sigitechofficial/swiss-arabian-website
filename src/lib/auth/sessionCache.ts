import { queryClient } from "@/lib/api/queryClient";
import { employeeBenefitsKeys } from "@/features/employeeBenefits/api/employeeBenefits.keys";
import { promotionKeys } from "@/features/promotions/api/promotions.keys";
import { loyaltyKeys } from "@/features/loyalty/api/loyalty.keys";

/**
 * Drop customer-scoped server quotes after sign-in or registration.
 * The next Employee context response is the only source of isEmployee.
 */
export function refreshCustomerScopedCaches(): void {
  void queryClient.removeQueries({ queryKey: promotionKeys.all });
  void queryClient.removeQueries({ queryKey: loyaltyKeys.all });
  void queryClient.removeQueries({ queryKey: employeeBenefitsKeys.all });
}
