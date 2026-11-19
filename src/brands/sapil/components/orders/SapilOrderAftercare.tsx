"use client";

import { useState } from "react";
import type { CancelItemInput, CancellationWindow } from "@/features/account/api/customerOrders.service";
import { useCancelItemsSelection } from "@/features/orders/hooks/useCancelItemsSelection";
import { useCancellationCountdown } from "@/features/orders/hooks/useCustomerOrders";
import { cancelPreviewLines, cancellableUnits, type CancellableLine } from "@/features/orders/utils/cancelItems";
import { refundHeadlineAmount, refundPartText, refundStateDisplay, type CustomerRefund } from "@/features/orders/utils/orderRefunds";
import { formatOrderDate } from "@/features/orders/utils/orderStatus";
import { useShopLocale } from "@/lib/i18n/ShopLocaleProvider";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import { useMarketTimeZone } from "@/lib/storefront/MarketTimeZoneProvider";
import { useSapilCopy } from "../../i18n/SapilCopy";
import { Button, QuantityStepper, cx } from "../../ui";
import { buttonClass } from "../../ui/Button";
import { StatusPill } from "../account/AccountChrome";
import { richText, useSapilMoney } from "../commerce/shared";

const SMALL = "!h-[40px] !px-[16px] !text-[14px]";

