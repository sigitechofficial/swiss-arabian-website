"use client";

import { useEffect, useState, type FormEvent } from "react";
import { formatMoney } from "@/features/home/utils/formatMoney";
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
import { useLoyaltyAccount } from "../hooks/useLoyaltyAccount";
import { useLoyaltyRedemption } from "../hooks/useLoyaltyRedemption";
import { formatPoints, type LoyaltyRedemptionView } from "../types/loyalty";
import { loyaltyRedemptionErrorMessage } from "../utils/redemptionErrors";

function availableCopy(quote: LoyaltyRedemptionView, worth: number | null, currency: string) {
  const points = `${formatPoints(quote.availablePoints)} points`;
  if (worth == null) return `Available ${points}`;
  return `Available ${points} · worth ${formatMoney(worth, currency)}`;
}

export function LoyaltyRedemptionEditor({
  quoteOverride,
}: {
  quoteOverride?: unknown;
} = {}) {
  const { quote, hidden, cartId, adjusted, acknowledgeAdjustment, apply, remove } =
    useLoyaltyRedemption({ quoteOverride });
  const { wallet } = useLoyaltyAccount();
  const [points, setPoints] = useState("");
  const [editing, setEditing] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const applied = Boolean(quote && quote.appliedPoints > 0);
  const increment = quote?.incrementPoints ?? 0;
  const min = quote?.minimumRedeemPoints ?? 0;
  const max = quote?.maxRedeemablePoints ?? 0;

  useEffect(() => {
    if (!applied) setEditing(false);
  }, [applied]);

  if (hidden || !quote) return null;

  const currency = quote.currencyCode ?? wallet.data?.currencyCode ?? "AED";
  const worth = wallet.data?.availableValue ?? null;
  const busy = apply.isPending || remove.isPending;
  const ready = Boolean(cartId);
  const showForm = quote.enabled && quote.eligible && (!applied || editing);
  const showReason = !showForm && !applied && quote.reasonMessage;

  async function onApply(event: FormEvent) {
    event.preventDefault();
    const next = Number(points);
    if (!Number.isFinite(next) || next <= 0 || !ready) return;
    setFieldError(null);
    try {
      await apply.mutateAsync(next);
      setPoints("");
      setEditing(false);
    } catch (error) {
      setFieldError(loyaltyRedemptionErrorMessage(error));
    }
  }

  async function onRemove() {
    setFieldError(null);
    try {
      await remove.mutateAsync();
      setPoints("");
      setEditing(false);
    } catch (error) {
      setFieldError(loyaltyRedemptionErrorMessage(error));
    }
  }

  function useMaximum() {
    setPoints(String(max));
    setFieldError(null);
  }

  return (
    <div className={couponBox} data-loyalty-redemption="">
      <p className={couponLabel}>Reward points</p>
      {adjusted ? (
        <p className={couponHint} role="status">
          Your reward points were adjusted after your bag changed.
        </p>
      ) : null}
      {applied && !editing ? (
        <div className={couponApplied}>
          <div>
            <p className={couponAppliedName}>{`${formatPoints(quote.appliedPoints)} points applied`}</p>
            <p className={couponAppliedCode}>Reserved on this bag</p>
          </div>
          {quote.appliedAmount > 0 ? (
            <span className={couponAppliedAmt} dir="ltr">
              −{formatMoney(quote.appliedAmount, currency)}
            </span>
          ) : null}
          <button
            type="button"
            className={couponAppliedRemove}
            onClick={() => {
              setEditing(true);
              setPoints(String(quote.appliedPoints));
              acknowledgeAdjustment();
            }}
            disabled={busy}
          >
            Change
          </button>
          <button
            type="button"
            className={couponAppliedRemove}
            onClick={() => void onRemove()}
            disabled={busy}
          >
            {remove.isPending ? "Removing…" : "Remove"}
          </button>
        </div>
      ) : null}
      {showForm ? (
        <>
          <p className={couponHint}>{availableCopy(quote, worth, currency)}</p>
          <form className={couponForm} onSubmit={(e) => void onApply(e)}>
            <input
              name="reward-points"
              type="number"
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              aria-label="Reward points to use"
              aria-invalid={fieldError ? true : undefined}
              min={min || undefined}
              max={max || undefined}
              step={increment || undefined}
              placeholder={min > 0 ? `Minimum ${formatPoints(min)}` : "Enter points"}
              value={points}
              onChange={(e) => {
                setPoints(e.target.value);
                if (fieldError) setFieldError(null);
              }}
              disabled={busy || !ready}
            />
            <button type="submit" disabled={busy || !ready || !points.trim()}>
              {apply.isPending ? "Applying…" : "Apply"}
            </button>
          </form>
          {max > 0 ? (
            <button
              type="button"
              className={couponCheck}
              onClick={useMaximum}
              disabled={busy || !ready}
            >
              Use maximum
            </button>
          ) : null}
        </>
      ) : null}
      {showReason ? <p className={couponHint}>{quote.reasonMessage}</p> : null}
      {fieldError ? (
        <p className={couponError} role="alert">
          {fieldError}
        </p>
      ) : null}
    </div>
  );
}
