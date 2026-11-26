"use client";

import { useEffect, useId, useRef } from "react";
import { formatMoney } from "@/lib/format/money";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
import type { OrderChanges } from "../utils/orderChanges";

type Props = {
  changes: OrderChanges;
  /** Place the order as it is now (same details). */
  onConfirm: () => void;
  /** Close and review the bag / checkout first. */
  onReview: () => void;
  /** Leave checkout for the bag (nothing can be ordered). */
  onBackToBag: () => void;
};

/**
 * "Your order has changed" (checkout QA-048): the order was not placed because
 * an offer ended, a price changed or an item went out of stock while the
 * shopper was checking out. Lists what changed and the new total; the shopper
 * places the order again or goes back. Nothing is charged until they choose.
 */
export function OrderChangedModal({ changes, onConfirm, onReview, onBackToBag }: Props) {
  const copy = useShopCopy();
  const titleId = useId();
  const firstAction = useRef<HTMLButtonElement>(null);
  const money = (amount: number) => formatMoney(amount, changes.currency);

  useEffect(() => {
    firstAction.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onReview();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onReview]);

  const lines = [
    ...changes.removed.map((item) => copy("checkout.orderChanged.removed", { name: item.name })),
    ...changes.repriced.map((item) =>
      copy("checkout.orderChanged.repriced", {
        name: item.name,
        from: money(item.from),
        to: money(item.to),
      }),
    ),
    ...changes.offersEnded.map((offer) => copy("checkout.orderChanged.offerEnded", { offer })),
    ...changes.offersAdded.map((offer) => copy("checkout.orderChanged.offerAdded", { offer })),
  ];
  const payNow = changes.amountPayable?.to ?? changes.total.to;

  return (
    <div
      className="fixed inset-0 z-[1400] flex items-end justify-center bg-ink/50 p-4 sm:items-center"
      data-order-changed-modal
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-md bg-cream p-6 text-ink shadow-[0_12px_32px_rgba(44,36,29,0.25)]"
      >
        <h2 id={titleId} className="m-0 text-lg font-semibold">
          {copy("checkout.orderChanged.title")}
        </h2>
        <p className="mt-2 text-sm text-ink/80">{copy("checkout.orderChanged.intro")}</p>

        {lines.length > 0 ? (
          <ul className="mt-4 list-disc space-y-1 ps-5 text-sm">
            {lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}

        {changes.nothingOrderable ? (
          <p className="mt-4 text-sm font-semibold">
            {copy("checkout.orderChanged.nothingOrderable")}
          </p>
        ) : (
          <dl className="mt-4 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 border-t border-bone pt-4 text-sm">
            <dt>{copy("checkout.orderChanged.total")}</dt>
            <dd className="m-0 text-end">
              <s className="me-2 text-ink/60">{money(changes.total.from)}</s>
              <strong>{money(changes.total.to)}</strong>
            </dd>
            {changes.amountPayable ? (
              <>
                <dt>{copy("checkout.orderChanged.amountPayable")}</dt>
                <dd className="m-0 text-end">
                  <s className="me-2 text-ink/60">{money(changes.amountPayable.from)}</s>
                  <strong>{money(changes.amountPayable.to)}</strong>
                </dd>
              </>
            ) : null}
          </dl>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
          {changes.nothingOrderable ? (
            <button
              ref={firstAction}
              type="button"
              onClick={onBackToBag}
              className="cursor-pointer rounded-md border-0 bg-ink px-4 py-3 text-sm font-semibold text-white hover:bg-copper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              {copy("checkout.orderChanged.backToBag")}
            </button>
          ) : (
            <>
              <button
                ref={firstAction}
                type="button"
                onClick={onConfirm}
                className="cursor-pointer rounded-md border-0 bg-ink px-4 py-3 text-sm font-semibold text-white hover:bg-copper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                {copy("checkout.orderChanged.placeOrder", { amount: money(payNow) })}
              </button>
              <button
                type="button"
                onClick={onReview}
                className="cursor-pointer rounded-md border border-ink/30 bg-transparent px-4 py-3 text-sm font-semibold text-ink hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                {copy("checkout.orderChanged.review")}
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
