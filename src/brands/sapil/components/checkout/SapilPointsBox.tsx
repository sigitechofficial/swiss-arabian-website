"use client";

import { useState, type FormEvent } from "react";
import { useLoyaltyAccount } from "@/features/loyalty/hooks/useLoyaltyAccount";
import { useLoyaltyRedemption } from "@/features/loyalty/hooks/useLoyaltyRedemption";
import { formatPoints } from "@/features/loyalty/types/loyalty";
import { useMarketCurrency } from "@/features/markets/hooks/useMarketCurrency";
import { ApiClientError } from "@/lib/api/apiError";
import { brandFeatureEnabled } from "@/lib/brand/features";
import { useSapilCopy, type SapilTranslator } from "../../i18n/SapilCopy";
import type { SapilCopyKey } from "../../i18n/catalog";
import { Button } from "../../ui";
import { buttonClass } from "../../ui/Button";
import { cx } from "../../ui/shared";
import { useSapilMoney } from "../commerce/shared";

/** Backend reason / error codes that have Sapil copy (en + ar). */
const REASONS = new Set([
  "REDEMPTION_DISABLED",
  "BELOW_MINIMUM",
  "INVALID_INCREMENT",
  "INSUFFICIENT_POINTS",
  "EXCEEDS_ORDER_COVERAGE",
  "REDEMPTION_NOT_AVAILABLE_WITH_CURRENT_OFFERS",
  "RESERVATION_EXPIRED",
  "REDEMPTION_EXPIRED",
  "CART_NOT_QUALIFIED",
  "PRICING_CHANGED",
]);

/** A reason code in the shopper's language; null when we have no copy for it. */
export function pointsReasonText(t: SapilTranslator, code: string | null | undefined): string | null {
  const key = code?.trim().toUpperCase();
  if (!key || !REASONS.has(key)) return null;
  return t(`checkout.pointsReason_${key}` as SapilCopyKey);
}

function errorText(t: SapilTranslator, error: unknown): string {
  if (error instanceof ApiClientError) {
    return pointsReasonText(t, error.code) ?? pointsReasonText(t, error.message) ?? t("checkout.pointsError");
  }
  return t("checkout.pointsError");
}

/**
 * Spend reward points on the bag (shared redemption logic, as Swiss Arabian's
 * bag page and checkout). Signed-in members only; hidden when the market has
 * no loyalty programme, and while the brand's `loyalty` feature is off. Points
 * are reserved on the cart, so the checkout and the order pick them up.
 */
