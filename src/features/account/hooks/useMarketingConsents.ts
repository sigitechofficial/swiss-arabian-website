"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/Toaster";
import { useApiMutation, useApiQuery } from "@/lib/api/queryHooks";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import { customerAccountKeys } from "../api/customerAccount.keys";
import {
  listMarketingConsents,
  updateMarketingConsents,
} from "../api/customerAccount.service";
import type { UpdateMarketingConsentsDto } from "../types/customerAccount";

export function useMarketingConsents() {
  const queryClient = useQueryClient();
  const list = useApiQuery(
    customerAccountKeys.consents(),
    listMarketingConsents,
  );

  const update = useApiMutation(
    (dto: UpdateMarketingConsentsDto) => updateMarketingConsents(dto),
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: customerAccountKeys.consents(),
        });
        toast("Communication preferences saved", "success");
      },
      onError: (error) => toast(getUserFacingErrorMessage(error), "error"),
    },
  );

  return { list, update };
}
