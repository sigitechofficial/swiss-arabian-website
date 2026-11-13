"use client";

import { toast } from "@/components/ui/Toaster";
import { fetchCustomerMe } from "@/features/auth/api/auth.service";
import { applyCustomerProfile } from "@/features/auth/lib/applyAuthSession";
import { useApiMutation } from "@/lib/api/queryHooks";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { updateCustomerMe } from "../api/customerAccount.service";
import type { UpdateCustomerProfileDto } from "../types/customerAccount";

export function useUpdateCustomerMe() {
  const t = useShopCopy();
  return useApiMutation(
    async (dto: UpdateCustomerProfileDto) => {
      await updateCustomerMe(dto);
      return fetchCustomerMe();
    },
    {
      onSuccess: (me) => {
        applyCustomerProfile(me);
        toast(t("account.toast.profileUpdated"), "success");
      },
      onError: (error) => toast(getUserFacingErrorMessage(error), "error"),
    },
  );
}
