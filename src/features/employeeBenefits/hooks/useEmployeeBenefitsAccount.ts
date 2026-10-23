"use client";

import { useApiQuery } from "@/lib/api/queryHooks";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUiStore } from "@/stores/useUiStore";
import { employeeBenefitsKeys } from "../api/employeeBenefits.keys";
import {
  fetchEmployeeBenefits,
  fetchEmployeeContext,
  fetchEmployeeLink,
} from "../api/employeeBenefits.service";
import { trustedLegalEntityCode, trustedZoneCode } from "../types/employeeBenefits";

export function useEmployeeBenefitsAccount() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const customerId = useAuthStore((s) => s.user?.id ?? "");
  const zoneCode = trustedZoneCode(useUiStore((s) => s.catalogContext?.zoneCode));
  const canLoad = bootstrapped && isAuthenticated && Boolean(customerId) && Boolean(zoneCode);

  const link = useApiQuery(
    employeeBenefitsKeys.link(customerId, zoneCode ?? ""),
    () => fetchEmployeeLink(zoneCode as string),
    { enabled: canLoad },
  );

  const context = useApiQuery(
    employeeBenefitsKeys.context(customerId, zoneCode ?? ""),
    () => fetchEmployeeContext(zoneCode as string),
    { enabled: canLoad },
  );

  const isEmployee = context.data?.isEmployee === true;
  const legalEntityCode = trustedLegalEntityCode(context.data?.legalEntityCode);
  const benefits = useApiQuery(
    employeeBenefitsKeys.benefits(customerId, zoneCode ?? "", legalEntityCode ?? ""),
    () => fetchEmployeeBenefits(zoneCode as string),
    { enabled: canLoad && isEmployee },
  );

  return {
    link,
    context,
    benefits,
    isEmployee,
    zoneCode,
    legalEntityCode,
    bootstrapped,
    isAuthenticated,
    customerId,
  };
}