export function SapilPointsBox({ quoteOverride }: { quoteOverride?: unknown }) {
  const t = useSapilCopy();
  const money = useSapilMoney();
  const marketCurrency = useMarketCurrency();
  const { quote, hidden, cartId, adjusted, acknowledgeAdjustment, apply, remove } = useLoyaltyRedemption({ quoteOverride });
  const { wallet } = useLoyaltyAccount();
  const [points, setPoints] = useState("");
  const [editingRequested, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applied = Boolean(quote && quote.appliedPoints > 0);
  const editing = editingRequested && applied;
  if (!brandFeatureEnabled("loyalty") || hidden || !quote) return null;

  const currency = quote.currencyCode ?? wallet.data?.currencyCode ?? marketCurrency;
  const worth = wallet.data?.availableValue ?? null;
  const busy = apply.isPending || remove.isPending;
  const ready = Boolean(cartId);
  const showForm = quote.enabled && quote.eligible && (!applied || editing);
  const reason = !showForm && !applied ? (pointsReasonText(t, quote.reason) ?? quote.reasonMessage) : null;
  if (!showForm && !applied && !reason) return null;

  const min = quote.minimumRedeemPoints;
  const max = quote.maxRedeemablePoints;
  const increment = quote.incrementPoints;
  const available = formatPoints(quote.availablePoints);

  async function onApply(event: FormEvent) {
    event.preventDefault();
    const next = Number(points);
    if (!Number.isFinite(next) || next <= 0 || !ready) return;
    setError(null);
    try {
      await apply.mutateAsync(next);
      setPoints("");
      setEditing(false);
    } catch (caught) {
      setError(errorText(t, caught));
    }
  }

  async function onRemove() {
    setError(null);
    try {
      await remove.mutateAsync();
      setPoints("");
      setEditing(false);
    } catch (caught) {
      setError(errorText(t, caught));
    }
  }

  return (
    <section data-sapil="points" aria-labelledby="co-points-title" className="mt-[18px] rounded-[18px] bg-sapil-paper p-[16px]">
      <h3 id="co-points-title" className="font-sapil-sans font-[600] text-[15px] leading-normal">
        {t("checkout.pointsTitle")}
      </h3>
      {adjusted ? (
        <p role="status" className="text-[13px] text-sapil-ink-2 mt-[4px]">
          {t("checkout.pointsAdjusted")}
        </p>
      ) : null}

      {applied && !editing ? (
        <div className="flex items-center gap-[10px] mt-[8px] flex-wrap">
          <p className="flex-1 min-w-[140px] text-[14px]">
            <b className="font-[600]">{t("checkout.pointsApplied", { points: formatPoints(quote.appliedPoints) })}</b>
            {quote.appliedAmount > 0 ? (
              <span className="text-sapil-ok tabular-nums ms-[6px]">−{money(quote.appliedAmount, currency)}</span>
            ) : null}
          </p>
          <button
            type="button"
            disabled={busy}
            className={cx(buttonClass("link"), "!text-[13px]")}
            onClick={() => {
              setEditing(true);
              setPoints(String(quote.appliedPoints));
              acknowledgeAdjustment();
            }}
          >
            {t("checkout.pointsChange")}
          </button>
          <button type="button" disabled={busy} className={cx(buttonClass("link"), "!text-[13px]")} onClick={() => void onRemove()}>
            {remove.isPending ? t("checkout.promoRemoving") : t("checkout.promoRemove")}
          </button>
        </div>
      ) : null}

      {showForm ? (
        <>
          <p className="text-[13px] text-sapil-ink-2 mt-[4px]">
            {worth != null
              ? t("checkout.pointsAvailableWorth", { points: available, amount: money(worth, currency) })
              : t("checkout.pointsAvailable", { points: available })}
          </p>
          <form className="flex gap-[8px] mt-[10px]" onSubmit={(event) => void onApply(event)} noValidate>
            <label className="sr-only" htmlFor="co-points">
              {t("checkout.pointsLabel")}
            </label>
            <input
              id="co-points"
              name="reward-points"
              type="number"
              inputMode="numeric"
              autoComplete="off"
              min={min || undefined}
              max={max || undefined}
              step={increment || undefined}
              placeholder={min > 0 ? t("checkout.pointsMinimum", { points: formatPoints(min) }) : t("checkout.pointsLabel")}
              aria-describedby="co-points-msg"
              aria-invalid={error ? true : undefined}
              value={points}
              disabled={busy || !ready}
              onChange={(event) => {
                setPoints(event.target.value);
                if (error) setError(null);
              }}
              className="h-[46px] rounded-[14px] border border-sapil-line-2 bg-sapil-card px-[16px] font-sapil-sans text-[15px] text-sapil-ink w-full min-w-0 placeholder:text-[#757575] [transition:border-color_.18s,box-shadow_.18s] focus:outline-none focus:border-sapil-accent focus:shadow-[0_0_0_3px_var(--sapil-accent-soft)]"
            />
            <Button type="submit" variant="line" disabled={busy || !ready || !points.trim()} className="!h-[46px] !px-[18px] shrink-0">
              {apply.isPending ? t("checkout.promoApplying") : t("checkout.promoApply")}
            </Button>
          </form>
          {max > 0 ? (
            <button
              type="button"
              disabled={busy || !ready}
              className={cx(buttonClass("link"), "!text-[13px] mt-[8px]")}
              onClick={() => {
                setPoints(String(max));
                setError(null);
              }}
            >
              {t("checkout.pointsUseMax", { points: formatPoints(max) })}
            </button>
          ) : null}
        </>
      ) : null}

      {reason ? <p className="text-[13px] text-sapil-ink-2 mt-[4px]">{reason}</p> : null}
      <p id="co-points-msg" role="alert" className="text-[13px] text-sapil-sale mt-[6px] empty:hidden">
        {error}
      </p>
    </section>
  );
}
