"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { previewCancelItems, type CancelItemInput } from "@/features/account/api/customerOrders.service";
import { useDebounce } from "@/hooks/useDebounce";
import { getUserFacingErrorMessage } from "@/lib/api/userFacingErrors";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import type { CancellableLine } from "../utils/cancelItems";

/**
 * Picking units to cancel inside the cancellation window, for every brand.
 * Each change asks the server what it would refund (offers, free gifts and
 * free delivery the kept items no longer earn), so the customer confirms
 * knowing the amount. Confirm is ready only once that preview is in.
 */
export function useCancelItemsSelection(orderId: string, lines: readonly CancellableLine[]) {
  const t = useShopCopy();
  const [qty, setQty] = useState<Record<string, number>>({});
  const items: CancelItemInput[] = useMemo(
    () =>
      lines
        .filter((line) => (qty[line.orderLineId] ?? 0) > 0)
        .map((line) => ({ orderLineId: line.orderLineId, quantity: qty[line.orderLineId] })),
    [lines, qty],
  );
  const debouncedItems = useDebounce(items, 350);
  const settled = debouncedItems === items;
  const previewQuery = useQuery({
    queryKey: ["cancel-items-preview", orderId, debouncedItems],
    queryFn: () => previewCancelItems(orderId, debouncedItems),
    enabled: debouncedItems.length > 0,
    retry: false,
    staleTime: 15_000,
  });
  const preview = settled && items.length > 0 ? previewQuery.data : undefined;
  const loading = items.length > 0 && (!settled || previewQuery.isFetching);
  const error =
    items.length > 0 && !loading && !preview && previewQuery.isError
      ? getUserFacingErrorMessage(previewQuery.error, t("orders.cancel.preview.failed"), t)
      : null;

  return {
    /** Units picked per order line. */
    selected: (orderLineId: string) => qty[orderLineId] ?? 0,
    change: (orderLineId: string, max: number, delta: number) =>
      setQty((current) => ({
        ...current,
        [orderLineId]: Math.min(max, Math.max(0, (current[orderLineId] ?? 0) + delta)),
      })),
    items,
    preview,
    loading,
    error,
    canConfirm: items.length > 0 && !loading && Boolean(preview),
  };
}
