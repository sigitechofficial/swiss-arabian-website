"use client";

import { useExchangeMoney, type ExchangeGuestProof } from "../hooks/useExchangeMoney";
import type { ExchangeMoneyView } from "../types/afterSales";

/**
 * Money side of an exchange (Swiss Arabian's look): pay the price difference,
 * or the status of a difference refund (logic: useExchangeMoney, every brand).
 */
export function ExchangeMoneyPanel({
  exchangeRequestId,
  money,
  guest,
}: {
  exchangeRequestId: string;
  money: ExchangeMoneyView | null | undefined;
  /** Guest order proof; omit for a signed-in customer. */
  guest?: ExchangeGuestProof;
}) {
  const view = useExchangeMoney({ exchangeRequestId, money, guest });
  if (!view) return null;

  return (
    <div className="mt-3 border-t border-sa-border pt-3 text-[13px]" data-exchange-money={view.action}>
      <p className="font-semibold text-sa-primary">
        {view.title}
        {view.amount ? <span dir="ltr">{` ${view.amount}`}</span> : null}
      </p>
      {view.confirming ? (
        <p className="mt-1 text-sa-muted" role="status">
          {view.body}
        </p>
      ) : (
        <p className="mt-1 leading-relaxed text-sa-muted">{view.body}</p>
      )}
      {view.offerNote ? <p className="mt-1 leading-relaxed text-sa-muted">{view.offerNote}</p> : null}
      {view.unconfirmedNote ? (
        <p className="mt-1 leading-relaxed text-sa-muted" role="status">
          {view.unconfirmedNote}
        </p>
      ) : null}
      {view.error ? (
        <p className="mt-1 leading-relaxed text-red-700" role="alert">
          {view.error}
        </p>
      ) : null}
      {view.canPay ? (
        <button
          type="button"
          className="mt-2 rounded-full bg-terra px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
          onClick={view.pay}
          disabled={view.opening}
        >
          {view.payLabel}
        </button>
      ) : null}
    </div>
  );
}
