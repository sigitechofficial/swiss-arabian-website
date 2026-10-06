"use client";

import { useState, type FormEvent } from "react";
import { formatMoney } from "@/features/home/utils/formatMoney";
import { useCartStore } from "@/stores/useCartStore";
import type { CheckoutSessionResponse } from "@/features/checkout/types/checkout";
import { useGiftCardMutations } from "../hooks/useGiftCardMutations";
import { visibleGiftCards, type PromotionSnapshotV1 } from "../types/promotions";
import { giftCardErrorMessage } from "../utils/giftCardErrors";
import {
  couponApplied,
  couponAppliedAmt,
  couponAppliedCode,
  couponAppliedName,
  couponAppliedRemove,
  couponBox,
  couponCheck,
  couponError,
  couponForm,
  couponHint,
  couponLabel,
} from "@/styles/cartChrome";

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
    <div className={couponBox} data-coupon="">
      <p className={couponLabel}>Gift card</p>
      {cards.map((card, index) => {
        const amount = Number(card.amount);
        return (
          <div className={couponApplied} key={card.usageId ?? card.maskedCode ?? index}>
            <div>
              <p className={couponAppliedName}>{card.maskedCode || "Gift card"}</p>
              <p className={couponAppliedCode}>Applied as payment</p>
            </div>
            {amount > 0 ? (
              <span className={couponAppliedAmt} dir="ltr">
                −{formatMoney(amount, card.currencyCode || currency)}
              </span>
            ) : null}
            <button
              type="button"
              className={couponAppliedRemove}
              onClick={() => void onRemove(card.usageId)}
              disabled={busy}
            >
              {remove.isPending ? "Removing…" : "Remove"}
            </button>
          </div>
        );
      })}
      <form className={couponForm} onSubmit={(e) => void onApply(e)}>
        <input
          name="gift-card"
          autoComplete="off"
          spellCheck={false}
          aria-label="Gift card code"
          aria-invalid={fieldError ? true : undefined}
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
        className={couponCheck}
        onClick={() => void onCheck()}
        disabled={busy}
      >
        {balance.isPending ? "Checking…" : "Check balance"}
      </button>
      {balanceNote ? <p className={couponHint}>{balanceNote}</p> : null}
      {fieldError ? (
        <p className={couponError} role="alert">
          {fieldError}
        </p>
      ) : null}
    </div>
  );
}
