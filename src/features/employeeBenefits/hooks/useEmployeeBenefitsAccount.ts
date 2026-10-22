"use client";

import { useApiMutation, useApiQuery } from "@/lib/api/queryHooks";
import { queryClient } from "@/lib/api/queryClient";
import { useAuthStore } from "@/stores/useAuthStore";
import { employeeBenefitsKeys } from "../api/employeeBenefits.keys";
import {
  acceptEmployeeInvitation,
  fetchEmployeeBenefits,
  fetchEmployeeLink,
} from "../api/employeeBenefits.service";

export function useEmployeeBenefitsAccount() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const customerId = useAuthStore((s) => s.user?.id ?? "");
  const canLoad = bootstrapped && isAuthenticated && Boolean(customerId);

  const link = useApiQuery(
    employeeBenefitsKeys.link(customerId),
    fetchEmployeeLink,
    { enabled: canLoad },
  );

  const active = link.data?.status === "ACTIVE";

  const benefits = useApiQuery(
    employeeBenefitsKeys.benefits(customerId),
    fetchEmployeeBenefits,
    { enabled: canLoad && active },
  );

  const accept = useApiMutation(acceptEmployeeInvitation, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: employeeBenefitsKeys.all });
    },
  });

  return {
    link,
    benefits,
    accept,
    bootstrapped,
    isAuthenticated,
    customerId,
  };
}
