"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/Toaster";
import { fetchCustomerMe } from "@/features/auth/api/auth.service";
import { applyCustomerProfile } from "@/features/auth/lib/applyAuthSession";
import { useApiMutation, useApiQuery } from "@/lib/api/queryHooks";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import { customerAccountKeys } from "../api/customerAccount.keys";
import {
  createCustomerPhone,
  deleteCustomerPhone,
  listCustomerPhones,
  setDefaultCustomerPhone,
} from "../api/customerAccount.service";
import type { CreateCustomerPhoneDto } from "../types/customerAccount";

async function refreshMe() {
  const me = await fetchCustomerMe();
  applyCustomerProfile(me);
}

export function useCustomerPhones() {
  const queryClient = useQueryClient();
  const list = useApiQuery(customerAccountKeys.phones(), listCustomerPhones);

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: customerAccountKeys.phones(),
    });
    try {
      await refreshMe();
    } catch {
      // Phone book still updated even if /me refresh fails.
    }
  };

  const create = useApiMutation(
    (dto: CreateCustomerPhoneDto) => createCustomerPhone(dto),
    {
      onSuccess: async () => {
        await invalidate();
        toast("Phone saved", "success");
      },
      onError: (error) => toast(getUserFacingErrorMessage(error), "error"),
    },
  );

  const remove = useApiMutation(deleteCustomerPhone, {
    onSuccess: async () => {
      await invalidate();
      toast("Phone removed", "success");
    },
    onError: (error) => toast(getUserFacingErrorMessage(error), "error"),
  });

  const setPrimary = useApiMutation(setDefaultCustomerPhone, {
    onSuccess: async () => {
      await invalidate();
      toast("Primary phone updated", "success");
    },
    onError: (error) => toast(getUserFacingErrorMessage(error), "error"),
  });

  return { list, create, remove, setPrimary };
}
