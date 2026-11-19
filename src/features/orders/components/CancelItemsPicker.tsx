"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus } from "lucide-react";
import {
  previewCancelItems,
  type CancelItemInput,
  type CancelItemsPreview,
} from "@/features/account/api/customerOrders.service";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { useDebounce } from "@/hooks/useDebounce";
import { ApiClientError } from "@/lib/api/apiError";
import type { Translator } from "@/lib/i18n/messages";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { orderCancelBtn, orderCancelConfirm, orderLineMeta } from "@/styles/accountChrome";

export type CancellableLine = {
  orderLineId: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

const stepBtn =
  "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#c9a45c] bg-white text-[#6d5320] transition-colors hover:bg-[#fbf5e8] disabled:cursor-default disabled:opacity-40";

/**
 * Pick units to cancel inside the cancellation window. Each change asks the
 * server what it would refund (offers, free gifts and free delivery the kept
 * items no longer earn), so the customer confirms knowing the amount.
 */
export function CancelItemsPicker({
  orderId,
  lines,
  hasGifts,
  currency,
  pending,
  onConfirm,
  onBack,
}: {
  orderId: string;
  lines: CancellableLine[];
  /** The order has free gifts (not selectable; they follow their offer). */
  hasGifts: boolean;
  currency: string;
  pending: boolean;
  onConfirm: (items: CancelItemInput[]) => void;
  onBack: () => void;
}) {
  const t = useShopCopy();
  const [qty, setQty] = useState<Record<string, number>>({});
  const items = useMemo(
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

  const change = (id: string, max: number, delta: number) =>
    setQty((current) => ({ ...current, [id]: Math.min(max, Math.max(0, (current[id] ?? 0) + delta)) }));

  return (
    <div className="grid w-full gap-3">
      <div>
        <p className="m-0 text-[0.86rem] font-semibold">{t("orders.cancel.chooseItems")}</p>
        <p className="m-0 mt-0.5 text-[0.76rem]">{t("orders.cancel.chooseHint")}</p>
      </div>
      <ul className="m-0 grid list-none gap-2 p-0" role="list">
        {lines.map((line) => {
          const selected = qty[line.orderLineId] ?? 0;
          return (
            <li
              key={line.orderLineId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg,4px)] bg-white/70 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="m-0 text-[0.82rem] font-semibold break-words text-[var(--ink,#241f1b)]">{line.name}</p>
                <p className={orderLineMeta}>
                  {formatMoney(line.unitPrice, currency)} · {t("orders.qty", { count: line.quantity })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={stepBtn}
                  disabled={pending || selected === 0}
                  onClick={() => change(line.orderLineId, line.quantity, -1)}
                  aria-label={t("orders.cancel.fewer", { name: line.name })}
                >
                  <Minus size={14} aria-hidden="true" />
                </button>
                <span className="min-w-[3.5rem] text-center text-[0.82rem] tabular-nums" aria-live="polite">
                  <b>{selected}</b> {t("orders.cancel.ofQty", { count: line.quantity })}
                </span>
                <button
                  type="button"
                  className={stepBtn}
                  disabled={pending || selected >= line.quantity}
                  onClick={() => change(line.orderLineId, line.quantity, 1)}
                  aria-label={t("orders.cancel.more", { name: line.name })}
                >
                  <Plus size={14} aria-hidden="true" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {hasGifts ? <p className="m-0 text-[0.74rem]">{t("orders.cancel.giftHint")}</p> : null}

      {items.length > 0 ? (
        <div className="rounded-[var(--radius-lg,4px)] bg-white/70 px-3 py-2 text-[0.8rem]" aria-live="polite">
          {loading ? (
            <p className="m-0">{t("orders.cancel.preview.loading")}</p>
          ) : preview ? (
            <PreviewText preview={preview} currency={currency} t={t} />
          ) : previewQuery.isError ? (
            <p className="m-0 text-[#8c3a2b]">
              {previewQuery.error instanceof ApiClientError && previewQuery.error.status === 422
                ? previewQuery.error.message
                : t("orders.cancel.preview.failed")}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={orderCancelConfirm}
          disabled={pending || items.length === 0 || loading || !preview}
          onClick={() => onConfirm(items)}
        >
          {pending ? t("orders.cancel.cancelling") : t("orders.cancel.confirmItems")}
        </button>
        <button type="button" className={orderCancelBtn} disabled={pending} onClick={onBack}>
          {t("orders.cancel.back")}
        </button>
      </div>
    </div>
  );
}

function PreviewText({ preview, currency, t }: { preview: CancelItemsPreview; currency: string; t: Translator }) {
  const money = (value: string) => formatMoney(Number(value), currency);
  if (preview.wholeOrder) return <p className="m-0 font-semibold">{t("orders.cancel.preview.whole")}</p>;
  const offer = Number(preview.offerAdjustmentAmount);
  const delivery = Number(preview.deliveryChargeAmount);
  const refund = Number(preview.refundAmount);
  const gifts = preview.giftsRemoved.map((gift) => gift.productName ?? gift.sku).filter(Boolean);
  return (
    <div className="grid gap-0.5">
      <p className="m-0">{t("orders.cancel.preview.items", { amount: money(preview.cancelledAmount) })}</p>
      {offer > 0 ? <p className="m-0">{t("orders.cancel.preview.offer", { amount: money(preview.offerAdjustmentAmount) })}</p> : null}
      {delivery > 0 ? (
        <p className="m-0">{t("orders.cancel.preview.delivery", { amount: money(preview.deliveryChargeAmount) })}</p>
      ) : null}
      {gifts.length > 0 ? <p className="m-0">{t("orders.cancel.preview.gifts", { names: gifts.join(", ") })}</p> : null}
      {preview.cashOnDelivery ? (
        <p className="m-0 font-semibold">
          {t("orders.cancel.preview.cod", { amount: money(preview.totalAfter), before: money(preview.totalBefore) })}
        </p>
      ) : refund > 0 ? (
        <p className="m-0 font-semibold">{t("orders.cancel.preview.refund", { amount: money(preview.refundAmount) })}</p>
      ) : (
        <p className="m-0 font-semibold">{t("orders.cancel.preview.noRefund")}</p>
      )}
      {!preview.cashOnDelivery ? (
        <p className="m-0 text-[0.74rem]">{t("orders.cancel.preview.newTotal", { amount: money(preview.totalAfter) })}</p>
      ) : null}
    </div>
  );
}
