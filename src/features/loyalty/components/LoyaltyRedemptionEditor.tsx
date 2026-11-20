"use client";

import { useMarketCurrency } from "@/features/markets/hooks/useMarketCurrency";
import { useState, type FormEvent } from "react";
import { formatMoney } from "@/features/home/utils/formatMoney";
import type { Translator } from "@/lib/i18n/messages";
import { useShopCopy } from "@/lib/i18n/useShopCopy";
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
import { formatPoints, redemptionReasonText, type LoyaltyRedemptionView } from "../types/loyalty";
import { loyaltyRedemptionErrorMessage } from "../utils/redemptionErrors";

function availableCopy(
  quote: LoyaltyRedemptionView,
  worth: number | null,
  currency: string,
  t: Translator,
) {
  const points = t("loyalty.redeem.points", { count: quote.availablePoints, points: formatPoints(quote.availablePoints) });
  if (worth == null) return t("loyalty.redeem.available", { points });
  return t("loyalty.redeem.availableWorth", { points, worth: formatMoney(worth, currency) });
}

export function LoyaltyRedemptionEditor({
  quoteOverride,
}: {
  quoteOverride?: unknown;
} = {}) {
  const t = useShopCopy();
  const marketCurrency = useMarketCurrency();
  const {
    quote,
    hidden,
    cartId,
    adjusted,
    acknowledgeAdjustment,
    apply,
    remove,
  } = useLoyaltyRedemption({ quoteOverride });
  const { wallet } = useLoyaltyAccount();
  const [points, setPoints] = useState("");
  const [editingRequested, setEditing] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const applied = Boolean(quote && quote.appliedPoints > 0);
  const increment = quote?.incrementPoints ?? 0;
  const min = quote?.minimumRedeemPoints ?? 0;
  const max = quote?.maxRedeemablePoints ?? 0;

  // Editing only applies while points are applied; removing them ends it.
  const editing = editingRequested && applied;

  if (hidden || !quote) return null;

  const currency =
    quote.currencyCode ?? wallet.data?.currencyCode ?? marketCurrency;
  const worth = wallet.data?.availableValue ?? null;
  const busy = apply.isPending || remove.isPending;
  const ready = Boolean(cartId);
  const showForm = quote.enabled && quote.eligible && (!applied || editing);
  const reasonText = !showForm && !applied ? redemptionReasonText(quote, t) : null;

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
      setFieldError(loyaltyRedemptionErrorMessage(error, t));
    }
  }

  async function onRemove() {
    setFieldError(null);
    try {
      await remove.mutateAsync();
      setPoints("");
      setEditing(false);
    } catch (error) {
      setFieldError(loyaltyRedemptionErrorMessage(error, t));
    }
  }

  function useMaximum() {
    setPoints(String(max));
    setFieldError(null);
  }

  return (
    <div className={couponBox} data-loyalty-redemption="">
      <p className={couponLabel}>{t("loyalty.redeem.title")}</p>
      {adjusted ? (
        <p className={couponHint} role="status">
          {t("loyalty.redeem.adjusted")}
        </p>
      ) : null}
      {applied && !editing ? (
        <div className={couponApplied}>
          <div>
            <p
              className={couponAppliedName}
            >
              {t("loyalty.redeem.applied", { count: quote.appliedPoints, points: formatPoints(quote.appliedPoints) })}
            </p>
            <p className={couponAppliedCode}>{t("loyalty.redeem.reserved")}</p>
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
            {t("loyalty.redeem.change")}
          </button>
          <button
            type="button"
            className={couponAppliedRemove}
            onClick={() => void onRemove()}
            disabled={busy}
          >
            {remove.isPending ? t("loyalty.redeem.removing") : t("account.remove")}
          </button>
        </div>
      ) : null}
      {showForm ? (
        <>
          <p className={couponHint}>{availableCopy(quote, worth, currency, t)}</p>
          <form className={couponForm} onSubmit={(e) => void onApply(e)}>
            <input
              name="reward-points"
              type="number"
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              aria-label={t("loyalty.redeem.input")}
              aria-invalid={fieldError ? true : undefined}
              min={min || undefined}
              max={max || undefined}
              step={increment || undefined}
              placeholder={
                min > 0 ? t("loyalty.redeem.minimum", { points: formatPoints(min) }) : t("loyalty.redeem.enter")
              }
              value={points}
              onChange={(e) => {
                setPoints(e.target.value);
                if (fieldError) setFieldError(null);
              }}
              disabled={busy || !ready}
            />
            <button type="submit" disabled={busy || !ready || !points.trim()}>
              {apply.isPending ? t("loyalty.redeem.applying") : t("loyalty.redeem.apply")}
            </button>
          </form>
          {max > 0 ? (
            <button
              type="button"
              className={couponCheck}
              onClick={useMaximum}
              disabled={busy || !ready}
            >
              {t("loyalty.redeem.useMax")}
            </button>
          ) : null}
        </>
      ) : null}
      {reasonText ? <p className={couponHint}>{reasonText}</p> : null}
      {fieldError ? (
        <p className={couponError} role="alert">
          {fieldError}
        </p>
      ) : null}
    </div>
  );
}
