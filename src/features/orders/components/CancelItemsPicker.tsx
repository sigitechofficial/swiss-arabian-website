"use client";

import { Minus, Plus } from "lucide-react";
import type { CancelItemInput } from "@/features/account/api/customerOrders.service";
import { formatMoney } from "@/lib/format/money";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { orderCancelBtn, orderCancelConfirm, orderLineMeta } from "@/styles/accountChrome";
import { useCancelItemsSelection } from "../hooks/useCancelItemsSelection";
import { cancelPreviewLines, type CancellableLine } from "../utils/cancelItems";

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
  const pick = useCancelItemsSelection(orderId, lines);
  const money = (value: string) => formatMoney(Number(value), currency);

  return (
    <div className="grid w-full gap-3">
      <div>
        <p className="m-0 text-[0.86rem] font-semibold">{t("orders.cancel.chooseItems")}</p>
        <p className="m-0 mt-0.5 text-[0.76rem]">{t("orders.cancel.chooseHint")}</p>
      </div>
      <ul className="m-0 grid list-none gap-2 p-0" role="list">
        {lines.map((line) => {
          const selected = pick.selected(line.orderLineId);
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
                  onClick={() => pick.change(line.orderLineId, line.quantity, -1)}
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
                  onClick={() => pick.change(line.orderLineId, line.quantity, 1)}
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

      {pick.items.length > 0 ? (
        <div className="rounded-[var(--radius-lg,4px)] bg-white/70 px-3 py-2 text-[0.8rem]" aria-live="polite">
          {pick.loading ? (
            <p className="m-0">{t("orders.cancel.preview.loading")}</p>
          ) : pick.preview ? (
            <div className="grid gap-0.5">
              {cancelPreviewLines(pick.preview, money, t).map((line) => (
                <p key={line.key} className={`m-0${line.tone === "strong" ? " font-semibold" : line.tone === "small" ? " text-[0.74rem]" : ""}`}>
                  {line.text}
                </p>
              ))}
            </div>
          ) : pick.error ? (
            <p className="m-0 text-[#8c3a2b]">{pick.error}</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={orderCancelConfirm}
          disabled={pending || !pick.canConfirm}
          onClick={() => onConfirm(pick.items)}
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