/** Pick units to cancel; each change shows what the server would refund (shared useCancelItemsSelection). */
function SapilCancelItems({
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
  hasGifts: boolean;
  currency: string;
  pending: boolean;
  onConfirm: (items: CancelItemInput[]) => void;
  onBack: () => void;
}) {
  const t = useShopCopy();
  const money = useSapilMoney();
  const pick = useCancelItemsSelection(orderId, lines);
  return (
    <div className="grid gap-[12px] w-full" data-sapil="cancel-items">
      <div>
        <b className="block text-[15px] font-[600]">{t("orders.cancel.chooseItems")}</b>
        <span className="text-[13px] text-sapil-ink-2">{t("orders.cancel.chooseHint")}</span>
      </div>
      <ul className="list-none p-0 m-0 grid gap-[8px]">
        {lines.map((line) => {
          const selected = pick.selected(line.orderLineId);
          return (
            <li key={line.orderLineId} className="flex flex-wrap items-center justify-between gap-[12px] rounded-[16px] bg-sapil-white py-[10px] px-[14px]">
              <div className="min-w-0 flex-1">
                <b className="block text-[15px] font-[600] break-words">{line.name}</b>
                <small className="text-[13px] text-sapil-muted">
                  {money(line.unitPrice, currency)} · {t("orders.qty", { count: line.quantity })}
                </small>
              </div>
              <QuantityStepper
                value={selected}
                min={0}
                max={line.quantity}
                itemLabel={line.name}
                labels={{
                  group: t("afterSales.quantityOf", { name: line.name }),
                  decrease: t("orders.cancel.fewer", { name: line.name }),
                  increase: t("orders.cancel.more", { name: line.name }),
                }}
                disabled={pending}
                onChange={(next) => pick.change(line.orderLineId, line.quantity, next - selected)}
              />
            </li>
          );
        })}
      </ul>
      {hasGifts ? <p className="text-[13px] text-sapil-ink-2">{t("orders.cancel.giftHint")}</p> : null}
      {pick.items.length ? (
        <div aria-live="polite" className="rounded-[16px] bg-sapil-white py-[12px] px-[14px] text-[14px] grid gap-[2px]">
          {pick.loading ? (
            <p>{t("orders.cancel.preview.loading")}</p>
          ) : pick.preview ? (
            cancelPreviewLines(pick.preview, (value) => money(Number(value), currency), t).map((row) => (
              <p key={row.key} className={cx(row.tone === "strong" && "font-[600]", row.tone === "small" && "text-[13px] text-sapil-ink-2")}>
                {row.text}
              </p>
            ))
          ) : pick.error ? (
            <p role="alert" className="text-sapil-sale">
              {pick.error}
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-[12px]">
        <Button onClick={() => onConfirm(pick.items)} disabled={pending || !pick.canConfirm} className={cx(SMALL, (pending || !pick.canConfirm) && "opacity-50")}>
          {pending ? t("orders.cancel.cancelling") : t("orders.cancel.confirmItems")}
        </Button>
        <button type="button" disabled={pending} onClick={onBack} className={cx(buttonClass("link"), "!text-[14px]")}>
          {t("orders.cancel.back")}
        </button>
      </div>
    </div>
  );
}

/**
 * Cancel inside the cancellation window, with its countdown: the whole order,
 * or some items when the market allows it (`canCancelItems`, more than one unit).
 * Counts from the server's remaining seconds, so a skewed clock can't show a closed window.
 */
export function SapilCancelPanel({
  orderId,
  window: cw,
  fetchedAt,
  pending,
  onConfirm,
  onExpired,
  cancellableLines,
  hasGifts,
  currency,
  pendingItems,
  itemsCancelledAt,
  onConfirmItems,
}: {
  orderId: string;
  window: CancellationWindow;
  fetchedAt: number;
  pending: boolean;
  onConfirm: () => void;
  onExpired: () => void;
  cancellableLines: CancellableLine[];
  hasGifts: boolean;
  currency: string;
  pendingItems: boolean;
  itemsCancelledAt: number;
  onConfirmItems: (items: CancelItemInput[]) => void;
}) {
  const t = useSapilCopy();
  const shop = useShopCopy();
  const [confirming, setConfirming] = useState(false);
  const [picking, setPicking] = useState(false);
  const [closedAt, setClosedAt] = useState(0);
  const { remaining, mmss } = useCancellationCountdown(cw, fetchedAt, onExpired);
  // Close the picker once a cancel of some items went through.
  if (itemsCancelledAt > closedAt) {
    setClosedAt(itemsCancelledAt);
    setPicking(false);
  }
  if (remaining <= 0) return null;
  const canPick = cw.canCancelItems === true && cancellableUnits(cancellableLines) > 1;
  const countdown = richText(t("account.odCancelWindow"), {
    time: (
      <span className="font-[600] tabular-nums" aria-live="off">
        {mmss}
      </span>
    ),
  });

  return (
    <div data-sapil="cancel-panel" className="flex items-center justify-between gap-[12px] flex-wrap bg-sapil-p-butter rounded-[20px] py-[16px] px-[20px] mb-[20px]">
      {picking && canPick ? (
        <div className="grid gap-[10px] w-full">
          <span className="text-[13px] text-sapil-ink-2">{countdown}</span>
          <SapilCancelItems
            orderId={orderId}
            lines={cancellableLines}
            hasGifts={hasGifts}
            currency={currency}
            pending={pendingItems}
            onConfirm={onConfirmItems}
            onBack={() => setPicking(false)}
          />
        </div>
      ) : (
        <>
          <div>
            <b className="block text-[15px] font-[600]">{t("account.odCancelTitle")}</b>
            <span className="text-[13px] text-sapil-ink-2">{countdown}</span>
          </div>
          {confirming ? (
            <div className="flex items-center gap-[12px] flex-wrap">
              <span className="text-[14px]">{t("account.odCancelConfirm")}</span>
              <Button onClick={onConfirm} disabled={pending} className={SMALL}>
                {pending ? t("account.odCancelling") : t("account.odCancelYes")}
              </Button>
              <button type="button" disabled={pending} onClick={() => setConfirming(false)} className={cx(buttonClass("link"), "!text-[14px]")}>
                {t("account.odCancelKeep")}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-[10px] flex-wrap">
              {canPick ? (
                <Button variant="line" disabled={pendingItems} onClick={() => setPicking(true)} className={SMALL}>
                  {shop("orders.cancel.someItems")}
                </Button>
              ) : null}
              <Button variant="line" onClick={() => setConfirming(true)} className={SMALL}>
                {t("account.odCancel")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Each refund: amount, state, where each share goes back (card, gift card, points, …), reference and date. */
export function SapilRefunds({ refunds, currency }: { refunds: CustomerRefund[]; currency: string }) {
  const t = useShopCopy();
  const money = useSapilMoney();
  const locale = useShopLocale();
  const timeZone = useMarketTimeZone();
  return (
    <ul className="list-none p-0 m-0 grid gap-[14px]" data-sapil="refunds">
      {refunds.map((refund, index) => {
        const { label, note, tone } = refundStateDisplay(refund.state, t, refund.parts);
        const amount = refundHeadlineAmount(refund);
        const refundCurrency = refund.currency ?? currency;
        const date =
          refund.state === "completed" && refund.completedAt
            ? t("orders.refund.completedOn", { date: formatOrderDate(refund.completedAt, { timeZone, locale }) })
            : refund.requestedAt
              ? t("orders.refund.requestedOn", { date: formatOrderDate(refund.requestedAt, { timeZone, locale }) })
              : null;
        return (
          <li key={refund.refundId ?? index} className="grid gap-[8px] pb-[14px] border-b border-sapil-line last:border-b-0 last:pb-0 text-[14px]">
            <div className="flex flex-wrap items-center justify-between gap-[8px]">
              {amount ? (
                <b className="font-[700] tabular-nums" dir="ltr">
                  {money(Number(amount), refundCurrency)}
                </b>
              ) : null}
              <StatusPill label={label} tone={tone} />
            </div>
            {refund.parts.length ? (
              <div>
                <p className="text-[12px] font-[600] tracking-[.1em] uppercase text-sapil-muted">{t("orders.refund.goesTo")}</p>
                <ul className="list-none p-0 m-0 mt-[4px] grid gap-[4px]">
                  {refund.parts.map((part, partIndex) => (
                    <li key={`${part.type}-${partIndex}`} className="flex items-start justify-between gap-[10px]">
                      <span className="min-w-0 break-words">{refundPartText(part, refundCurrency, t)}</span>
                      <span className={cx("shrink-0 text-[13px]", part.state === "done" ? "font-[600] text-sapil-ok" : "text-sapil-muted")}>
                        {part.state === "done" ? t("orders.refund.part.done") : t("orders.refund.part.pending")}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <p className="text-sapil-ink-2 leading-[1.5]">{note}</p>
            {refund.refundNumber || date ? (
              <p className="text-[13px] text-sapil-muted">
                {[refund.refundNumber ? t("orders.reference", { id: refund.refundNumber }) : null, date].filter(Boolean).join(" · ")}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
