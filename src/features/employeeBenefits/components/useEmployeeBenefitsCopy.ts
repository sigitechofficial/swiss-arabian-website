"use client";

import { useMemo } from "react";
import type { MessageKey } from "@/lib/i18n/messages";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { EMPLOYEE_BENEFITS_COPY } from "../types/employeeBenefits";

type EmployeeBenefitsCopy = { [K in keyof typeof EMPLOYEE_BENEFITS_COPY]: string };

/** `EMPLOYEE_BENEFITS_COPY` in the page's language (`employee.copy.<name>` in `src/messages`). */
export function useEmployeeBenefitsCopy(): EmployeeBenefitsCopy {
  const t = useShopCopy();
  return useMemo(
    () =>
      Object.fromEntries(
        Object.keys(EMPLOYEE_BENEFITS_COPY).map((name) => [name, t(`employee.copy.${name}` as MessageKey)]),
      ) as EmployeeBenefitsCopy,
    [t],
  );
}
