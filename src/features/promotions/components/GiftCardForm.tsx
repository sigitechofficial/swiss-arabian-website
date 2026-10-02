"use client";

import { useState, type FormEvent } from "react";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { useCartStore } from "@/stores/useCartStore";
import type { CheckoutSessionResponse } from "@/features/checkout/types/checkout";
import { useGiftCardMutations } from "../hooks/useGiftCardMutations";
import { visibleGiftCards, type PromotionSnapshotV1 } from "../types/promotions";
import { giftCardErrorMessage } from "../utils/giftCardErrors";

export function GiftCardForm({
  snapshot,
  extraGiftCards,
  checkoutSessionId,
  onCheckoutSession,
}: {
  snapshot?: PromotionSnapshotV1 | null;
  extraGiftCards?: unknown;
  checkoutSessionId?: string | null;
  onCheckoutSession?: (session: CheckoutSessionResponse) => void | Promise<void>;
}) {
  const fromStore = useCartStore((s) => s.promotions);
  const totals = useCartStore((s) => s.totals);
  const data = snapshot ?? fromStore;
  const cards = visibleGiftCards(data, extraGiftCards);
  const currency = data?.context?.currencyCode ?? totals?.currency ?? "AED";
  const { apply, remove, balance, cartId, checkoutSessionId: sessionId } =
    useGiftCardMutations({
      checkoutSessionId,
      onCheckoutSession,
    });

  const [code, setCode] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [balanceNote, setBalanceNote] = useState<string | null>(null);

  const ready = Boolean(sessionId || cartId);
  const busy = apply.isPending || remove.isPending || balance.isPending;

  async function onApply(event: FormEvent) {
    event.preventDefault();
    const next = code.trim();
    if (!next || !ready) return;
    setFieldError(null);
    setBalanceNote(null);
    try {
      await apply.mutateAsync(next);
      setCode("");
    } catch (error) {
      setFieldError(giftCardErrorMessage(error));
    }
  }

  async function onRemove(usageId?: string | null) {
    setFieldError(null);
    try {
      await remove.mutateAsync(usageId);
    } catch (error) {
      setFieldError(giftCardErrorMessage(error));
    }
  }

  async function onCheck() {
    const next = code.trim();
    if (!next) {
      setBalanceNote(null);
      setFieldError("Enter a gift card code first.");
      return;
    }
    setFieldError(null);
    try {
      const result = await balance.mutateAsync(next);
      const remaining = Number(result.remainingBalance);
      const label = result.maskedCode || "Gift card";
      setBalanceNote(
        Number.isFinite(remaining)
          ? `${label} · ${formatMoney(remaining, result.currencyCode || currency)} remaining`
          : `${label} balance checked.`,
      );
    } catch (error) {
      setBalanceNote(null);
      setFieldError(giftCardErrorMessage(error));
    }
  }

  return (
    <div className="coupon-box">
      <p className="coupon-box__label">Gift card</p>
      {cards.map((card, index) => {
        const amount = Number(card.amount);
        return (
          <div className="coupon-applied" key={card.usageId ?? card.maskedCode ?? index}>
            <div>
              <p className="coupon-applied__name">{card.maskedCode || "Gift card"}</p>
              <p className="coupon-applied__code">Applied as payment</p>
            </div>
            {amount > 0 ? (
              <span className="coupon-applied__amt" dir="ltr">
                −{formatMoney(amount, card.currencyCode || currency)}
              </span>
            ) : null}
            <button
              type="button"
              className="coupon-applied__remove"
              onClick={() => void onRemove(card.usageId)}
              disabled={busy}
            >
              {remove.isPending ? "Removing…" : "Remove"}
            </button>
          </div>
        );
      })}
      <form className="coupon-form" onSubmit={(e) => void onApply(e)}>
        <input
          className={fieldError ? "is-err" : undefined}
          name="gift-card"
          autoComplete="off"
          spellCheck={false}
          aria-label="Gift card code"
          aria-invalid={Boolean(fieldError)}
          placeholder="Enter gift card"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (fieldError) setFieldError(null);
            if (balanceNote) setBalanceNote(null);
          }}
          disabled={busy || !ready}
        />
        <button type="submit" disabled={busy || !ready || !code.trim()}>
          {apply.isPending ? "Applying…" : "Apply"}
        </button>
      </form>
      <button
        type="button"
        className="coupon-box__check"
        onClick={() => void onCheck()}
        disabled={busy}
      >
        {balance.isPending ? "Checking…" : "Check balance"}
      </button>
      {balanceNote ? <p className="coupon-box__hint">{balanceNote}</p> : null}
      {fieldError ? (
        <p className="coupon-box__error" role="alert">
          {fieldError}
        </p>
      ) : null}
    </div>
  );
}
