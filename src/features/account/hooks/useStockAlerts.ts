"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/Toaster";
import { useApiMutation, useApiQuery } from "@/lib/api/queryHooks";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { customerAccountKeys } from "../api/customerAccount.keys";
import { cancelStockAlert, listStockAlerts } from "../api/customerAccount.service";

/** The shopper's waiting back-in-stock alerts, and stopping one of them (D3-4b). */
export function useStockAlerts() {
  const queryClient = useQueryClient();
  const t = useShopCopy();
  const list = useApiQuery(customerAccountKeys.stockAlerts(), listStockAlerts);
  const cancel = useApiMutation((id: string) => cancelStockAlert(id), {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: customerAccountKeys.stockAlerts() });
      toast(t("stockAlertsStopped"), "success");
    },
    onError: () => toast(t("stockAlertsError"), "error"),
  });
  return { list, cancel };
}
